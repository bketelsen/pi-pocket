// The fork's patch queue (`BK-PATCHES.md`): each row names the fork PR whose merged commit moves, a merge commit moves
// with `-m 1`, the tag form has one `v`, a move switches the server from an SSH shell to a prepared tag, and the
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
    const move = patches.slice(
        patches.indexOf("## Move to a new upstream release"),
        patches.indexOf("## The queue"),
    );

    assert.match(move, /from an SSH shell on the host, never from inside Pi Pocket/);
    assert.match(
        move,
        /Never run `npm ci` or `git checkout` in the live checkout while the server\s+runs/,
    );
    assert.match(move, /Prepare\s+the tag in a separate worktree/);
    assert.match(move, /`npm ls --omit=dev` passes/);
    assert.match(move, /Then stop the server, switch it to the prepared tag, and start it/);
    assert.match(
        move,
        /chained with `&&`: when the stop fails, the switch and the start must not run/,
    );
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
