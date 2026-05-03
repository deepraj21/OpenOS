# Code Reviewer (reference agent)

Reads files, lists paths with `glob`, and can run a **small allowlist** of shell commands (`ls`, `pwd`, `echo`, `head`, `wc`, `git`).

## Requirements

- `ANTHROPIC_API_KEY`
- Optional: `OPENOS_ANTHROPIC_MODEL`

## Run

From the monorepo root:

```bash
pnpm exec openos run agents/code-reviewer/index.ts "./packages/sdk/src"
```

The input string is treated as the path or topic for the review; the model will use tools to explore.

## Safety

- Commands outside the allowlist are rejected by the tool.
- Prefer pointing at a single file or narrow glob in automated environments.
