# Changelog

Mudanças do Curupira que quem usa percebe. Formato
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versões em
[SemVer](https://semver.org/lang/pt-BR/). Regras em `_standards/documentation.md` §7.

Ainda não há release nem tag: tudo está em `[Não lançado]` até a primeira versão em produção (1.0.0), que
espera a prefeitura conferir bairros e cronograma.

## [Não lançado]

### Adicionado

- App do morador, em português, espanhol e inglês, instalável como aplicativo (PWA):
  - escolher o bairro uma vez e ver a próxima coleta e os próximos 14 dias, com cor, ícone e nome por tipo
    (orgânico, reciclável, volumoso, entulho);
  - calendário do mês por bairro, com arquivo `.ics` para o calendário do celular;
  - avisos da prefeitura na home e em uma página própria;
  - denúncia em 3 passos (tipo, foto e local, descrição e envio), com até 3 fotos, GPS ou pin arrastável no
    mapa, e escolha entre enviar anônimo ou deixar contato;
  - denúncia salva no aparelho quando falta sinal, com reenvio automático ao voltar a conexão;
  - protocolo `CUR-XXXX-XXXX` ao enviar, e acompanhamento sem login pela linha do tempo (Recebida, Em análise,
    Encaminhada, Resolvida) com a resposta da gestão;
  - mapa público das ocorrências já analisadas, sem foto, descrição nem contato;
  - páginas Sobre, Privacidade e Termos (textos em rascunho).
- Painel da gestão em `/gestao`, para operador e administrador:
  - visão geral com contagens por situação e tipo e gráfico dos últimos 30 dias;
  - ocorrências em mapa e tabela com filtros, detalhe com foto, contato e histórico, mudança de situação
    (só para frente) e resposta ao morador;
  - avisos: criar, agendar, encerrar e excluir;
  - só para administrador: cronograma por bairro em grade semanal, bairros com ponto no mapa e contas da gestão;
  - perfil e troca de senha.
- API com rotas públicas (`/storefront`), da gestão (`/management`), de sessão, de conta e de arquivos, com
  documentação em `/documentation`.
- Entrada por cookie `httpOnly`, com renovação de sessão e limite de tentativas.
- Envio de foto direto ao armazenamento, com conferência do arquivo e remoção dos dados de câmera e GPS.
- Esteira de entrega: verificações em todo PR, imagens `curupira-api` e `curupira-app` e implantação no
  Coolify (aguardando os identificadores das aplicações).

### Segurança

- Denúncia anônima por padrão: sem contato, o servidor não guarda nada sobre quem enviou.
- Limite de envios por IP em denúncia (10 por hora), fotos (60 por hora) e consulta de protocolo (30 em 10 minutos).
- Foto sem EXIF e coordenada sempre a do pin confirmado.
- Barreira de origem contra CSRF e cabeçalhos de segurança no app e na API.
