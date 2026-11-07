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
- A tag `v<release>-bk.<n>` marks each state of the branch that a server runs. Tags are made by hand, never by CI; a
  tag does not publish to npm (only a published GitHub release does, in `publish.yml`).

## Move to a new upstream release

1. Make `bk/<new tag>` from the upstream tag, and push it.
2. Cherry-pick the queue onto it, in order, on a branch. Fix the conflicts there. Drop each patch that upstream now
   ships, and say so in this file.
3. Run `npm ci`, `npm run check`, `npm run lint` and `npm test`.
4. Open a pull request into `bk/<new tag>`. After its review and merge, tag `v<new tag>-bk.1`.

## The queue

| #   | Patch     | Why                                          | Upstream         | Drop when |
| --- | --------- | -------------------------------------------- | ---------------- | --------- |
| 1   | This file | It records the queue and how the fork moves. | none (fork only) | never     |
