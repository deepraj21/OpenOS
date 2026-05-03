# File Manager (reference agent)

Provides directory listing, read/write, move, mkdir, and **soft delete** (moves files into `.openos-trash/` under the current working directory).

## Requirements

- `ANTHROPIC_API_KEY`
- Optional: `OPENOS_ANTHROPIC_MODEL`

## Run

```bash
pnpm exec openos run agents/file-manager/index.ts "List the packages directory and summarize."
```

## Safety

- Paths are constrained to the process working directory.
- `delete_file` never hard-deletes; it renames into `.openos-trash/`.
