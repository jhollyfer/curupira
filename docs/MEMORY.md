# Memória do projeto

**Curupira** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-02 | 1 · deploy (1.6, bloqueada); o resto está feito | 96% (24 de 25 tarefas) | Responsividade mesclada (#6, #8, #9) · CI verde nos 10 checks · MVP v1.0 |

## Já feito

- Régua sincronizada, workspace pnpm, husky, commitlint e workflows de CI/CD (Fase 1, menos o deploy 1.6).
- `shared/` com enums, validators Zod, responses, `Either` e o protocolo; 5 arquivos de teste, 21 testes.
- Backend AdonisJS 7 completo: 6 entidades de domínio, repositórios Lucid e em memória, 11 migrations, 47
  operações no `openapi.json`, throttles com o IP em HMAC, `Origin`, EXIF, assinatura de arquivo, seeders de
  bairros e do dono (só em `development` e `test`), comandos `storages:prune` e `users:create-owner`; 76
  arquivos de teste unitário (290 testes) e 69 de e2e, que passam no CI em 3 shards contra Postgres e MinIO reais.
- App do morador: home, cronograma e `.ics`, denúncia em 3 passos com fila offline, acompanhar por protocolo,
  mapa com ponto aproximado, avisos, sobre, privacidade e termos, PWA sem o painel no cache, três idiomas.
  Fala com a API de verdade (3.6 provada por E2E); 303 testes unitários em 53 arquivos.
- Painel `/gestao`: visão geral, ocorrências, avisos, cronograma, bairros, contas e perfil, com capacidade por papel.
- E2E de Playwright contra a API real, no CI: 11 testes de fluxo (6 do morador em celular, 5 do painel em desktop),
  com axe, mais a matriz de responsividade (4 larguras no CI, 7 localmente ou com `E2E_FULL_MATRIX=1`). Total de
  121 testes no CI e 187 com a matriz completa; o job leva cerca de 13,6 min, com limite de 25.
- Responsividade: app do morador com navegação superior em tablet e desktop, hero e grade em colunas a partir de
  `md` e `lg`; painel `/gestao` do celular ao monitor largo (gaveta, cartões, folha de filtros, abas, cronograma
  por dia, `.panel-touch` de 44 px). Descrito em `DESIGN.md` §4.
- Auditoria de segurança feita, com as correções aplicadas (`SECURITY.md` §10); revisão de acessibilidade e
  movimento reduzido por peça.
- Docs completos: PRD, fluxos, decisões (24), arquitetura, ambiente, segurança, plano de testes, design, regras, changelog.

## Parou em

Responsividade do app e do painel mesclada (PRs #6, #8 e #9). O PR #8 trocou a matriz de E2E do CI por uma de
4 larguras, e o job `Frontend - E2E (Playwright)`, que tinha estourado o tempo no PR #6, passou em 13,6 min junto
com os outros 9 checks (commitlint, auditoria de dependências, varredura de segredo, check do backend e do
frontend, 3 shards do backend contra MinIO real). Código, auditoria de segurança e polimento de design fechados.
O que falta de resto é só do dono, nada de código:

1. Preencher `UUID_API` e `UUID_APP` em `main-deploy-coolify.yml` e configurar o painel do Coolify
   (`ARCHITECTURE.md` §9.1).
2. Criar o bucket de produção e definir `VITE_STORAGE_URL` em `frontend/.env.production`.
3. Criar o cron de `node ace storages:prune` no servidor (por exemplo, de hora em hora).
4. Criar o primeiro administrador com `node ace users:create-owner`.
5. Conferir bairros e cronograma com a prefeitura, definir a retenção e revisar os textos de privacidade e termos.
6. Fechar os PRs do Dependabot #2 e #3 (`node:26-alpine` contraria a régua, Node 24 por digest), avaliar #4 e #5 e apagar as branches já mergeadas no GitHub.

## Próximos passos

1. Os seis itens de "Parou em", na ordem.
2. Conferir no painel do Coolify se o proxy grava o IP do morador no log de acesso (`SECURITY.md` §2.8).
3. Propor ao `maiyu-pattern` as entradas de `_doc-lib` para Leaflet/react-leaflet, `vite-plugin-pwa`/workbox e `sharp`.
4. Teste manual antes do release (`TEST-PLAN.md` §8).

## Contexto importante

- Bairros e cronograma do seed são de exemplo: a prefeitura confere antes de abrir.
- Os textos de privacidade e termos (`/privacidade`, `/termos`) são rascunho: a prefeitura e a procuradoria revisam.
- Os uuids das aplicações no Coolify (`UUID_API`, `UUID_APP`) ainda são `PREENCHER_*`; o job de deploy reprova de
  propósito enquanto for assim.
- `VITE_STORAGE_URL` não está definida porque o endereço do bucket de produção é desconhecido; o build do app só
  avisa, e a foto não sobe em produção até a variável existir (`DECISIONS.md` #15).
- O MinIO real roda no CI (3 shards do backend e o E2E do frontend). Nesta máquina, sem Docker, a suíte usa um S3
  emulado (moto) e 2 testes do backend falham só por limitação dele: `refuses with 422 when what was uploaded does
  not have the declared size` e `a signed URL stops being valid after it expires`.
- Sessões antigas caem no deploy: os cookies passaram a se chamar `curupira-access-token` e `curupira-refresh-token`.
- O seeder do dono só roda em `development` e `test`; em produção o primeiro administrador sai de `users:create-owner`.
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
| 2026-11-01 | Agente seguiu a doc sem testar a variável de ambiente real: `TRUSTED_PROXIES=loopback,uniquelocal` quebrava a API (A-01) | testar `TRUSTED_PROXIES` com o valor de produção, e toda variável de ambiente nova com o valor que a produção terá, não só com o do `.env.example` | `backend/` e o `ENV.md` |

## Problemas conhecidos

| Problema | Onde | Contorno |
|---|---|---|
| Leaflet/react-leaflet, `vite-plugin-pwa`/workbox e `sharp` sem entrada na `_doc-lib` | `docs/DECISIONS.md` #3 e #4, `docs/SECURITY.md` §7 | usar a página oficial; propor ao upstream |
| As skills `high-end-visual-design` e `redesign-existing-projects` só o usuário invoca e não foram aplicadas ao polimento de design | `docs/DESIGN.md` | o dono invoca quando quiser a passada |
| `VITE_STORAGE_URL` não definida: a CSP de produção bloqueia o `PUT` da foto ao bucket | `frontend/.env.production`, `docs/ENV.md` §1.2 | definir o valor antes do primeiro build de produção |
| Sem cron de `storages:prune`: foto abandonada e upload `PENDING` ficam no bucket | `docs/ARCHITECTURE.md` §9.1 | criar o cron no servidor |
| Sem retenção automática de denúncia, foto e contato | `docs/SECURITY.md` §8.1 | decisão da prefeitura (`PRD.md` §8) |
| IP no log do proxy não verificável pelo repositório | `docs/SECURITY.md` §2.8 | conferir no painel do Coolify |
| Menus abertos do shadcn (dropdown, select) com 1 achado moderado de axe, a regra `region` | painel, `frontend/e2e/responsive-panel.spec.ts` | revisão de acessibilidade (`TASKS.md` 5.4) |
| Links de bairro com 38 px de largura no tablet, no tema escuro, abaixo dos 44 px | app do morador, `/coleta` e home | revisão de acessibilidade (`TASKS.md` 5.4) |

## Links úteis

- Repositório: `jhollyfer/curupira`
