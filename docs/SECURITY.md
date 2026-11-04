# Segurança

**Curupira** · como avisar de uma falha, o que se protege, de quem, e como

> O modelo de ameaças (§2) é ancorado em evidência: cada fronteira, superfície e abuso aponta um
> caminho do repositório. Revisado quando muda fronteira: rota pública nova, integração, upload,
> papel novo (`_standards/documentation.md` §5). Segredo encontrado no caminho é redigido aqui,
> nunca copiado. O resultado da auditoria de segurança do código está no §10.

## 1. Como reportar uma vulnerabilidade

Não abra issue pública. Escreva para o dono do repositório, Jhollyfer Rodrigues
(`jhollyfer.fr@gmail.com`), com passos para reproduzir. Contato de segurança dedicado e prazo de
resposta ainda não foram definidos (`PRD.md` §8).

## 2. Modelo de ameaças

### 2.1 Escopo e premissas

- Dentro: API (`backend/`), app do morador e painel (`frontend/`), contrato (`shared/`), bucket de fotos,
  pipeline do GitHub Actions e deploy no Coolify.
- Fora: a conta do Coolify, do Docker Hub e do provedor do bucket (só se pede MFA e token de menor
  escopo); o banco gerenciado; o proxy Traefik além do que `ENV.md` exige dele.
- Premissas: TLS terminado no Traefik; banco sem acesso público; o bucket é privado e nenhum objeto sai
  por URL pública; produção separada de CI e de desenvolvimento.

### 2.2 Componentes, fluxos e fronteiras de confiança

```mermaid
flowchart LR
  user[Navegador do morador] -->|HTTPS| web[Frontend SSR]
  user -->|"HTTPS, sem sessão (/storefront)"| api[API]
  user -->|PUT pré-assinado| bucket[(Bucket privado)]
  staff[Navegador da gestão] -->|HTTPS + cookie httpOnly| web
  staff -->|HTTPS + cookie| api
  web -->|HTTP + cookie encaminhado| api
  api --> db[(PostgreSQL)]
  api -->|leitura, sobrescrita, URL assinada| bucket
  user -->|tiles| osm[OpenStreetMap]
```

| Fronteira | Entre | O que a protege | Evidência |
|---|---|---|---|
| internet para rota pública da API | morador e `/storefront` | throttle por IP em toda escrita, na consulta de protocolo e no mapa, com o IP guardado só como HMAC-SHA256; consulta pública seleciona só colunas públicas; mapa com coordenada arredondada; validator Zod/VineJS | `backend/start/limiter.ts`, `backend/start/routes.ts`, `backend/app/repositories/report/report.lucid.repository.ts`, `backend/app/features/storefront/reports/map/map.use-case.ts` |
| internet para rota autenticada | gestão e a API | cookie `httpOnly`, `Origin` contra a lista do `CORS_ORIGINS`, `auth()` e `role()` no grupo, throttle por conta e por IP no login | `backend/app/middleware/origin.middleware.ts`, `role.middleware.ts`, `backend/config/cookie.ts` |
| navegador para bucket | foto da denúncia | URL `PUT` pré-assinada de 3 min com tamanho fixado, em chave com prefixo `report-photos/` sorteada pelo servidor; `complete` só aceita esse tipo, confere tamanho e assinatura e reencoda | `backend/app/features/storefront/report-photos/`, `backend/app/core/report-photo-key.ts`, `backend/app/services/multipart/multipart.service.ts` |
| API para bucket | leitura e escrita | credencial `STORAGE_KEY` do usuário `app-rw`; bucket privado; leitura da gestão por URL assinada de 15 min (foto no detalhe) e download da biblioteca por URL de 5 min | `backend/infra/minio/minio-setup.sh`, `backend/config/drive.ts`, `backend/app/services/storage/storage.service.ts` |
| navegador para CDN de tiles | mapa | CSP libera só `https://tile.openstreetmap.org` em `img-src` | `frontend/vite.config.ts` |
| navegador para cache do aparelho | painel e entrada | service worker não guarda `/management` nem `/sign-in` (nem as versões `/en` e `/es`); Nitro responde `Cache-Control: no-store` nelas; o sign-out apaga o cache `pages` | `frontend/vite.config.ts`, `frontend/src/lib/pwa.ts` |
| CI para produção | GitHub e Coolify | `COOLIFY_TOKEN` em secret, uuid conferido, smoke test por revisão; build do app reprova sem `https` em `VITE_API_URL` e `VITE_SITE_URL` | `.github/workflows/main-deploy-coolify.yml`, `.github/workflows/main-build-frontend.yml` |

### 2.3 Ativos

