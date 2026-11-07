# Patches on this branch

This branch, `bk/v0.28.0`, is the upstream release tag `v0.28.0` of
[TannerMidd/pi-pocket](https://github.com/TannerMidd/pi-pocket) with a short queue of patches on top. A server
that runs this fork runs a tag of this branch: `v0.28.0-bk.1`, `v0.28.0-bk.2`, and so on.

## How the fork works

- `main` of this fork mirrors upstream `main`. It holds no patches. Pull requests to upstream start from it.
- Each upstream release that the fork takes gets a branch `bk/<tag>`, made from that tag with no change. The patches
  go on top of it, each by a pull request into that branch, in the order of the table below.
- Each patch is also offered upstream as a pull request on upstream `main`. When upstream ships the patch, or an
  equivalent, the patch leaves the queue at the next move.
- A tag `<tag>-bk.<n>` marks each state of the branch that a server runs. For example: upstream tag `v0.29.0`,
  branch `bk/v0.29.0`, fork tags `v0.29.0-bk.1`, `v0.29.0-bk.2`. Tags are made by hand, never by CI.
- Pushing a tag does not publish to npm. `.github/workflows/publish.yml` publishes only for a published GitHub
  release (`release`) or a manual run (`workflow_dispatch`): do neither for a fork tag.

## Move to a new upstream release

1. Make `bk/<new tag>` from the upstream tag, and push it.
2. Cherry-pick the queue onto it, in order, on a branch: for each row of the table, the merged commit of its pull
   request in this fork. For a merge commit, run `git cherry-pick -m 1 <merge commit>`: parent 1 is the `bk/` branch
   before the merge, so the patch is the PR's whole change. For a squash or rebase merge, run
   `git cherry-pick <commit>` for each commit it made. Fix the conflicts there. Drop each patch that upstream now
   ships, and say so in this file.
3. In this file, change the branch name, the upstream tag and the example fork tags at the top to the new ones.
4. Run `npm ci`, `npm run check`, `npm run lint` and `npm test`.
5. Open a pull request into `bk/<new tag>`. After its review and merge, tag `<new tag>-bk.1`.

## The queue

Each row names its pull request in this fork (`bketelsen/pi-pocket#<n>`). Its merged commit is the patch that moves.
`test/bk-patches.test.ts` checks this table and the facts above.

| #   | Patch                                                                | Fork PR               | Why                                                                                                                                                                                   | Upstream                                                                | Drop when                                                                     |
| --- | -------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | This file, `test/bk-patches.test.ts` and `.memory/corrections.jsonl` | bketelsen/pi-pocket#1 | It records the queue and how the fork moves.                                                                                                                                          | none (fork only)                                                        | never                                                                         |
| 2   | `host.linkedSessions.reports`: a lead turns off run-end answers      | bketelsen/pi-pocket#2 | Since 0.28.0 a lead gets a message, and a run, at each run end of each session it started, with no way to turn it off. A supervisor that takes reports another way pays for each one. | offered: pending PR, branch `bketelsen:sheeana/upstream-linked-reports` | upstream ships a lead switch for run-end answers, and the drop-ins move to it |
