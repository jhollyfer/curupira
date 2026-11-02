# Plano de testes

**Curupira** · o que se testa, em que nível, com que critério

> Onde cada teste mora e o que cada camada leva: `_standards/architecture.md` §8; como se escreve:
> `_standards/domain.md` §10 e `_standards/backend.md` §7. Aqui fica só o que é deste projeto: os
> fluxos críticos, a matriz requisito × teste e o que conta como pronto.

## 1. Níveis

| Nível | Ferramenta | Onde | Roda em | Tamanho hoje |
|---|---|---|---|---|
| Unitário do backend | Japa, suíte `unit` (sem banco nem HTTP) | `backend/app/**/*.unit.spec.ts` e `scripts/`, `commands/`, `tests/`, `start/` | hook de commit, PR e `main` | 76 arquivos, 290 testes |
| E2E do backend | Japa, suíte `functional` (app inteiro, Postgres e MinIO reais) | `backend/app/**/*.e2e.spec.ts` | PR e `main`, em 3 shards | 69 arquivos; 367 testes passam e 2 falham só pelo emulador S3 (§7) |
| `shared/` | Vitest | `shared/src/**/*.test.ts` | hook de commit, PR e `main` | 5 arquivos, 21 testes |
| Unitário do frontend | Vitest + Testing Library | `frontend/src/**/*.test.ts(x)` e `frontend/scripts/*.test.ts` | hook de commit, PR e `main` | 53 arquivos, 303 testes |
| E2E do frontend | Playwright contra a API real (axe-core em cada tela) | `frontend/e2e/report-flow.spec.ts` (projeto `mobile`, Pixel 7), `management-flow.spec.ts` (projeto `desktop`, 1440 x 900), `responsive-public.spec.ts` (projetos `responsive-touch` e `responsive-pointer`) e `responsive-panel.spec.ts` (projeto `responsive`) | job `e2e` de `main-check-frontend.yml` | 4 specs: 121 testes no CI (matriz pública de 4 larguras) e 187 com a matriz completa; o job leva cerca de 13,6 min (§1.1) |

### 1.1 Responsividade

A matriz tem sete larguras (`frontend/e2e/support/responsive.ts`): 360 x 740, 412 x 915, 740 x 360 (celular
deitado), 768 x 1024, 1024 x 768, 1440 x 900 e 1920 x 1080.

| Spec | Projeto | O que cobra |
|---|---|---|
| `responsive-public.spec.ts` | `responsive-touch` (Pixel 7) | as 11 rotas públicas (as 9 do app, a entrada e uma página inexistente) nas 7 larguras: sem rolagem horizontal da página e nenhum alvo de toque visível abaixo de 44 x 44 px (154 testes) |
| `responsive-public.spec.ts` | `responsive-pointer` (Desktop Chrome) | o mesmo, só a rolagem horizontal, porque o alvo de 44 px é regra de toque (77 testes) |
| `responsive-panel.spec.ts` | `responsive` (Desktop Chrome) | painel nas 7 larguras: 12 telas sem rolagem horizontal e sem nenhuma violação de axe (qualquer impacto, não só sério e crítico); o detalhe da ocorrência cabe e o menu (gaveta no celular, barra lateral daí em diante) abre e navega; os filtros ficam na URL ao trocar a largura; o OPERADOR não chega a cronograma, bairros e contas, nem pelo menu nem digitando o endereço, em todas as larguras (22 testes) |

