# Plano de testes

**Curupira** · o que se testa, em que nível, com que critério

> Onde cada teste mora e o que cada camada leva: `_standards/architecture.md` §8; como se escreve:
> `_standards/domain.md` §10 e `_standards/backend.md` §7. Aqui fica só o que é deste projeto: os
> fluxos críticos, a matriz requisito × teste e o que conta como pronto.

## 1. Níveis

| Nível | Ferramenta | Onde | Roda em | Tamanho hoje |
|---|---|---|---|---|
| Unitário do backend | Japa, suíte `unit` (sem banco nem HTTP) | `backend/app/**/*.unit.spec.ts` e `scripts/`, `commands/`, `tests/`, `start/` | hook de commit, PR e `main` | 71 arquivos |
| E2E do backend | Japa, suíte `functional` (app inteiro, Postgres e MinIO reais) | `backend/app/**/*.e2e.spec.ts` | PR e `main`, em 3 shards | 67 arquivos |
| `shared/` | Vitest | `shared/src/**/*.test.ts` | hook de commit, PR e `main` | 5 arquivos, 21 testes |
| Unitário do frontend | Vitest + Testing Library | `frontend/src/**/*.test.ts(x)` e `frontend/scripts/*.test.ts` | hook de commit, PR e `main` | 47 arquivos |
| E2E do frontend | Playwright (axe-core em cada tela) | `frontend/e2e/report-flow.spec.ts` (projeto `mobile`, Pixel 7) e `management-flow.spec.ts` (projeto `desktop`, 1440 x 900) | job `e2e` de `main-check-frontend.yml` | 2 specs, 6 testes |

Redes que cobram o que ninguém lembra:

| Rede | O que reprova | Onde |
|---|---|---|
| `pattern:check` | desvio de padrão do backend (arquitetura, nomes, env sem leitor) | `backend/scripts/pattern-check.ts` |
| `authz:check` | qualquer mudança na cadeia de autorização de uma rota (`auth`, `role`, papéis) contra a linha de base versionada | `backend/scripts/authz-check.ts`, `backend/app/core/openapi/authz-baseline.json` |
| `openapi:check` | documento fora de dia com as rotas, operação sem resposta, id duplicado | `backend/app/core/openapi/openapi.e2e.spec.ts`, `public-routes.unit.spec.ts` |
| `depcruise` | camada que importa a que não devia, ciclo | `backend/scripts/depcruise.config.ts` |
| `di:check` | serviço ou policy que o container não consegue construir | `backend/commands/di-check.command.ts` |
| mensagens de validação | texto em inglês que escapou, campo sem rótulo ou sem teto | `backend/app/core/validator.unit.spec.ts`, `validator-messages.e2e.spec.ts`, `frontend/src/lib/messages.test.ts` |
| vazamento de resposta | credencial em qualquer nível, contato em rota pública | `backend/app/core/response-leak.e2e.spec.ts` |
| redação de log | senha e token no log | `backend/app/core/log-redaction.unit.spec.ts` |
| `i18n:check` | chave faltando em algum idioma | `frontend` (`inlang check`) |
| ciclo de chunk | ciclo que quebra o SSR | `frontend/scripts/check-chunk-cycles.mjs` |
| `routeTree.gen.ts` em dia | rota nova sem o arquivo gerado commitado | `main-check-frontend.yml` |
| banco de teste | rodar a suíte em banco sem o sufixo `_test` | `backend/tests/database-guard.ts` |

## 2. Fluxos críticos

Cada fluxo de `USER-FLOWS.md` marcado aqui tem spec E2E de ponta a ponta.

| Fluxo | Caminho feliz | Caminhos de erro | Teste |
|---|---|---|---|
| Nova denúncia | tipo, foto, ponto, envio e protocolo na tela | foto de formato inválido, sem sinal (fila) | `frontend/e2e/report-flow.spec.ts: sends a report and follows it by the protocol`, `saves the report on the device when offline` |
| Acompanhar | protocolo de exemplo mostra a linha do tempo | protocolo inexistente | `report-flow.spec.ts: tracks an example protocol`, `says so when the protocol does not exist` |
| Tratar ocorrência | entrar, abrir ocorrência recebida, avançar o status | não volta o status | `frontend/e2e/management-flow.spec.ts: signs in, handles an untreated report and cannot move it back` |
| Manter cronograma | administrador abre a grade por bairro | operador não abre a área (quando `E2E_OPERATOR_*` existe) | `management-flow.spec.ts: an administrator reaches the schedule, grouped by neighborhood` |
| Próxima coleta, calendário, mapa público, avisos, bairros, contas | | | sem E2E de navegador; cobertos por unitário de `lib/` e dos componentes (`schedule.test.ts`, `ics.test.ts`, `waste-calendar.test.tsx`, `report-map.test.tsx`) e pelo E2E da API (`storefront/*`, `management/*`) |

