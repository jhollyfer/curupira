# Frontend: instruções para agentes

TanStack Start + Nitro. A régua é `../_standards/` (`frontend.md`, `i18n.md`, `typescript.md`,
`solid.md` e `tooling.md`); o contrato das bibliotecas, `../_doc-lib/`. Regras e contexto do produto:
`../AGENTS.md` e `../docs/`.

## Comandos

- `pnpm dev` sobe em `http://localhost:3000` (dados de exemplo, sem backend).
- `pnpm check`: Paraglide, lint, typecheck e Prettier (`tooling.md` §7).
- `pnpm test:unit`: Vitest. `pnpm test:e2e`: Playwright (esqueleto em `e2e/report-flow.spec.ts`).
- `pnpm build`, depois `pnpm check-cycles`.
- `pnpm format` reescreve com Prettier e `eslint --fix`.
- `routeTree.gen.ts` é regerado pelo plugin do Router (`pnpm dev` ou `pnpm build`), nunca à mão.
- `node scripts/generate-icons.mjs`: favicon, ícones do manifesto e `og-image.png` a partir de `public/favicon.svg`.

## Mapa da base

| O quê                                                       | Onde                                                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guarda do painel (sessão, `account` no contexto da rota)    | `src/routes/_private/layout.tsx` (a guarda de sessão e o shell: sidebar, cabeçalho, trilha)                                                                                                     |
| Visão geral do painel                                       | `src/routes/_private/gestao/index.tsx` + `index.lazy.tsx`                                                                                                                                       |
| Entrada                                                     | `src/routes/_authentication/` (`/sign-in`, `?redirect=` validado, guarda inversa)                                                                                                               |
| Tokens (cores, `--waste-*`, status, raio, camadas)          | `src/styles.css`                                                                                                                                                                                |
| Kit de painel já trazido do interclasse                     | `components/common/{page-shell,form-shell,empty-state,submit-button,input-password,not-found-page,theme-toggle,locale-switch}`; `components/ui/` (inclui `sidebar`, `table`, `sheet`, `dialog`) |
| Peças do domínio, reutilizáveis                             | `components/common/{status-badge,status-timeline,notice-list,waste-calendar,neighborhood-picker,report-kind-picker,report-map,step-wizard,prose-page}`                                          |
| Form                                                        | `integrations/react-hook-form/app-field.tsx`, `hooks/use-mutation-form.ts`, `lib/form-errors.ts`, `lib/form-a11y.ts`                                                                            |
| Chaves de cache                                             | `hooks/tanstack-query/_query-keys.ts` (seção `management` já aberta)                                                                                                                            |
| Queries e mutations do público                              | `integrations/tanstack-query/{queries,mutations}/storefront.ts`                                                                                                                                 |
| Sessão                                                      | `queries/account.ts`, `mutations/authentication.ts`, `hooks/use-sign-out.ts`                                                                                                                    |
| HTTP (cookie, refresh, `X-`/`Accept-Language`, erro tipado) | `integrations/tanstack-query/http.ts`                                                                                                                                                           |
| Rótulos de enum e ícones de enum                            | `lib/labels.ts`, `lib/icons.ts`                                                                                                                                                                 |
| Listagem na URL                                             | `lib/list-search.ts` (`ListSearch`, `withExtra`, `queryString`)                                                                                                                                 |
| Dados de exemplo                                            | `src/data/{neighborhoods,schedules,notices,reports}.ts`                                                                                                                                         |

Lixeira e upload de imagem do interclasse **não** foram trazidos (o painel não tem nenhum dos dois).

## O painel da gestão (`/gestao`)

Rotas em `src/routes/_private/gestao/`, em par `rota.tsx` + `rota.lazy.tsx`, nomes em inglês:

| Rota                                          | Quem entra     | O que é                                                                                                         |
| --------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `/gestao`                                     | os dois papéis | visão geral: atalho das "Recebidas", contagens por status e tipo, gráfico dos últimos 30 dias (SVG próprio)     |
| `/gestao/reports`, `reports/$id`              | os dois papéis | mapa + tabela do mesmo recorte (`reportsFilterOf`), detalhe, mudança de status só para frente + resposta        |
| `/gestao/notices` (+ `new`, `$id/edit`)       | os dois papéis | avisos: criar, agendar, encerrar, excluir; filtro por situação                                                  |
| `/gestao/schedules`                           | administrador  | grade semanal por bairro (tipo x dia), criar/editar/excluir em diálogo; 409 de slot repetido no campo `weekday` |
| `/gestao/neighborhoods` (+ `new`, `$id/edit`) | administrador  | bairros com ponto opcional escolhido no mapa                                                                    |
| `/gestao/users` (+ `new`, `$id/edit`)         | administrador  | contas da gestão (papel, situação, senha)                                                                       |
| `/gestao/account/profile`                     | os dois papéis | o próprio perfil e a troca de senha                                                                             |

