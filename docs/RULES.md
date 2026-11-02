# Regras de desenvolvimento

**Curupira** · valem para quem escreve código aqui, pessoa ou agente

> As regras da casa (TypeScript sem `any`/`as`/`!`, SOLID, `Either`, validators, commits) estão em
> `_standards/` e valem integralmente. Este arquivo só **acrescenta** o que é deste projeto.
> Regra que serviria para qualquer projeto vai para `_standards/`, não aqui.

## 1. Antes de mudar

- Ler `docs/MEMORY.md` e a linha da tarefa em `docs/TASKS.md`.
- Mudança pequena, um assunto por commit; todo ajuste vem com teste.
- Procurar o que já existe antes de criar (`_standards/architecture.md` §1, item 10).
- Ler `docs/DECISIONS.md` antes de uma escolha difícil de desfazer.
- Denúncia, protocolo, foto ou mapa: ler `docs/SECURITY.md` §2 antes de tocar.

## 2. O agente não mexe sem perguntar

- Migration que já rodou em produção (cria uma nova).
- Dependência nova, ou troca de versão major.
- Teste que está falhando: investiga, não apaga nem pula.
- `docs/PRD.md` (escopo).
- Variável de ambiente de produção, segredo, configuração de deploy.
- Os secrets de deploy (`COOLIFY_*`) e o `.github/workflows/main-deploy-coolify.yml`; os
  workflows em geral (`.github/workflows/`) e o `dependabot.yml`.
- Contratos de `shared/` (enums, validators, responses): são o contrato dos dois apps e do `openapi.json`;
  mudar um enum ou campo mexe nos três pacotes, na documentação e nos dados em produção.
