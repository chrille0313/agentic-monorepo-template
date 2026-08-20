---
name: plan
description: Interactively plan a feature with the user, then land it as the fewest build-ready tasks that cover it: one spec handed straight to /build, or dependency-ordered backlog issues. Use when the user says "plan X", "break down X", "create issues for X", or brings an idea too large for a single /build task.
---

# /plan: from idea to build-ready work

Input (`$ARGUMENTS`): a feature or project description, however rough.

Outcome: a plan the user has explicitly approved, expressed as the fewest build-ready tasks that cover it. The quality bar is high on purpose: first-pass quality is the dominant predictor of loop output (see docs/DESIGN.md), and the spec is where first-pass quality is decided.

## 1. Understand before proposing

Interview the user, as many rounds as it takes, until you can state without guessing: the goal and why now, the user-visible behavior, constraints (stack, compatibility, performance, security), what is explicitly out of scope, and how success is verified. The plan must be grounded in the codebase as it actually is, not as assumed. Challenge vague answers instead of absorbing them: "proper auth" is not a requirement; "email+password login with session cookies, no OAuth yet" is. Surface the decisions the user hasn't realized they're making.

## 2. Propose, then iterate to approval

Present the plan: approach, decomposition, ordering with dependencies, and open risks. Iterate until the user explicitly approves. Create nothing before approval.

Size tasks by cohesion, not by how small they can be cut. One task is the largest chunk an implementer can carry to a finished, coherent end and a human can still review in one sitting; it must leave the app releasable and be verifiable on its own. Splitting is not free — every extra task pays for a spec, a branch, a review loop and a merge, and the seams between tasks are where incoherence enters — so a split needs a reason, and there are only three:

- a hard dependency (one task's output is another's input),
- a risky unknown worth landing on its own so it can be judged or reverted alone,
- a diff a human could no longer review honestly in one pass.

"It could be smaller" is not one of them. Anything with a single coherent surface — a page, a user flow, a design system, a resource end-to-end — is one task, built whole. Slicing a UI by section is the classic failure: five PRs that each pass review and together look like five different products.

## 3. Land the plan

**If it is one task** — often the right answer — say so, write the single spec, and hand it straight to `/build` (or the `agent` label). Skip the fan-out entirely: a one-task plan is a good outcome, not a failed planning session.

**If it is genuinely several**:

- One issue per task in the PM spec format (goal, acceptance criteria, out of scope, verification plan). `gh issue create` when a remote exists; BACKLOG.md sections otherwise.
- Label issues whose prerequisites aren't merged yet `blocked`, with "Blocked by #N" in the body.
- Above a handful of issues, create a tracking issue holding a task list of all of them so progress reads at a glance.
- Report what was created and offer the first dispatch: `/build` on the first task, or the `agent` label to run it in CI.

Issue count follows from the split triggers, not from scope anxiety: most features are one to three issues; a long-term roadmap may be twenty. For genuinely large plans, detail the near-term tasks fully and keep later phases as coarser placeholder issues; a future /plan run refines them when their turn comes.
