# Design rationale

Why the loops are shaped the way they are. Every choice below traces to published evidence (research pass: July 2026, claims adversarially verified against primary sources).

## The patterns have names

The inner loop is Anthropic's **evaluator-optimizer** pattern ("one LLM call generates a response while another provides evaluation and feedback in a loop"). The outer PM loop is **orchestrator-workers**, whose canonical use case is coding systems making multi-file changes. Orchestration is defined by *dynamic decomposition*, which is why the PM decomposes oversized items itself rather than only dispatching whole backlog items. ([Anthropic, Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents))

## Review must be grounded in execution, or it's theater

The single strongest result in the literature: LLMs cannot reliably improve their own output through intrinsic critique, and self-correction without external feedback often *decreases* accuracy ([Huang et al., ICLR 2024](https://arxiv.org/abs/2310.01798)). Pure agent-vs-agent review exhibits "disagreement collapse" (a present correct answer fails to become the consensus) in up to 86% of judge-free cases, and answer-flipping correlates almost perfectly with sycophancy rather than reasoning (r=0.902) ([arXiv 2509.23055](https://arxiv.org/html/2509.23055v1)). What makes the loop work is machine-verifiable signal: executed tests, build exit codes, exercised behavior.

Hence: the command contract is a **hard gate beneath the reviewer** (CI enforces the same commands), blocking findings **require executed evidence**, and the contract includes **Run/Smoke** so agents verify behavior. A verifier that only checks compilation is a named failure mode in the MAST taxonomy ([Cemri et al., NeurIPS 2025](https://arxiv.org/html/2503.13657v1)).

Grounding review in execution does not mean every agent runs the checks itself. Deterministic commands return the same answer whoever runs them, so what buys independence is that the author isn't the one certifying their own work — not the number of agents repeating the run. Check/test/build therefore run once per round, dispatched by the controller rather than the implementer, and again in CI on the PR. The reviewer's own commands go where a repeat would actually add something: a running app, exercised on the surface the diff touched.

## Both review failure modes are guarded

- **Rubber-stamping** is countered by the fresh-context reviewer (it never sees the implementer's reasoning) and by sending disputes to an independent judge instead of implementer-reviewer consensus. Sycophancy intensifies during negotiation, and adding a judge roughly halves collapse rates.
- **Over-reporting** is the inverse failure, and Anthropic documents it: "a reviewer prompted to find gaps will usually report some, even when the work is sound." The reviewer is scoped to correctness plus stated requirements, APPROVE is framed as a common correct outcome, and only blocking findings obligate the implementer. ([Claude Code best practices](https://code.claude.com/docs/en/best-practices))

## 3 rounds, with early exit

Debate studies recommend capping at 2-3 substantive exchanges: sycophancy grows in later rounds while marginal quality gains shrink, and *initial* answer quality dominates final quality (beta=0.600, p<0.001; the structural knobs of the loop were statistically insignificant) ([arXiv 2511.07784](https://arxiv.org/html/2511.07784v1)). Two consequences: the cap stays at 3, and effort goes into first-pass quality (spec quality, right-sized tasks) rather than more rounds. The **no-progress exit** ends the loop as soon as a round changes nothing, since continuing is provably wasted.

Rounds are not turns: the 3-round cap bounds implement/review *cycles*, `--max-turns` bounds steps inside a single agent, and workflow timeouts bound wall-clock time per CI run. Independent circuit breakers at independent levels.

## Tests are a floor, not a verdict

A large share of AI-generated code introduces security vulnerabilities *while passing unit tests* (Veracode 2025; [survey](https://arxiv.org/html/2508.00083v1)). Hence the independent security scan in CI and the reviewer's explicit duty to judge whether the tests themselves are meaningful.

## The human gate is weak unless informed

Automation bias is measured: developers initially accepted 82% of AI suggestions but retained only 52% (Sabouri et al., ICSE 2025), and AI-authored PRs take about 12% more human review rounds. So PRs must carry evidence (criteria mapping, severity-ranked findings, what was executed), and the pipeline pre-resolves lint/format noise before a human ever looks. The merge gate is the last line of defense, not the only one: branch protection, turn caps, and the independence rule for parallel dispatches (no shared code, no dependencies between in-flight tasks, dispatch paced by review capacity) hold independently of human vigilance.

## Prompt philosophy

Agent prompts state **outcomes and constraints, not procedures**. Over-prompting encodes today's assumptions into every future run; models reason better toward a clearly stated outcome than through a prescribed checklist. Keep prompts short. The exception: message formats the loop parses (verdicts, reports) are specified exactly.

## Task size is a cohesion decision, not a minimization problem

Orchestration is *dynamic* decomposition, which cuts both ways: an orchestrator that always decomposes isn't orchestrating, it's shredding. Every extra task costs a spec, a branch, a review loop and a merge, and none of that buys quality — first-pass quality dominates final quality, and a feature split five ways has five first passes to get right instead of one.

The failure is sharpest in interface work, where coherence is not a property any single slice can carry: five sections built in five loops, each approved against its own criteria, compose into an interface that looks assembled rather than designed. A spec written as an inventory of parts produces the same result. Where a surface genuinely exceeds one sitting's review, the split that keeps coherence is foundation-first — layout, tokens and component vocabulary decided once, later tasks conforming to them — rather than section by section.

Hence the sizing rule: one task is what an implementer can carry to a coherent end and a human can review in one sitting, and a split needs a named trigger (hard dependency, risky unknown worth landing alone, diff too large to review honestly). This is operating experience with this template rather than a citation; instrument it the same way — track how many of your merged PRs would have been better as one.

## Smoke is a suite, not a ritual

Behavioral verification earns its place by testing what could plausibly be broken, and a smoke command that only proves the process boots stops doing that after the first few features. So smoke is the app's critical user journeys, extended by every feature that adds one, with the full run gating the PR; inside the loop, agents exercise the surface their diff touched. Coverage moves to where it is cheap, and the per-round check stays where the risk is.

## Known caveats

The quantitative sycophancy and round-cap results come from QA and logic-puzzle debate settings. Applying them to code loops is analogical, though directionally consistent with code-domain evidence (MAST, ICSE 2025 review experiments). Instrument your own loop: track how often round 2+ actually changes the outcome, and tune the cap on your data.
