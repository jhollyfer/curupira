# Changelog

Mudanças do Curupira que quem usa percebe. Formato
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versões em
[SemVer](https://semver.org/lang/pt-BR/). Regras em `_standards/documentation.md` §7.

Ainda não há release nem tag: tudo está em `[Não lançado]` até a primeira versão em produção (1.0.0), que
espera a prefeitura conferir bairros e cronograma.

## [Não lançado]

### Corrigido

- Painel no celular: campos, filtros, o resumo da tabela do gráfico e o botão de senha com 44 px de alvo de toque; o "Pular para o conteúdo" do painel usa o mesmo estilo do app do morador.
- E2E: o título da lista do mapa seguia o formato antigo "Ocorrências (N)".
- Endereço que não existe responde 404 de verdade (antes respondia 200 com a página "não encontrada"), mantendo o cabeçalho e o rodapé do app.

### Alterado

- Crédito "Desenvolvido por Maiyu" (pt, es, en) no rodapé público, no login e no painel, pelo componente `MaiyuCredit`; sem slogan. A logo (`maiyu.png`) ainda não está no repositório, então o crédito sai só com o texto.
- Bairros do seed trocados pelos 14 da lista oficial do município (Agropalmin, Alzenir Magalhães, Bom Jardim, Castanhal, Centro, Cidade Nova, Cohabam, Coimbra, Colônia I, Colônia II, Eduardo Braga, Javarizinho, Monte da Redenção e Umarizal), sem coordenada: o administrador marca o ponto no painel. Quem já tem a lista antiga no banco continua com ela até a limpar no painel.
- Botões, campos, menus, paginação e abas têm 44 px de altura no celular, em todas as telas, e voltam ao tamanho denso a partir de `sm`.
- Contadores de registros e ocorrências dizem "Nenhum registro" e "1 registro" em vez de "0 registros", nos três idiomas.
- Títulos e o número da próxima coleta crescem de forma contínua com a largura da tela.

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

### Removido

- O modo de dados de exemplo do frontend (`VITE_DATA_SOURCE=mock`) e as contas de exemplo na tela de entrada: o app e o
  painel falam só com a API, e o dado de exemplo é a demonstração semeada pelo backend. As chaves `E2E_WORKERS` e
  `E2E_FULL_MATRIX` e o `frontend/.env.production` também saíram.

### Alterado

- Todas as chaves de ambiente seguem o catálogo da régua, as mesmas dos outros projetos da casa. API: `APP_CLIENT_URL` (comentada) e
  `SEED_DEMO_PASSWORD` entram no `.env.example`; o seed do dono e o da demonstração ligam pela senha presente, em qualquer
  ambiente, e a demonstração cria uma conta por papel (`administrator@example.com`, `operator@example.com`) com essa senha.
  App: `VITE_STORAGE_URL` (de build) vira `STORAGE_PUBLIC_URL`, lida pelo servidor a cada requisição, e a CSP passa a ser
  escrita em `src/server.ts`; `CHROMIUM_PATH` vira `E2E_CHROMIUM_PATH`; os E2E de outros papéis usam `E2E_DEMO_PASSWORD`.
  Quem opera o Coolify define `STORAGE_PUBLIC_URL` no app (e `SITE_ENV=production`), em vez de `VITE_STORAGE_URL` no build.
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
