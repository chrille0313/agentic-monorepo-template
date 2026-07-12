---
name: plan
description: Interactively plan a feature with the user, then fan the agreed plan out into build-ready, dependency-ordered backlog issues. Use when the user says "plan X", "break down X", "create issues for X", or brings an idea too large for a single /build task.
---

# /plan: from idea to build-ready backlog

Input (`$ARGUMENTS`): a feature or project description, however rough.

Outcome: a plan the user has explicitly approved, fanned out into spec-formatted issues the inner loop can consume one at a time. The quality bar is high on purpose: first-pass quality is the dominant predictor of loop output (see docs/DESIGN.md), and the spec is where first-pass quality is decided.

## 1. Understand before proposing

Explore the codebase enough to ground the plan in what exists. Then interview the user (AskUserQuestion, as many rounds as it takes) until you can state without guessing: the goal and why now, the user-visible behavior, constraints (stack, compatibility, performance, security), what is explicitly out of scope, and how success is verified. Challenge vague answers instead of absorbing them: "proper auth" is not a requirement; "email+password login with session cookies, no OAuth yet" is. Surface the decisions the user hasn't realized they're making.

## 2. Propose, then iterate to approval

Present the plan: approach, slice decomposition, ordering with dependencies, and open risks. Each slice must be one PR-sized task that is independently verifiable and leaves the app releasable. Iterate until the user explicitly approves. Create nothing before approval.

## 3. Fan out

- One issue per slice in the PM spec format (goal, acceptance criteria, out of scope, verification plan). `gh issue create` when a remote exists; BACKLOG.md sections otherwise.
- Label issues whose prerequisites aren't merged yet `blocked`, with "Blocked by #N" in the body.
- Create a tracking issue holding a task list of all slices so progress reads at a glance.
- Report what was created and offer the first dispatch: `/build` on the first slice, or the `agent` label to run it in CI.

A good plan often yields 3 issues, not 15. Small slices converge in 1-2 review rounds; sprawling ones burn the cap.
