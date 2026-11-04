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
| `SEED_OWNER_EMAIL` | junto com a senha | não | e-mail do `ADMINISTRATOR` criado pelo seeder do dono (`node ace db:seed`) ou por `node ace users:create-owner`; senha sem e-mail para o seeder | `owner@example.com` |
| `SEED_OWNER_PASSWORD` | não | **sim** | **liga** o seed do dono, em qualquer ambiente; vazia, o seed do dono é pulado com uma linha de log; o `users:create-owner` recusa senha fraca | `<segredo>` |
| `SEED_DEMO_PASSWORD` | não | **sim** | **liga** a demonstração: senha comum de uma conta por papel (`administrator@example.com`, `operator@example.com`) e o conteúdo de exemplo (cronograma, denúncias, avisos); vazia, a demonstração é pulada e o resto do seed segue | `<segredo>` |

Chaves do `backend/.env.example` que o Curupira ainda não lê, e por isso ficam comentadas no lugar: `APP_CLIENT_URL` (web e API
ficam em sites irmãos e o cookie é `lax`, `backend/config/cookie.ts`) e `DATABASE_SSL`; `COOKIE_DOMAIN` e `TRUSTED_PROXIES` seguem a
tabela acima. O Curupira não tem e-mail, fila nem JWT, então os blocos `optional` `mail`, `queue` e `jwt` do modelo saem inteiros.

**Seed ligado pela chave** (`_standards/backend.md` §6.2): nenhum seeder depende de `NODE_ENV` nem de flag à parte. Os bairros
(dado de referência) rodam sempre em `development` e `production`; ficam fora do `test` porque a suíte cria os próprios e o nome
é `unique`. O e-mail de cada conta de demonstração é `<papel em minúsculas>@example.com`, sem chave.

Só do `docker-compose.yml`, nunca da aplicação: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `DB_PORT`, `STORAGE_PORT`,
`STORAGE_CONSOLE_PORT`. Estão no modelo de todo projeto.

