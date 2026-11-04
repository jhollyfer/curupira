# Frontend: instruções para agentes

TanStack Start + Nitro. A régua é `../_standards/` (`frontend.md`, `i18n.md`, `typescript.md`,
`solid.md` e `tooling.md`); o contrato das bibliotecas, `../_doc-lib/`. Regras e contexto do produto:
`../AGENTS.md` e `../docs/`.

## Comandos

- `pnpm dev` sobe em `http://localhost:3000` (dados de exemplo, sem backend).
- `pnpm check`: Paraglide, lint, typecheck e Prettier (`tooling.md` §7).
- `pnpm test:unit`: Vitest. `pnpm test:e2e`: Playwright (`e2e/*.spec.ts`; projetos `setup`, `mobile`, `tablet` e `desktop` em `e2e/playwright.config.ts`; rode um projeto por vez, `--project=mobile`).
- `pnpm build`, depois `pnpm check-cycles`.
- `pnpm format` reescreve com Prettier e `eslint --fix`.
- `routeTree.gen.ts` é regerado pelo plugin do Router (`pnpm dev` ou `pnpm build`), nunca à mão.
- `node scripts/generate-icons.mjs`: favicon, ícones do manifesto e `og-image.png` a partir de `public/favicon.svg`.

## Mapa da base

| O quê                                                       | Onde                                                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guarda do painel (sessão, `account` no contexto da rota)    | `src/routes/_private/layout.tsx` (a guarda de sessão e o shell: sidebar, cabeçalho, trilha)                                                                                                     |
| Visão geral do painel                                       | `src/routes/_private/management/index.tsx` + `index.lazy.tsx`                                                                                                                                   |
| Entrada                                                     | `src/routes/_authentication/` (`/sign-in`, `?redirect=` validado, guarda inversa)                                                                                                               |
| Tokens (cores, `--waste-*`, status, raio, camadas)          | `src/styles.css`                                                                                                                                                                                |
| Layout do morador (container, gutter, tipografia fluida)    | `page-container*` e `--page-gutter` em `src/styles.css`; `routes/_public/-components/{header,bottom-nav,menu,home-page}.tsx` (`NAV_ITEMS` alimenta barra inferior e cabeçalho)                  |
| Alvo de 44px no painel                                      | classe `.panel-touch` em `src/styles.css` (celular ou ponteiro de toque); `lib/dialog-layout.ts` (`PHONE_SHEET_CLASSES`, diálogo como folha inferior no celular)                                |
| Tabela no celular (lista de cartões)                        | `components/common/table/table-cards.tsx`, mesma definição de colunas da grade via `meta.card` (`table-meta.d.ts`)                                                                              |
| Filtros de listagem (folha no celular)                      | `routes/_private/-components/filter-panel.tsx`; contagem em `lib/active-filters.ts`                                                                                                             |     |
| Kit de painel já trazido do interclasse                     | `components/common/{page-shell,form-shell,empty-state,submit-button,input-password,not-found-page,theme-toggle,locale-switch}`; `components/ui/` (inclui `sidebar`, `table`, `sheet`, `dialog`) |
| Peças do domínio, reutilizáveis                             | `components/common/{status-badge,status-timeline,notice-list,waste-calendar,neighborhood-picker,report-kind-picker,report-map,step-wizard,prose-page}`                                          |
| Form                                                        | `integrations/react-hook-form/app-field.tsx`, `hooks/use-mutation-form.ts`, `lib/form-errors.ts`, `lib/form-a11y.ts`                                                                            |
| Chaves de cache                                             | `hooks/tanstack-query/_query-keys.ts` (seção `management` já aberta)                                                                                                                            |
| Queries e mutations do público                              | `integrations/tanstack-query/{queries,mutations}/storefront.ts`                                                                                                                                 |
| Sessão                                                      | `queries/account.ts`, `mutations/authentication.ts`, `hooks/use-sign-out.ts`                                                                                                                    |
| HTTP (cookie, refresh, `X-`/`Accept-Language`, erro tipado) | `integrations/tanstack-query/http.ts`                                                                                                                                                           |
| Rótulos de enum e ícones de enum                            | `lib/labels.ts`, `lib/icons.ts`                                                                                                                                                                 |
| Listagem na URL                                             | `lib/list-search.ts` (`ListSearch`, `withExtra`, `queryString`)                                                                                                                                 |
| Cabeçalhos de segurança (CSP com o bucket)                  | `src/server.ts`, `lib/security-headers.ts`                                                                                                                                                      |

Lixeira e upload de imagem do interclasse **não** foram trazidos (o painel não tem nenhum dos dois).

## O painel da gestão (`/management`)

Rotas em `src/routes/_private/management/`, em par `rota.tsx` + `rota.lazy.tsx`, nomes em inglês:

