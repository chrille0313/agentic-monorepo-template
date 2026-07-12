---
name: setup-stack
description: One-time template adaptation — pick a language/framework, scaffold a minimal project, and fill in the command contract in CLAUDE.md that all agents verify against. Use right after creating a repo from this template, or to swap the stack later.
---

# /setup-stack — adapt the template to a stack

This template is stack-agnostic on purpose: the agentic loop only needs the **command contract** in CLAUDE.md (check / test / build / dev). This skill makes those commands real.

## 1. Choose

Ask the user (AskUserQuestion) for their stack — language/framework, package manager, test runner — unless they already said. Offer sensible bundles (e.g. "TypeScript + Vite + Vitest", "Python + uv + pytest", "Go + std tooling") but accept anything.

## 2. Scaffold minimally

Use the stack's official initializer where one exists. Keep it minimal: the loop needs something to lint, test, and build — not a demo app. Include at least one real passing test, so the contract's test command is meaningful from day one. Extend `.gitignore` for the stack.

## 3. Fill the command contract

Replace every `TODO` in CLAUDE.md's command-contract section with real commands. Then **verify each one by running it** — a contract entry that hasn't run green doesn't go in. Fast and deterministic beats thorough here; these run on every inner-loop round.

## 4. Finish

- Update the README title/intro to name the project (keep the loop documentation).
- Mark the "Set up the stack" task done in BACKLOG.md (or close the issue).
- Suggest next steps: add branch protection on `main`, set the `ANTHROPIC_API_KEY` repo secret and create the `agent` label if they want the CI modes, then `/pm` or `/build` to start the loop.
