# Tarefas do projeto

**Curupira** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 24 tarefas · 19 feitas · 1 em andamento · 1 bloqueada · 3 a fazer (atualizado 2026-11-01)

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
| 1.6 | Deploy no Coolify: serviços, variáveis, healthcheck `/health-check` | Média | Bloqueada | domínios definidos (`api-curupira.maiyu.com.br`, `curupira.maiyu.com.br`); faltam os uuids das duas aplicações em `main-deploy-coolify.yml` (hoje `PREENCHER_*`, o job reprova de propósito) |

## Fase 2 · Backend (5/5)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 2.1 | Domínio, models, repositórios e migrations | Alta | Feita | seis entidades, repositórios Lucid e em memória, 11 migrations |
| 2.2 | Features `storefront` (bairros, cronograma, avisos, fotos, denúncia, protocolo, mapa) | Alta | Feita | e2e contra Postgres e MinIO reais ainda não rodado nesta máquina (`TEST-PLAN.md` §7) |
| 2.3 | Features `management` (ocorrências, cronograma, bairros, avisos, contas) | Alta | Feita | mais `authentication`, `account` e `storages` |
| 2.4 | Segurança: throttles, EXIF, Origin, mimetype | Alta | Feita | `docs/SECURITY.md`; a auditoria do diff é a 5.2 |
| 2.5 | Seeders com bairros reais de Benjamin Constant | Média | Feita | 12 bairros e cronograma de exemplo; a prefeitura confere antes de abrir (`PRD.md` §8) |

## Fase 3 · App do morador (5/6)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 3.1 | Base: tokens, i18n pt-BR/es/en, PWA, componentes comuns | Alta | Feita | |
| 3.2 | Home e cronograma do mês | Alta | Feita | |
| 3.3 | Denúncia em 3 passos e fila offline | Alta | Feita | |
| 3.4 | Acompanhar por protocolo | Alta | Feita | |
| 3.5 | Mapa público | Média | Feita | |
| 3.6 | Trocar os mocks de `src/data` pela API | Alta | Em andamento | integração real sendo provada por outro agente; achados na leitura: `/authentication/sessions` no front contra `/authentication/sign-in` e `/sign-out` na API, `VITE_STORAGE_URL` fora da CSP de produção, e o job de e2e do CI passa `E2E_ADMIN_*` enquanto os specs leem `E2E_OWNER_*` |

## Fase 4 · Painel da gestão (4/4)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 4.1 | Entrada e visão geral | Alta | Feita | |
| 4.2 | Ocorrências: mapa, tabela com filtros, detalhe, status e resposta | Alta | Feita | |
| 4.3 | Cronograma e bairros | Média | Feita | |
| 4.4 | Avisos e contas | Média | Feita | |

## Fase 5 · Fechamento (0/3)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 5.1 | E2E (fluxo de denúncia, protocolo, painel, offline) | Alta | A fazer | só na fase final; hoje os 6 testes de Playwright rodam em modo `mock`, falta contra a API real |
| 5.2 | Auditoria de segurança do diff (`claude-security`) | Alta | A fazer | `docs/SECURITY.md` §2.8 e §8.1 listam o que olhar |
| 5.3 | Revisão de acessibilidade e desempenho em rede lenta | Média | A fazer | contraste conferido com ferramenta, leitor de tela, Lighthouse em 3G |

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
