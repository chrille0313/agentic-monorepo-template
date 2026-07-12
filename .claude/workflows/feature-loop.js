export const meta = {
  name: 'feature-loop',
  description: 'Deterministic implement → review → fix loop for one task spec (max 3 rounds)',
  whenToUse: 'When you want the inner loop with scripted control flow instead of the /build skill — e.g. Workflow({name: "feature-loop", args: {spec: "..."}})',
  phases: [
    { title: 'Implement', detail: 'implementer agent builds against the spec' },
    { title: 'Review', detail: 'fresh reviewer judges spec vs diff' },
  ],
}

// Runs agents sequentially in the CURRENT branch/worktree (no per-agent isolation:
// round N+1 must see round N's changes). The caller owns git state — create the
// task branch before invoking, commit after.

const spec = args && args.spec
if (!spec) throw new Error('Pass the task spec: Workflow({name: "feature-loop", args: {spec: "..."}})')
const MAX_ROUNDS = (args && args.maxRounds) || 3

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

let findings = []
let lastReview = null
const rounds = []

for (let round = 1; round <= MAX_ROUNDS; round++) {
  log(`Round ${round}/${MAX_ROUNDS}`)

  const feedback = findings.length
    ? `\n\nA reviewer requested changes. Address EVERY blocking finding (fix it, or dispute with evidence):\n${
        findings.map(f => `- [blocking] ${f.location} — ${f.defect}${f.suggestedFix ? ` (suggested: ${f.suggestedFix})` : ''}`).join('\n')
      }`
    : ''

  const report = await agent(
    `Implement the following task spec in the current working tree. Follow CLAUDE.md, verify with the command contract, and do NOT commit.\n\n${spec}${feedback}`,
    { agentType: 'implementer', label: `implement:r${round}`, phase: 'Implement' },
  )
  if (report === null) throw new Error(`Implementer died in round ${round}`)

  // Fresh reviewer every round — it gets only the spec and the working tree, never the
  // implementer's report. That separation is the point of the loop.
  lastReview = await agent(
    `Review the uncommitted changes in the current working tree (git diff, plus git diff --stat for scope) strictly against this task spec. Run the command contract from CLAUDE.md.\n\n${spec}`,
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
  // round provably won't help — escalate now instead of riding out the cap.
  const key = fs => JSON.stringify(fs.map(f => `${f.location}|${f.defect}`).sort())
  if (findings.length && key(blocking) === key(findings)) {
    log(`Round ${round}: no progress (same blocking findings) — escalating`)
    return { approved: false, escalate: true, reason: 'no-progress', rounds, unresolvedFindings: blocking, review: lastReview }
  }

  log(`Round ${round}: ${blocking.length} blocking finding(s)`)
  findings = blocking
}

// Iteration cap hit — escalate, don't thrash.
return { approved: false, escalate: true, rounds, unresolvedFindings: findings, review: lastReview }