O teto da foto da denúncia (10 MiB) deixou de ser variável: é `LIST_LIMITS.REPORT_PHOTO_SIZE` em `@curupira/shared`, o mesmo
em todo ambiente (`DECISIONS.md` #25).

### 1.2 Frontend (`frontend/.env`, lido em `frontend/src/env.ts` e, em execução, no servidor)

Mesma ordem de blocos do `frontend/.env.example`.

| Variável | Quando | Obrigatória | O que é | Exemplo |
|---|---|---|---|---|
| `VITE_API_URL` | build | sim em produção (em dev cai em `http://localhost:3333`) | endereço da API visto pelo navegador; entra no bundle e na CSP | `http://localhost:3333` |
| `SERVER_API_URL` | execução (servidor) | não | endereço interno da API para o SSR, sem sair pela internet; sem `VITE_`, não vai ao navegador; ausente usa `VITE_API_URL` | `http://curupira-api:3333` |
| `VITE_SITE_URL` | build | sim em produção (em dev cai em `http://localhost:3000`) | endereço público do site (canonical, hreflang, sitemap); sem barra final | `http://localhost:3000` |
| `SITE_ENV` | execução (servidor) | não | só `production` libera indexação; qualquer outro valor responde `noindex` e `Disallow: /`; ausente não é produção | `production` |
| `STORAGE_PUBLIC_URL` | execução (servidor) | com envio de foto | origem do bucket **exatamente como a URL assinada a usa** (o `STORAGE_ENDPOINT` visto do navegador: com `STORAGE_FORCE_PATH_STYLE=false` o bucket vira subdomínio, `https://<bucket>.<conta>.r2.cloudflarestorage.com`, e é esse host que entra aqui; o host da conta sem o bucket não casa com a CSP e o envio de foto é bloqueado), lida **por requisição** em `src/server.ts` para abrir `img-src` e `connect-src` da CSP; nunca no build; ausente, a CSP só libera a API e a foto não sobe | `https://<bucket>.exemplo.com` |
| `VITE_UPLOAD_MAX_SIZE` | build | não | espelho de `UPLOAD_MAX_SIZE`; **comentada no Curupira**: a foto da denúncia tem teto fixo (`LIST_LIMITS.REPORT_PHOTO_SIZE`) e não há biblioteca de arquivos | `1073741824` |

O frontend só fala com a API: não há modo de dados de exemplo. O dado de exemplo vem do seeder de demonstração do backend
(`SEED_DEMO_PASSWORD`).

Variáveis dos testes de ponta a ponta (`frontend/.env.e2e.example`, lidas em `e2e/support/env.ts`, sem default: faltando uma, a
suíte para e diz qual): `E2E_BASE_URL` (origem do app que a suíte sobe; o `CORS_ORIGINS` da API precisa listá-la), `E2E_API_URL`,
`E2E_OWNER_EMAIL` e `E2E_OWNER_PASSWORD` (o administrador semeado; no CI a senha nasce a cada execução) e `E2E_DEMO_PASSWORD`
(a `SEED_DEMO_PASSWORD` do backend sob teste: o operador entra como `operator@example.com`, conta do seeder de demonstração).
`E2E_SHOTS_DIR` (pasta das capturas) e `E2E_CHROMIUM_PATH` (binário do Chromium, também lido por `scripts/generate-icons.mjs`)
são opcionais. Workers e matriz de larguras não são chave: são do `playwright.config.ts` e do CI.

Regras (detalhe em `_standards/backend.md` §6):

- Segredo e credencial não têm default: o app não sobe sem eles.
- `VITE_*` vai para o navegador: nunca segredo.
- `COOKIE_DOMAIN` não é cobrada pelo schema; esquecê-la em produção desloga o painel a cada F5.
- Variável nova de ambiente se testa com o valor de produção, não só com o do `.env.example` (`TRUSTED_PROXIES`, A-01).

## 2. Exemplo

Os dois `.env.example` são o modelo da régua (`_templates/{backend,frontend}/.env.example`): mesmas chaves, mesma ordem, mesmos
blocos e comentários em inglês; só os valores abaixo são do Curupira. Não se repete o arquivo aqui: ele é a fonte, e o
`sync-to-project.mjs --check` cobra a lista de chaves.

| Chave | Valor de exemplo do Curupira |
|---|---|
| `DATABASE_URL` | `postgres://curupira:curupira@localhost:5436/curupira` |
| `STORAGE_KEY`, `STORAGE_BUCKET` | `curupira` |
| `STORAGE_ENDPOINT` | `http://localhost:9006` |
| `DB_PORT`, `STORAGE_PORT`, `STORAGE_CONSOLE_PORT` | `5436`, `9006`, `9007` |
| `SEED_OWNER_EMAIL` | `owner@example.com` |
| `STORAGE_PUBLIC_URL` (frontend) | `http://localhost:9006` |
| `E2E_BASE_URL` | `http://localhost:3010` |

## 3. Segredo fora do Git

`.env` e `.env.*` ficam fora do Git; `.env.example`, `.env.test` e `.env.e2e.example` são versionados, e os dois últimos só usam
chaves do catálogo. O `.env.test` do backend só tem o banco `curupira_test`, o bucket `curupira-test` e a senha de teste do dono.
Não existe `frontend/.env.production`: os `VITE_*` do build chegam pelo passo de build do CI (`main-build-frontend.yml`, que
reprova se `VITE_API_URL` ou `VITE_SITE_URL` não forem `https`), e o resto é de execução, no painel do Coolify.

## 4. Por ambiente

| Ambiente | De onde vêm os valores | Observação |
|---|---|---|
| Desenvolvimento | `backend/.env` copiado de `.env.example`; `frontend/.env` de `.env.example` | Postgres na porta 5436, MinIO na 9006 e console na 9007 (portas próprias para conviver com outros projetos na mesma máquina); app na 3000, API na 3333 |
| Teste | `backend/.env.test` (versionado) | banco `curupira_test` (o runner se recusa a rodar em banco sem o sufixo `_test`), bucket `curupira-test`, `CORS_ORIGINS=http://localhost:5173` |
| CI | `env:` dos workflows | valores de placeholder; o e2e do frontend cria um `api.env` temporário |
| Produção | painel do Coolify para a API e o app; `VITE_*` no passo de build do CI | nunca em arquivo no servidor de build |

Produção, API: `NODE_ENV=production`, `HOST=0.0.0.0`, `APP_SERVER_URL=https://api-curupira.maiyu.com.br`,
`CORS_ORIGINS=https://curupira.maiyu.com.br`, `COOKIE_DOMAIN=.maiyu.com.br`,
`TRUSTED_PROXIES=loopback,uniquelocal`, `UPLOAD_MAX_SIZE`, `STORAGE_*` do
provedor (sem `STORAGE_FORCE_PATH_STYLE`), `DATABASE_URL` e `DATABASE_SSL` conforme o banco,
`SEED_OWNER_*` só no momento de criar o primeiro administrador (com `SEED_OWNER_PASSWORD` presente o seeder o cria; ou
`node ace users:create-owner`, que lê a mesma chave ou as flags); `SEED_DEMO_PASSWORD` fica vazia em produção, e a demonstração
é pulada. O `Dockerfile-production` do backend define `APP_SERVER_URL`, `CORS_ORIGINS` e `TRUSTED_PROXIES`
com valores de placeholder só no estágio de build, para o schema passar; a
plataforma injeta os reais.

Produção, app: `VITE_API_URL=https://api-curupira.maiyu.com.br` e `VITE_SITE_URL=https://curupira.maiyu.com.br` no build (passo do
CI), e no servidor `SITE_ENV=production`, `STORAGE_PUBLIC_URL` (origem do bucket de produção, a definir antes do primeiro deploy:
sem ela a CSP bloqueia o envio da foto) e, se houver rede interna, `SERVER_API_URL`.

## 5. Primeira configuração

- [ ] `cp backend/.env.example backend/.env` e `cp frontend/.env.example frontend/.env`.
- [ ] Gerar `APP_KEY` (`node ace generate:key` no `backend/`).
- [ ] Definir `SEED_OWNER_PASSWORD` (liga o seed do dono) e, se quiser a demonstração, `SEED_DEMO_PASSWORD`.
- [ ] Subir os serviços locais: `docker compose up -d` em `backend/` (Postgres, MinIO e `minio-setup`).
- [ ] Criar o banco de teste: `docker compose exec database createdb -U curupira curupira_test`.
- [ ] `node ace migration:run` e `node ace db:seed` (bairros sempre; dono e demonstração só com a senha da chave).
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
