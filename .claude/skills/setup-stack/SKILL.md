---
name: setup-stack
description: One-time template adaptation. Pick a language/framework, scaffold a minimal project, and fill in the command contract in CLAUDE.md that all agents verify against. Use right after creating a repo from this template, or to swap the stack later.
---

# /setup-stack: adapt the template to a stack

This template is stack-agnostic on purpose: the agentic loop only needs the **command contract** in CLAUDE.md (check / test / build / run / smoke). This skill makes those commands real, and sets the codebase up so agents can properly test the application. That is the template's core design goal.

## 1. Choose

Establish the stack with the user (language/framework, package manager, test runner) unless they already said. Offer sensible bundles (e.g. "TypeScript + Vite + Vitest", "Python + uv + pytest", "Go + std tooling") but accept anything.

## 2. Scaffold minimally

Use the stack's official initializer where one exists, scaffolding into the repo's fixed monorepo layout (see CLAUDE.md): the first app in `apps/<name>`, shared code in `packages/<name>`, even for a single app. Wire up the stack's workspace tooling when it has one (pnpm workspaces, cargo workspaces, uv workspaces, Nx, moon, ...); a plain directory layout is fine when it doesn't. Keep it minimal: the loop needs something to lint, test, build, and run, not a demo app. Include at least one real passing test, so the contract's test command is meaningful from day one. Extend `.gitignore` for the stack.

## 3. Make the app agent-testable

The part most templates skip. Agents must be able to verify *behavior*, not just that code compiles:

- **Run**: the app starts with one command, on a stable port/URL (or deterministic CLI entrypoint), with seeded deterministic data. No interactive prompts, no manual setup steps.
- **Smoke**: one command exercises the *running* app end-to-end (HTTP calls against real endpoints, CLI invocations checking real output, or a headless-browser check for UIs) and exits non-zero on failure.

Both must be reliable enough that red means "the app is broken", never "the harness is flaky".

## 4. Fill the command contract

Replace every `TODO` in CLAUDE.md's command-contract section with real commands, and wire check/test/build into the `gates` job of `.github/workflows/ci.yml`. Also add the stack's package ecosystem to `.github/dependabot.yml` if it introduces one that isn't covered (npm is already active for the repo's toolchain; keep updates grouped). Then **verify each contract entry by running it**; a command that hasn't run green doesn't go in. Fast and deterministic beats thorough here, because these run on every inner-loop round.

## 5. Releases and deploys

Releasing (versioning, notes, tags) and deploying (shipping an app somewhere) are separate lifecycles; set them up separately. Do this now if the stack makes it cheap, otherwise leave it to the "Set up releases and deploys" backlog item for when there is something to release. What done looks like:

- Each releasable app/package can be versioned and released on its own, with tooling that fits the stack (changesets, release-please manifest mode, release-plz, ...).
- Releasing collects the user-facing notes PRs ship with (a CLAUDE.md convention) into the release notes, so pick tooling with a place for such notes and wire up what "a note" concretely is (a changeset file, a changelog fragment, ...). The commit log never becomes release notes.
- Each deployable app has its own deploy workflow with its own trigger and steps (cloud deploy, package publish, docs site, ...).
- Any new action is pinned to a full commit SHA.

## 6. Configure the repo on GitHub

Skip if the repo has no GitHub remote. All of this is `gh` work:

- Protect the default branch with a **ruleset** (rulesets, not classic branch protection): pull requests required before merging with review threads resolved, the ci.yml jobs required to pass and pinned to the GitHub Actions integration (so only real workflow runs can satisfy them), force pushes and branch deletion blocked. Require an approving review when more than one human maintains the repo. This turns the "agents open PRs; humans merge" convention into something enforced. (GitHub doesn't enforce rulesets on free-plan private repos; if that applies, say so and move on.)
- Add a **tag ruleset** making all tags immutable: creation stays open for release tooling; moving or deleting a tag is blocked.
- Create the `agent` and `in-progress` labels, and allow GitHub Actions to create pull requests, so the headless loop (agent-task.yml) can run.
- Enable auto-delete of merged branches (`gh repo edit --delete-branch-on-merge`). Besides the hygiene, stacked PRs only retarget to the default branch when their base branch is deleted at merge.
- Offer a kanban board: a GitHub Project linked to the repo, its Status field extended with "In Review" and "Blocked", built-in workflows enabled (auto-add from the repo, closed items to Done), and the `PROJECT_URL` repo variable set so board-sync.yml can mirror issue state onto it. Live status sync in CI additionally needs a classic PAT with `project` scope saved as the `PROJECT_TOKEN` secret (GITHUB_TOKEN cannot access Projects v2); the user creates that themselves. The board is a human view; the backlog rules in CLAUDE.md own what counts as truth.

The auth secret for the CI modes stays manual: the user adds `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`, billing their subscription) or `ANTHROPIC_API_KEY` themselves.

## 7. Finish

- Update the README title/intro to name the project (keep the loop documentation).
- Mark the "Set up the stack" task done in BACKLOG.md (or close the issue).
- Suggest next steps: add the auth secret if they want the CI modes, then `/pm` or `/build` to start the loop.
