# Arquitetura do sistema

**Curupira** · como as peças conversam

> Só o que é **deste** projeto. Camadas, árvore de pastas e nomes seguem
> `_standards/architecture.md`; aqui não se repete, se aponta.

## 1. Visão geral

```
Navegador (PWA)
   │  HTTPS
   ▼
Frontend (TanStack Start + Nitro, SSR)  curupira.maiyu.com.br
   │  HTTP + cookie httpOnly (SSR usa SERVER_API_URL quando existe)
   ▼
API (AdonisJS 7)  api-curupira.maiyu.com.br ───▶ PostgreSQL 18 (reports, schedules, users, rate_limits…)
   │         ▲
   │         └── @curupira/shared (enums, validators Zod, responses, Either, protocolo)
   ▼
Bucket S3-compatível (privado)  ◀── PUT pré-assinado direto do navegador (foto da denúncia)
```

O morador não tem conta: lê o cronograma, envia a denúncia e consulta o protocolo sem sessão
(`/storefront/*`). A gestão entra por `/sign-in` e usa `/management/*`, `/account` e `/storages`.

## 2. Stack

| Camada | Tecnologia | Versão | Doc |
|---|---|---|---|
| Linguagem | TypeScript | ~6 | `_standards/typescript.md` |
| Monorepo | pnpm workspace: `backend/`, `frontend/`, `shared/` | pnpm 12, Node 24 | `_standards/architecture.md` §9 |
| Web | TanStack Start + React 19 + Tailwind 4 + shadcn (Base UI) + Nitro `node-server` | Start 1.168, Vite 8 | `_standards/frontend.md` |
| API | AdonisJS 7 (perfil Adonis) + Lucid + Bouncer + Limiter | core 7.6, Lucid 22 | `_standards/backend.md` |
| Validação | Zod em `shared/` e no frontend; VineJS nos validators do backend (`backend/app/validators/`) | Zod 4 | `_doc-lib/zod.md` |
| Idiomas | Paraglide no front (pt-BR base, es, en); `@adonisjs/i18n` no back (`resources/lang/{pt-BR,es,en}`) | | `_standards/i18n.md` |
| Banco | PostgreSQL + Lucid | 18 | |
| Fila | Não se aplica: não há job assíncrono; o limiter usa a tabela `rate_limits` | | |
| Arquivos | S3-compatível (MinIO em dev e teste, S3 ou R2 em produção) por URL pré-assinada | AWS SDK v3 | |
| Imagem | `sharp` (remove EXIF da foto da denúncia; 50 milhões de pixels, no máximo 2 conversões ao mesmo tempo) | 0.35.5 | |
| Mapa | Leaflet + react-leaflet, tiles OpenStreetMap, só no cliente e em chunk lazy | Leaflet 1.9 | `DECISIONS.md` #3 |
| PWA | `vite-plugin-pwa` (workbox `generateSW`), fila de denúncia em IndexedDB | 2.x | `DECISIONS.md` #4 |
| Deploy | Docker (imagens `curupira-api` e `curupira-app`) no Coolify | | §9 |

Leaflet, react-leaflet, `vite-plugin-pwa`/workbox e `sharp` não têm entrada em `_doc-lib/`; a proposta
ao `maiyu-pattern` está em `MEMORY.md`.

## 3. Estrutura de pastas

Segue `_standards/architecture.md` §3 (backend), §4 (frontend) e §9 (raiz e `shared/`). Itens opcionais
da árvore que o projeto usa:

