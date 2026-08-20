export const meta = {
  name: 'feature-loop',
  description: 'Deterministic implement → gate → review → fix loop for one task spec (max 3 rounds)',
  whenToUse: 'When you want the inner loop with scripted control flow instead of the /build skill, e.g. Workflow({name: "feature-loop", args: {spec: "..."}})',
  phases: [
    { title: 'Implement', detail: 'implementer agent builds against the spec' },
    { title: 'Gate', detail: 'command contract runs once on the finished diff' },
    { title: 'Review', detail: 'fresh reviewer judges spec vs diff' },
  ],
}

// Runs agents sequentially in the CURRENT branch/worktree (no per-agent isolation:
// round N+1 must see round N's changes). The caller owns git state: create the
// task branch before invoking, commit after.

const spec = args && args.spec
if (!spec) throw new Error('Pass the task spec: Workflow({name: "feature-loop", args: {spec: "..."}})')
const MAX_ROUNDS = (args && args.maxRounds) || 3
const MAX_GATE_FIXES = 2

const GATE_SCHEMA = {
  type: 'object',
  required: ['pass', 'commands'],
  properties: {
    pass: { type: 'boolean' },
    commands: {
      type: 'array',
      items: {
        type: 'object',
        required: ['command', 'pass'],
        properties: {
          command: { type: 'string' },
          pass: { type: 'boolean' },
          failure: { type: 'string', description: 'the relevant output when it failed' },
        },
      },
    },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['verdict', 'findings'],
  properties: {
    verdict: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES'] },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        required: ['criterion', 'verified'],
        properties: {
          criterion: { type: 'string' },
          verified: { type: 'boolean' },
          how: { type: 'string' },
        },
      },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['blocking', 'location', 'defect'],
        properties: {
          blocking: { type: 'boolean' },
          location: { type: 'string', description: 'file:line' },
          defect: { type: 'string' },
          failureScenario: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
  },
}

// A workflow script has no shell of its own, so the gate is an agent — but never the
// author of the diff, and never the reviewer. It runs check/test/build exactly once
// per attempt and reports exit status, nothing else.
const runGate = round =>
  agent(
    "Run this repo's check, test and build commands from CLAUDE.md's command contract, exactly once each, against the current working tree. Report each command's exit status and, for failures, the relevant output. Do not fix anything, do not review the code.",
    { label: `gate:r${round}`, phase: 'Gate', schema: GATE_SCHEMA, effort: 'low' },
  )

const gateReport = gate =>
  gate.commands.map(c => `- ${c.command}: ${c.pass ? 'pass' : `FAIL — ${c.failure || 'see output'}`}`).join('\n')

let findings = []
let lastReview = null
const rounds = []

for (let round = 1; round <= MAX_ROUNDS; round++) {
  log(`Round ${round}/${MAX_ROUNDS}`)

  const feedback = findings.length
    ? `\n\nA reviewer requested changes. Address EVERY blocking finding (fix it, or dispute with evidence):\n${
        findings.map(f => `- [blocking] ${f.location}: ${f.defect}${f.suggestedFix ? ` (suggested: ${f.suggestedFix})` : ''}`).join('\n')
      }`
    : ''

  const report = await agent(
    `Implement this task spec in the current working tree.\n\n${spec}${feedback}`,
    { agentType: 'implementer', label: `implement:r${round}`, phase: 'Implement' },
  )
  if (report === null) throw new Error(`Implementer died in round ${round}`)

  // Gate before review: a red contract is not a review finding, it's a bounce back to
  // the implementer. Fixing it does not consume a review round.
  let gate = await runGate(round)
  if (gate === null) throw new Error(`Gate died in round ${round}`)
  for (let fix = 1; !gate.pass && fix <= MAX_GATE_FIXES; fix++) {
    log(`Round ${round}: gate red, back to the implementer (${fix}/${MAX_GATE_FIXES})`)
    await agent(
      `Your changes fail the command contract. Fix them; change nothing else.\n\n${gateReport(gate)}\n\nThe task spec, for context:\n\n${spec}`,
      { agentType: 'implementer', label: `fix-gate:r${round}.${fix}`, phase: 'Gate' },
    )
    gate = await runGate(round)
    if (gate === null) throw new Error(`Gate died in round ${round}`)
  }
  if (!gate.pass) {
    log(`Round ${round}: gate still red after ${MAX_GATE_FIXES} attempts, escalating`)
    return { approved: false, escalate: true, reason: 'gate-red', rounds, gate }
  }

  // Fresh reviewer every round. It gets only the spec, the working tree and the gate
  // result, never the implementer's report; that separation is the point of the loop.
  // It does not re-run the gate: its budget goes on behavior and test quality.
  lastReview = await agent(
    `Review the uncommitted changes in the current working tree against this task spec.\n\nThe command contract already ran green on this exact diff; do not re-run it:\n${gateReport(gate)}\n\n${spec}`,
    { agentType: 'reviewer', label: `review:r${round}`, phase: 'Review', schema: REVIEW_SCHEMA },
  )
  if (lastReview === null) throw new Error(`Reviewer died in round ${round}`)

  const blocking = lastReview.findings.filter(f => f.blocking)
  rounds.push({ round, verdict: lastReview.verdict, blockingCount: blocking.length })

  if (lastReview.verdict === 'APPROVE') {
    log(`Approved in round ${round}`)
    return { approved: true, rounds, review: lastReview }
  }

  // No-progress exit: identical blocking findings to last round means another
  // round provably won't help. Escalate now instead of riding out the cap.
  const key = fs => JSON.stringify(fs.map(f => `${f.location}|${f.defect}`).sort())
  if (findings.length && key(blocking) === key(findings)) {
    log(`Round ${round}: no progress (same blocking findings), escalating`)
    return { approved: false, escalate: true, reason: 'no-progress', rounds, unresolvedFindings: blocking, review: lastReview }
  }

  log(`Round ${round}: ${blocking.length} blocking finding(s)`)
  findings = blocking
}

// Iteration cap hit. Escalate, don't thrash.
return { approved: false, escalate: true, rounds, unresolvedFindings: findings, review: lastReview }