| Ativo | Por quê importa | C / I / D | Onde fica | Quem acessa |
|---|---|---|---|---|
| Anonimato de quem denuncia | medo de retaliação derruba a denúncia; é a promessa central do produto | C | ausência de dado: sem `contact`, nada sobre o autor; contador do limiter com o HMAC do IP (nunca o IP), temporário | ninguém |
| Contato opcional (telefone ou e-mail) | dado pessoal (LGPD) | C | `reports.contact`, texto de até 120 caracteres | só a gestão, no detalhe da ocorrência |
| Foto e ponto no mapa | revelam o lugar, e a foto crua revela o aparelho e a posição | C | bucket privado e `reports.latitude/longitude` | gestão (foto por URL assinada, ponto exato); o público vê o ponto aproximado (3 casas decimais, cerca de 110 m), o tipo e o dia, sem foto |
| Protocolo | única chave da página de acompanhamento | C | `reports.protocol` | quem o recebeu; a gestão |
| Senha da gestão | tomada de conta | C | hash no banco (`users.password`) | ninguém lê |
| Sessão (access e refresh) | acesso ao painel | C, I | cookies `httpOnly` e tabela `auth_access_tokens` | o navegador da pessoa |
| Situação e resposta de cada denúncia | confiança pública no canal | I | `report_status_events` | gestão grava; o morador lê |
| Cronograma e avisos | informação pública que precisa ser correta | I, D | `collection_schedules`, `notices` | `ADMINISTRATOR` (cronograma), os dois papéis (avisos) |
| Disponibilidade do envio | o morador denuncia onde há pouco sinal | D | PWA, fila local, API | |

### 2.4 Atacante

| Pode | Não pode (premissa) |
|---|---|
| chamar qualquer rota de `/storefront` sem conta, de muitos IPs | ler o banco ou o bucket diretamente |
| enviar corpo, `Content-Type`, tamanho e foto arbitrários, e arquivo que não é imagem | quebrar TLS entre navegador e Traefik |
| tentar adivinhar protocolos e senhas | obter `COOLIFY_TOKEN`, `APP_KEY` ou as credenciais do bucket |
| forjar `Origin`, `X-Forwarded-For` e cabeçalhos pelo `curl` | forjar o `Origin` de outro site dentro de um navegador de vítima |
| operador tentando abrir área de administrador | alterar o código ou o pipeline sem passar por PR do dono |
| conta de gestão roubada | |

### 2.5 Superfícies

| Superfície | Como chega | Fronteira | Evidência |
|---|---|---|---|
| Criar denúncia | `POST /storefront/reports` | internet para API | `backend/app/features/storefront/reports/create/` |
| Upload de foto | `POST /storefront/report-photos`, `PUT` no bucket, `POST .../complete` | internet, bucket | `backend/app/features/storefront/report-photos/` |
| Consulta por protocolo | `GET /storefront/reports/:protocol` | internet para API | `backend/app/features/storefront/reports/show-by-protocol/` |
| Mapa público | `GET /storefront/reports/map` | internet para API, com throttle | `backend/app/features/storefront/reports/map/` |
| Entrada no painel | `POST /authentication/sign-in` | internet para API | `backend/app/features/authentication/sessions/sign-in/` |
| Painel | `/management/*`, `/account`, `/storages` | internet para API autenticada | `backend/start/routes.ts` |
| Renovação de sessão | `POST /authentication/refresh` | internet para API | `backend/app/features/authentication/sessions/refresh/` |
| Documentação da API | `/openapi.json`, `/documentation` | internet para API | `backend/app/middleware/documentation.middleware.ts` |
| Fila offline no aparelho | IndexedDB e `localStorage` | aparelho do morador | `frontend/src/lib/report-queue.ts` |
| Cabeçalhos do app | Nitro, só no build de produção | internet para frontend | `frontend/vite.config.ts` |
| Redirecionamento pós-login | `/sign-in?redirect=` | internet para frontend | `frontend/src/lib/redirect-search.ts` |
| Criação do primeiro administrador | `node ace users:create-owner`, por quem opera o servidor | operador do servidor | `backend/commands/users-create-owner.command.ts` |

### 2.6 Abusos priorizados

