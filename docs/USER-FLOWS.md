# Fluxos do usuário

**Curupira** · cada passo do primeiro acesso até concluir a tarefa

> Um fluxo por funcionalidade do `PRD.md` §4. Tela nova ou fluxo novo entra aqui no mesmo
> commit. O teste de ponta a ponta segue estes passos (`TEST-PLAN.md`).

## Jornadas principais

| Fluxo | Quem | Tela inicial | Resultado |
|---|---|---|---|
| [Próxima coleta](#proxima-coleta) | morador | `/` | vê o dia, o turno e o tipo da próxima coleta |
| [Cronograma do mês](#cronograma-do-mes) | morador | `/coleta` | calendário do mês e arquivo `.ics` |
| [Nova denúncia](#nova-denuncia) | morador | `/denunciar` | protocolo na tela |
| [Acompanhar denúncia](#acompanhar-denuncia) | morador | `/acompanhar` | linha do tempo do status |
| [Mapa público](#mapa-publico) | morador | `/mapa` | ocorrências em andamento e resolvidas |
| [Entrar no painel](#entrar-no-painel) | gestão | `/sign-in` | painel aberto em `/gestao` |
| [Tratar ocorrência](#tratar-ocorrencia) | operador, administrador | `/gestao/ocorrencias` | status novo e resposta registrada |
| [Manter cronograma](#manter-cronograma) | administrador | `/gestao/cronograma` | dias e turnos atualizados |
| [Publicar aviso](#publicar-aviso) | operador, administrador | `/gestao/avisos` | aviso na home do morador |

---

## Próxima coleta

**Entrada:** abrir o app pela primeira vez ou voltar a ele
**Pré-condição:** nenhuma; o bairro fica salvo no aparelho

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre o app | sem bairro salvo, pergunta "Em qual bairro você mora?" | `/` |
| 2 | escolhe o bairro | guarda no aparelho e mostra "Próxima coleta no seu bairro" com dia, turno e tipo | `/` |
| 3 | rola a faixa | mostra os próximos 14 dias com bolinhas por tipo | `/` |
| 4 | lê os avisos | mostra os avisos da prefeitura ativos | `/` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Sem sinal | mostra o cronograma guardado do último acesso, com aviso "Dados do último acesso" |
| Bairro sem cronograma | mensagem "Ainda não temos o cronograma deste bairro" e link para a prefeitura |
| Troca de bairro | botão "Trocar bairro" volta ao passo 1 |

---

## Cronograma do mês

**Entrada:** "Ver calendário" na home
**Ação:** consultar o mês, trocar de bairro, exportar
**Sucesso:** calendário com as cores fixas por tipo; arquivo `.ics` baixado

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre o calendário | mostra o mês atual do bairro salvo | `/coleta` |
| 2 | troca o mês ou o bairro | recalcula as datas | `/coleta` |
| 3 | toca em "Adicionar ao calendário do celular" | baixa o `.ics` com as coletas do bairro | `/coleta` |

---

## Nova denúncia

**Entrada:** botão "Fazer denúncia"
**Pré-condição:** nenhuma; sem login
**Sucesso:** código de protocolo na tela
**Falha:** mantém tudo o que foi preenchido e oferece "Tentar de novo"

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | escolhe o tipo (Queimada, Descarte irregular de lixo, Desmatamento, Outro) | marca o card e libera "Continuar" | passo 1 |
| 2 | tira ou escolhe a foto | mostra a prévia e permite trocar | passo 2 |
| 3 | usa o GPS ou arrasta o pin | guarda a coordenada confirmada no mapa | passo 2 |
| 4 | escreve a descrição (opcional) | conta os caracteres | passo 3 |
| 5 | escolhe "Enviar anônimo" (padrão) ou "Deixar contato" | sem contato, não guarda nada sobre quem enviou | passo 3 |
| 6 | toca em "Enviar" | envia a foto, cria a denúncia e mostra o protocolo `CUR-XXXX-XXXX` | confirmação |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Sem sinal ao enviar | guarda foto e dados no aparelho, avisa "Salva no aparelho. Será enviada quando voltar a conexão" e mostra "Pendente de envio" |
| Volta o sinal | envia sozinha e mostra o protocolo |
| GPS negado ou sem sinal de satélite | o pin fica no centro do bairro e o morador o arrasta |
| Foto grande ou formato inválido | mensagem no campo dizendo o que fazer |
| Muitas tentativas (429) | pede para aguardar alguns minutos |

---

## Acompanhar denúncia

**Entrada:** "Acompanhar denúncia"
**Pré-condição:** o morador guardou o protocolo
**Sucesso:** linha do tempo Recebida, Em análise, Encaminhada, Resolvida

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | digita o protocolo | aceita maiúscula, minúscula, espaço e `O`/`0` trocados | `/acompanhar` |
| 2 | toca em "Consultar" | mostra o status e a resposta da gestão em cada etapa | `/acompanhar` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Protocolo inexistente (404) | "Não encontramos este protocolo. Confira o código" |
| Protocolo mal formado | mensagem no campo com o formato esperado |

---

## Mapa público

**Entrada:** "Mapa" no menu
**Sucesso:** pins por tipo; nenhum dado de quem denunciou

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre o mapa | mostra ocorrências em andamento e resolvidas, por tipo | `/mapa` |
| 2 | filtra por tipo | mostra só o tipo escolhido | `/mapa` |

---

## Entrar no painel

**Entrada:** `/sign-in`
**Pré-condição:** conta criada pelo administrador

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | informa e-mail e senha | abre a sessão por cookie e vai para a visão geral | `/gestao` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Credencial errada | mensagem única, sem dizer qual campo errou |
| Muitas tentativas (429) | bloqueio temporário com aviso |
| Operador abre área de administrador (403) | volta à visão geral com aviso |

---

## Tratar ocorrência

**Entrada:** "Ocorrências" no painel
**Sucesso:** status novo e resposta no histórico, visíveis ao denunciante pelo protocolo

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | filtra por tipo, bairro, status e período | atualiza o mapa e a tabela com o mesmo recorte | `/gestao/ocorrencias` |
| 2 | clica no pin ou na linha | abre o detalhe com foto, local, descrição e histórico | detalhe |
| 3 | muda o status e escreve a resposta | grava o evento com o autor; o status só avança | detalhe |

---

## Manter cronograma

**Entrada:** "Cronograma" no painel (só administrador)

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | escolhe o bairro | lista os dias, turnos e tipos | `/gestao/cronograma` |
| 2 | adiciona ou edita um dia | grava; repetir tipo, dia e turno no mesmo bairro dá 409 | formulário |

---

## Publicar aviso

**Entrada:** "Avisos" no painel

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | cria o aviso com título, texto e início | agenda ou publica | `/gestao/avisos` |
| 2 | define o fim ou toca em "Encerrar" | o aviso sai da home | `/gestao/avisos` |

---

## Checklist de todo fluxo

- [ ] Entrada clara (de onde o usuário chega).
- [ ] Toda ação tem retorno: carregando, sucesso, erro.
- [ ] Dá para voltar ao passo anterior.
- [ ] Estados vazio e de erro desenhados.
- [ ] Sucesso visível (mensagem ou mudança na tela).
- [ ] Funciona no celular.
