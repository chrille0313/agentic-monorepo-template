# Agentic Monorepo Template

This repo is agentic-first: features flow through a PM → implementer → reviewer pipeline (see README). These instructions are shared by every agent in that pipeline.

## Command contract

<!-- Filled in by /setup-stack. Every agent verifies work with these exact commands;
     CI runs the same ones. Keep them fast and deterministic. -->

- **Check** (lint + typecheck): `TODO — run /setup-stack`
- **Test**: `TODO — run /setup-stack`
- **Build**: `TODO — run /setup-stack`
- **Dev server** (optional): `TODO — run /setup-stack`

If a contract command is still `TODO`, say so and stop — do not invent a substitute.

## Backlog

- If the repo has a GitHub remote, **GitHub Issues are the backlog**. Use `gh issue list/view`.
- Otherwise, [BACKLOG.md](BACKLOG.md) is the backlog.
- A task is **ready** when it has a spec: goal, acceptance criteria, out-of-scope, verification plan.

## Conventions

- Work happens on branches, never directly on `main`. Agents open PRs; humans merge.
- One task = one branch = one PR. Branch names: `agent/<short-slug>`.
- Conventional commits (`feat:`, `fix:`, `chore:`, ...).
- The inner loop is capped at 3 implement→review rounds. If the reviewer still requests changes, stop and escalate to a human with the unresolved findings.
- Implementers implement the spec, not more. Scope creep is a review finding.
- Reviewers judge only the spec and the diff — fresh context is the point. Never ask the implementer to explain; if it needs explaining, that's a finding.
