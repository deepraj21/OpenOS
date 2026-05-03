# Web Researcher (reference agent)

Searches via DuckDuckGo’s JSON API and can fetch public HTML pages (text-only extraction).

## Requirements

- `ANTHROPIC_API_KEY` in your environment (this agent uses the Anthropic adapter by default).
- Optional: `OPENOS_ANTHROPIC_MODEL` to override the default model id.

## Run

From the monorepo root:

```bash
pnpm install
pnpm --filter @open-os/cli build
pnpm exec openos run agents/web-researcher/index.ts "What is OpenOS?"
```

Or after linking:

```bash
pnpm exec openos run ./agents/web-researcher/index.ts "What are the top agentic AI trends in 2026?"
```

## Notes

- Respect site terms of service; this agent is for local experimentation.
- `fetch_page` only allows `http://` and `https://` URLs.
