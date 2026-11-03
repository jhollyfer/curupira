# Tarefas do projeto

**Curupira** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 25 tarefas · 24 feitas · 1 bloqueada · fase R: 4 de 9 feitas, 5 pendentes (atualizado 2026-11-02)

Status: `A fazer` · `Em andamento` · `Feita` · `Bloqueada` (com motivo nas notas).
Prioridade: `Alta` · `Média` · `Baixa`.

## Fase 1 · Fundação (5/6)

Workspace, régua, contratos e CI/CD no padrão Maiyu.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 1.1 | Sincronizar `_doc-lib/`, `_standards/` e skills do `maiyu-pattern` | Alta | Feita | |
| 1.2 | Workspace pnpm, husky, commitlint e workflows de CI/CD | Alta | Feita | portas e nomes do banco/MinIO de teste alinhados ao Curupira |
| 1.3 | `shared/` com enums, validators Zod e responses do domínio | Alta | Feita | |
| 1.4 | `AGENTS.md`, `CLAUDE.md` e `docs/` | Alta | Feita | |
| 1.5 | Remover as sobras do starter (backend e frontend) | Alta | Feita | backend e frontend reescritos a partir do molde do interclasse |
| 1.6 | Deploy no Coolify: serviços, variáveis, healthcheck `/health-check` | Média | Bloqueada | domínios definidos (`api-curupira.maiyu.com.br`, `curupira.maiyu.com.br`); faltam os uuids das duas aplicações em `main-deploy-coolify.yml` (hoje `PREENCHER_*`, o job reprova de propósito) e o endereço do bucket de produção para `STORAGE_PUBLIC_URL` (`DECISIONS.md` #27) |

## Fase 2 · Backend (5/5)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 2.1 | Domínio, models, repositórios e migrations | Alta | Feita | seis entidades, repositórios Lucid e em memória, 11 migrations |
| 2.2 | Features `storefront` (bairros, cronograma, avisos, fotos, denúncia, protocolo, mapa) | Alta | Feita | e2e do backend passam no CI, em 3 shards contra Postgres e MinIO reais (PRs #6 e #8; `TEST-PLAN.md` §7) |
| 2.3 | Features `management` (ocorrências, cronograma, bairros, avisos, contas) | Alta | Feita | mais `authentication`, `account` e `storages` |
| 2.4 | Segurança: throttles, EXIF, Origin, mimetype | Alta | Feita | `docs/SECURITY.md`; a auditoria do código é a 5.2 |
| 2.5 | Seeders com bairros reais de Benjamin Constant | Média | Feita | 12 bairros e cronograma de exemplo; a prefeitura confere antes de abrir (`PRD.md` §8) |

## Fase 3 · App do morador (6/6)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 3.1 | Base: tokens, i18n pt-BR/es/en, PWA, componentes comuns | Alta | Feita | |
| 3.2 | Home e cronograma do mês | Alta | Feita | |
| 3.3 | Denúncia em 3 passos e fila offline | Alta | Feita | |
| 3.4 | Acompanhar por protocolo | Alta | Feita | |
| 3.5 | Mapa público | Média | Feita | |
| 3.6 | Trocar os mocks de `src/data` pela API | Alta | Feita | provada por E2E de Playwright contra a API real (11 testes); entrada e saída usam `/authentication/sign-in` e `/sign-out`; a camada de dados de exemplo saiu depois (R.1); resta definir `VITE_STORAGE_URL` (1.6) |

## Fase 4 · Painel da gestão (4/4)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 4.1 | Entrada e visão geral | Alta | Feita | |
| 4.2 | Ocorrências: mapa, tabela com filtros, detalhe, status e resposta | Alta | Feita | |
| 4.3 | Cronograma e bairros | Média | Feita | |
| 4.4 | Avisos e contas | Média | Feita | |

## Fase 5 · Fechamento (4/4)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 5.1 | E2E (fluxo de denúncia, protocolo, painel, offline) | Alta | Feita | 11 testes de Playwright contra a API real, com axe em cada tela; o job de E2E do CI roda contra a API real e o MinIO real e passou no PR #8, em 13,6 min |
| 5.2 | Auditoria de segurança do código | Alta | Feita | correções aplicadas; achados e residuais em `docs/SECURITY.md` §10 |
| 5.3 | Revisão de acessibilidade e desempenho em rede lenta | Média | Feita | axe sem violações nas telas do morador (360x740 e 412x915) e do painel (1440x900 e 1024x768), nos temas claro e escuro; movimento reduzido por peça; o teste manual antes do release continua em `TEST-PLAN.md` §8 |
| 5.4 | Responsividade do app e do painel, e revisão de acessibilidade e desempenho dela | Alta | Feita | layout feito e documentado (`DESIGN.md` §4); testes `responsive-*` no CI (121 de E2E no total, matriz pública de 4 larguras; 187 com a matriz completa). Resíduos, registrados em `MEMORY.md`: (a) 1 achado moderado de axe (`region`) nos menus abertos do shadcn; (b) links de bairro com 38 px de largura no tablet escuro; (c) desempenho do layout novo em rede lenta, ainda não medido |

## Fase R · Pendências da régua sincronizada em 2026-11-02

Achados do sync que mudam muito código ou dependem de decisão do dono; nenhum foi aplicado.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| R.1 | `VITE_DATA_SOURCE` fora do catálogo: remover a camada de dados de exemplo (`src/data`, `fromSource`, mock-session, `strip-example-data`) | Média | Feita | decisão do dono: saiu a camada inteira (`src/data`, `fromSource`, mock-session, `strip-example-data`, contas de exemplo, `.env.production`); dado de exemplo vem do seeder de demonstração (`DECISIONS.md` #26) |
| R.2 | `VITE_STORAGE_URL` fora do catálogo: virar `STORAGE_PUBLIC_URL` em runtime, com CSP em `src/server.ts` | Média | Feita | `src/server.ts` lê `STORAGE_PUBLIC_URL` por requisição e escreve a CSP (`DECISIONS.md` #27); falta só o endereço do bucket de produção (1.6) |
| R.3 | Playwright em projetos `mobile` (360×740), `tablet` (768×1024) e `desktop` (1440×900) com os mesmos specs, mais `responsive.spec` e `touch-targets.spec`, e matriz no CI | Alta | A fazer | hoje: `mobile`, `desktop`, `responsive-*` |
| R.4 | Alvo de toque de 44 px vir do kit `components/ui/` (`h-11 sm:h-7`), não da variante `touch` nem de `.panel-touch` | Média | Feita | kit com `h-11 sm:h-7`; `.panel-touch` sobrou só no trilho da barra lateral; as variantes `touch` ficam como tamanho de leitura do app do morador; `touch-targets.spec` não rodou (sem Docker) |
| R.5 | Tipografia fluida com `clamp` e teto no desktop nos tokens `--text-*` | Baixa | Feita | `--text-display`, `--text-title`, `--text-section`, `--text-numeral` no `@theme`; `cn` conhece os nomes |
| R.6 | Auditoria das telas contra a tabela "cara de gerador" (`frontend.md`) | Média | Feita | sem halo, gradiente, hover só de `scale`, texto justificado, entrada escalonada nem copy genérica; `uppercase` só no dia da semana e no código de protocolo |
| R.7 | Contadores com `=0` e `=1` antes do plural (`panel_table_total`, `map_list_title`) | Baixa | Feita | nos três idiomas, com teste em `i18n.test.ts` |
| R.8 | `E2E_WORKERS`, `E2E_FULL_MATRIX` e `E2E_CHROMIUM_PATH` fora do catálogo de E2E | Baixa | Feita | `E2E_WORKERS` e `E2E_FULL_MATRIX` saíram; `CHROMIUM_PATH` virou `E2E_CHROMIUM_PATH` |
| R.9 | Todas as chaves de ambiente no catálogo da régua (`backend.md` §6.2): `APP_CLIENT_URL`, `SEED_DEMO_PASSWORD`, `SITE_ENV`, `E2E_DEMO_PASSWORD`, secrets do deploy `COOLIFY_*` | Alta | Feita | `chore/env-catalogo-padrao`; régua #276, jhollyfer/maiyu-pattern#16; E2E de Playwright e suíte `functional` do backend não rodaram nesta sessão (sem Docker): rodam no CI do PR |

## Fase N · Ideias (fora do escopo atual)

- Lembrete na noite anterior (push) e widget "o que sai hoje" - guia de UI de calendário de coleta
- Camada de focos de calor do INPE no mapa da gestão - BDQueimadas

---

## Como escrever uma tarefa

| Campo | Exemplo |
|---|---|
| Tarefa | Criar formulário de tarefa |
| Entradas | título e data de entrega |
| Validação | título obrigatório |
| Pronta quando | tarefa salva aparece na lista |

Antes de começar, a tarefa tem: um resultado claro, dependências listadas, arquivos
identificados e critério de aceite. Ao terminar: resultado revisado e status atualizado.
