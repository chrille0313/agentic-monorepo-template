// Conventional commits, enforced in CI (see the commits job in ci.yml).
// Agents and humans follow the same rule; CLAUDE.md states it, this checks it.
//
// Two rules are relaxed for Dependabot, whose messages we don't control: it
// always capitalizes the subject ("ci(deps): Bump ...") and its bodies carry
// long release-note URLs. Type, scope, and format stay fully enforced.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'body-max-line-length': [0],
  },
}