- **Capacidade por área**: `lib/capabilities.ts` é a tabela única (guarda e menu leem dela). Cada área
  restrita tem o próprio `layout.tsx` com `requireCapability` (`_private/-components/require-capability.ts`).
  O backend continua sendo quem autoriza (403); o front só redireciona e esconde o link.
- **Listagens**: `_private/-components/list-page.tsx` (esqueleto), `common/table` (TanStack Table sem features
  de cliente, ordenação e paginação na URL), `common/option-select`, `search-filter.tsx`. Filtros em `lib/management-search.ts`,
  validados à mão. `reportsFilterOf` é o único lugar que separa filtro de página/ordem, e é o que garante mapa e tabela no mesmo recorte.
- **Regras puras testadas em `lib/`**: `report-status.ts` (só avança), `schedule-grid.ts`, `report-stats.ts` (30 dias,
  zeros incluídos), `datetime-field.ts` (hora de Benjamin Constant no `datetime-local`), `capabilities.ts`, `breadcrumbs.ts`.
- **Dados**: `integrations/tanstack-query/{queries,mutations}/management.ts`, com `fromSource({ mock, api })`. Mocks em
  `src/data/management/` (um `store.ts` em memória, com os mesmos 409/422 da API). Invalidação por
  `queryKeys.management.*` + `DEPENDENTS` (mudar status ou aviso na gestão invalida também o que o público lê).
  No modo mock o público e o painel têm bases separadas: mudar um status no painel não altera o `/acompanhar` de exemplo.
- **Entrar no painel sem backend**: com `VITE_DATA_SOURCE=mock` **e** `pnpm dev`, a tela de entrada mostra as
  "contas de exemplo" (administrador e operador, senha `Exemplo@2026`, em `data/management/session.ts`). A sessão é o
  cookie `curupira-mock-session`, lido também no SSR. Tudo passa por `import.meta.env.DEV`: o build de produção
  (mesmo com `mock`, que é o padrão) não tem contas e responde 401. Nunca remover essa guarda.
- **E2E**: `e2e/management-flow.spec.ts` (projeto `desktop`); credenciais em `e2e/support/credentials.ts`
  (`E2E_OWNER_*`, `E2E_OPERATOR_*`, ver `.env.e2e.example`).

## Dados de exemplo e a API

`VITE_DATA_SOURCE=mock` (padrão) serve `src/data/*`; `api` fala com `VITE_API_URL`. O ponto de troca é
**um só**: `integrations/tanstack-query/source.ts` (`fromSource({ mock, api })`). Cada `queryFn`/`mutationFn`
do público escreve os dois corpos; as telas só veem `queryOptions`. Os caminhos do corpo `api`
(`/storefront/neighborhoods`, `/storefront/schedules`, `/storefront/notices`, `/storefront/reports/map`,
`/storefront/reports/:protocol`, `POST /storefront/reports`, `POST /storefront/report-photos`,
`/authentication/sessions`, `/account`) seguem os módulos do `@curupira/shared` e **precisam ser conferidos
contra o OpenAPI do backend** na primeira troca. Listagens de bairros e avisos assumem o envelope paginado.

## Regras deste app

- **A cor de cada tipo de lixo é fixa** (`--waste-organic|recyclable|bulky|debris`, classe `.waste-*`) e
  nunca vem acompanhada só de cor: ícone e nome vão junto (`lib/icons.ts`, `WasteDot`). Laranja e vermelho
  são só de queimada e de status.
- **Alvo de toque de 44px**: `Button` `size="touch" | "touch-lg" | "icon-touch"` (variantes `// casa:`).
- **Mapa**: Leaflet só em chunk lazy e só no cliente (`components/common/report-map`); nada de `import 'leaflet'`
  fora dele. Biblioteca fora da `_doc-lib`.
- **Offline**: a denúncia sem sinal vai para a fila em IndexedDB (`lib/report-queue.ts`) e é reenviada pelo
  `ReportQueueSync` do layout público. O service worker é do `vite-plugin-pwa` (precache só do leve; chunks
  entram em cache no primeiro uso).
- Datas pelo Luxon, sempre em `America/Manaus` (`lib/i18n.ts`); "agora" vem do `loader` como texto.
- Enum do `@curupira/shared` entra como **tipo** em módulos alcançados por várias rotas (`lib/schedule.ts`,
  `lib/labels.ts`, `lib/search.ts`): leitura em runtime no topo do módulo cria ciclo de chunk.
