# L3-041 regression-preserving CI cost reduction

**Scope:** this milestone's pull request, branch `l3-041-panel-card-kit`, only.

The accepted L3-020 through L3-040 workflows previously launched 21 additional
GitHub-hosted runners on every commit to this review branch. Each one repeated
clean installation and overlapping unit, browser, and production-build testing.
For **this PR only**, their jobs now return `skipped` by a job-level event/branch
guard. Nothing is deleted from their test definitions or behavior on other PRs,
`push` events to `main`, or manual `workflow_dispatch`. They can still be run
individually when needed. A skipped workflow is **not** a passing test.

The L3-041 acceptance workflow remains the **sole required execution gate**
for this branch. It runs clean pinned `npm ci`, strict/negative types,
domain boundaries, all unit regressions, genuine Vite dev and preview, verified
source/build/test hashes, and Chromium scripts for every inherited milestone
including L3-020 through L3-040 at 375/390/402/430 CSS pixels. Its steps must
run and succeed; any failed or skipped acceptance step **blocks merge**.

To avoid charging for superseded L3-041 review commits, its workflow has a
concurrency group and cancels older in-progress attempts. The pinned npm cache
accelerates later clean installs but does not substitute for `npm ci`.

**Current environmental limitation:** the user's private repository exhausted
or otherwise cannot access GitHub-hosted Actions runner capacity; jobs have
failed before assignment with zero steps. This change only reduces potential
future cost. It cannot bypass GitHub billing, entitlement, or runner limits.

Do not merge until the acceptance job actually runs successfully, the bundle
and manifest have been verified, and numbered backups have been saved.
No L3-042 development is authorized by this change.
