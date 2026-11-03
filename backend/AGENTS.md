# Backend: instruções para agentes

AdonisJS 7 + Lucid/Postgres. A régua é `../_standards/` (`backend.md`, `domain.md`, `architecture.md`,
`typescript.md`, `tooling.md` e `openapi.md`); o contrato das bibliotecas, `../_doc-lib/`. Regras e
contexto do produto: `../AGENTS.md` e `../docs/`. O que cada operação faz, recebe e devolve está no
`openapi.json` (UI em `/documentation`).

## Comandos

- `pnpm check`: lint, `format:check`, typecheck, `openapi:check`, `pattern:check`, `authz:check` e `test:unit`
  (`backend.md` §10).
- `pnpm depcruise`: direção das camadas e ciclo (`domain.md` §8).
- `pnpm test:unit`: a suíte `unit`, sem banco. `pnpm test:e2e`: a suíte `functional`, contra Postgres
  e MinIO do `docker-compose.yml` (`tooling.md` §8.4).
- `pnpm di:check`: constrói service e policy pelo container (exige banco).
- `pnpm openapi:generate`: reescreve o `openapi.json`.
- `node ace db:seed`: cada seed liga pela chave com valor, em qualquer ambiente (`backend.md` §6.2). Dono
  (`user.seed.ts`) com `SEED_OWNER_PASSWORD`; demonstração (`demo.seed.ts`: uma conta `<papel>@example.com` por papel,
  cronograma, denúncias e avisos) com `SEED_DEMO_PASSWORD`; vazia, pula com uma linha de log. Os bairros
  (`neighborhood.seed.ts`) são referência e rodam sempre (fora do `test`).

## Gerados e commitados

`database/schema.ts`, `.adonisjs/**` e `openapi.json`. Mexeu em migration, rota, controller ou policy,
regenere no mesmo commit: o CI roda `--check`.
