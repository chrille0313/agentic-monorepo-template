// Conventional commits, enforced in CI (see the commits job in ci.yml).
// Agents and humans follow the same rule; CLAUDE.md states it, this checks it.
//
// Rules stay fully strict. Dependabot commits are exempted the same way
// commitlint's defaults exempt merge and revert commits: their casing is
// machine-generated and not configurable (dependabot-core derives it from
// repo-history heuristics, not from dependabot.yml). Matched via the
// updated-dependencies trailer every Dependabot commit carries.
export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => /^updated-dependencies:$/m.test(message)],
}
