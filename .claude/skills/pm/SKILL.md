---
name: pm
description: Run the outer agentic loop once. Triage the backlog, pick the most valuable ready item, shape its spec, and hand it to the inner loop. Use when the user asks "what's next", "groom the backlog", "run the PM", or on a schedule. Pass --dispatch to label the chosen issue for CI instead of building locally.
---

# /pm: the outer loop (orchestrator)

Input (`$ARGUMENTS`): optionally `--dispatch`.

## 1. Triage

Spawn the `pm` agent for a triage. Its deliverables: backlog health (stale items, blocked items, items missing acceptance criteria), the ONE most valuable ready-or-readyable item, and a build-ready spec for it.

## 2. Report

Relay to the user: the pick and why, the spec, plus a short health note (e.g. "3 items lack acceptance criteria: #12, #15, #18").

## 3. Hand off

- **Without `--dispatch`** (interactive): ask the user whether to run `/build` on the spec now. If yes, invoke the build skill with the spec.
- **With `--dispatch`** (autonomous/CI): post the spec as a comment on the chosen issue, then add the `agent` label, which triggers `.github/workflows/agent-task.yml` to run the inner loop headlessly. Independent tasks run in parallel: after dispatching, repeat the triage while ready items remain that are independent of everything now in flight (each pm pass picks knowing what the previous one dispatched). Two limits are real, and only these two: a dispatch must not depend on or touch the same code as in-flight work, and the human merge gate paces everything: when unreviewed agent PRs are piling up, stop dispatching rather than adding more.

If nothing on the backlog is actionable, say so, list what would make the top items ready, and stop. An empty dispatch is a fine outcome.