| Pasta | Por quê |
|---|---|
| `backend/app/services/photo-sanitizer/` | tira EXIF e metadado da foto da denúncia com `sharp`, atrás de contrato com fake para teste; `core/semaphore.ts` limita a 2 conversões simultâneas |
| `backend/app/services/protocol/` | sorteia o protocolo com `crypto.randomInt`, separado para o teste fixar o valor |
| `backend/app/services/multipart/` e `storage/` | URL pré-assinada, leitura e sobrescrita do objeto no bucket |
| `backend/commands/storages-prune.command.ts` | varre uploads `PENDING` abandonados e foto de denúncia `UPLOADED` sem denúncia há mais de 24 h; não há agendador na aplicação |
| `backend/commands/users-create-owner.command.ts` | cria o primeiro administrador em produção, onde o seeder do dono não roda |
| `backend/app/core/trusted-proxies.ts`, `report-photo-key.ts` | lê `TRUSTED_PROXIES` como lista validada no boot; prefixo `report-photos/` da chave da foto |
| `backend/infra/minio/` | imagem do MinIO de dev e teste, e o script que cria os buckets |
| `frontend/src/data/` | dados de exemplo do modo `VITE_DATA_SOURCE=mock` (`DECISIONS.md` #10); o build com `api` os tira do bundle (`frontend/scripts/strip-example-data.ts`) |
| `frontend/src/lib/` | regras puras: cronograma, `.ics`, fila offline, status, grade semanal, capacidades |

## 4. Módulos (features)

`app/features/<módulo>/<recurso>/<ação>/`.

| Módulo | Recursos | Ações principais | Público |
|---|---|---|---|
| `storefront` | `neighborhoods`, `schedules`, `notices`, `reports`, `report-photos` | `paginate`, `map`, `create`, `show-by-protocol`, `complete` | morador, sem conta |
| `management` | `reports`, `notices`, `schedules`, `neighborhoods`, `users` | `paginate`, `show`, `create`, `update`, `delete`, `update-status`, `map`, `stats`, `close` | operador e administrador |
| `authentication` | `sessions` | `sign-in`, `sign-out`, `refresh` | gestão |
| `account` | `profile` | `show`, `update` | gestão |
| `storages` | `files` | `create`, `parts`, `complete`, `paginate`, `show`, `download`, `delete` | gestão (biblioteca de arquivos) |
| `documentation` | `openapi`, `reference` | `show` | quem tem acesso ao `middleware.documentation()` |

Há 47 operações no `backend/openapi.json`. `GET /health-check` fica fora do documento.

| Entidade | Tabela | Repository | Invariantes principais |
|---|---|---|---|
| `Report` | `reports`, `report_photos`, `report_status_events` | `ReportRepository` | nasce `RECEIVED`; o status só avança (`REPORT_STATUS_REGRESSION`); `anonymous` é derivado de `contact` nulo; protocolo único |
| `Neighborhood` | `neighborhoods` | `NeighborhoodRepository` | nome e slug únicos; ponto (lat/long) opcional; `nearestTo` escolhe o bairro mais perto até 20 km |
| `CollectionSchedule` | `collection_schedules` | `CollectionScheduleRepository` | combinação bairro, tipo, dia e turno é única (409) |
| `Notice` | `notices` | `NoticeRepository` | situação `SCHEDULED`, `ACTIVE` ou `CLOSED` calculada por início, fim e encerramento |
| `User` | `users`, `auth_access_tokens` | `UserRepository`, `SessionRepository` | papel `ADMINISTRATOR` ou `OPERATOR`; conta inativa não entra; mudar papel ou situação revoga as sessões |
| `Storage` | `storages` | `StorageRepository` | `PENDING` até `complete` conferir tamanho e assinatura do arquivo |

### 4.1 Linguagem do domínio

| Termo no negócio | Significado | Nome no código | Evitar |
|---|---|---|---|
| Denúncia, ocorrência | registro enviado pelo morador (tipo, ponto, foto, descrição) | `Report` (a gestão chama de "ocorrência" na tela) | `complaint`, `incident` |
| Protocolo | código `CUR-XXXX-XXXX` que o morador guarda para acompanhar | `protocol` | `ticket`, `code` |
| Tipo de denúncia | queimada, descarte irregular de lixo, desmatamento, outro | `ReportKind` (`BURNING`, `DUMPING`, `DEFORESTATION`, `OTHER`) | `category` |
| Situação da denúncia | recebida, em análise, encaminhada, resolvida | `ReportStatus` (`RECEIVED`, `IN_REVIEW`, `FORWARDED`, `RESOLVED`) | `state` |
| Resposta da gestão | texto (até 500 caracteres) gravado junto da mudança de situação | `ReportStatusEvent.message` | `comment` |
| Anônima | denúncia sem contato | `anonymous` (derivado de `contact === null`) | `isPublic` |
| Tipo de coleta | orgânico, reciclável, volumoso, entulho | `WasteType` (`ORGANIC`, `RECYCLABLE`, `BULKY`, `DEBRIS`) | `trashType` |
| Turno | manhã, tarde, noite | `CollectionShift` | `period` |
| Cronograma | dia da semana, turno e tipo de coleta de um bairro | `CollectionSchedule` | `calendar` |
| Aviso | comunicado da prefeitura com início e fim opcional | `Notice` | `announcement` |
| Gestão | equipe da prefeitura que usa o painel | `User` (papel `ADMINISTRATOR` ou `OPERATOR`) | `staff`, `admin` solto |
| Bairro | divisão do município onde a coleta passa | `Neighborhood` | `district` |

## 5. Modelo de dados

| Entidade | Campos principais | Relações | Observação |
|---|---|---|---|
| `reports` | id, protocol (único), kind, status, latitude, longitude, neighborhood_id, description, contact, anonymous | pertence a `neighborhoods` (`SET NULL`); tem muitas `report_photos` e `report_status_events` | `contact` só é lido pelo painel; índice por (status, created_at) |
| `report_photos` | report_id, storage_id (único), position | `storages` com `RESTRICT` | uma foto serve a uma denúncia só |
| `report_status_events` | report_id, status, message, author_id, at | autor é `users` (nulo no evento `RECEIVED`) | histórico que o morador vê pelo protocolo |
| `neighborhoods` | name, slug, latitude, longitude | tem muitos `collection_schedules` | 12 bairros de exemplo no seed |
| `collection_schedules` | neighborhood_id, waste_type, weekday, shift, note (200) | pertence a `neighborhoods` | unique `collection_schedules_slot_unique` |
| `notices` | title (120), body (600), starts_at, ends_at, closed_at | | |
| `users` | name, email (único), password (hash), role, status, avatar_id | `storages` | |
| `storages` | key, mimetype, size, status (`PENDING`/`UPLOADED`), upload_id | | biblioteca da gestão e fotos de denúncia |
| `rate_limits` | key, points, expire | | contador do limiter; nas rotas anônimas a chave é o HMAC-SHA256 do IP (`anon:<hash>`), nunca o IP |

## 6. Fluxo de dados

### 6.1 Uma denúncia, da foto ao protocolo

1. O morador escolhe o tipo, tira a foto e confirma o ponto no mapa (`/denunciar`). O navegador reduz a
   foto a 1600 px e JPEG 80 (`lib/image.ts`), o que já derruba o EXIF.
2. Para cada foto (até 3), `POST /storefront/report-photos` com `mimetype` e `size`. O `size` respeita
   `REPORT_PHOTO_MAX_SIZE`. A API grava um `Storage` `PENDING` e devolve `{ id, uploadUrl }`, uma URL
   `PUT` pré-assinada de 3 minutos com o tamanho fixado, para uma chave com o prefixo `report-photos/`.
3. O navegador faz `PUT` da foto direto no bucket (o arquivo não passa pela API).
4. `POST /storefront/report-photos/:id/complete`: a API confere o tamanho no bucket, confere os bytes
   iniciais contra a assinatura do tipo declarado, lê o objeto, reencoda com `sharp` (sem metadado,
   limite de 50 milhões de pixels, no máximo 2 conversões ao mesmo tempo) e sobrescreve o objeto; só então
   grava `UPLOADED`. Falha em qualquer passo apaga o objeto e a linha (422). Só foto com o prefixo
   `report-photos/` passa: arquivo da biblioteca da gestão responde 404 e não se anexa a denúncia.
5. `POST /storefront/reports` com tipo, ponto, descrição, contato opcional e os `photoIds`. A API confere
   que as fotos são anexáveis e livres, escolhe o bairro mais próximo, sorteia o protocolo e grava a
   denúncia com o evento `RECEIVED` em transação (até 5 sorteios se o protocolo colidir). A resposta é
   só `{ protocol }`.
6. O navegador guarda o protocolo no aparelho (`lib/report-history.ts`) e mostra o código.
7. O morador consulta `GET /storefront/reports/:protocol` (com throttle) e vê tipo, situação, data e a
   linha do tempo com as respostas.

### 6.2 Fluxo offline

1. Sem sinal, ou com erro 5xx do servidor, `useReportSubmit` grava o rascunho (dados e `Blob` das fotos)
   no IndexedDB `curupira`, loja `report-queue` (`lib/report-queue.ts`) e mostra "Pendente de envio".
2. `ReportQueueSync`, no layout público, esvazia a fila ao abrir o app e no evento `online`, da mais
   antiga para a mais nova. Falha de rede ou 5xx para na primeira e mantém a ordem; 4xx descarta o item
   (repetir não adianta). Uma chamada em andamento é reaproveitada para não enviar duas vezes.
3. A fila vive na página e não no service worker porque o Safari não tem Background Sync.
4. O service worker (`vite-plugin-pwa`) faz precache só de estilos, fonte e ícones; páginas públicas
   visitadas usam `NetworkFirst`, `/assets/` usa `CacheFirst`, cronograma, bairros e avisos usam
   `StaleWhileRevalidate`, e os tiles do OSM ficam 14 dias em cache. `/gestao` e `/sign-in` (e as versões
   `/en` e `/es`) ficam fora do cache, o Nitro responde `Cache-Control: no-store` nelas e o sign-out apaga o
   cache `pages` (`frontend/src/lib/pwa.ts`).

## 7. Integrações externas

| Serviço | Para quê | Contrato no código | Variáveis (`ENV.md`) |
|---|---|---|---|
| Bucket S3-compatível | foto da denúncia e biblioteca de arquivos da gestão | `StorageContract` e `MultipartContract` em `backend/app/services/` | `STORAGE_*`, `UPLOAD_MAX_SIZE` |
| OpenStreetMap | tiles do mapa, direto do navegador | CSP em `frontend/vite.config.ts` | Não se aplica: sem chave |
| Docker Hub e Coolify | imagem e deploy | `.github/workflows/` | secrets do GitHub (`ENV.md` §6) |

Não há e-mail, SMS, pagamento nem API de terceiros no servidor.

## 8. Autenticação e autorização

- Sessão por dois cookies `httpOnly`: `curupira-access-token` (1 dia) e `curupira-refresh-token` (7 dias), `sameSite=lax`,
  `secure` em produção, `Domain` pelo `COOKIE_DOMAIN`. `POST /authentication/refresh` renova.
- Rotas agrupadas por papel: `middleware.auth()` e depois `middleware.role([...])` no grupo
  (`backend/start/routes.ts`). Sem sessão a resposta é 401; com sessão e papel errado, 403.
- Reports e avisos: `ADMINISTRATOR` e `OPERATOR`. Cronograma, bairros e contas: só `ADMINISTRATOR`.
  `/account` e `/storages`: qualquer papel autenticado.
- `UserPolicy` impede a conta de mudar o próprio papel ou situação e de se excluir; `StoragePolicy` só
  deixa a gestão (ou o dono do avatar) baixar um arquivo.
- `scripts/authz-check.ts` compara a cadeia de autorização de cada rota com `app/core/openapi/authz-baseline.json`.
- No frontend, `lib/capabilities.ts` é a tabela de capacidades por área; a guarda `requireCapability`
  redireciona para `/gestao` e o menu esconde o link. Quem autoriza é o backend.
- Matriz e ameaças: `SECURITY.md`.

### 8.1 Mapa de rotas

Frontend (`frontend/src/routes/`, rotas em par `rota.tsx` + `rota.lazy.tsx`):

| Grupo | Rotas | SSR |
|---|---|---|
| `_public` | `/`, `/coleta`, `/denunciar`, `/acompanhar`, `/mapa`, `/avisos`, `/sobre`, `/privacidade`, `/termos`, `$` (404) | completo |
| `_authentication` | `/sign-in` (com `?redirect=` validado e guarda inversa) | completo |
| `_private` | `/gestao`, `/gestao/reports` e `/$id`, `/gestao/notices` (`new`, `$id/edit`), `/gestao/schedules`, `/gestao/neighborhoods` (`new`, `$id/edit`), `/gestao/users` (`new`, `$id/edit`), `/gestao/account/profile` | `data-only`: dados no servidor, tela no cliente |
| Raiz | `/health-check`, `/robots.txt`, `/sitemap.xml` | servidor |

API:

| Prefixo | Rotas | Quem |
|---|---|---|
| `/storefront` | `GET neighborhoods`, `schedules`, `notices`, `reports/map`, `reports/:protocol`; `POST reports`, `report-photos`, `report-photos/:id/complete` | público, com throttle por IP (HMAC) nas escritas, na consulta de protocolo e no mapa; o mapa devolve as 500 mais recentes com o ponto arredondado a 3 casas |
| `/authentication` | `POST sign-in`, `sign-out`, `refresh` | gestão |
| `/account` | `GET`, `PUT` | autenticado |
| `/storages` | `GET`, `POST`, `GET :id`, `DELETE :id`, `POST :id/complete`, `GET :id/parts`, `GET :id/download` | autenticado |
| `/management/reports` e `/notices` | listar, mostrar, mapa, estatísticas, mudar situação, criar, editar, encerrar, excluir | `ADMINISTRATOR`, `OPERATOR` |
| `/management/schedules`, `/neighborhoods`, `/users` | CRUD | `ADMINISTRATOR` |
| Raiz | `GET /health-check`, `/openapi.json`, `/documentation` | liveness; documentação atrás do middleware próprio |

### 8.2 Fonte de dados do frontend

`VITE_DATA_SOURCE=mock` (padrão em dev) serve `frontend/src/data/*`; `api` fala com `VITE_API_URL`. O ponto de
troca é `integrations/tanstack-query/source.ts` (`fromSource({ mock, api })`). A integração real foi provada
de ponta a ponta pelos 11 testes de Playwright contra a API real (`TASKS.md` 3.6 e 5.1). O build de produção
usa `api` (`frontend/.env.production`, conferido pelo CI) e tira `src/data/**` do bundle.

Nas chamadas feitas pelo servidor do app (SSR), `integrations/tanstack-query/http.server.ts` repassa à API o
`Cookie` recebido, o `X-Forwarded-For` (a cadeia recebida mais o IP do par, para os limites por IP verem o
morador e não o Nitro) e o `Origin` (`VITE_SITE_URL`, que a barreira de CSRF exige em método não seguro).

## 9. Ambientes

| Ambiente | URL | Onde roda | Banco | Deploy |
|---|---|---|---|---|
| Desenvolvimento | app `http://localhost:3000`, API `http://localhost:3333` | máquina local (`pnpm dev`) | Postgres 5436 do `docker-compose.yml` | |
| Teste | | CI e máquina local | `curupira_test` na porta 5436 | |
| Produção | app `https://curupira.maiyu.com.br`, API `https://api-curupira.maiyu.com.br` | Coolify, duas aplicações a partir das imagens `curupira-app` (porta 3000) e `curupira-api` (porta 3333) | Postgres gerenciado fora do repositório | push na `main` |

Health check: `GET /health-check` em cada app (`_standards/architecture.md` §7). O do frontend não chama a
API, para um app não reiniciar por causa do outro.

### 9.2 Pipeline

| Workflow | Gatilho | O que faz |
|---|---|---|
| `ci.yml` | PR para `main` | `main-check-backend`, `main-check-frontend`, `pnpm audit --prod` (alta), Gitleaks, varredura de `pull_request_target` e de `github.event` em `run:` |
| `commitlint.yml` | PR | Conventional Commits |
| `main-check-backend.yml` | chamado | autor e trailers dos commits (só no PR), lint, typecheck, `pattern:check`, `authz:check`, `depcruise`, `openapi:check`, unitário, build; e2e em 3 shards com Postgres 18 e MinIO; `di:check` |
| `main-check-frontend.yml` | chamado | i18n, lint, typecheck, Prettier, unitário, build, `routeTree.gen.ts` em dia, ciclos de chunk; Playwright contra a API real (imagem `curupira-api:e2e`, Postgres e MinIO), com `E2E_BASE_URL`, `E2E_API_URL` e `E2E_OWNER_*` |
| `main-build-frontend.yml` | chamado | grava o sha em `frontend/public/revision.txt` antes do build, reprova se faltar `frontend/.env.production`, se `VITE_DATA_SOURCE` não for `api` ou se `VITE_API_URL` e `VITE_SITE_URL` não forem `https`, avisa se faltar `VITE_STORAGE_URL`, confere que o carimbo entrou no manifesto do Nitro, publica `.output` como artifact |
| `main-docker-backend.yml`, `main-docker-frontend.yml` | chamados | imagens `curupira-api` e `curupira-app` (amd64 e arm64) no Docker Hub, tags `latest` e sha |
| `main-deploy-coolify.yml` | chamado, depois das duas imagens | `POST` em `/api/v1/deploy` para cada aplicação, exige `deployment_uuid` na resposta; smoke test |
| `main.yml` | push na `main` | encadeia os de cima |

Smoke test: a API responde em `/health-check`; o app é cobrado por `/revision.txt` com o sha do commit,
porque o container antigo também responde 200.

### 9.1 O que a plataforma faz e o repositório não

| O quê | Onde se configura | Por quê |
|---|---|---|
| `COOLIFY_URL`, `COOLIFY_API_UUID` e `COOLIFY_APP_UUID` | secrets do GitHub | o job reprova nomeando o que faltar; uuid de outro projeto redeploya o projeto errado |
| `node ace migration:run --force` como *Post-deployment command* da API | painel do Coolify | o `Dockerfile-production` do backend não tem `ENTRYPOINT` |
| `COOKIE_DOMAIN=.maiyu.com.br` na API | painel | sem ela o cookie nasce host-only e o SSR do app nunca o recebe: todo F5 em rota privada desloga |
| `TRUSTED_PROXIES=loopback,uniquelocal` na API | painel | lista separada por vírgula, validada no boot; sem ele `request.ip()` é o do Traefik e todo throttle por IP vira um balde só; vazio, `true` e `*` derrubam a partida |
| `CORS_ORIGINS` e `APP_SERVER_URL` na API | painel | `CORS_ORIGINS` é a lista do CORS e da barreira de `Origin`; `APP_SERVER_URL` entra no OpenAPI |
| Healthcheck das duas aplicações em `/health-check` | painel | o painel sobrepõe o `HEALTHCHECK` dos Dockerfiles |
| CORS do bucket para `https://curupira.maiyu.com.br`, com `PUT` e `ETag` em `ExposeHeaders` | painel do provedor do bucket | o navegador envia a foto direto ao bucket |
| `VITE_STORAGE_URL` no build do app | `frontend/.env.production` | a CSP do Nitro só libera `connect-src` para a origem do bucket se ela estiver aí; hoje não está (endereço do bucket de produção desconhecido) e o CI só avisa; obrigatória antes do primeiro deploy (`DECISIONS.md` #15) |
| Bairros no primeiro deploy | comando manual | `node ace db:seed` (o seeder de bairros roda em `development` e `production`) |
| Primeiro administrador | comando manual | `node ace users:create-owner` com `SEED_OWNER_EMAIL` e `SEED_OWNER_PASSWORD`; o seeder do dono só roda em `development` e `test` |
| `node ace storages:prune` em cron do host, por exemplo de hora em hora | agendador do ambiente | não há agendador na aplicação; sem ele, uploads `PENDING` e fotos sem denúncia ficam no bucket |
| Secrets do GitHub: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_TOKEN` | configurações do repositório | login no Docker Hub e chamada ao Coolify |

## 10. Escala e limites conhecidos

- Um processo de API; o limiter usa o banco (`rate_limits`), sem Redis. Mais réplicas funcionam, mas cada
  contagem vira escrita no Postgres.
- O mapa público devolve as 500 denúncias mais recentes em `IN_REVIEW`, `FORWARDED` e `RESOLVED` numa resposta
  só, sem paginação nem recorte de área; as mais antigas saem do mapa.
- Os tiles públicos do OSM têm política de uso; produção pode pedir provedor próprio.
- Cronograma sem feriado nem exceção: vira aviso publicado pela gestão (`DECISIONS.md` #5).
