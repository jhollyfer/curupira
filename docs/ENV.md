# Configuração de ambiente

**Curupira** · variáveis que o app precisa para rodar, local e em produção

> Exemplo e documentação usam placeholder; segredo real fica fora do Git.
> Variável nova entra aqui **e** em `.env.example` no mesmo commit. Quem valida é o schema do
> leitor de ENV (`backend/start/env.ts`, `frontend/src/env.ts`); este arquivo explica.

## 1. Variáveis

### 1.1 Backend (`backend/.env`, schema em `backend/start/env.ts`)

Mesma ordem de blocos do `backend/.env.example`.

| Variável | Obrigatória | Segredo | O que é | Exemplo |
|---|---|---|---|---|
| `TZ` | não | não | fuso do processo; `UTC` em todo ambiente, para a mesma consulta dar a mesma data em qualquer máquina | `UTC` |
| `PORT` | sim | não | porta HTTP | `3333` |
| `HOST` | sim | não | endereço de escuta; `0.0.0.0` em container | `localhost` |
| `NODE_ENV` | sim | não | `development`, `production` ou `test` | `development` |
| `LOG_LEVEL` | sim | não | nível do log | `info` |
| `APP_KEY` | sim | **sim** | chave de cifra da aplicação | `<segredo>` |
| `APP_SERVER_URL` | sim | não | endereço público da API, sem barra final (entrada `servers` do OpenAPI) | `http://localhost:3333` |
| `CORS_ORIGINS` | sim | não | origens do frontend, sem barra final, separadas por vírgula; é a lista do CORS e a barreira de `Origin` (CSRF) ao mesmo tempo; `*` derruba a partida (`backend/app/core/cors-origins.ts`) | `http://localhost:3000` |
| `TRUSTED_PROXIES` | sim | não | quem o Adonis aceita como proxy para ler `X-Forwarded-For`; lista separada por vírgula de IP, sub-rede ou `loopback`/`linklocal`/`uniquelocal`, validada no boot (`backend/app/core/trusted-proxies.ts`); vazio, `true`, `*`, `0.0.0.0/0` e `::/0` derrubam a partida | `loopback` |
| `COOKIE_DOMAIN` | produção | não | `Domain` dos cookies de sessão; vazio em dev | `.maiyu.com.br` |
| `DATABASE_URL` | sim | **sim** | conexão com o Postgres | `postgres://<usuario>:<senha>@localhost:5436/curupira` |
| `DATABASE_SSL` | não | não | TLS na conexão com o banco; depende de onde o banco está | `false` |
| `UPLOAD_MAX_SIZE` | sim | não | teto por arquivo da biblioteca da gestão, em bytes | `1073741824` |
| `STORAGE_KEY` | sim | **sim** | chave de acesso do bucket | `<chave>` |
| `STORAGE_SECRET` | sim | **sim** | segredo do bucket | `<segredo>` |
| `STORAGE_BUCKET` | sim | não | nome do bucket (privado) | `curupira` |
| `STORAGE_ENDPOINT` | sim | não | endpoint S3-compatível | `http://localhost:9006` |
| `STORAGE_FORCE_PATH_STYLE` | não | não | `true` para MinIO; remover em S3, R2 ou Spaces | `true` |
| `SEED_OWNER_EMAIL` | só para semear | não | e-mail do `ADMINISTRATOR` criado por `node ace db:seed` (só em `development` e `test`) ou por `node ace users:create-owner` | `owner@mail.com` |
| `SEED_OWNER_PASSWORD` | só para semear | **sim** | senha do dono; sem default, o seeder para sem ela; o `users:create-owner` recusa senha fraca | `<segredo>` |

Só no desenvolvimento, lidas pelo `docker-compose.yml` (blocos `compose-minio` e `compose-ports` do modelo): `MINIO_ROOT_USER`,
`MINIO_ROOT_PASSWORD`, `DB_PORT`, `STORAGE_PORT`, `STORAGE_CONSOLE_PORT`.

