# Agentic Monorepo Template

A stack-agnostic monorepo template where **agents are the workflow, not the helpers**. It ships two composable loops built on Claude Code primitives (subagents, skills, workflows, GitHub Actions):

```
backlog ------> PM agent ------> task spec
(issues or      (triage, pick,       |
BACKLOG.md)     spec, dispatch)      |
    ^                                v
    |      +---------- INNER LOOP (max 3 rounds) ----------+
    |      |                                               |
    |      |   implementer ---- diff ----> reviewer        |
    |      |        ^                    (fresh context)   |
    |      |        |                         |            |
    |      |        +--- blocking findings ---+            |
    |      |                                               |
    |      +-----------------------+-----------------------+
    |                              | APPROVE
    |                              v
    +-- merge <-- human gate <-- PR + evidence
```

- **Inner loop** (evaluator-optimizer): an *implementer* agent builds against a task spec, then a *reviewer* agent with completely fresh context tries to break it. Findings cycle back until the reviewer approves or the iteration cap hits.
- **Outer loop** (orchestrator-workers): a *PM* agent owns the backlog. It triages, picks the next most valuable item, shapes it into a build-ready spec, and dispatches it into the inner loop.

Humans stay at the merge gate. Agents never merge to `main`.

## Quick start

1. **Use this template** (or clone), then open it in Claude Code.
2. Run `/setup-stack` to pick your language/framework; the agent scaffolds it and fills in the [command contract](CLAUDE.md#command-contract) that all other agents rely on.
3. Add work to the backlog (GitHub Issues, or [BACKLOG.md](BACKLOG.md) for local-only repos).
4. Run the loops:

| Command | What it does |
|---|---|
| `/build <description or issue #>` | Runs the inner loop on one task, with you at the merge gate |
| `/pm` | Runs the outer loop once: triage backlog, pick the next item, spec it, offer to build |
| `/pm --dispatch` | Same, but dispatches by labeling the issue `agent` (triggers CI) |

## Three execution modes

**Local (interactive).** `/build` and `/pm` in a Claude Code session. You approve the final commit/PR.

**GitHub Actions (event-driven).** Label any issue `agent` and [agent-task.yml](.github/workflows/agent-task.yml) runs the full inner loop headlessly, opening a PR that references the issue. Requires the `ANTHROPIC_API_KEY` repo secret.

**Scheduled PM (autonomous).** [pm-cron.yml](.github/workflows/pm-cron.yml) runs the PM agent on a schedule: it triages the backlog, picks one ready issue, refreshes its spec, and labels it `agent`, which triggers the event-driven mode. Disabled by default; uncomment the `schedule` block to enable.

## Repo layout

```
.claude/
  agents/          pm, implementer, reviewer: the actors, each with its own context and tools
  skills/          /build (inner loop), /pm (outer loop), /setup-stack (one-time adapt)
  workflows/       feature-loop.js, a deterministic scripted variant of the inner loop
  settings.json    pre-approved read-only permissions
.github/workflows/ ci.yml (deterministic gates + security scan), agent-task.yml
                   (label-triggered inner loop), pm-cron.yml (scheduled PM)
docs/DESIGN.md     the research-backed rationale for every design choice
BACKLOG.md         local backlog fallback when GitHub Issues aren't available
CLAUDE.md          conventions + the command contract every agent relies on
```

## Safety rails (deliberate, evidence-backed design choices)

See [docs/DESIGN.md](docs/DESIGN.md) for the research behind each of these.

- **Deterministic gates beneath review.** Check/test/build run in CI on every PR and must be green before a review round even starts. Agent review layers on top of machinery that can't be talked past.
- **Grounded review.** The reviewer sees only the spec and the diff, never the implementer's reasoning, and a blocking finding requires evidence the reviewer *executed*: a failing command, a reproduced wrong output. Agents verify behavior through the contract's `run`/`smoke` path, not just compilation.
- **Bounded loops at three levels.** At most 3 implement/review rounds with a no-progress early exit, `--max-turns` caps any single agent, and workflow timeouts cap each CI run.
- **No consensus-seeking.** Disputed findings go to an independent judge (or the human, locally). The implementer and reviewer never negotiate each other into agreement.
- **Informed human merge gate.** Agents open PRs carrying criteria mapping, severity-ranked findings, and executed verification evidence; only humans merge. Branch protection on `main` is strongly recommended.
- **Spec-driven.** Nothing is implemented without acceptance criteria; the PM decomposes anything too big for one PR.
- **Tests are a floor.** An independent security scan runs in CI, and the reviewer explicitly judges whether the tests themselves are meaningful.

## Adapting the template

- Swap the stack: rerun `/setup-stack`, or hand-edit the command contract in [CLAUDE.md](CLAUDE.md).
- Add actors: drop a new agent in `.claude/agents/` (e.g. a security reviewer) and reference it from the `/build` skill's review phase.
- Tune autonomy: the spectrum runs from `/build` with you watching to a cron'd PM feeding a labeled-issue pipeline you only see as incoming PRs.
