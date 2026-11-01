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

## Mapa da base (para quem constrói o painel `/gestao`)

| O quê                                                       | Onde                                                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guarda do painel (sessão, `account` no contexto da rota)    | `src/routes/_private/layout.tsx` (esqueleto: só `Outlet`; o shell do painel entra aqui)                                                                                                         |
| Porta do painel (placeholder)                               | `src/routes/_private/gestao/index.tsx` + `index.lazy.tsx`                                                                                                                                       |
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

Tabela (`common/table`), lixeira e upload de imagem do interclasse **não** foram trazidos: entram quando o
painel precisar, do mesmo molde.

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
