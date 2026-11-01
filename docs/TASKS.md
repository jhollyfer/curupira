# Tarefas do projeto

**Curupira** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 24 tarefas · 4 feitas · 3 em andamento · 17 a fazer — atualizado 2026-11-01

Status: `A fazer` · `Em andamento` · `Feita` · `Bloqueada` (com motivo nas notas).
Prioridade: `Alta` · `Média` · `Baixa`.

## Fase 1 · Fundação (4/6)

Workspace, régua, contratos e CI/CD no padrão Maiyu.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 1.1 | Sincronizar `_doc-lib/`, `_standards/` e skills do `maiyu-pattern` | Alta | Feita | |
| 1.2 | Workspace pnpm, husky, commitlint e workflows de CI/CD | Alta | Feita | portas e nomes do banco/MinIO de teste alinhados ao Curupira |
| 1.3 | `shared/` com enums, validators Zod e responses do domínio | Alta | Feita | |
| 1.4 | `AGENTS.md`, `CLAUDE.md` e `docs/` | Alta | Feita | |
| 1.5 | Remover as sobras do starter (backend e frontend) | Alta | Em andamento | |
| 1.6 | Deploy no Coolify: serviços, variáveis, healthcheck `/health-check` | Média | A fazer | depende da conta e do domínio |

## Fase 2 · Backend (0/5)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 2.1 | Domínio, models, repositórios e migrations | Alta | Em andamento | |
| 2.2 | Features `storefront` (bairros, cronograma, avisos, fotos, denúncia, protocolo, mapa) | Alta | Em andamento | |
| 2.3 | Features `management` (ocorrências, cronograma, bairros, avisos, contas) | Alta | Em andamento | |
| 2.4 | Segurança: throttles, EXIF, Origin, mimetype | Alta | A fazer | `docs/SECURITY.md` |
| 2.5 | Seeders com bairros reais de Benjamin Constant | Média | A fazer | conferir com a prefeitura |

## Fase 3 · App do morador (0/6)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 3.1 | Base: tokens, i18n pt-BR/es/en, PWA, componentes comuns | Alta | A fazer | |
| 3.2 | Home e cronograma do mês | Alta | A fazer | |
| 3.3 | Denúncia em 3 passos e fila offline | Alta | A fazer | |
| 3.4 | Acompanhar por protocolo | Alta | A fazer | |
| 3.5 | Mapa público | Média | A fazer | |
| 3.6 | Trocar os mocks de `src/data` pela API | Alta | A fazer | depende de 2.2 |

## Fase 4 · Painel da gestão (0/4)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 4.1 | Entrada e visão geral | Alta | A fazer | |
| 4.2 | Ocorrências: mapa, tabela com filtros, detalhe, status e resposta | Alta | A fazer | |
| 4.3 | Cronograma e bairros | Média | A fazer | |
| 4.4 | Avisos e contas | Média | A fazer | |

## Fase 5 · Fechamento (0/3)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 5.1 | E2E (fluxo de denúncia, protocolo, painel, offline) | Alta | A fazer | só na fase final |
| 5.2 | Auditoria de segurança do diff (`claude-security`) | Alta | A fazer | |
| 5.3 | Revisão de acessibilidade e desempenho em rede lenta | Média | A fazer | |

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
