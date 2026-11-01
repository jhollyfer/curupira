# Design system

**Curupira** · institucional, acolhedor, legível no celular

> Registra a **decisão**: que valor, por quê, onde usar. O valor que o código lê mora no tema
> (`frontend/src/styles.css`, `frontend/components.json`); componente usa token semântico, nunca hex nem
> valor arbitrário em classe (`_standards/frontend.md` §6). Token mudou aqui, muda no tema no mesmo commit.
> Os anti-padrões que valem para todo projeto estão em `_standards/frontend.md` §10.8; aqui só se aponta.

## 1. Visão geral

- Direção: serviço público confiável e próximo. Verde de floresta como cor principal, superfícies
  claras com um leve tom de verde, cantos arredondados, texto grande e frase curta. A interface fala com
  quem tem pouca familiaridade com aplicativo e, muitas vezes, rede fraca.
- Modo dominante: **Operar** no painel da gestão (padrão familiar de tabela, filtro e formulário) e
  **Convencer e guiar** na parte do morador (poucos passos, um botão principal por tela).
- Tema: claro e escuro. O tema vem de cookie lido no servidor (`integrations/theme/get-theme.ts`), sem
  flash; classe `.dark` na raiz. O `ThemeToggle` está no cabeçalho.
- Idiomas: pt-BR, es e en; todo texto visível por chave de mensagem.
- Cor nunca carrega sentido sozinha: tipo de coleta, situação e tipo de denúncia vão com ícone e nome.

## 2. Cores

Dois níveis: o tema do shadcn (semântico) e tokens do domínio. Componente só consome o semântico; o
escuro redefine só o semântico. Valores em OKLCH, de `frontend/src/styles.css`.

| Token semântico | Claro | Escuro | Papel |
|---|---|---|---|
| `primary` (`--field`) | `oklch(0.44 0.1 155)` | `oklch(0.74 0.15 152)` | ação principal e marca; no máximo uma ação `default` por área |
| `secondary` | `oklch(0.94 0.025 150)` | `oklch(0.27 0.035 158)` | ação secundária |
| `accent` | `oklch(0.93 0.035 150)` | `oklch(0.29 0.045 156)` | item selecionado, hover de menu |
| `destructive` | `oklch(0.5 0.2 27)` | `oklch(0.72 0.17 25)` | erro e ação que apaga |
| `background` | `oklch(0.985 0.006 150)` | `oklch(0.17 0.025 158)` | fundo da página |
| `card`, `popover` | `oklch(1 0 0)` | `oklch(0.21 0.03 158)` | superfície elevada |
| `foreground` | `oklch(0.22 0.03 158)` | `oklch(0.96 0.012 150)` | texto principal |
| `muted-foreground` | `oklch(0.42 0.03 155)` | `oklch(0.76 0.025 152)` | texto de apoio |
| `border`, `input` | `oklch(0.89 0.015 150)`, `oklch(0.78 0.02 150)` | `oklch(1 0 0 / 12%)`, `oklch(1 0 0 / 28%)` | contorno de card e de campo |
| `ring` | `oklch(0.55 0.14 155)` | `oklch(0.74 0.15 152)` | anel de foco |
| `stage` (`--stage`, `-foreground`, `-muted`) | `oklch(0.27 0.055 158)` | `oklch(0.2 0.04 158)` | faixa verde escura (`.stage-band`) para destaque e convite à denúncia |
| `alert` | `oklch(0.55 0.17 45)` | `oklch(0.72 0.16 50)` | **só** queimada (tipo de denúncia) e situação de alerta |

Cores fixas por tipo de coleta (nunca mudam de tipo para tipo, nem entre telas), com classe `.waste-*`
e `WasteDot`:

| Tipo | Token | Claro | Escuro |
|---|---|---|---|
| Orgânico | `--waste-organic` | `oklch(0.48 0.075 62)` (marrom) | `oklch(0.7 0.09 65)` |
| Reciclável | `--waste-recyclable` | `oklch(0.5 0.14 245)` (azul) | `oklch(0.72 0.12 245)` |
| Volumoso | `--waste-bulky` | `oklch(0.48 0.14 300)` (roxo) | `oklch(0.72 0.13 300)` |
| Entulho | `--waste-debris` | `oklch(0.66 0.13 92)` (amarelo escuro) | `oklch(0.8 0.13 95)` |

Cada um tem `--waste-*-foreground`. Laranja e vermelho **não** servem para tipo de lixo: ficam para
queimada (`alert`) e para erro (`destructive`).

Situação da denúncia (`StatusBadge`, variantes de `Badge`, pares `--badge-*` e `--badge-*-fg`):

| Situação | Variante | Ícone |
|---|---|---|
| Recebida | `neutral` | de `REPORT_STATUS_ICONS` |
| Em análise | `warning` | idem |
| Encaminhada | `info` | idem |
| Resolvida | `success` | idem |

