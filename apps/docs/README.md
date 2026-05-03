# OpenOS Docs (`@open-os/docs`)

Next.js documentation shell. Global styles map core tokens from the root [`DESIGN.md`](../../DESIGN.md) (white canvas, display/body font fallbacks, primary pill CTA patterns).

```bash
pnpm --filter @open-os/docs dev
```

## GitHub Pages

The app builds as a **static export** (`next build` with `output: 'export'`). CI workflow [`.github/workflows/docs-github-pages.yml`](../../.github/workflows/docs-github-pages.yml) uploads `apps/docs/out` via **GitHub Actions** → **Pages**.

1. In the repo: **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
2. Push to `main` (or run the workflow manually). The workflow sets `BASE_PATH` to `/<repo>` for normal repos, or empty when the repo is `<owner>.github.io` (user/org site).
3. To preview locally with the same base path as production: `BASE_PATH=/YourRepo pnpm --filter @open-os/docs build` then open `apps/docs/out/index.html` via a static server (absolute `/YourRepo/...` asset URLs will not resolve from `file://`).

Server-side docs search was removed so the export stays fully static.
