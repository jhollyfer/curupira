# Documento de requisitos

**Curupira** · serviço público de Benjamin Constant/AM para consultar a coleta de lixo, denunciar crimes ambientais com foto e mapa, e dar à gestão um painel para responder

| Versão | Status | Data | Dono do produto | Meta |
|---|---|---|---|---|
| 1.0 | Rascunho | 2026-11-01 | Jhollyfer Rodrigues | Primeira versão em produção, com bairros e cronograma conferidos pela prefeitura |

> Escopo é decisão do dono do produto. O agente não altera este arquivo sem pedido; viu
> contradição entre a tarefa e o PRD, pergunta.

## 1. Problema

Muitos moradores não sabem em que dia a coleta passa no seu bairro, e o lixo vai para a rua fora de hora. Também não têm um canal seguro para denunciar queimadas, descarte irregular de lixo e desmatamento: quem denuncia se expõe, e a denúncia some sem resposta. A gestão não tem um lugar único para receber, localizar e responder as ocorrências.

## 2. Para quem

| Perfil | Quem é | O que precisa |
|---|---|---|
| Morador | qualquer pessoa do município, inclusive com pouca familiaridade com aplicativos, no celular, às vezes sem sinal | saber quando a coleta passa; denunciar sem se expor; acompanhar o andamento |
| Operador | equipe de campo e de atendimento da prefeitura | ver as ocorrências no mapa e na lista, mudar o status e registrar resposta; publicar avisos |
| Administrador | chefia da gestão | tudo do operador, mais cronograma, bairros e contas |

## 3. Objetivos

- Todo morador responde "quando passa a coleta no meu bairro?" em até 2 toques depois de escolher o bairro uma vez.
- Uma denúncia com foto e localização é enviada em até 3 passos, anônima por padrão, inclusive sem sinal (fila local).
- Toda denúncia tem protocolo e status visível ao denunciante sem login.
- A gestão enxerga as ocorrências por tipo, bairro, status e período, num mapa e numa tabela.

## 4. Primeira versão (MVP)

| # | Funcionalidade | Para quem | Fluxo |
|---|---|---|---|
| 1 | Escolher o bairro e ver a próxima coleta e os próximos 14 dias | morador | `USER-FLOWS.md#proxima-coleta` |
| 2 | Calendário do mês por tipo de coleta, com exportação `.ics` | morador | `USER-FLOWS.md#cronograma-do-mes` |
| 3 | Denúncia em 3 passos com foto, mapa, anonimato e fila offline | morador | `USER-FLOWS.md#nova-denuncia` |
| 4 | Acompanhar a denúncia por protocolo | morador | `USER-FLOWS.md#acompanhar-denuncia` |
| 5 | Mapa público das ocorrências em andamento e resolvidas | morador | `USER-FLOWS.md#mapa-publico` |
| 6 | Avisos da prefeitura na home | morador | `USER-FLOWS.md#proxima-coleta` |
| 7 | Visão geral, ocorrências (mapa, tabela, detalhe, status e resposta) | operador, administrador | `USER-FLOWS.md#tratar-ocorrencia` |
| 8 | Cronograma e bairros | administrador | `USER-FLOWS.md#manter-cronograma` |
| 9 | Avisos: criar, agendar e encerrar | operador, administrador | `USER-FLOWS.md#publicar-aviso` |
| 10 | Contas da gestão | administrador | `USER-FLOWS.md#entrar-no-painel` |

## 5. Fica de fora (nesta versão)

- Notificação push e lembrete na noite anterior: exige serviço de push e consentimento; volta depois do MVP.
- Cadastro de morador: o app é anônimo de propósito.
- Retorno ao denunciante por e-mail ou telefone: o contato é guardado, mas o envio é manual pela equipe.
- Camadas de focos de calor (INPE) no mapa da gestão: ideia futura.
- Pagamento, cobrança, qualquer dado financeiro.

## 6. Requisitos não funcionais

| Tema | Requisito |
|---|---|
| Desempenho | home usável em rede lenta; mapa e Leaflet carregam só quando a tela precisa |
| Disponibilidade | cronograma do bairro escolhido e envio de denúncia funcionam sem sinal (PWA) |
| Acessibilidade | WCAG 2.1 AA; toque grande; linguagem simples |
| Dispositivos | celular primeiro no app do morador; painel responsivo do celular ao monitor largo (`DESIGN.md` §4) |
| Idiomas | pt-BR (base), es e en, pela fronteira com Peru e Colômbia |
| Dados pessoais | denúncia anônima por padrão; contato só se o morador deixar, visível só ao painel; foto sem EXIF; detalhe em `SECURITY.md` |

## 7. Métricas de sucesso

| Métrica | Hoje | Meta | Como medir |
|---|---|---|---|
| Denúncias com resposta em até 7 dias | sem canal | 80% | tabela do painel por período |
| Moradores que acham o dia da coleta sem ajuda | desconhecido | maioria | pesquisa com a prefeitura |

## 8. Perguntas em aberto

- [ ] Cronograma real de Benjamin Constant: os 14 bairros do seed são da lista oficial; o cronograma é de exemplo e a prefeitura confere antes de abrir.
- [ ] Qual órgão recebe o encaminhamento de cada tipo (queimada, desmatamento, lixo)? Define o texto de "Encaminhada".
- [ ] A prefeitura envia retorno por telefone ou por e-mail ao denunciante que deixou contato?
- [ ] Por quanto tempo a prefeitura guarda denúncia, foto e contato, e quem apaga? Hoje não há exclusão automática.
- [ ] Quem recebe os avisos de segurança (contato e prazo de resposta de `SECURITY.md` §1)?
- [ ] Os textos de `/privacidade` e `/termos` são rascunho: a prefeitura e a procuradoria revisam antes da abertura.