| Rota                                              | Quem entra     | O que é                                                                                                         |
| ------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `/management`                                     | os dois papéis | visão geral: atalho das "Recebidas", contagens por status e tipo, gráfico dos últimos 30 dias (SVG próprio)     |
| `/management/reports`, `reports/$id`              | os dois papéis | mapa + tabela do mesmo recorte (`reportsFilterOf`), detalhe, mudança de status só para frente + resposta        |
| `/management/notices` (+ `new`, `$id/edit`)       | os dois papéis | avisos: criar, agendar, encerrar, excluir; filtro por situação                                                  |
| `/management/schedules`                           | administrador  | grade semanal por bairro (tipo x dia), criar/editar/excluir em diálogo; 409 de slot repetido no campo `weekday` |
| `/management/neighborhoods` (+ `new`, `$id/edit`) | administrador  | bairros com ponto opcional escolhido no mapa                                                                    |
| `/management/users` (+ `new`, `$id/edit`)         | administrador  | contas da gestão (papel, situação, senha)                                                                       |
| `/management/account/profile`                     | os dois papéis | o próprio perfil e a troca de senha                                                                             |

- **Capacidade por área**: `lib/capabilities.ts` é a tabela única (guarda e menu leem dela). Cada área
  restrita tem o próprio `layout.tsx` com `requireCapability` (`_private/-components/require-capability.ts`).
  O backend continua sendo quem autoriza (403); o front só redireciona e esconde o link.
- **Listagens**: `_private/-components/list-page.tsx` (esqueleto), `common/table` (TanStack Table sem features
  de cliente, ordenação e paginação na URL), `common/option-select`, `search-filter.tsx`. Filtros em `lib/management-search.ts`,
  validados à mão. `reportsFilterOf` é o único lugar que separa filtro de página/ordem, e é o que garante mapa e tabela no mesmo recorte.
- **Regras puras testadas em `lib/`**: `report-status.ts` (só avança), `schedule-grid.ts`, `report-stats.ts` (30 dias,
  zeros incluídos), `datetime-field.ts` (hora de Benjamin Constant no `datetime-local`), `capabilities.ts`, `breadcrumbs.ts`.
- **Dados**: `integrations/tanstack-query/{queries,mutations}/management.ts`, direto na API (`request()`/`send()`).
  Invalidação por `queryKeys.management.*` + `DEPENDENTS` (mudar status ou aviso na gestão invalida também o que o
  público lê).
- **Entrar no painel**: a API precisa estar de pé e semeada (`SEED_OWNER_PASSWORD` e, para a demonstração,
  `SEED_DEMO_PASSWORD`, no `backend/.env`); a demonstração dá `administrator@example.com` e `operator@example.com` com
  a `SEED_DEMO_PASSWORD`. Não há conta de exemplo no frontend.
- **Responsivo**: abaixo de 768 px (`useIsMobile`) a sidebar é gaveta, a tabela vira cartões, os filtros viram
  `FilterPanel` e o cronograma vira lista por dia; abaixo de 1024 px a sidebar começa recolhida em trilho.
  Controle novo no painel herda os 44 px por `.panel-touch`; listagem nova passa `meta.card` nas colunas.
- **E2E**: `auth.setup.ts` grava a sessão de cada papel em `e2e/.auth/`; `report-flow`, `management-flow`, `responsive.spec` (todas as telas, rolagem lateral, axe, tema claro e escuro) rodam nos três projetos de viewport e `touch-targets.spec` só no `mobile`. Credenciais em `e2e/support/credentials.ts`
  (`E2E_BASE_URL`, `E2E_API_URL`, `E2E_OWNER_*`, `E2E_DEMO_PASSWORD`, ver `.env.e2e.example`). Cada projeto denuncia e o limite é de 10 por hora por IP: entre um projeto e outro, local, esvazie `rate_limits`.

## Dados e a API

O frontend fala só com a API (`VITE_API_URL`); não há modo de dados de exemplo (`DECISIONS.md` #26). Cada
`queryFn`/`mutationFn` chama `request()`/`send()` e as telas só veem `queryOptions`. Os caminhos
(`/storefront/neighborhoods`, `/storefront/schedules`, `/storefront/notices`, `/storefront/reports/map`,
`/storefront/reports/:protocol`, `POST /storefront/reports`, `POST /storefront/report-photos`,
`/authentication/sign-in`, `/account`) seguem os módulos do `@curupira/shared` e o OpenAPI do backend. O dado de
exemplo é o seeder de demonstração do backend. Ambiente: só as chaves do catálogo da régua (`docs/ENV.md` §1.2); a CSP
lê `STORAGE_PUBLIC_URL` por requisição em `src/server.ts`, nunca no build.

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
