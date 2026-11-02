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
  - mapa público das ocorrências já analisadas, sem foto, descrição nem contato, com o ponto aproximado
    (cerca de 110 m) e as 500 mais recentes;
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
- Comando `node ace users:create-owner`, para criar o primeiro administrador em produção.
- Comando `node ace storages:prune`, que também apaga foto enviada sem denúncia há mais de 24 horas (precisa de
  um cron no servidor).
- Esteira de entrega: verificações em todo PR, imagens `curupira-api` e `curupira-app` e implantação no
  Coolify (aguardando os identificadores das aplicações).
- Navegação do app do morador também em tablet e desktop: cabeçalho com os mesmos destinos da barra inferior.
- Painel `/gestao` no celular: menu em gaveta, listagens em cartões com ordenação em botões, filtros em folha
  inferior com a contagem dos ativos, ocorrências em abas de lista e mapa, cronograma em lista por dia da
  semana e diálogos de formulário como folha inferior.
- Testes de Playwright de responsividade do app do morador e do painel, em sete larguras (360 a 1920 px).

### Alterado

- Variáveis de ambiente da API renomeadas pelo catálogo da régua: `APP_URL` vira `APP_SERVER_URL`, `SITE_URL` vira
  `CORS_ORIGINS` (lista separada por vírgula) e `REPORT_PHOTO_MAX_SIZE` deixa de existir (o teto de 10 MiB da foto é
  fixo no código). Quem opera o Coolify precisa trocar as chaves antes do próximo deploy.
- Deploy lê URL e uuids do Coolify de secrets do GitHub; o CI de um PR só de texto não roda a suíte.
- Layout responsivo em todo o app: container com largura máxima e margem lateral fluida, tipografia fluida, home
  com o seletor de bairro ao lado da pergunta a partir de 768 px e com próximos 14 dias e avisos lado a lado a
  partir de 1024 px.
- Painel `/gestao` responsivo do celular ao monitor largo: gaveta no celular (idioma e tema vão para o menu da
  conta), trilho de ícones no tablet e barra lateral aberta no desktop; gráfico da visão geral compacto no
  celular, com a tabela de números como alternativa.
- Controles do painel com 44 px em celular ou com ponteiro de toque.
- Movimento reduzido (`prefers-reduced-motion`): deixou de ser uma regra global e passou a valer por peça, o
  mapa incluído.
- Acessibilidade: o mapa tem nome acessível, os marcadores têm título e os alvos de toque têm 44 px.

### Segurança

- Denúncia anônima por padrão: sem contato, o servidor não guarda nada sobre quem enviou.
- Limite de envios por IP em denúncia (10 por hora), fotos (60 por hora) e consulta de protocolo (30 em 10 minutos).
- Foto sem EXIF e coordenada sempre a do pin confirmado.
- Barreira de origem contra CSRF e cabeçalhos de segurança no app e na API.
- Auditoria de segurança do código, com as correções aplicadas (`SECURITY.md` §10):
  - `TRUSTED_PROXIES` aceita lista separada por vírgula, é validada na partida da API e recusa vazio, `true`,
    `*` e `0.0.0.0/0` (antes o valor de produção documentado quebrava toda requisição);
  - o IP de quem usa as rotas anônimas deixa de ser guardado em texto claro: o limite usa um hash com chave, e
    a API não registra o IP ao recusar com 429 em `/storefront`;
  - o mapa público ganhou limite de 60 consultas por 10 minutos por IP e mostra o ponto aproximado (cerca de
    110 m); o painel segue com o ponto exato;
  - foto de denúncia: chave com prefixo próprio, arquivo da biblioteca da gestão não pode ser anexado a
    denúncia, URL de envio válida por 3 minutos (antes 15), limite de 50 milhões de pixels e no máximo 2
    conversões ao mesmo tempo;
  - cookies de sessão renomeados para `curupira-access-token` e `curupira-refresh-token`: quem estava logado
    entra de novo;
  - o painel e a entrada não ficam mais no cache do aparelho, e sair da conta apaga as páginas guardadas;
  - o endereço de retorno depois do login só aceita caminho do próprio site;
  - o app em produção não leva mais os dados de exemplo no pacote;
  - o texto de privacidade passou a dizer que o endereço de rede vira um hash guardado por cerca de 2 horas e
    que o ponto do mapa é aproximado.