Gráficos usam `--chart-1` a `--chart-5`. Contraste (AA): texto 4,5:1, texto grande e componente 3:1, nos
dois temas. Os pares `*-foreground` foram escolhidos para isso; a conferência com ferramenta e a data
estão pendentes (`TASKS.md` 5.3).

## 3. Tipografia

Família única: **Figtree Variable** (`@fontsource-variable/figtree`, peso variável), com fallback
`Figtree Fallback` (Arial com `size-adjust` e `ascent-override`) para a troca de fonte não mover a página.
`--font-sans` e `--font-display` apontam para a mesma família. `font-synthesis: none`.

O projeto não declara uma escala de tokens de texto; o tamanho vem das classes de texto do Tailwind e do
componente. Tokens de texto próprios: `--text-error-code` (7rem) e `--text-error-code-lg` (9rem), para a
página de erro, e `--leading-display` (1.05). `--heading-tight` (-0.02em) e `--heading-tighter`
(-0.03em) são os espaçamentos de título.

Corpo nunca abaixo de 16 px; prosa (`ProsePage`, `/sobre`, `/privacidade`, `/termos`) com medida limitada;
número em coluna com `tabular-nums`.

## 4. Layout

- Celular primeiro: base sem prefixo, camadas em `md:`/`lg:`. Barra de navegação inferior no celular
  (`BottomNav`) e cabeçalho com os mesmos destinos no desktop; os dois leem `NAV_ITEMS`.
- Painel: `Sidebar` e `SidebarInset` do shadcn; abaixo do breakpoint de tablet, a barra lateral vira `Sheet`.
- `--space-section`: `clamp(3rem, 7vw, 6rem)`, espaço entre seções da página pública (único `clamp`).
- Grades nomeadas em `@utility` (`grid-cols-main-aside`, `grid-cols-agenda`...), sem valor solto em classe.
- Sem rolagem horizontal da página a 320 px; uso a 200% de zoom.

## 5. Elevação e camadas

- Sombra por papel: `--shadow-card`, `--shadow-card-hover`, `--shadow-card-elevated` (no escuro, sombra
  mais funda e contorno claro de 6 a 8%).
- Camadas nomeadas: `dropdown` (40) acima de `sticky` (10), `overlay` (20), `modal` (30); depois `toast`
  (50) e `tooltip` (60). Utilitários `z-sticky`, `z-overlay`, `z-modal`, `z-dropdown`, `z-toast`,
  `z-tooltip`, nunca `z-50` solto.

## 6. Formas

`--radius: 0.875rem`; `sm`, `md`, `lg`, `xl` e `2xl` derivam dele (-6px, -4px, 0, +4px, +8px). Botão de
toque usa `rounded-xl`. Cantos arredondados em toda a interface; pílula só em badge.

## 7. Componentes

Vêm de `components/ui/` (shadcn estilo `base-mira`, Base UI; variantes próprias marcadas `// casa:`) e do
kit `components/common/`, em compound (`_standards/frontend.md` §8).

| Componente | Variantes e regra |
|---|---|
| `Button` | `default`, `secondary`, `outline`, `ghost`, `destructive`; tamanhos de toque `touch`, `touch-lg`, `icon-touch` (44 px) para o app do morador; `destructive` só na ação que apaga |
| `Badge` | `neutral`, `info`, `success`, `warning`, `alert`; sempre com rótulo |
| `Input`, `Textarea`, `NativeSelect`, `Combobox`, `Field` | rótulo visível acima; erro abaixo, ligado por `aria-describedby`; `InputPassword` com mostrar/ocultar |
| `ConfirmDialog` | só para ação irreversível (excluir) |
| `Dialog`, `Sheet`, `AlertDialog` | modal não é primeira opção; o diálogo de cronograma e o `Sheet` da barra lateral |
| `Table`, `Pagination` | TanStack Table sem recurso de cliente; ordenação e página na URL |
| `Sonner` | toast curto de sucesso e erro |

Kit comum (`components/common/`, cada um com pasta, `index.ts` e partes em compound):

| Componente | Para que serve |
|---|---|
| `WasteCalendar` | calendário do mês e faixa de 14 dias, com `WasteDot` por tipo |
| `NeighborhoodPicker` | escolha do bairro, guardada no aparelho |
| `ReportKindPicker` | cartões grandes dos quatro tipos; só queimada recebe a cor `alert` |
| `StepWizard` | os 3 passos da denúncia, com barra de progresso e voltar |
| `ReportMap` | Leaflet em chunk lazy, só no cliente: pins, pins selecionáveis e seletor de ponto; pin preso à caixa do município |
| `StatusBadge`, `StatusTimeline` | situação e linha do tempo da denúncia |
| `NoticeList` | avisos ativos |
| `PageShell`, `FormShell`, `ProsePage`, `EmptyState`, `NotFoundPage`, `SubmitButton` | esqueletos e estados |
| `Table`, `OptionSelect`, `RowActions`, `ConfirmDialog` | listagem do painel |
| `BrandMark`, `ThemeToggle`, `LocaleSwitch`, `ThemeProvider` | marca, tema e idioma |

