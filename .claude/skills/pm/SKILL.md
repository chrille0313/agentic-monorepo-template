---
name: pm
description: Run the outer agentic loop once — triage the backlog, pick the most valuable ready item, shape its spec, and hand it to the inner loop. Use when the user asks "what's next", "groom the backlog", "run the PM", or on a schedule. Pass --dispatch to label the chosen issue for CI instead of building locally.
---

# /pm — the outer loop (orchestrator)

Input: `$ARGUMENTS` — optionally `--dispatch`.

## 1. Triage

Spawn the `pm` agent to: read the backlog (GitHub Issues if a remote exists, else BACKLOG.md), report backlog health (stale items, blocked items, items missing acceptance criteria), pick the ONE most valuable ready-or-readyable item, and produce a build-ready spec for it.

## 2. Report

Relay to the user: the pick and why, the spec, plus a short health note (e.g. "3 items lack acceptance criteria: #12, #15, #18").

## 3. Hand off

- **Without `--dispatch`** (interactive): ask the user whether to run `/build` on the spec now. If yes, invoke the build skill with the spec.
- **With `--dispatch`** (autonomous/CI): post the spec as a comment on the chosen issue, then add the `agent` label — that triggers `.github/workflows/agent-task.yml`, which runs the inner loop headlessly. Dispatch at most ONE issue per run, and skip dispatching entirely if an `agent`-labeled issue is already open (one task in flight at a time).

If nothing on the backlog is actionable, say so, list what would make the top items ready, and stop — an empty dispatch is a fine outcome.
