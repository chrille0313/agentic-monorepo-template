# packages/

Shared code lives here, one directory per library (`packages/ui`, `packages/config`, ...). A piece of code moves here when a second app needs it, not before.

This is also the natural home for the agent-testing harness (e.g. `packages/smoke`) if it grows beyond a single script.