Estado atual (PR #8, mesclado): a matriz pública do CI tem 4 larguras (360, 768, 1440 e 1920, 88 testes) e as
7 larguras (154 testes) valem localmente ou com `E2E_FULL_MATRIX=1`. Os projetos públicos rodam em paralelo
(`fullyParallel`) porque só leem páginas; os fluxos que gravam no banco e gastam o limite de 5 logins por minuto
ficam encadeados por `dependencies` (`mobile`, depois `desktop`, depois `responsive` do painel). O número de
workers vem de `E2E_WORKERS` (4 no CI, 2 local), o `globalTimeout` é de 25 minutos e o workflow não força mais
`--workers=1`. A rolagem horizontal é medida contra a largura pedida, e não só contra `innerWidth`, porque no
celular emulado o navegador alarga a viewport até caber o conteúdo e o teste passaria numa página mais larga que
o aparelho.

Por que mudou: no PR #6 o job `Frontend - E2E (Playwright)` falhou por tempo (242 testes passaram, 22 não
rodaram, limite global de 900 s), sem falha funcional. Com a matriz reduzida o CI roda 121 testes (187 com a
matriz completa) e o job do PR #8 passou em 13,6 minutos, dentro do limite de 25. O gargalo é o servidor de dev
(um processo só), então o ganho veio de navegar menos, não do paralelismo; rodar o E2E contra o build de produção
daria folga maior e fica como melhoria futura.

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
| `TRUSTED_PROXIES` | valor de produção (`loopback,uniquelocal`) que quebra a leitura do IP, ou que confia em todos (`true`, `*`) | `backend/app/core/trusted-proxies.unit.spec.ts` |
| dados de exemplo fora do bundle | `src/data/**` no build com `VITE_DATA_SOURCE=api` | `frontend/scripts/strip-example-data.test.ts` |
| `.env.production` do app | build sem o arquivo ou sem `VITE_DATA_SOURCE=api` | `.github/workflows/main-build-frontend.yml` |
| `i18n:check` | chave faltando em algum idioma | `frontend` (`inlang check`) |
| ciclo de chunk | ciclo que quebra o SSR | `frontend/scripts/check-chunk-cycles.mjs` |
| `routeTree.gen.ts` em dia | rota nova sem o arquivo gerado commitado | `main-check-frontend.yml` |
| banco de teste | rodar a suíte em banco sem o sufixo `_test` | `backend/tests/database-guard.ts` |

## 2. Fluxos críticos

Cada fluxo de `USER-FLOWS.md` marcado aqui tem spec E2E de ponta a ponta.

| Fluxo | Caminho feliz | Caminhos de erro | Teste |
|---|---|---|---|
| Nova denúncia | tipo, foto real, ponto, envio e protocolo na tela; o painel responde | sem sinal (fila), a 11ª denúncia da hora é recusada em linguagem simples | `frontend/e2e/report-flow.spec.ts: files an anonymous report with a real photo, follows it and the panel answers it`, `saves the report on the device offline and sends it when the connection returns`, `the eleventh report of the hour from the same IP is refused, in plain words` |
| Foto sem dados de câmera | o servidor remove o EXIF mesmo se o navegador mandou a foto crua | | `report-flow.spec.ts: the server strips camera data even when the browser sent it untouched` |
| Acompanhar | a denúncia enviada aparece na linha do tempo | protocolo inexistente | `report-flow.spec.ts: files an anonymous report with a real photo...`, `says the protocol does not exist` |
| Próxima coleta | escolher o bairro e ver a coleta do cronograma real | | `report-flow.spec.ts: picks the neighborhood and sees the next collection from the real schedule` |
| Entrar | dono entra | senha errada | `frontend/e2e/management-flow.spec.ts: refuses a wrong password and lets the owner in` |
| Tratar ocorrência | abrir ocorrência recebida, avançar o status | não volta o status | `management-flow.spec.ts: handles an untreated report and cannot move it back` |
| Avisos | publicar, ver na home e encerrar | | `management-flow.spec.ts: publishes a notice, sees it on the home and closes it` |
| Manter cronograma | cadastrar um dia de coleta e o morador o vê no calendário | operador não abre cronograma, bairros nem contas | `management-flow.spec.ts: registers a collection day and the resident sees it on the calendar`, `reaches reports and notices but not schedules, neighborhoods or users` |
| Layout do morador e do painel do celular ao monitor largo | cada rota sem rolagem horizontal e com alvo de 44 px em toque; painel nas 7 larguras com menu, filtros na URL e axe sem violação | operador sem acesso às áreas de administrador em toda largura | `frontend/e2e/responsive-public.spec.ts`, `frontend/e2e/responsive-panel.spec.ts` (§1.1); unitários `active-filters.test.ts`, `table-grid.test.tsx` |
| Calendário, mapa público, bairros, contas | | | sem E2E de navegador dedicado; cobertos por unitário de `lib/` e dos componentes (`schedule.test.ts`, `ics.test.ts`, `waste-calendar.test.tsx`, `report-map.test.tsx`) e pelo E2E da API (`storefront/*`, `management/*`) |

