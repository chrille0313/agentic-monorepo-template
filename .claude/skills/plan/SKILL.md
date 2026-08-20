---
name: plan
description: Interactively plan a feature with the user, then land it as right-sized build-ready tasks: one spec handed straight to /build, or dependency-ordered backlog issues. Use when the user says "plan X", "break down X", "create issues for X", or brings an idea too large for a single /build task.
---

# /plan: from idea to build-ready work

Input (`$ARGUMENTS`): a feature or project description, however rough.

Outcome: a plan the user has explicitly approved, expressed as right-sized, build-ready tasks the inner loop can consume one at a time. The quality bar is high on purpose: first-pass quality is the dominant predictor of loop output (see docs/DESIGN.md), and the spec is where first-pass quality is decided.

## 1. Understand before proposing

Interview the user, as many rounds as it takes, until you can state without guessing: the goal and why now, the user-visible behavior, constraints (stack, compatibility, performance, security), what is explicitly out of scope, and how success is verified. The plan must be grounded in the codebase as it actually is, not as assumed. Challenge vague answers instead of absorbing them: "proper auth" is not a requirement; "email+password login with session cookies, no OAuth yet" is. Surface the decisions the user hasn't realized they're making.

## 2. Propose, then iterate to approval

Present the plan: approach, decomposition, ordering with dependencies, and open risks. Iterate until the user explicitly approves. Create nothing before approval.

Size tasks by cohesion. One task is a chunk an implementer can carry to a coherent, finished state and a human can still review in one sitting; it leaves the app releasable and is verifiable on its own. Splitting costs a spec, a branch, a review loop and a merge, and the seams are where incoherence enters, so a split needs a reason — typically:

- a hard dependency (one task's output is another's input),
- a risky unknown worth landing on its own, so it can be judged or reverted in isolation,
- a diff a human could no longer review honestly in one pass.

A coherent surface — a page, a user flow, a design system, a resource end-to-end — is the natural unit: build it whole while the diff stays reviewable. Slicing a UI by section is the classic failure, five PRs that each pass review and together look like five different products; when a surface genuinely outgrows one task, split it so the design is still decided once — its foundation lands first and later tasks conform to it.

## 3. Land the plan

**If it is one task**: write the single spec and hand it to `/build` (or the `agent` label). No issues needed.

**If it is several**:

- One issue per task in the PM spec format (goal, acceptance criteria, out of scope, verification plan). `gh issue create` when a remote exists; BACKLOG.md sections otherwise.
- Label issues whose prerequisites aren't merged yet `blocked`, with "Blocked by #N" in the body.
- When the spread of issues makes progress hard to read, add a tracking issue holding a task list of all of them.
- Report what was created and offer the first dispatch: `/build` on the first task, or the `agent` label to run it in CI.

How many issues that comes to is whatever the split triggers produce. When the later phases of a plan are still speculative, detail the near-term tasks fully and leave the rest as coarser placeholders; a future /plan run refines them when their turn comes.
