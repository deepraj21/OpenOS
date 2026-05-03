# OpenOS Registry (`@openos/registry`)

Next.js app with **Prisma** and **SQLite** for zero-config local development (`prisma/registry.db`). The schema models `Agent` and `AgentVersion` as described in the product plan.

```bash
cp .env.example .env   # optional
pnpm --filter @openos/registry dev
```

- `GET /api/agents` supports `q` and `tag` query params.
- Production should point `DATABASE_URL` at Postgres and run migrations in your pipeline.
