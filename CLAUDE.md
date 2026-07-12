# Agentic Monorepo Template

This repo is agentic-first: features flow through a PM -> implementer -> reviewer pipeline (see README). These instructions are shared by every agent in that pipeline.

## Command contract

<!-- Filled in by /setup-stack. Every agent verifies work with these exact commands;
     CI (.github/workflows/ci.yml) runs the same ones. Keep them fast and deterministic. -->

- **Check** (lint + typecheck): `TODO: run /setup-stack`
- **Test**: `TODO: run /setup-stack`
- **Build**: `TODO: run /setup-stack`
- **Run** (start the app so an agent can exercise it, via a stable port/URL or CLI entrypoint): `TODO: run /setup-stack`
- **Smoke** (drive the *running* app end-to-end; deterministic, seeded): `TODO: run /setup-stack`

Check, test, and build are hard gates: they must exit 0 before agent review means
anything. Review layers on top of deterministic checks, never replaces them.
Run and smoke exist so agents can verify *behavior*, not just code: this repo treats
"an agent can start and exercise the app" as a first-class requirement of the stack.

If a contract command is still `TODO`, say so and stop. Do not invent a substitute.

## Layout

This is a monorepo with a fixed structure, independent of stack and tooling:

- `apps/<name>`: deployable applications. Every deployable lives here, even when there is only one.
- `packages/<name>`: shared libraries used by apps.
- Group feature code by domain (vertical slices), not by technology.

## Backlog

- If the repo has a GitHub remote, **GitHub Issues are the backlog**. Use `gh issue list/view`.
- Otherwise, [BACKLOG.md](BACKLOG.md) is the backlog.
- A task is **ready** when it has a spec: goal, acceptance criteria, out-of-scope, verification plan.
- Dependencies: label the dependent issue `blocked` and write "Blocked by #N" in its body. The PM removes the label once every blocker is closed.

## Conventions

- Work happens on branches, never directly on `main`. Agents open PRs; humans merge.
- One task = one branch = one PR. Branch names: `agent/<short-slug>`.
- Conventional commits (`feat:`, `fix:`, `chore:`, ...), enforced by the `commits` job in CI.
- Commit messages are for developers; release notes are for users. Every user-facing change includes its own short release-note entry (the spec's Goal section is good raw material), and releases are assembled from those entries, never from commit messages.
- Verification is executed, not argued: any claim about behavior is backed by a command that actually ran (a test, a smoke check, a reproduced output).
- Agent prompts state outcomes and constraints, not step-by-step procedures. Keep them short; trust the model. One owner per rule: repo-wide conventions live here, an agent's behavior lives in its agent file, orchestration lives in the skill that runs it.
