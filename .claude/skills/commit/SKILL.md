---
name: commit
description: Turn the working tree into small, reviewable conventional commits. Use when asked to commit, and at the end of any task before opening a PR.
---

Read the full diff before staging anything, then commit it as a series of small, modular commits: one logical change each. Concerns a reviewer reads differently get separate commits when they are separable: behavior changes, refactors, tests, docs, config. Stage selectively (per file or per hunk); never sweep the whole tree into one commit, and leave unrelated leftovers out of the series entirely (mention them instead).

Messages follow conventional commits (CI enforces the format). The title says **what** changed; the body says **why**: the intent or the problem being solved, never a summary of the diff.

Good:

```
feat(auth): add session timeout

Users stayed logged in indefinitely, a security risk on shared
devices. Sessions now expire after 24h of inactivity.
```

Bad: a body that restates what the diff already shows ("added a timeout and updated the hooks"), or says nothing ("fix: fix bug").
