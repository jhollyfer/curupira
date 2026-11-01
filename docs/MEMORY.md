# Memória do projeto

**Curupira** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-01 | 3 · integração real (3.6) e 5 · fechamento | 80% (19 de 24 tarefas) | Em desenvolvimento · MVP v1.0 |

## Já feito

- Régua sincronizada, workspace pnpm, husky, commitlint e workflows de CI/CD (Fase 1, menos o deploy 1.6).
- `shared/` com enums, validators Zod, responses, `Either` e o protocolo; 5 arquivos de teste, 21 testes.
- Backend AdonisJS 7 completo: 6 entidades de domínio, repositórios Lucid e em memória, 11 migrations, 47
  operações no `openapi.json`, throttles, `Origin`, EXIF, assinatura de arquivo, seeders de bairros e do dono,
  71 arquivos de teste unitário e 67 de e2e.
- App do morador: home, cronograma e `.ics`, denúncia em 3 passos com fila offline, acompanhar por protocolo,
  mapa, avisos, sobre, privacidade e termos, PWA, três idiomas. Roda com dados de exemplo (`VITE_DATA_SOURCE=mock`).
- Painel `/gestao`: visão geral, ocorrências, avisos, cronograma, bairros, contas e perfil, com capacidade por papel.
- Docs completos: PRD, fluxos, decisões, arquitetura, ambiente, segurança, plano de testes, design, regras, changelog.

## Parou em

Os docs foram preenchidos a partir do código real. Outro agente está provando a API de ponta a ponta contra o
frontend (tarefa 3.6, `Em andamento`). Falta: fechar a integração (e conferir o contrato, ver "Problemas
conhecidos"), rodar a suíte `functional` do backend contra o MinIO do compose, o E2E contra a API real, a
auditoria de segurança e a revisão final de acessibilidade e desempenho. O deploy (1.6) espera os uuids do Coolify.

## Próximos passos

1. Fechar a 3.6: corrigir `/authentication/sessions` para `sign-in` e `sign-out`, definir `VITE_STORAGE_URL`,
   alinhar `E2E_ADMIN_*` e `E2E_OWNER_*` e `E2E_DATA_SOURCE=api` no job de e2e do frontend.
2. Rodar `pnpm test:e2e` do backend com `docker compose up -d` (Postgres e MinIO reais).
3. Preencher `UUID_API` e `UUID_APP` em `main-deploy-coolify.yml` e configurar o painel do Coolify (`ARCHITECTURE.md` §9.1).
4. E2E completo (5.1), auditoria de segurança do diff (5.2) e revisão de acessibilidade e desempenho (5.3).
5. Propor ao `maiyu-pattern` as entradas de `_doc-lib` para Leaflet/react-leaflet, `vite-plugin-pwa`/workbox e `sharp`.
6. Prefeitura: conferir bairros e cronograma, definir retenção e revisar privacidade e termos (`PRD.md` §8).

## Contexto importante

- Bairros e cronograma do seed são de exemplo: a prefeitura confere antes de abrir.
- Os textos de privacidade e termos (`/privacidade`, `/termos`) são rascunho: a prefeitura e a procuradoria revisam.
- Os uuids das aplicações no Coolify (`UUID_API`, `UUID_APP`) ainda são `PREENCHER_*`; o job de deploy reprova de
  propósito enquanto for assim.
- MinIO real não foi rodado nesta máquina: o caminho do bucket foi exercitado só com um S3 emulado (moto).
- Leaflet/react-leaflet, `vite-plugin-pwa`/workbox e `sharp` não têm entrada na `_doc-lib`; devem ir ao
  `maiyu-pattern`. Enquanto isso valem a página oficial de cada uma.
- Commits de migração usam `HUSKY=0` enquanto `backend/` e `frontend/` não passam no `check`; depois disso o gate volta inteiro.
- Branch de trabalho: `feat/curupira-plataforma` (a sessão sugeria um nome com prefixo de agente, proibido pela régua).
- Toolchain local: Node 24 e pnpm 12 instalados num prefixo à parte, o sistema tem Node 22 e pnpm 10.
- Produção: app em `https://curupira.maiyu.com.br`, API em `https://api-curupira.maiyu.com.br`; imagens
  `curupira-app` e `curupira-api`; smoke test em `/health-check` (API) e `/revision.txt` (app).
- Portas de dev próprias: Postgres 5436, MinIO 9006 e console 9007 (outros projetos ocupam as padrão).

## Lições

> Uma linha por correção do dono (`AGENTS.md`, "Modo de trabalho" item 3). Lida no início de toda
> sessão. Lição que vale para todo projeto sobe para a régua e sai daqui.

| Data | Erro | Regra que evita | Vale para |
|---|---|---|---|
| 2026-11-01 | Nome de branch com prefixo de agente sugerido pela sessão | branch `<tipo>/<escopo>-<assunto>`, sem nome de agente | toda branch e todo PR |

## Problemas conhecidos

| Problema | Onde | Contorno |
|---|---|---|
| Leaflet, vite-plugin-pwa e sharp sem entrada na `_doc-lib` | `docs/DECISIONS.md` #3 e #4 | usar a página oficial; propor ao upstream |
| O corpo `api` de entrar e sair chama `/authentication/sessions`; a API tem `/authentication/sign-in` e `/sign-out` | `frontend/src/integrations/tanstack-query/mutations/authentication.ts`, `backend/start/routes.ts` | corrigir na 3.6 |
| `VITE_STORAGE_URL` não está em `.env.production`: a CSP de produção bloqueia o `PUT` da foto ao bucket | `frontend/vite.config.ts`, `docs/ENV.md` §1.2 | definir o valor no build |
| Job de e2e do frontend passa `E2E_ADMIN_*` e `E2E_API_URL`, os specs leem `E2E_OWNER_*` e o modo é `mock` | `.github/workflows/main-check-frontend.yml`, `frontend/e2e/support/credentials.ts` | alinhar na 3.6 |
| `prefers-reduced-motion` desliga animação por regra global em `*` | `frontend/src/styles.css` | trocar por `motion-reduce:` nos componentes |
| Sem retenção automática de denúncia, foto e contato | `docs/SECURITY.md` §8.1 | decisão da prefeitura (`PRD.md` §8) |
| Suíte `functional` do backend não rodada contra MinIO real aqui | `docs/TEST-PLAN.md` §7 | rodar no CI ou local com o compose |

## Links úteis

- Repositório: `jhollyfer/curupira`
