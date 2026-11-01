# Memória do projeto

**Curupira** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-01 | 1 · Fundação | 15% | Em desenvolvimento · MVP v1.0 |

## Já feito

- Régua sincronizada, workspace pnpm, husky, commitlint e workflows de CI/CD
- `shared/` com enums, validators Zod e responses do domínio, verde (check e 21 testes)
- `AGENTS.md`, `CLAUDE.md`, PRD, fluxos, decisões e tarefas

## Parou em

Backend e frontend sendo reescritos a partir do molde do interclasse (o starter foi descartado). `docs/ARCHITECTURE.md`, `ENV.md`, `SECURITY.md`, `TEST-PLAN.md`, `DESIGN.md`, `RULES.md` e `CHANGELOG.md` ainda são modelo: preencher com o que o código real ficar sendo.

## Próximos passos

1. Fechar backend e app do morador (Fases 2 e 3) e rodar `pnpm check` na raiz.
2. Painel `/gestao` (Fase 4) em cima da base do frontend.
3. Trocar os mocks de `src/data` pela API e rodar o E2E.
4. Preencher os docs pendentes.

## Contexto importante

- Bairros e cronograma do seed são de exemplo: a prefeitura confere antes de abrir.
- Commits de migração usam `HUSKY=0` enquanto `backend/` e `frontend/` não passam no `check`; depois disso o gate volta inteiro.
- Branch de trabalho: `feat/curupira-plataforma` (a sessão sugeria um nome com prefixo de agente, proibido pela régua).
- Toolchain local: Node 24 e pnpm 12 instalados num prefixo à parte, o sistema tem Node 22 e pnpm 10.

## Lições

> Uma linha por correção do dono (`AGENTS.md`, "Modo de trabalho" item 3). Lida no início de toda
> sessão. Lição que vale para todo projeto sobe para a régua e sai daqui.

| Data | Erro | Regra que evita | Vale para |
|---|---|---|---|
| AAAA-MM-DD | <o que o agente fez de errado> | <o que fazer em vez disso> | <camada, pasta ou tipo de tarefa> |

## Problemas conhecidos

| Problema | Onde | Contorno |
|---|---|---|
| Leaflet, vite-plugin-pwa, sharp sem entrada na `_doc-lib` | `docs/DECISIONS.md` #3 e #4 | propor ao upstream |

## Links úteis

- Repositório: `jhollyfer/curupira`
