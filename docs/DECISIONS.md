# Decisões

**Curupira** · escolhas difíceis de desfazer, com o porquê e o custo aceito

> Leia antes de decidir para não reabrir o que já foi resolvido. Decisão nova entra no fim.
> Só entra o que cumpre os três critérios: difícil de reverter, surpreendente para quem chega sem
> contexto, e com troca real (`_standards/documentation.md` §5).
> Regra que vale para todo projeto não fica aqui: vai para `_standards/DECISIONS.md` (upstream).
> Decisão ainda aberta fica na issue ou em `.specs/features/<f>/context.md`; fechada, vira linha aqui.

| # | Data | Tema | Decisão | Por quê | Alternativas descartadas | Custo aceito |
|---|---|---|---|---|---|---|
| 1 | 2026-11-01 | Denúncia anônima por padrão | sem `contact`, o servidor não guarda nada sobre quem enviou; o contato é opcional e só o painel o vê | quem denuncia queimada ou lixo na vizinhança se expõe; o medo de retaliação derruba a denúncia | cadastro obrigatório: reduz denúncia; telefone obrigatório: expõe | a gestão não consegue pedir mais detalhes a quem não deixou contato |
| 2 | 2026-11-01 | Protocolo como chave de consulta | código aleatório `CUR-XXXX-XXXX` (alfabeto de 32 símbolos, 2^40 combinações), consulta sem login e com throttle por IP | acompanhar sem conta, o que a anonimato pede | número sequencial: enumerável; e-mail: quebra o anonimato | quem perde o código perde o acompanhamento; a resposta da consulta nunca traz contato, descrição nem foto |
| 3 | 2026-11-01 | Leaflet e OpenStreetMap | `react-leaflet` com tiles do OSM, carregado só no cliente e em chunk lazy | sem chave, sem custo, suficiente para pin e filtros | MapLibre: mais potente, bundle maior; Google Maps: chave e cobrança | uso dos tiles públicos do OSM é limitado; produção pode precisar de provedor de tiles próprio. Lib não coberta pela `_doc-lib`: proposta ao upstream |
| 4 | 2026-11-01 | PWA com fila de denúncia offline | `vite-plugin-pwa` e fila em IndexedDB com reenvio ao voltar a conexão | denúncia de desmatamento nasce onde não há sinal | exigir conexão: perde a denúncia | lib e padrão não cobertos pela `_doc-lib`; iOS limita o service worker |
| 5 | 2026-11-01 | Cronograma calculado no cliente | a API entrega a semana de cada bairro; próximos 14 dias, calendário do mês e `.ics` saem de `lib/` puro | funciona offline e a API não precisa de rota por data | endpoints `next-collection` e `calendar-ics`: mais rotas e nada de offline | feriado e exceção não entram no cálculo; viram aviso publicado pela gestão |
| 6 | 2026-11-01 | Módulo `management` por papel | um módulo de features com ability por papel (operador: ocorrências e avisos; administrador: tudo) | só dois papéis, e as ações são as mesmas | `administrator/` e `operator/` duplicando ações | a ability precisa ser coberta por `authz:check` |
| 7 | 2026-11-01 | Foto sem EXIF e coordenada do campo | o servidor remove EXIF/GPS da foto; a coordenada vem do pin que o morador confirmou | foto de celular carrega a posição exata e o aparelho | confiar no EXIF: vaza dados e erra a posição | processamento de imagem no servidor |
| 8 | 2026-11-01 | Status público só depois de olhado | o mapa público só mostra `IN_REVIEW`, `FORWARDED` e `RESOLVED` | denúncia falsa ou pin errado não aparece antes da equipe ver | mostrar tudo: expõe trote | a denúncia nova não aparece no mapa público até alguém a abrir |

- **Tema** é a decisão como substantivo ("Sessão em Redis"), não a pergunta ("Onde guardar a sessão?").
- **Por quê** traz as forças que pesaram, com número quando houver.
- **Alternativas descartadas** dizem a propriedade que desqualificou cada uma ("não expressa o
  próximo estado"), não um juízo vago ("menos limpo").
- **Custo aceito** é a consequência negativa honesta da escolha. Linha sem custo não foi pensada.

Decisão não se edita nem se apaga: a linha nova diz "substitui #N" e a antiga ganha
"substituída por #M" no Tema.