O E2E do frontend roda sempre contra a API real (`VITE_DATA_SOURCE=api`, fixado em `playwright.config.ts`),
com o dono semeado (`E2E_OWNER_*`), a demonstração de `pnpm db:seed:demo` e o operador que o spec cria
(`E2E_OPERATOR_*`). Isso fecha a 3.6 de `TASKS.md`: entrada, foto pré-assinada e protocolo foram exercitados do
navegador à API. O job do CI (`main-check-frontend.yml`) sobe a API (imagem `curupira-api:e2e`), Postgres e
MinIO e passa `E2E_OWNER_*`, `E2E_OPERATOR_*` e `E2E_API_URL`. Rodou pela primeira vez no PR #6 e estourou o tempo (§1.1); os 22 testes de responsividade do painel e a matriz pública completa só foram rodados localmente em modo de exemplo, sem a API real.

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
| PRD 5 | mapa público só tem o que a equipe já abriu, sem hora, texto nem contato | E2E backend | `storefront/reports/map/map.e2e.spec.ts: only reports already looked at, with no hour, no text and no contact` |
| PRD 5 | o ponto público sai arredondado a 3 casas e o do painel é exato | E2E, unitário | `map.e2e.spec.ts: the public pin is rounded to 3 decimals, the panel one is exact`, `management/reports/map/map.unit.spec.ts` |
| Segurança | arquivo da biblioteca não é confirmado pela rota anônima de foto | E2E backend | `complete.e2e.spec.ts: a library file is 404...` |
| Segurança | `TRUSTED_PROXIES` aceita a lista de produção e recusa quem confia em todos | Unitário | `core/trusted-proxies.unit.spec.ts` |
| Segurança | `users:create-owner` cria o administrador uma vez e recusa senha fraca | E2E backend | `commands/_users-create-owner.command.e2e.spec.ts` |
| Segurança | `storages:prune` apaga `PENDING` antigo e foto sem denúncia, e poupa as recentes e as anexadas | E2E backend | `commands/_storages-prune.command.e2e.spec.ts` |
| Segurança | painel fora do cache do service worker e apagado no sign-out | Unitário frontend | `frontend/src/lib/pwa.test.ts` |
| Segurança | `?redirect=` só aceita caminho do próprio site | Unitário frontend | `frontend/src/lib/redirect-search.test.ts` |
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
| `GET /storefront/reports/map` | 200 | `map.e2e.spec.ts: only reports already looked at...` |
| | 429 | `map.e2e.spec.ts: throttles the map per IP: the 61st within ten minutes is 429` |
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
- Frontend: Vitest com Testing Library (os dados de `frontend/src/data/` servem ao unitário e ao modo `mock` de
  desenvolvimento); o E2E usa a API real, o dono semeado (`E2E_OWNER_*`) e a demonstração de `pnpm db:seed:demo`.

## 6. Critério de pronto

A definição de pronto da casa (prova no `HEAD`, quatro estados por portão, atalho de teste proibido) vale
aqui sem cópia: `_standards/tooling.md` §10.1. Deste projeto:

- `pnpm check` na raiz (shared, backend e frontend) e `pnpm test:unit` verdes.
- Teste novo falha antes da correção e passa depois.
- Mudança em rota regrava `openapi.json` e a linha de base do `authz:check` no mesmo commit.
- Cobertura: o join do §3.1 sem lacuna. Percentual mínimo: não exigido.
- O E2E do navegador roda só na fase final (`TASKS.md` 5.1), já feito contra a API real.

## 7. O que não roda sem infraestrutura

- A suíte `functional` precisa de Postgres e MinIO reais. No CI ela roda em 3 shards, cada um com o próprio
  Postgres e um MinIO em container (`main-check-backend.yml`), e passou nos PRs #6 e #8. Localmente, sem Docker, a
  suíte foi exercitada contra um S3 emulado (moto) e 2 testes falham só por limitação dele:
  `refuses with 422 when what was uploaded does not have the declared size` e `a signed URL stops being valid
  after it expires`. Com `docker compose up -d` o comando completo (`pnpm test:e2e` no `backend/`) usa o MinIO do
  compose.
- `pnpm di:check` exige banco.
- O Playwright precisa do Chromium (`pnpm exec playwright install chromium` ou `E2E_CHROMIUM_PATH`).
- O E2E do frontend depende da API no ar com `SITE_URL` igual à origem do app (`http://localhost:<E2E_PORT>`).
- O job de E2E do frontend no CI roda contra a API real (imagem do backend) e o MinIO em container; passou no PR #8.

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