O E2E do frontend roda hoje com `VITE_DATA_SOURCE=mock` (padrão de `playwright.config.ts`) e dados de exemplo.
A prova contra a API real é a tarefa 3.6 de `TASKS.md`; sem ela, a entrada, a foto presignada e o protocolo
não foram exercitados do navegador à API. O job do CI sobe API, Postgres e MinIO, mas passa
`E2E_ADMIN_*` e `E2E_API_URL` enquanto os specs leem `E2E_OWNER_*` e `E2E_DATA_SOURCE`: alinhar na 3.6.

## 3. Matriz requisito × teste

Os requisitos ainda não têm id EARS próprio; a linha usa o número da funcionalidade de `PRD.md` §4.

| Requisito | Critério | Nível | Teste |
|---|---|---|---|
| PRD 3 | denúncia anônima devolve só o protocolo e não guarda contato | E2E backend | `storefront/reports/create/create.e2e.spec.ts: files an anonymous report and answers only the protocol` |
| PRD 3 | com contato a denúncia deixa de ser anônima e o contato é guardado | E2E backend | `create.e2e.spec.ts: with a contact the report is not anonymous...` |
| PRD 3 | o bairro é o centro mais próximo | E2E, unitário | `create.e2e.spec.ts: resolves the neighborhood by the nearest center`, `domain/neighborhood/nearest-neighborhood.unit.spec.ts` |
| PRD 3 | 1 a 3 fotos, tipo e coordenada válidos | E2E backend, shared | `create.e2e.spec.ts: requires 1 to 3 photos...`, `shared/src/validators/storefront/reports.test.ts` |
| PRD 3 | uma foto serve a uma denúncia, e `PENDING` não anexa | E2E backend | `create.e2e.spec.ts` (dois testes) |
| PRD 3 | EXIF removido do objeto guardado | E2E backend | `storefront/report-photos/complete/complete.e2e.spec.ts: strips the EXIF/GPS...` |
| PRD 3 | conteúdo que não é a imagem declarada é recusado e descartado | E2E backend | `complete.e2e.spec.ts` (bytes que só começam como JPEG, PNG enviado como JPEG) |
| PRD 3 | fila offline envia por ordem e descarta 4xx | Unitário frontend | `frontend/src/lib/report-queue.test.ts` |
| PRD 4 | consulta aceita maiúscula, espaço e letras parecidas | E2E, unitário | `show-by-protocol.e2e.spec.ts: forgives case...`, `shared/src/value-objects/protocol.test.ts` |
| PRD 4 | consulta pública mostra só campos públicos | E2E backend | `show-by-protocol.e2e.spec.ts: shows only the public fields...` |
| PRD 5 | mapa público só tem o que a equipe já abriu, sem hora, texto nem contato | E2E backend | `storefront/reports/map/map.e2e.spec.ts` |
| PRD 7 | status só avança | Unitário, E2E | `domain/report/report.entity.unit.spec.ts`, `management/reports/update-status/*.spec.ts`, `frontend/src/lib/report-status.test.ts` |
| PRD 8 | slot repetido do cronograma responde 409 | E2E backend | `management/schedules/create/create.e2e.spec.ts`, `domain/collection-schedule/*.unit.spec.ts` |
| PRD 10 | papel e capacidade | E2E, unitário | `middleware/role.middleware.e2e.spec.ts`, `policies/user.policy.*.spec.ts`, `frontend/src/lib/capabilities.test.ts` |
| Segurança | CSRF por `Origin` e CORS | Unitário, E2E | `middleware/origin.middleware.unit.spec.ts`, `middleware/cors.middleware.e2e.spec.ts` |
| Segurança | sessão por cookie | E2E | `guards/cookie-access-tokens.guard.e2e.spec.ts`, `authentication/sessions/*/*.e2e.spec.ts` |

### 3.1 Join de cobertura