| Id | Abuso | Probabilidade | Impacto | Prioridade | Mitigação | Evidência |
|---|---|---|---|---|---|---|
| TM-001 | encher o banco e a fila da gestão com denúncias falsas | alta | médio | alta | 10 envios por hora por IP, bloqueio de 10 min ao estourar; foto exigida (1 a 3); mapa público só mostra o que a equipe já abriu | `backend/start/limiter.ts` (`reportCreateThrottle`), `backend/app/domain/report/report.entity.ts` |
| TM-002 | encher o bucket com arquivos anônimos | alta | médio | alta | 60 chamadas por hora por IP nas rotas de foto; teto `REPORT_PHOTO_MAX_SIZE` (constante do `shared`) no validator e no `Content-Length` assinado; só `jpeg`, `png`, `webp`; `PENDING` abandonado e foto `UPLOADED` sem denúncia há mais de 24 h saem no `storages:prune` (cron do host) | `backend/start/limiter.ts` (`reportPhotoThrottle`), `backend/app/validators/storefront/report-photos.validator.ts`, `backend/commands/storages-prune.command.ts` |
| TM-003 | subir arquivo que não é imagem com `Content-Type` de imagem (HTML, script, bomba de descompressão) | média | alto | alta | `complete` confere os primeiros bytes contra a assinatura do tipo; `sharp` decodifica com limite de 50 milhões de pixels e `failOn: error`, no máximo 2 conversões ao mesmo tempo (`Semaphore`); o objeto é reescrito pela saída do `sharp`; falha apaga objeto e linha | `backend/app/domain/storage/storage.entity.ts`, `backend/app/services/photo-sanitizer/photo-sanitizer.service.ts`, `backend/app/core/semaphore.ts` |
| TM-004 | revelar posição ou aparelho pelo EXIF da foto | alta | alto | alta | o navegador redesenha a foto no canvas; o servidor reencoda sem `withMetadata`; a coordenada vem do pin confirmado, nunca do EXIF | `frontend/src/lib/image.ts`, `backend/app/services/photo-sanitizer/photo-sanitizer.service.ts` |
| TM-005 | enumerar protocolos para ler o andamento de denúncias alheias | média | médio | média | protocolo de 8 símbolos de um alfabeto de 32 (2^40) sorteado com `crypto.randomInt`; 30 consultas por 10 min por IP com bloqueio de 10 min; a resposta traz só tipo, situação, datas e mensagens da gestão (sem contato, descrição, foto nem ponto); protocolo mal formado responde 404 igual ao inexistente | `backend/app/services/protocol/protocol.service.ts`, `backend/start/limiter.ts` (`reportLookupThrottle`) |
| TM-006 | descobrir quem denunciou pelo mapa público ou pela consulta | média | alto | alta | o mapa devolve id, tipo, situação, ponto arredondado a 3 casas decimais (cerca de 110 m) e o dia (nunca a hora), as 500 denúncias mais recentes, sem contato, descrição nem foto, com 60 consultas por 10 min por IP; a consulta seleciona colunas explícitas | `backend/app/features/storefront/reports/map/map.use-case.ts`, `backend/start/limiter.ts` (`reportMapThrottle`), `backend/app/repositories/report/report.lucid.repository.ts` (`publicMap`, `showByProtocol`) |
| TM-007 | ler o contato de quem denunciou | baixa | alto | alta | `contact` só aparece em `ManagementReportShowResponse`, atrás de `auth()` e `role()`; o teste de vazamento de resposta confere os campos | `backend/app/core/response-leak.e2e.spec.ts`, `shared/src/responses/management/reports.response.ts` |
| TM-008 | força bruta ou preenchimento de credencial no login | alta | alto | alta | 5 tentativas por minuto por IP com bloqueio de 10 min, e 20 por hora por e-mail normalizado; mensagem única; hash gasto mesmo para conta inexistente | `backend/start/limiter.ts`, `backend/app/features/authentication/sessions/sign-in/sign-in.use-case.ts` |
| TM-009 | CSRF de outro site contra a sessão da gestão | média | alto | alta | `Origin` (ou `Sec-Fetch-Site`) conferido em todo método não seguro, antes do bodyparser; CORS com origem explícita e `credentials`; cookie `sameSite=lax` | `backend/app/middleware/origin.middleware.ts`, `backend/config/cors.ts` |
| TM-010 | operador executar ação de administrador, ou abrir rota nova sem proteção | média | alto | alta | `role()` por grupo; `authz-check` falha quando a cadeia de qualquer rota muda; o front esconde o link, mas o 403 é do backend | `backend/start/routes.ts`, `backend/scripts/authz-check.ts` |
| TM-011 | baixar arquivo da biblioteca sem sessão | baixa | médio | média | bucket privado; download exige `auth()` e `StoragePolicy` | `backend/app/policies/storage.policy.ts` |
| TM-012 | todos os moradores caírem no mesmo balde de throttle (IP do proxy) ou o IP ser forjável | média | alto | alta | `TRUSTED_PROXIES` obrigatório, lista separada por vírgula (`loopback,uniquelocal` em produção), validada no boot; recusa vazio, `true`, `*`, `0.0.0.0/0` e `::/0` | `backend/app/core/trusted-proxies.ts`, `backend/start/env.ts`, `backend/config/app.ts` |
| TM-013 | embutir o site em outro por `iframe` (clickjacking) | baixa | médio | baixa | `frame-ancestors 'none'` no app e `X-Frame-Options: DENY` na API | `frontend/vite.config.ts`, `backend/config/shield.ts` |
| TM-014 | vazar segredo por log | baixa | alto | média | redação de `password`, tokens, `authorization` e `cookie`; o corpo da denúncia não é logado | `backend/config/logger.ts`, `backend/app/core/log-redaction.unit.spec.ts` |
| TM-015 | commit com autoria de agente ou segredo no repositório, ou workflow injetável | baixa | médio | média | Gitleaks, `pnpm audit --prod`, varredura de `pull_request_target` e de `github.event` em `run:`, checagem de autor e trailers | `.github/workflows/ci.yml`, `.github/workflows/main-check-backend.yml` |
| TM-016 | próxima pessoa de um aparelho compartilhado abrir páginas do painel pelo cache | baixa | alto | média | o service worker não guarda `/management` nem `/sign-in`; Nitro manda `no-store` nelas; o sign-out apaga o cache `pages` | `frontend/vite.config.ts`, `frontend/src/lib/pwa.ts` |
| TM-017 | trocar a foto já higienizada pela URL de envio | baixa | médio | baixa | a URL `PUT` vale 3 minutos; passado o prazo, não escreve mais (janela residual, A-09 no §10) | `backend/app/features/storefront/report-photos/create/create.use-case.ts` |
| TM-018 | anexar arquivo da biblioteca da gestão a uma denúncia, ou confirmá-lo pela rota anônima | baixa | alto | média | a chave da foto de denúncia tem o prefixo `report-photos/` sorteado pelo servidor; `complete` e o anexo só aceitam esse tipo (arquivo da biblioteca responde 404) | `backend/app/core/report-photo-key.ts`, `backend/app/repositories/storage/storage.lucid.repository.ts` |

