// Conventional commits, enforced in CI (see the commits job in ci.yml).
// Agents and humans follow the same rule; CLAUDE.md states it, this checks it.
export default { extends: ['@commitlint/config-conventional'] }