Estados de todo controle: padrão, hover, `focus-visible`, active, disabled, loading, erro.

## 8. Estados de tela

| Estado | Como aparece |
|---|---|
| Carregando | esqueleto (`Skeleton`) com a forma do conteúdo; `Spinner` no botão que enviou e na tela do painel antes de montar |
| Vazio | `EmptyState` por motivo: primeiro uso (o que vai aparecer e a ação), filtro sem resultado, bairro sem cronograma |
| Erro | mensagem que diz o que houve e como seguir; `ErrorBoundary` por bloco; 404 de painel e de site com `NotFoundPage` |
| Sem conexão | faixa `ConnectionStatus`: "Sem conexão. O cronograma continua disponível e a denúncia fica salva no aparelho." |
| Pendente de envio | contagem das denúncias na fila e aviso enquanto são enviadas |
| Sucesso | toast curto; na denúncia, tela com o protocolo `CUR-XXXX-XXXX` |

Ilustração de estado vazio: ícone Phosphor, sem ilustração.

## 9. Movimento

- Curvas: `--ease-out-expo` e `--ease-out-quart`; feedback curto, saída mais curta que a entrada.
- Anima só `transform` e `opacity`; nunca `transition: all`. O botão afunda com `scale-press` (0,97).
- `prefers-reduced-motion`: `styles.css` encurta toda animação e transição para 0,01 ms por uma regra global
  em `*`. A régua pede `motion-reduce:` por componente e manter o feedback de ação
  (`_standards/frontend.md`); a regra global é um desvio a corrigir.

## 10. Acessibilidade

- Meta: WCAG 2.1 AA. O E2E roda axe em cada tela (`frontend/e2e/support/test.ts`, falha em violação grave
  ou crítica); a revisão final está em `TASKS.md` 5.3.
- Foco visível em todo interativo, anel `--ring`; link "pular para o conteúdo" (`.skip-link`).
- Alvo de toque de 44 px no app do morador (`size-11` ou `h-11`; token `--spacing-touch: 2.75rem`);
  hover nunca é o único caminho.
- Ícones Phosphor, uma família; botão só de ícone tem `aria-label` por chave de mensagem; ícone decorativo
  com `aria-hidden`.
- Formulários: `aria-invalid` e `aria-describedby` do erro (`lib/form-a11y.ts`); erros em `role="alert"`.
- Mapa: tudo que o mapa mostra também está na lista ou na tabela; o seletor de ponto aceita GPS e arraste.
- Rede lenta: nenhuma imagem para o primeiro desenho (a faixa verde é gradiente de token), fonte variável com
  fallback ajustado, Leaflet só quando a tela precisa, foto reduzida a 1600 px antes do envio.
- PWA: `manifest.webmanifest` em pt-BR (`display: standalone`, `theme_color #1f6b3d`, atalhos "Fazer denúncia",
  "Cronograma da coleta" e "Acompanhar denúncia"), ícones de 192, 512 e maskable; service worker com cache
  descrito em `ARCHITECTURE.md` §6.2.
- Datas sempre em `America/Manaus`.

## 11. Fazer / não fazer

| Fazer | Não fazer |
|---|---|
| ícone e nome junto da cor de tipo e de situação | cor como única pista |
| um botão principal por tela do morador, em verde | dois botões de destaque lado a lado |
| laranja só para queimada | laranja ou vermelho em tipo de lixo |
| frase curta, verbo no início do botão ("Enviar denúncia") | texto técnico, sigla sem explicação |
| mostrar o que ficou salvo no aparelho quando falta sinal | deixar o envio falhar em silêncio |
| `ReportMap` por chunk lazy | `import 'leaflet'` fora do kit |
| enum do `shared` importado como tipo em módulos de várias rotas | leitura de valor do enum no topo do módulo (ciclo de chunk) |

## 12. Referências

| Referência | Onde | O que se tirou | Data |
|---|---|---|---|
| Interclasse (painel de gestão do mesmo dono) | repositório `interclasse` | esqueleto de painel: `PageShell`, `FormShell`, listagem, formulário, tema e troca de idioma | 2026-11-01 |
| Calendário de coleta (guia de UI) | | calendário do mês com bolinhas por tipo e lembrete (lembrete fica fora do MVP) | 2026-11-01 |

Componentes trazidos de fora (21st.dev, React Bits): Não se aplica: nenhum.
