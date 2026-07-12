# Agentic Monorepo Template

A stack-agnostic monorepo template where **agents are the workflow, not the helpers**. It ships two composable loops built on Claude Code primitives (subagents, skills, workflows, GitHub Actions):

```
┌─────────────────────── OUTER LOOP (orchestrator–workers) ───────────────────────┐
│                                                                                  │
│   Backlog ──▶ PM agent ──▶ task spec ──▶ ┌────────── INNER LOOP ──────────┐      │
│   (issues /    triages,                  │  (evaluator–optimizer)         │      │
│   BACKLOG.md)  prioritizes,              │                                │      │
│                writes spec               │  Implementer ──▶ Reviewer      │      │
│      ▲                                   │      ▲   (fresh context,       │      │
│      │                                   │      │    adversarial)         │      │
│      │                                   │      └── findings ◀── verdict  │      │
│      │                                   │       (max 3 rounds)           │      │
│      │                                   └───────────────┬────────────────┘      │
│      │                                                   │ APPROVE               │
│      └──────────────── PR merged / issue closed ◀── PR + human merge gate        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Inner loop** (evaluator–optimizer): an *implementer* agent builds against a task spec, then a *reviewer* agent with completely fresh context tries to break it. Findings cycle back until the reviewer approves or the iteration cap hits.
- **Outer loop** (orchestrator–workers): a *PM* agent owns the backlog — it triages, picks the next most valuable item, shapes it into a build-ready spec, and dispatches it into the inner loop.

Humans stay at the merge gate. Agents never merge to `main`.

## Quick start

1. **Use this template** (or clone), then open it in Claude Code.
2. Run `/setup-stack` — pick your language/framework; the agent scaffolds it and fills in the [command contract](CLAUDE.md#command-contract) that all other agents rely on.
3. Add work to the backlog (GitHub Issues, or [BACKLOG.md](BACKLOG.md) for local-only repos).
4. Run the loops:

| Command | What it does |
|---|---|
| `/build <description or issue #>` | Runs the inner loop on one task, with you at the merge gate |
| `/pm` | Runs the outer loop once: triage backlog → pick next → spec it → offer to build |
| `/pm --dispatch` | Same, but dispatches by labeling the issue `agent` (triggers CI) |

## Three execution modes

**Local (interactive).** `/build` and `/pm` in a Claude Code session. You approve the final commit/PR.

**GitHub Actions (event-driven).** Label any issue `agent` and [agent-task.yml](.github/workflows/agent-task.yml) runs the full inner loop headlessly and opens a PR referencing the issue. Requires the `ANTHROPIC_API_KEY` repo secret.

**Scheduled PM (autonomous).** [pm-cron.yml](.github/workflows/pm-cron.yml) runs the PM agent on a schedule: it triages the backlog, picks one ready issue, refreshes its spec, and labels it `agent` — which triggers the event-driven mode. Disabled by default (uncomment the `schedule` block to enable).

## Repo layout

```
.claude/
  agents/          pm, implementer, reviewer — the actors, each with own context + tools
  skills/          /build (inner loop), /pm (outer loop), /setup-stack (one-time adapt)
  workflows/       feature-loop.js — deterministic scripted variant of the inner loop
  settings.json    pre-approved read-only permissions
.github/workflows/ agent-task.yml (label-triggered), pm-cron.yml (scheduled PM)
BACKLOG.md         local backlog fallback when GitHub Issues aren't available
CLAUDE.md          conventions + the command contract every agent relies on
```

## Safety rails (deliberate design choices)

- **Fresh-context review.** The reviewer never sees the implementer's reasoning — only the spec and the diff. That's what makes the review adversarial rather than confirmatory.
- **Iteration cap.** The inner loop stops after 3 rounds and escalates to a human instead of thrashing.
- **Human merge gate.** Agents open PRs; only humans merge. Branch protection on `main` is strongly recommended.
- **Command contract.** Agents verify with the *same* commands CI runs (`check`, `test`, `build` in CLAUDE.md), so "reviewer approved" means something.
- **Spec-driven.** Nothing is implemented without acceptance criteria. Vague requests get shaped by the PM agent first.

## Adapting the template

- Swap the stack: rerun `/setup-stack`, or hand-edit the command contract in [CLAUDE.md](CLAUDE.md).
- Add actors: drop a new agent in `.claude/agents/` (e.g. a security reviewer) and reference it from the `/build` skill's review phase.
- Tune autonomy: the spectrum is yours — from `/build` with you watching, to a cron'd PM feeding a labeled-issue pipeline you only see as incoming PRs.