- As regras de anonimato: denúncia sem `contact` não guarda nada sobre quem enviou; `contact` nunca sai em
  rota pública; as respostas públicas (`showByProtocol`, `publicMap`) mantêm a lista fechada de colunas; o
  mapa público mostra o dia, nunca a hora, e o ponto arredondado a 3 casas decimais (`DECISIONS.md` #17); o
  IP só entra no limiter como HMAC (`LimiterKey`), e o 429 de `/storefront/*` não loga o IP.
- O tratamento da foto: remoção de EXIF no `photo-sanitizer` (50 milhões de pixels, 2 conversões ao mesmo
  tempo), conferência de assinatura em `storage.entity.ts`, tipos aceitos (`REPORT_PHOTO_MIMETYPES`), teto
  `REPORT_PHOTO_MAX_SIZE`, prefixo `report-photos/` da chave e os 3 minutos da URL de envio; a coordenada é a do
  pin, nunca a do EXIF.
- O protocolo: alfabeto, comprimento, gerador `crypto.randomInt`, formato `CUR-XXXX-XXXX` e a normalização.
- Os throttles de `backend/start/limiter.ts` (limites, janelas, `blockFor`), `TRUSTED_PROXIES` (lista validada
  em `core/trusted-proxies.ts`), `COOKIE_DOMAIN`, o nome dos cookies de sessão, o middleware de `Origin`, o CORS e a cadeia `auth()`/`role()` das rotas. Rota que muda de
  papel regrava a linha de base do `authz:check` e pede aprovação.
- A CSP e os cabeçalhos de segurança em `frontend/src/server.ts` e `frontend/src/lib/security-headers.ts`, e a lista de rotas fora do cache do service worker em `frontend/vite.config.ts`.
- Os seeds de bairros (`backend/database/seeders/neighborhood.seed.ts`) e o cronograma de exemplo
  (`backend/database/seeders/demo.seed.ts`): são de exemplo, a prefeitura confere; não trocar por dados "reais" sem fonte.
- Os textos de `/privacidade`, `/termos` e `/sobre` (rascunho a revisar pela prefeitura e pela procuradoria).
- A cor fixa de cada tipo de coleta (`--waste-*`) e o uso exclusivo de laranja e vermelho.
- Os arquivos gerados e commitados: `backend/openapi.json`, `backend/database/schema.ts`,
  `frontend/src/routeTree.gen.ts`; regeram-se pelo comando, não à mão.
- `frontend/src/components/ui/`: território do shadcn, não se edita à mão (variantes próprias levam `// casa:`).

## 3. Regras deste projeto

| Tema | Regra | Por quê |
|---|---|---|
| Anonimato | a denúncia é anônima por padrão; `contact` é opcional e só o painel o lê | quem denuncia se expõe; o medo derruba a denúncia (`DECISIONS.md` #1) |
| Resposta pública | só tipo, situação, data e mensagens da gestão (consulta); id, tipo, situação, ponto aproximado e dia, até 500 (mapa) | evitar que um campo novo vaze por esquecimento |
| Foto | 1 a 3 por denúncia, `jpeg`, `png` ou `webp`, sem EXIF, redimensionada no navegador e reencodada no servidor | privacidade e rede lenta |
| Situação | só avança: `RECEIVED`, `IN_REVIEW`, `FORWARDED`, `RESOLVED`; cada mudança grava um evento com autor e mensagem | histórico confiável para o morador |
| Mapa público | só `IN_REVIEW`, `FORWARDED` e `RESOLVED` | trote ou pin errado não aparece antes da equipe ver |
| Papéis | `ADMINISTRATOR` e `OPERATOR`; o operador não toca cronograma, bairros nem contas; ninguém muda o próprio papel nem se exclui | `SECURITY.md` §4 |
| Fuso | banco e processo em UTC (`TZ=UTC`); a interface mostra `America/Manaus` | a mesma consulta dá a mesma data em qualquer máquina |
| Datas de cronograma | calculadas no cliente a partir de dia da semana e turno | funciona offline (`DECISIONS.md` #5) |
| Cor | tipo de coleta tem cor fixa e sempre vem com ícone e nome; laranja e vermelho só para queimada e erro | acessibilidade e leitura rápida |
| Toque | alvo de 44 px no app do morador | uso com uma mão, no sol, no barco |
| Idiomas | pt-BR é a base; todo texto novo entra em pt-BR, es e en no mesmo commit | fronteira com Peru e Colômbia |
| Mapa | Leaflet só em chunk lazy e só no cliente; nada de `import 'leaflet'` fora de `components/common/report-map` | peso e SSR |
| Fonte de dados do frontend | só a API (`VITE_API_URL`); o dado de exemplo é o seeder de demonstração do backend, ligado por `SEED_DEMO_PASSWORD`; nenhuma chave de ambiente fora do catálogo da régua | os quatro projetos da casa têm as mesmas chaves (`DECISIONS.md` #26) |
| Rotas do frontend | par `rota.tsx` + `rota.lazy.tsx`; nomes das rotas da gestão em inglês, da vitrine em português (`/coleta`, `/denunciar`) | convenção já consolidada |
| Bucket | privado; nunca URL pública; leitura por URL assinada de 15 minutos, download da biblioteca de 5 e envio de foto de denúncia de 3 | `SECURITY.md` |
| Variável de ambiente nova | testada com o valor de produção, não só com o do `.env.example` | `TRUSTED_PROXIES` com `loopback,uniquelocal` quebrou a API (A-01, `MEMORY.md`) |
| Primeiro administrador | `node ace users:create-owner`; o seeder do dono só roda em `development` e `test` | `DECISIONS.md` #24 |
| Enum do `shared` | entra como tipo em módulos que várias rotas alcançam | leitura de valor no topo do módulo cria ciclo de chunk |

## 4. Estrutura

Tela em `frontend/`, regra em `backend/` (entidade em `app/domain/`, operação em
`app/features/<módulo>/<recurso>/<ação>/`), contrato de endpoint, validator e enum em `shared/`;
nada solto na raiz. A árvore é a de `_standards/architecture.md` §3, §4 e §9. O que diverge dela é
desvio e se corrige; regra que não serve muda no `maiyu-pattern` (`documentation.md`, "Quem manda em quê").

## 5. Definição de pronto

- [ ] Lint, typecheck, `pattern:check` e testes rodados no `HEAD` atual, com o resultado à mão
      (critério completo em `TEST-PLAN.md` §6).
- [ ] Teste novo cobre o comportamento e entra na matriz de `TEST-PLAN.md` §3.
- [ ] Estados de carregando, vazio, erro, sem conexão e sucesso tratados na tela (`DESIGN.md` §8, `USER-FLOWS.md`).
- [ ] Texto visível por chave i18n nos três idiomas (`_standards/i18n.md`).
- [ ] `openapi.json` e a linha de base do `authz:check` regravados se a rota mudou.
- [ ] `docs/` atualizado no mesmo commit (`_standards/documentation.md` §5).
- [ ] Sem segredo, `console.log`, código comentado ou `TODO` sem dono no diff.

## Histórico

| Data | Mudança |
|---|---|
| 2026-11-01 | Primeira versão, a partir do código do backend, do frontend e do `shared/` |
| 2026-11-01 | Ajustada ao código depois da auditoria de segurança e do polimento de design |
