---
name: build
description: Run the inner agentic loop on one task. The implementer builds, a fresh-context reviewer judges, and findings cycle back until approval (max 3 rounds). Use when the user says "build X", "implement issue #N", "work on the next backlog item", or CI dispatches a labeled issue.
---

# /build: the inner loop (evaluator-optimizer)

Input (`$ARGUMENTS`): an issue number, a task description, or empty (meaning the next ready backlog item).

You are the **loop controller**. You do not implement or review yourself; you dispatch the `implementer` and `reviewer` subagents, route the verdict, and own git state.

## 1. Resolve the spec

- Issue number → `gh issue view <n>` (body + comments; the newest spec-formatted comment wins).
- Description or empty → if it already has acceptance criteria, use it; otherwise spawn the `pm` agent to shape it into a spec (for empty input, PM also picks the item).
- No acceptance criteria obtainable → stop and ask the user; never build without a spec.

## 2. Prepare isolation

If not already on a task branch/worktree: create branch `agent/<short-slug>` (worktree if the session supports it). Never build on `main`.

If the task is an issue, label it `in-progress` now; remove the label when the loop ends (PR opened, or escalation).

## 3. Loop (max 3 rounds)

Round N:

1. **Implement**: spawn the `implementer` agent with the full spec text. On round 2+, message the *same* implementer (it has the context) with the reviewer's blocking findings verbatim.
2. Sanity-check its report: if `STATUS: BLOCKED`, stop and surface it to the user.
3. **Gate**: a review round only starts once check/test/build pass; red gates go straight back to the implementer without consuming a round.
4. **Review**: spawn a **fresh** `reviewer` agent each round (never reuse; fresh context is the point). Give it only the spec, the branch/diff reference, and the round number. Never forward the implementer's report or reasoning.
5. Route the verdict:
   - `APPROVE` → exit loop to step 4.
   - `REQUEST_CHANGES` → next round with the blocking findings.
   - **No-progress exit**: if the round produced the same blocking findings as the previous one, or the diff didn't change, stop early and escalate; more rounds provably won't help.
   - **Disputed finding**: when the implementer disputed a finding with evidence and a reviewer restates it, surface the disagreement to the user if interactive. If headless, spawn a fresh judge agent (general-purpose) with only the spec, the finding, and both sides' evidence; its ruling on that finding is final. Never let the implementer and reviewer negotiate to consensus.
   - After round 3 still not approved → **stop and escalate**: present the spec, what was built, and the unresolved findings. Do not keep looping; do not merge anything.

## 4. On approval

1. Run the command contract yourself once (trust but verify).
2. Commit on the task branch following the `commit` skill: small modular commits, referencing the source issue.
3. **Interactive session** → present a summary and ask whether to push + open a PR.
   **Headless/CI session** → push and open a PR, `Closes #<n>` in the body, and comment the PR link on the issue.
4. The summary/PR body must make the human gate an *informed* check, not a rubber stamp:
   - what was built, mapped to the acceptance criteria
   - review-round history: findings by severity, fixed vs disputed
   - verification evidence: which commands ran (contract + smoke) and their results
5. Never merge. The merge gate is human.