| Conjunto | Membro | Teste |
|---|---|---|
| `POST /storefront/reports` | 201 | `create.e2e.spec.ts: files an anonymous report...` |
| | 422 | `create.e2e.spec.ts: requires 1 to 3 photos...`, foto `PENDING`, foto repetida |
| | 429 | `create.e2e.spec.ts: throttles the filing per IP: the 11th within the hour is 429` |
| `GET /storefront/reports/:protocol` | 200 | `show-by-protocol.e2e.spec.ts: shows only the public fields...` |
| | 404 | `show-by-protocol.e2e.spec.ts: an unknown and a malformed protocol answer the same 404` |
| | 429 | `show-by-protocol.e2e.spec.ts: throttles the lookups per IP...` |
| `ReportStatus` | `RECEIVED` | `report.entity.unit.spec.ts` (estado inicial) |
| | `IN_REVIEW`, `FORWARDED`, `RESOLVED` | `update-status` (unitário e E2E), `map.e2e.spec.ts` (os três são públicos) |
| `ReportKind` | `BURNING`, `DUMPING`, `DEFORESTATION`, `OTHER` | `shared/src/validators/storefront/reports.test.ts`, `report-kind-picker.test.tsx` |
| `UserRole` | `ADMINISTRATOR` | `role.middleware.e2e.spec.ts`, todas as specs de `management/schedules`, `neighborhoods`, `users` |
| | `OPERATOR` | `role.middleware.e2e.spec.ts` (403 nas rotas de administrador) |
| `NoticeStatus` | `SCHEDULED`, `ACTIVE`, `CLOSED` | `domain/notice/notice.entity.unit.spec.ts`, `management/notices/paginate`, `close` |
| `WasteType`, `CollectionShift` | todos os membros | `collection-schedule.entity.unit.spec.ts`, `frontend/src/lib/schedule.test.ts`, `schedule-grid.test.ts` |

Rota nova entra aqui com os status dela; valor novo de enum, com a linha dele. As specs de cada ação
(`app/features/**/<ação>.e2e.spec.ts` e `.unit.spec.ts`) cobrem os demais status das rotas da gestão.

## 4. Toda rota de API cobre

- [ ] Sucesso com o status certo.
- [ ] Entrada inválida: 422 com o campo.
- [ ] Sem login: 401; papel sem acesso: 403.
- [ ] Recurso inexistente: 404 com `code` do recurso.
- [ ] Conflito ou estado inválido: `left(HTTPException)` com o status e o `code` certos.
- [ ] Depois de todo 4xx de escrita: a asserção de que nada foi gravado.
- [ ] Rota pública de escrita ou de consulta: o 429 do throttle.

## 5. Dados de teste

- Banco: `curupira_test` na porta 5436 (`backend/.env.test`), com migrações e seed por teste; o runner
  recusa banco sem o sufixo `_test`. Postgres e MinIO sobem com `docker compose up -d` em `backend/`.
- Bucket: `curupira-test` no MinIO do compose, com o mesmo código de produção (multipart pré-assinado).
  Os repositórios têm versões em memória (`*.memory.repository.ts`) e os serviços têm fakes
  (`*.fake.ts`), usados no unitário.
- Factories em `backend/database/factories/` e fixtures em `backend/tests/`.
- Frontend: Vitest com Testing Library; o E2E usa os dados de `frontend/src/data/` no modo `mock` e, no modo
  `api`, o dono semeado (`E2E_OWNER_*`) e a demonstração de `pnpm db:seed:demo`.

## 6. Critério de pronto

A definição de pronto da casa (prova no `HEAD`, quatro estados por portão, atalho de teste proibido) vale
aqui sem cópia: `_standards/tooling.md` §10.1. Deste projeto:

- `pnpm check` na raiz (shared, backend e frontend) e `pnpm test:unit` verdes.
- Teste novo falha antes da correção e passa depois.
- Mudança em rota regrava `openapi.json` e a linha de base do `authz:check` no mesmo commit.
- Cobertura: o join do §3.1 sem lacuna. Percentual mínimo: não exigido.
- O E2E do navegador roda só na fase final (`TASKS.md` 5.1).

## 7. O que não roda sem infraestrutura

- A suíte `functional` precisa de Postgres e MinIO reais. O comando completo
  (`pnpm test:e2e` no `backend/`) não foi rodado contra o MinIO do compose nesta etapa; o caminho do bucket
  foi exercitado só contra um S3 emulado (moto). Rodar no CI ou local com `docker compose up -d` antes
  de dar a fase 2 por provada.
- `pnpm di:check` exige banco.
- O Playwright precisa do Chromium (`pnpm exec playwright install chromium` ou `E2E_CHROMIUM_PATH`).
- A prova API real do frontend (`VITE_DATA_SOURCE=api`) depende da API no ar com `SITE_URL` igual à origem
  do app.

## 8. Teste manual antes do release

- [ ] Denúncia com foto no celular, com o GPS ligado e negado.
- [ ] Denúncia em modo avião e reenvio ao voltar a conexão; conferir o protocolo na tela.
- [ ] Cronograma e `.ics` abertos no calendário do celular.
- [ ] Todos os fluxos com rede lenta (3G simulado) e com o idioma em espanhol e inglês.
- [ ] Leitor de tela e navegação por teclado nas telas do morador e do painel.
- [ ] Contraste nos temas claro e escuro.
- [ ] Foto enviada: baixar o objeto do bucket e conferir que não traz EXIF.
- [ ] Entrar como operador e confirmar que cronograma, bairros e contas não abrem.
- [ ] `/privacidade` e `/termos` revisados pela prefeitura e pela procuradoria.