O teto da foto da denúncia (10 MiB) deixou de ser variável: é `LIST_LIMITS.REPORT_PHOTO_SIZE` em `@curupira/shared`, o mesmo
em todo ambiente (`DECISIONS.md` #25).

### 1.2 Frontend (`frontend/.env`, lido em `frontend/src/env.ts`)

| Variável | Quando | Obrigatória | O que é | Exemplo |
|---|---|---|---|---|
| `VITE_API_URL` | build | sim em produção (em dev cai em `http://localhost:3333`) | endereço da API visto pelo navegador; entra no bundle | `http://localhost:3333` |
| `VITE_SITE_URL` | build | sim em produção (em dev cai em `http://localhost:3000`) | endereço público do site (canonical, hreflang, sitemap); sem barra final | `http://localhost:3000` |
| `VITE_DATA_SOURCE` | build | não em dev; `api` em produção (conferido pelo CI) | `mock` (padrão, dados de `src/data`) ou `api`; qualquer outro valor derruba o boot; com `api` o build tira `src/data/**` do bundle (`scripts/strip-example-data.ts`) | `mock` |
| `VITE_STORAGE_URL` | build | em produção, para a foto subir; **ainda não definida** | origem do bucket; só entra na CSP de `connect-src` e `img-src` (`vite.config.ts`); está comentada no `.env.production` e fora dos `.env.example`; o CI só avisa quando falta (`main-build-frontend.yml`) | `https://<bucket>.exemplo.com` |
| `SERVER_API_URL` | execução (servidor) | não | endereço interno da API para o SSR, sem sair pela internet; sem `VITE_`, não vai ao navegador | `http://curupira-api:3333` |
| `SITE_ENV` | execução (servidor) | não | só `production` libera indexação; qualquer outro valor responde `noindex` e `Disallow: /` | `production` |

Variáveis dos testes de ponta a ponta (`frontend/.env.e2e.example`, lidas em `e2e/support/env.ts`, sem default: faltando uma, a
suíte para e diz qual): `E2E_BASE_URL` (origem do app que a suíte sobe; o `CORS_ORIGINS` da API precisa listá-la), `E2E_API_URL`,
`E2E_OWNER_EMAIL` e `E2E_OWNER_PASSWORD` (o administrador semeado; no CI a senha nasce a cada execução). O operador não é
variável: cada execução cria o seu com a sessão do dono. `E2E_CHROMIUM_PATH` (binário do Chromium) é opcional. Os specs
rodam sempre com `VITE_DATA_SOURCE=api`, fixado em `playwright.config.ts`.

Regras (detalhe em `_standards/backend.md` §6):

- Segredo e credencial não têm default: o app não sobe sem eles.
- `VITE_*` vai para o navegador: nunca segredo.
- `COOKIE_DOMAIN` não é cobrada pelo schema; esquecê-la em produção desloga o painel a cada F5.
- Variável nova de ambiente se testa com o valor de produção, não só com o do `.env.example` (`TRUSTED_PROXIES`, A-01).

## 2. Exemplo

`backend/.env.example` (versionado, só placeholder; os comentários completos estão no arquivo):

```dotenv
TZ=UTC
PORT=3333
HOST=localhost
NODE_ENV=development
LOG_LEVEL=info
APP_KEY=
APP_SERVER_URL=http://${HOST}:${PORT}
TRUSTED_PROXIES=loopback
CORS_ORIGINS=http://localhost:3000
# COOKIE_DOMAIN=.maiyu.com.br
DATABASE_URL=postgres://curupira:curupira@localhost:5436/curupira
UPLOAD_MAX_SIZE=1073741824
STORAGE_KEY=curupira
STORAGE_SECRET=curupira-secret
STORAGE_BUCKET=curupira
STORAGE_ENDPOINT=http://localhost:9006
STORAGE_FORCE_PATH_STYLE=true
SEED_OWNER_EMAIL=owner@mail.com
SEED_OWNER_PASSWORD=
```

`frontend/.env.example`:

```dotenv
VITE_API_URL=http://localhost:3333
VITE_SITE_URL=http://localhost:3000
VITE_DATA_SOURCE=mock
```

## 3. Segredo fora do Git

`.env` e `.env.*` ficam fora do Git; `.env.example`, `.env.test` e `frontend/.env.production` são
versionados. O `.env.test` do backend só tem o banco `curupira_test`, o bucket `curupira-test` e a
senha de teste do dono. O `frontend/.env.production` só tem valores públicos (`VITE_*`) e o CI reprova o
build do app se ele faltar ou se `VITE_DATA_SOURCE` não for `api` (`DECISIONS.md` #21).

## 4. Por ambiente

| Ambiente | De onde vêm os valores | Observação |
|---|---|---|
| Desenvolvimento | `backend/.env` copiado de `.env.example`; `frontend/.env` de `.env.example` | Postgres na porta 5436, MinIO na 9006 e console na 9007 (portas próprias para conviver com outros projetos na mesma máquina); app na 3000, API na 3333 |
| Teste | `backend/.env.test` (versionado) | banco `curupira_test` (o runner se recusa a rodar em banco sem o sufixo `_test`), bucket `curupira-test`, `CORS_ORIGINS=http://localhost:5173` |
| CI | `env:` dos workflows | valores de placeholder; o e2e do frontend cria um `api.env` temporário |
| Produção | painel do Coolify para a API e o app; `frontend/.env.production` para o build | nunca em arquivo no servidor de build |

Produção, API: `NODE_ENV=production`, `HOST=0.0.0.0`, `APP_SERVER_URL=https://api-curupira.maiyu.com.br`,
`CORS_ORIGINS=https://curupira.maiyu.com.br`, `COOKIE_DOMAIN=.maiyu.com.br`,
`TRUSTED_PROXIES=loopback,uniquelocal`, `UPLOAD_MAX_SIZE`, `STORAGE_*` do
provedor (sem `STORAGE_FORCE_PATH_STYLE`), `DATABASE_URL` e `DATABASE_SSL` conforme o banco,
`SEED_OWNER_*` só no momento de criar o primeiro administrador com `node ace users:create-owner` (o seeder
não roda em produção). O `Dockerfile-production` do backend define `APP_SERVER_URL`, `CORS_ORIGINS` e `TRUSTED_PROXIES`
com valores de placeholder só no estágio de build, para o schema passar; a
plataforma injeta os reais.

Produção, app: `VITE_API_URL=https://api-curupira.maiyu.com.br`, `VITE_SITE_URL=https://curupira.maiyu.com.br`,
`VITE_DATA_SOURCE=api` (já em `frontend/.env.production`), `VITE_STORAGE_URL` (a definir, antes do primeiro deploy), e no
servidor `SITE_ENV=production` e, se houver rede interna, `SERVER_API_URL`.

## 5. Primeira configuração

- [ ] `cp backend/.env.example backend/.env` e `cp frontend/.env.example frontend/.env`.
- [ ] Gerar `APP_KEY` (`node ace generate:key` no `backend/`).
- [ ] Definir `SEED_OWNER_PASSWORD` (em desenvolvimento o seeder cria o dono; em produção, `node ace users:create-owner`).
- [ ] Subir os serviços locais: `docker compose up -d` em `backend/` (Postgres, MinIO e `minio-setup`).
- [ ] Criar o banco de teste: `docker compose exec database createdb -U curupira curupira_test`.
- [ ] `node ace migration:run` e `node ace db:seed` (bairros; o dono só em `development` e `test`); `pnpm db:seed:demo` para a demonstração.
- [ ] `pnpm dev` na raiz. A API valida as variáveis no boot e para se faltar alguma.
- [ ] Reiniciar a API depois de mudar o `.env`.

## 6. Secrets do GitHub

| Secret | Para quê |
|---|---|
| `DOCKERHUB_USERNAME` | login e nome da conta das imagens `curupira-api` e `curupira-app` |
| `DOCKERHUB_TOKEN` | token de escrita no Docker Hub |
| `COOLIFY_URL` | endereço do painel do Coolify, sem barra final |
| `COOLIFY_TOKEN` | token da API do Coolify para disparar o deploy |
| `COOLIFY_API_UUID` | uuid da aplicação da API no Coolify |
| `COOLIFY_APP_UUID` | uuid da aplicação do app no Coolify |

URL e uuid são secrets, e não valores no workflow (`_standards/tooling.md` §8.3): o deploy reprova nomeando o que faltar.
