// The fork's patch queue (`BK-PATCHES.md`): each row names the fork PR whose merged commit moves, a merge commit moves
// with `-m 1`, the tag form has one `v`, a move prepares a release folder and switches the server's link to it from
// an SSH shell, and the
// publish triggers it names are the ones `publish.yml` has. Fork only: it moves with the queue.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const patches = readFileSync(join(root, "BK-PATCHES.md"), "utf8");

/** The rows of the queue table, as their cells by header. */
function queue(text: string): Record<string, string>[] {
    const lines = text
        .slice(text.indexOf("## The queue"))
        .split("\n")
        .filter((line) => line.startsWith("|"));
    const cells = (line: string) =>
        line
            .slice(1, -1)
            .split("|")
            .map((cell) => cell.trim());
    const header = cells(lines[0] ?? "");

    return lines
        .slice(2)
        .map((line) => Object.fromEntries(cells(line).map((cell, i) => [header[i], cell])));
}

test("each patch in the queue names its fork PR", () => {
    const rows = queue(patches);

    assert.ok(rows.length >= 1, "the queue has at least its first row");

    for (const row of rows) {
        assert.match(row["Fork PR"] ?? "", /^bketelsen\/pi-pocket#\d+$/, `row ${row["#"]}`);
    }

    assert.deepEqual(
        rows.map((row) => row["#"]),
        rows.map((_, i) => String(i + 1)),
        "rows are numbered in order",
    );
});

test("a fork tag is the upstream tag with -bk.<n>, never a second v", () => {
    assert.doesNotMatch(patches, /`v<[^>]*tag>/);
    assert.match(patches, /`<new tag>-bk\.1`/);
});

test("a move cherry-picks a merge commit with its first parent, and a squash commit as it is", () => {
    assert.match(patches, /`git cherry-pick -m 1 <merge commit>`/);
    assert.match(patches, /parent 1 is the `bk\/` branch/);
    assert.match(patches, /`git cherry-pick <commit>`/);
});

test("a move switches the server from an SSH shell, to a tag prepared in a separate worktree", () => {
    // Line breaks fall anywhere in the prose: compare with each run of white space as 1 space.
    const move = patches
        .slice(
            patches.indexOf("## Move to a new upstream release"),
            patches.indexOf("## The queue"),
        )
        .replace(/\s+/g, " ");
    const says = (phrase: string) => assert.ok(move.includes(phrase), `step 6 says: ${phrase}`);

    // The server runs 1 symlink; each fork tag has its own release folder, a separate worktree.
    says("The server runs the symlink `~/projects/pi-pocket-live`");
    says("`~/projects/pi-pocket-releases/<fork tag>`: a detached worktree of the main checkout");
    says(
        "The drop-ins' links `~/.pi-pocket/extensions/node_modules` and `_pocket.d.ts` point through `pi-pocket-live`",
    );
    says(
        "Never run `npm ci` or `git checkout` in the folder that `pi-pocket-live` names (`readlink -f ~/projects/pi-pocket-live`) while the server runs",
    );
    // Before the first switch the link names the main checkout, so the main checkout is live until then.
    says(
        "Until the first switch to a release folder, `pi-pocket-live` names the main checkout itself",
    );
    says("Only after the first switch does the main checkout hold no live code");
    assert.ok(!move.includes("The main checkout holds no live code"), "no unconditional claim");
    says(
        "in a worktree of the branch of step 2, never in the folder that `pi-pocket-live` names (step 6)",
    );

    // Prepare while the server runs, and check that the folder loads.
    says(
        "Prepare, as the server's user, while the server runs: `pocket-switch prepare <new tag>-bk.<n>`",
    );
    says("`npm ls --omit=dev` passes");
    says("`node test/serve.ts 8898 127.0.0.2` answers");
    says("It never touches the folder that `pi-pocket-live` names");

    // Activate from an SSH shell, as 1 chain; roll back the same way.
    says("Activate from an SSH shell on the host, never from inside Pi Pocket");
    says("`sudo pocket-switch activate <new tag>-bk.<n>`");
    says(
        "stops the server, points `pi-pocket-live` at the prepared release folder, and starts the server",
    );
    says("chained with `&&`: when the stop fails, the switch and the start must not run");
    says("Roll back with the command that `activate` prints");
    says("same `activate` with the previous fork tag");
    says("After the first switch, it points `pi-pocket-live` back at the main checkout");
    says("only after the next release runs well, and never the folder that `pi-pocket-live` names");
});

test("the publish triggers named are the ones publish.yml has", () => {
    const workflow = readFileSync(join(root, ".github", "workflows", "publish.yml"), "utf8");
    const on = workflow.slice(workflow.indexOf("\non:"), workflow.indexOf("\npermissions:"));
    const triggers = [...on.matchAll(/^ {4}(\w+):/gm)].map((match) => match[1]);

    assert.ok(triggers.length >= 1, "publish.yml has triggers");

    for (const trigger of triggers) {
        assert.ok(patches.includes(`(\`${trigger}\`)`), `BK-PATCHES.md names ${trigger}`);
    }

    assert.ok(!triggers.includes("push"), "a pushed tag does not publish");
});
