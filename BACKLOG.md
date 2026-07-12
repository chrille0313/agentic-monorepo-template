# Backlog

Local backlog, used when this repo has no GitHub remote. One `##` section per task, top = highest priority. The PM agent (`/pm`) triages this file; `/build` consumes ready tasks from it.

A task is **ready** when it has acceptance criteria. Move finished tasks to the Done section with the PR/commit reference.

## Set up the stack

Run `/setup-stack` to scaffold the project and fill in the command contract in CLAUDE.md.

- **Acceptance criteria:** Every command-contract entry in CLAUDE.md is a real, runnable command; each runs green on a fresh clone.
- **Out of scope:** Any feature work.

## Set up releases and deploys

Blocked by: Set up the stack.

Wire the release and deploy story for whatever stack was chosen (see /setup-stack step 5 for the outcomes).

- **Acceptance criteria:** Each releasable app/package can be released independently with tooling fitting the stack; release notes aggregate authored entries, not commit subjects; each deployable app has its own deploy workflow with an appropriate trigger.
- **Out of scope:** Provisioning cloud infrastructure or accounts.

## Done

<!-- - ~~Task name~~ (#PR) -->