### 2.7 Calibragem de criticidade

- Crítico: identificar quem denunciou; sessão de gestão tomada; execução de código por arquivo enviado.
- Alto: ler contato ou foto sem papel; escalada de operador para administrador; deploy no projeto errado.
- Médio: enxurrada de denúncias falsas que atrasa a fila; enumeração de protocolo com sucesso raro.
- Baixo: enumeração de dados públicos (bairros, cronograma, avisos); falha de cabeçalho sem exploração.

### 2.8 Para revisão manual

- Todo `select` novo em `ReportRepository` que alcance uma rota `/storefront`: conferir que nenhuma
  coluna além das públicas sai.
- Mudança em `start/limiter.ts`, `origin.middleware.ts`, `photo-sanitizer.service.ts` ou na assinatura de
  `storage.entity.ts`.
- Log de acesso do Traefik no Coolify: se ele grava o IP do morador junto com a rota `POST /storefront/reports`,
  a promessa "o servidor não guarda nada sobre quem enviou" fica mais fraca. Fora do repositório; não
  verificável daqui (residual, §10).
- `STORAGE_PUBLIC_URL`: ainda não definida em produção (o endereço do bucket é desconhecido). Lida por requisição em
  `frontend/src/server.ts` (só a origem entra na CSP, sem caminho; valor que não é URL não abre nada). Sem ela a CSP
  bloqueia o `PUT` da foto; é obrigatória antes do primeiro deploy (`DECISIONS.md` #27).
- `TRUSTED_PROXIES`: ao mudar o valor, testar com o de produção (`loopback,uniquelocal`), não com o do
  `.env.example` (A-01, §10).
- Intervalo de coordenadas aceito: o validator limita a latitude e longitude do mundo, e o frontend prende o
  pin à caixa do município; a API não impõe a caixa.

## 3. Autenticação e sessão

- Cookies `curupira-access-token` (1 dia) e `curupira-refresh-token` (7 dias): `httpOnly`, `sameSite=lax`,
  `secure` em produção, `Domain` pelo `COOKIE_DOMAIN`. O prefixo existe porque o `Domain=.maiyu.com.br` é
  compartilhado com outros projetos da casa: nome genérico colidiria com o cookie deles. Sessão emitida com
  o nome antigo deixa de valer (`DECISIONS.md` #20). O nome do token é conferido pelo guard para recusar um
  refresh usado como access (`backend/config/cookie.ts`, `backend/app/guards/cookie-access-tokens.guard.ts`).
- O redirecionamento depois do login (`?redirect=`) só aceita caminho interno: recusa `//`, `\`, caractere de
  controle (literal ou codificado) e o que, resolvido contra uma base, sai da origem
  (`frontend/src/lib/redirect-search.ts`).
- O SSR repassa à API o `X-Forwarded-For` (a cadeia recebida mais o IP do par) e o `Origin`
  (`VITE_SITE_URL`): sem o primeiro, a API veria o IP do Nitro em toda chamada do SSR e os limites por IP virariam um balde só; sem o segundo, a barreira de
  `Origin` recusaria a renovação de sessão feita no servidor (`frontend/src/integrations/tanstack-query/http.server.ts`).
- Painel e entrada nunca vão para o cache do aparelho: `Cache-Control: no-store` em `/management/**` e
  `/sign-in` (e as versões `/en` e `/es`), service worker sem essas rotas e cache `pages` apagado no sign-out
  (`frontend/vite.config.ts`, `frontend/src/lib/pwa.ts`).
- `sign-out` revoga os tokens da sessão; mudar papel ou situação de uma conta revoga todas as sessões dela.
- Limite de tentativas: `signIn` 5 por minuto por IP (bloqueio de 10 min), `signInAccount` 20 por hora por
  e-mail (bloqueio de 10 min), `refresh` 30 por minuto por IP, `accountUpdate` 10 por hora por usuário
  (bloqueio de 10 min).
- A resposta de credencial errada é a mesma para e-mail inexistente, senha errada e conta inativa.
- Não há recuperação de senha nem autocadastro: o administrador cria as contas. A troca de senha exige a
  senha atual (`PUT /account`).

## 4. Autorização

- Toda rota da gestão passa por `auth()` e `role()` no grupo; o escopo vem da sessão (`actor`), nunca de id
  vindo do cliente. Registro inexistente e registro negado respondem igual quando há política de posse.
- A matriz abaixo é a que o código impõe (`backend/start/routes.ts`) e a que a interface espelha
  (`frontend/src/lib/capabilities.ts`).

| Capacidade | `OPERATOR` | `ADMINISTRATOR` |
|---|---|---|
| Ver visão geral, estatísticas e mapa da gestão | sim | sim |
| Listar, abrir e excluir ocorrências; ler foto e contato | sim | sim |
| Mudar situação (só avança) e registrar resposta | sim | sim |
| Criar, editar, encerrar e excluir avisos | sim | sim |
| Ver e editar o próprio perfil e trocar a senha | sim | sim |
| Biblioteca de arquivos (`/storages`) | sim | sim |
| Criar, editar e excluir cronograma | não (403) | sim |
| Criar, editar e excluir bairros | não (403) | sim |
| Criar, editar e excluir contas | não (403) | sim |
| Mudar o próprio papel ou situação; excluir a própria conta | não | não (`UserPolicy`) |

## 5. Entrada e saída

- Todo dado de fora passa por validator antes da regra: VineJS no backend (`backend/app/validators/`),
  Zod em `shared/` para o frontend. Tetos: descrição 1000 caracteres, contato 3 a 120, resposta da gestão
  500, aviso 120 e 600, 1 a 3 fotos.
- Upload da denúncia: só `image/jpeg`, `image/png` e `image/webp`; tamanho de 1 byte até
  `REPORT_PHOTO_MAX_SIZE`, fixado na URL assinada, que vale 3 minutos; chave do objeto com prefixo
  `report-photos/`; assinatura conferida; reencodado sem metadado com `sharp` (limite de 50 milhões de pixels,
  no máximo 2 conversões simultâneas). O arquivo da biblioteca da gestão não pode ser confirmado pela rota
  anônima nem anexado a denúncia.
- Upload da biblioteca: tipos de `STORAGE_MIMETYPES` (imagens, PDF e áudio) com a mesma conferência de
  assinatura, teto `UPLOAD_MAX_SIZE`, multipart pré-assinado.
- Mensagem de validação sempre localizada; resposta de erro não vaza stack, SQL nem caminho
  (`backend/app/exceptions/handler.ts`).
- Cabeçalhos: a API envia `X-Frame-Options: DENY`, HSTS (180 dias) e `nosniff`; a CSP do Adonis fica
  desligada porque a API não serve HTML. O app envia, só no build de produção, `Content-Security-Policy`
  (`default-src 'self'`, `script-src` e `style-src` com `'unsafe-inline'` porque o Start escreve scripts
  de hidratação sem nonce, `img-src` e `connect-src` com a API e o bucket, `img-src` também com
  `https://tile.openstreetmap.org`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Content-Type-Options`,
  `Referrer-Policy: strict-origin-when-cross-origin` e HSTS de um ano sem `preload`.
- O `shield` com CSRF por token está desligado de propósito: a barreira é o `Origin`.

## 6. Segredos

- Só em variável de ambiente (`ENV.md`); nada de segredo no código, log ou `docs/`.
- Rotação: `APP_KEY` (invalida sessões e dados cifrados), `STORAGE_SECRET`, `COOLIFY_TOKEN` e
  `DOCKERHUB_TOKEN` pelo painel de cada provedor; quem rotaciona é o dono, a cada troca de pessoa com acesso
  ou suspeita de vazamento. Prazo regular de rotação: a definir.
- A senha do dono nasce de `SEED_OWNER_PASSWORD`, sem default; o seed do dono liga pela presença dela, em qualquer
  ambiente (vazia, é pulado com uma linha de log), e com a senha sem o `SEED_OWNER_EMAIL` o seeder para. A senha das
  contas de demonstração é `SEED_DEMO_PASSWORD`, também sem default: **vazia em produção**, porque preencher cria uma
  conta por papel com e-mail previsível (`<papel>@example.com`) e senha comum. O primeiro administrador de produção
  sai de `node ace users:create-owner` (e-mail e senha por argumento ou por `SEED_OWNER_EMAIL` e
  `SEED_OWNER_PASSWORD`; recusa senha fraca; não faz nada se já existe administrador ativo), de preferência pela
  variável, porque argumento fica no histórico do shell.
- O frontend não carrega dado nem conta de exemplo: a demonstração é o seeder do backend, ligado por `SEED_DEMO_PASSWORD`
  (vazia em produção) e com `<papel>@example.com` (`DECISIONS.md` #26).

## 7. Dependências

- Última versão publicada (`_standards/tooling.md` §0); Dependabot semanal para npm, Actions e imagens base
  fixadas por digest.
- `pnpm audit --prod --audit-level=high` e Gitleaks em todo PR (`.github/workflows/ci.yml`).
- Bibliotecas sem entrada na `_doc-lib/` (Leaflet, react-leaflet, `vite-plugin-pwa`, `sharp`) usam a página
  oficial de cada uma; a proposta de entrada está em `MEMORY.md`. `sharp` está na 0.35.5.

## 8. Dados pessoais (LGPD)

| Dado | Finalidade | Base legal | Retenção | Exclusão |
|---|---|---|---|---|
| Contato opcional da denúncia | a gestão dar retorno a quem pediu | consentimento (o morador escolhe "Deixar contato") | enquanto a denúncia existir; prazo da prefeitura a definir | excluir a ocorrência no painel (`DELETE /management/reports/:id`) apaga o contato; não há rotina automática |
| Foto e ponto da denúncia | a equipe localizar e tratar o problema | execução de política pública (o dado não identifica a pessoa; o EXIF é removido) | enquanto a denúncia existir; prazo a definir | exclusão da ocorrência; o arquivo no bucket é removido junto com o registro `Storage` |
| Marca do IP do morador (HMAC-SHA256, segredo derivado de `APP_KEY`) | limitar abuso | legítimo interesse (segurança) | só na tabela `rate_limits`, sem o IP em texto claro; dura a janela do limite mais 1 hora de limpeza (cerca de 2 horas no pior caso); o 429 de `/storefront/*` não loga o IP | expira sozinho |
| Nome, e-mail e senha (hash) da gestão | operar o painel | execução das funções do cargo | enquanto a conta existir | `DELETE /management/users/:id` (a conta não exclui a si mesma) |
| Protocolos, bairro e fila de denúncias no aparelho | o morador acompanhar e reenviar | consentimento implícito do uso, sem envio ao servidor | até o morador limpar os dados do site | limpar os dados do site no navegador |

Os textos de `/privacy` e `/terms` (`frontend/messages/*.json`) são rascunho: a prefeitura e a
procuradoria revisam antes da abertura. O direito de acesso, correção e exclusão é atendido pela
prefeitura de Benjamin Constant; a denúncia anônima não pode ser localizada por quem a fez, a não ser
pelo protocolo.

### 8.1 Riscos aceitos e abertos

| Risco | Situação |
|---|---|
| Sem retenção automática de denúncias, fotos e contatos | aceito para o MVP; a prefeitura define o prazo e a rotina de eliminação |
| O mapa público mostra o ponto aproximado (cerca de 110 m) e o dia | decisão #17, que substitui a #9; o painel mantém o ponto exato; morador que denuncia a própria rua ainda pode ser inferido pela vizinhança, o que a aproximação reduz e não zera (A-08) |
| Throttle por IP: moradores atrás do mesmo NAT dividem o limite | aceito; o limite de 10 envios por hora é folgado para uso real |
| IP no log do proxy (Traefik e Coolify) | não verificável pelo repositório; a conferir no painel (§2.8) |
| Sem varredura de vírus em arquivos da biblioteca da gestão | aceito: só a gestão autenticada envia, e a assinatura é conferida |
| CSP do app com `'unsafe-inline'` | exigência do TanStack Start sem nonce |
| Janela de até 3 minutos em que quem tem a URL de envio pode sobrescrever o objeto já higienizado | residual (A-09); a URL vale 3 minutos e não é divulgada |
| Travar o login de uma conta por e-mail conhecido (20 tentativas por hora, bloqueio de 10 min) | aceito (A-10): o teto por conta protege contra preenchimento de credencial e custa essa troca |
| `Domain=.maiyu.com.br` largo | residual (S-03); o prefixo evita a colisão de nome, e subdomínio de terceiros continua enxergando o cookie |
| `STORAGE_PUBLIC_URL` fora da CSP em produção | pendente: a foto não sobe até ser definida |

## 9. Checklist de revisão

- [ ] Rota nova tem auth e policy; rota pública nova, integração, upload ou papel atualizou o §2.
- [ ] Rota pública nova tem throttle por IP e seleciona só colunas públicas.
- [ ] Nenhum segredo no diff.
- [ ] Entrada validada; saída sem contato, descrição ou foto em rota pública.
- [ ] Log sem senha, token, contato, IP de rota `/storefront` ou outro dado pessoal.
- [ ] Variável nova de ambiente testada com o valor de produção, não só com o do `.env.example`.
- [ ] `authz:check` e `openapi:check` regravados no mesmo commit quando a cadeia de uma rota mudou.

## 10. Auditoria de segurança

Auditoria do código inteiro (`TASKS.md` 5.2), feita sobre o backend, o frontend e a esteira, com as correções
aplicadas no mesmo ciclo. Achados da API levam `A-`; achados de sessão e cookie, `S-`. O relatório da auditoria
não está no repositório: a tabela guarda o achado, o estado atual e onde o código e os testes provam.

| Id | Achado | Status | Onde está |
|---|---|---|---|
| A-01 | `TRUSTED_PROXIES=loopback,uniquelocal`, o valor documentado para produção, era lido como um endereço só e `request.ip()` lançava erro em toda requisição | corrigido: lista separada por vírgula, validada no boot, recusa vazio, `true`, `*`, `0.0.0.0/0` e `::/0` | `backend/app/core/trusted-proxies.ts`, `trusted-proxies.unit.spec.ts` |
| A-08 | o mapa público devolvia a coordenada exata, e o ponto de quem denuncia a própria casa o identificava | corrigido, com residual: arredondada a 3 casas decimais (cerca de 110 m), 500 denúncias mais recentes, só o dia; o ponto continua aproximado, não nulo | `backend/app/features/storefront/reports/map/map.use-case.ts`, `DECISIONS.md` #17 |
| A-09 | a URL de envio da foto continua válida depois do `complete` e permite sobrescrever o objeto já higienizado | residual: a validade caiu de 15 para 3 minutos; a janela de até 3 minutos permanece | `backend/app/features/storefront/report-photos/create/create.use-case.ts` |
| A-10 | o teto de login por e-mail permite travar o acesso de uma conta cujo e-mail se conhece | aceito: trade-off do teto por conta | `backend/start/limiter.ts` (`signInAccountThrottle`) |
| S-03 | cookies de sessão com nome genérico, sujeitos a colidir com outros projetos em `.maiyu.com.br` | corrigido por prefixo (`curupira-access-token`, `curupira-refresh-token`); residual: o `Domain=.maiyu.com.br` segue largo | `backend/config/cookie.ts`, `DECISIONS.md` #20 |

Demais achados, um a um (todos com correção e teste no mesmo ciclo):

| Id | Achado | Status | Onde está |
|---|---|---|---|
| A-02 | o `.env.production` do frontend nunca foi versionado e o build do CI saía em modo de exemplo, com a API em `localhost` e a CSP fechada para ela: o morador acharia que enviou a denúncia | corrigido: não há mais modo de exemplo (`DECISIONS.md` #26) e `main-build-frontend.yml` reprova o build sem `https` nos `VITE_*` | `.github/workflows/main-build-frontend.yml` |
| A-03 | o service worker guardava o HTML de `/management/*` e nada o limpava no sign-out | corrigido: sem `/management` e `/sign-in` no cache, `no-store`, `caches.delete` no sign-out | `frontend/vite.config.ts`, `frontend/src/lib/pwa.ts` |
| A-04 | o SSR de `/track` chamava a API sem o IP do visitante: todas as consultas caíam no mesmo balde de 30 por 10 minutos | corrigido: o SSR repassa `X-Forwarded-For` | `frontend/src/integrations/tanstack-query/http.server.ts` |
| A-05 | o IP do denunciante ficava em texto claro na chave de `rate_limits` e o 429 o registrava em log | corrigido: HMAC do IP como chave; sem IP no log de 429 anônimo | `backend/start/limiter.ts`, `backend/app/exceptions/handler.ts` |
| A-06 | foto enviada que nunca virou denúncia não era podada, e a foto pendente guarda o objeto cru | corrigido: `storages:prune` apaga também a `UPLOADED` de denúncia sem denúncia há mais de 24 h (exige cron) | `backend/commands/storages-prune.command.ts` |
| A-07 | `sharp` 0.34 com três avisos HIGH no `pnpm audit --prod` | corrigido: `sharp` 0.35.5; `pnpm audit --prod --audit-level=high` sem HIGH | `backend/package.json` |
| A-11 | dados de exemplo do painel com e-mails e telefones de aparência real no bundle | corrigido: o dado de exemplo saiu do frontend e vive só no seeder de demonstração do backend (`DECISIONS.md` #26) | `backend/database/seeders/demo.seed.ts` |
| A-12 | o dono não é semeado em produção e faltava caminho para criar o primeiro administrador | corrigido: `node ace users:create-owner` | `backend/commands/users-create-owner.command.ts` |
| S-01 | `?redirect=` recusava só `//` e `/\`, e `/%09/evil.com` poderia sair do site | corrigido: validação por origem e sem caractere de controle | `frontend/src/lib/redirect-search.ts` |
| S-02 | o `fetch` do SSR não manda `Origin` e o backend exige `Origin` em método não seguro: o refresh feito no servidor levaria 403 | corrigido: o SSR envia `Origin` igual a `VITE_SITE_URL` (não reproduzido ao vivo com token expirado) | `frontend/src/integrations/tanstack-query/http.server.ts` |
| S-04 | `limitInputPixels` de 60 MP permitia cerca de 240 MB de pixels por conversão, com 60 chamadas por hora por IP | corrigido: 50 MP (uma foto de 48 MP ainda passa) e no máximo 2 conversões simultâneas | `backend/app/services/photo-sanitizer/photo-sanitizer.service.ts`, `backend/app/core/semaphore.ts` |
| S-05 | o arquivo da biblioteca da gestão podia ser anexado a uma denúncia por quem soubesse o uuid | corrigido: o anexo só aceita arquivo com o prefixo `report-photos/` | `backend/app/core/report-photo-key.ts`, `backend/app/repositories/storage/` |

Resumo das correções por tema:

| Tema | Correção | Onde |
|---|---|---|
| IP nos contadores | chave do throttle anônimo é o HMAC-SHA256 do IP (segredo derivado de `APP_KEY`), nunca o IP; o 429 de `/storefront/*` não loga o IP | `backend/start/limiter.ts` (`LimiterKey`), `backend/app/exceptions/handler.ts` |
| Mapa público | novo throttle de 60 consultas por 10 minutos por IP | `backend/start/limiter.ts` (`reportMapThrottle`) |
| Foto de denúncia | chave com prefixo `report-photos/`; `complete` e o anexo só aceitam esse tipo; a biblioteca da gestão não anexa a denúncia | `backend/app/core/report-photo-key.ts`, `backend/app/repositories/storage/storage.lucid.repository.ts` |
| Foto de denúncia | URL `PUT` de 3 minutos (antes 15) | `backend/app/features/storefront/report-photos/create/create.use-case.ts` |
| Foto de denúncia | `storages:prune` apaga também foto `UPLOADED` sem denúncia há mais de 24 h | `backend/commands/storages-prune.command.ts` |
| Processamento de imagem | `sharp` 0.35.5, limite de 50 milhões de pixels e no máximo 2 conversões simultâneas | `backend/app/services/photo-sanitizer/photo-sanitizer.service.ts`, `backend/app/core/semaphore.ts` |
| Primeiro administrador | `node ace users:create-owner` (ou o seed do dono, com `SEED_OWNER_PASSWORD` presente); `SEED_DEMO_PASSWORD` vazia em produção | `backend/commands/users-create-owner.command.ts` |
| Cache do aparelho | service worker sem `/management` e `/sign-in`; `no-store`; sign-out apaga o cache `pages` | `frontend/vite.config.ts`, `frontend/src/lib/pwa.ts` |
| SSR para a API | repassa `X-Forwarded-For` e `Origin` | `frontend/src/integrations/tanstack-query/http.server.ts` |
| Redirecionamento | `?redirect=` validado por origem e sem caractere de controle | `frontend/src/lib/redirect-search.ts` |
| Dados de exemplo | só no seeder de demonstração, ligado por `SEED_DEMO_PASSWORD` | `backend/database/seeders/demo.seed.ts` |
| Texto de privacidade | passa a dizer que o IP vira um hash guardado por cerca de 2 horas e que o ponto do mapa é aproximado | `frontend/messages/*.json` (`privacy_anonymous_text`, `privacy_data_text`) |
| Esteira | `VITE_*` do build conferidos como `https` | `.github/workflows/main-build-frontend.yml` |

### 10.1 Residuais e o que falta

| Item | Situação |
|---|---|
| A-09, A-10, A-08 e `Domain` largo (S-03) | descritos acima e no §8.1 |
| Retenção automática de denúncia, foto e contato | inexistente; a prefeitura define o prazo (`PRD.md` §8) |
| IP no log do proxy (Traefik e Coolify) | não verificável pelo repositório |
| `STORAGE_PUBLIC_URL` | indefinida em produção |
| Cron de `storages:prune` | não existe no repositório; sem ele as fotos abandonadas ficam (`ARCHITECTURE.md` §9.1) |
| Suíte `functional` contra o MinIO real | roda no CI (3 shards com MinIO em container) e passou nos PRs #6 e #8; localmente, sem Docker, dois testes falham só no emulador S3 (moto), ver `TEST-PLAN.md` §7 |
