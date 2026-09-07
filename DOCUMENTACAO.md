# DOCUMENTAÇÃO DO PROJETO — leia isto primeiro

> **Para quem está retomando o projeto (outra sessão de IA ou outro desenvolvedor):**
> este arquivo é o ponto de partida. Ele contém o estado atual, as decisões já
> tomadas e por quê, o que falta, e como trabalhar. Leia inteiro antes de mexer
> em código — várias decisões aqui não são óbvias e já foram debatidas.

**Produto:** CRM de funil de vendas para representante comercial
**Cliente/dono:** Gustavo de Oliveira — Consultoria e Representação
**No ar em:** https://shaliach.pages.dev
**Repositório:** https://github.com/Guxtavodeoliveira/CRM (público)
**Última atualização desta doc:** agosto de 2026

---

## 0. Índice dos documentos da pasta

| Arquivo | Para quem | Assunto |
|---|---|---|
| **DOCUMENTACAO.md** | quem retoma o projeto | este arquivo: estado, decisões, arquitetura |
| **COMO-TRABALHAR.md** | o dono | como pedir alteração, instalar o zip, publicar, backup |
| **LEIA-ME.md** | o dono | manual de uso: o que cada tela faz |
| **COMO-USAR-AGORA.md** | o dono | o que mudou ao sair do arquivo para o banco |
| **COMO-PUBLICAR.md** | o dono | GitHub + Cloudflare, primeira publicação |
| **COMANDOS-GIT.md** | o dono | comandos de Git, e o que fazer quando dá erro |
| **TROCAR-SENHA-E-EMAIL.md** | o dono | 3 ajustes no Supabase para os e-mails funcionarem |
| **banco/COMO-CRIAR-O-SUPABASE.md** | o dono | criar o projeto e rodar o esquema |
| **banco/PASSO-A-PASSO-MIGRAR.md** | o dono | trazer um `.json` para o banco |
| **banco/schema.sql** | técnico | esquema completo do Postgres |
| **banco/migrar.js** | técnico | script de importação |
| **testes/LEIA-ME.md** | técnico | como rodar e estender os testes |
| **img/LOGO-COMO-USAR.md** | técnico | arquivos da marca e medidas |

---

## 1. O que é e para quem

Gustavo é representante comercial. Ele representa marcas (a primeira é a
**NST Print**, do ramo de DTF/têxtil) e vende para clientes indústria e confecção
em Santa Catarina e Rio Grande do Sul.

O sistema serve para ele:

- organizar clientes em um **funil kanban** por etapa;
- registrar **atividades** (visita, WhatsApp, ligação, nota, proposta, reunião,
  e-mail) com prazo, e comentar nelas depois do que aconteceu;
- ver a **agenda do dia** (hoje / amanhã / período) do que está em aberto;
- lançar **pedidos** com itens, quantidade, preço, forma de pagamento e
  **percentual de comissão**, gerando a **ficha do pedido em PDF** para mandar
  para a empresa faturar;
- tirar **relatório de vendas e comissões** por período.

Ele **não é desenvolvedor**. Toda instrução para ele precisa ser passo a passo,
sem jargão, dizendo onde clicar. Ele usa Windows e CMD.

---

## 2. Como o sistema está montado

Não há backend próprio. É um site estático que fala direto com o Supabase.

```
Navegador (HTML + CSS + JS puro, sem framework)
        │
        ├── Cloudflare Pages  ← hospeda os arquivos estáticos
        │       ▲
        │       └── GitHub (deploy automático a cada push)
        │
        └── Supabase ← Postgres + autenticação (login, e-mails, sessão)
```

**Por que sem backend:** foi decidido em conversa. O Supabase já entrega banco +
autenticação prontos, e o front conversa direto com ele. Um backend em Node só
repassaria dados — trabalho e custo a mais sem benefício. Um servidor entra
quando aparecer algo que **não pode** rodar no navegador: envio automático de
WhatsApp, geração de PDF no servidor, rotina agendada, relatório muito pesado.
Nesse dia, o front não precisa mudar.

**Sem build step.** Não há npm, webpack, TypeScript nem compilação. Os arquivos
que estão no repositório são exatamente os que o navegador baixa. Isso é
intencional: mantém o projeto simples para o dono publicar sozinho.

**Sem ES modules.** Os scripts são carregados com `<script src>` comum e
compartilham escopo global. Motivo: o sistema começou rodando em `file://`, onde
módulos ES falham por CORS. Se algum dia virar módulos, tudo tem que virar de
uma vez.

---

## 3. Arquivos e o que cada um faz

```
index.html                 tela principal (funil) — todos os modais moram aqui
login.html                 entrar
cadastro.html              criar conta
recuperar-senha.html       pedir link de recuperação
nova-senha.html            definir senha nova (aberta pelo link do e-mail)

assets/css/app.css         estilo do sistema + paleta (:root no topo)
assets/css/auth.css        estilo das 4 telas de entrada

assets/js/vendor/supabase.js         supabase-js 2.x (UMD, embutido)
assets/js/vendor/xlsx.mini.min.js    SheetJS (gera .xlsx no navegador)

assets/js/config.js        URL e chave pública do Supabase; cria o cliente `sb`
assets/js/auth.js          login, cadastro, recuperação, força de senha, perfil
assets/js/util.js          uid (UUID), datas, moeda, máscaras, ícones, toast,
                           confirmar(), pedirTexto(), chaveTexto(), ACT_TYPES,
                           CORES_SEGMENTO (paleta fixa dos segmentos)
assets/js/storage.js       modelo de dados, normalização/migração, gravação em
                           arquivo .json (modo local) e roteamento p/ o banco
assets/js/banco.js         carrega do Supabase e sincroniza de volta; vários funis
assets/js/board.js         kanban: colunas, cartões, arrastar, menu do botão direito
assets/js/empresa.js       modal de cadastro/edição do cliente
assets/js/negocio.js       modal do negócio: etapas, atividades, comentários
assets/js/pedidos.js       aba Pedidos, modal do pedido, ficha em PDF
assets/js/agenda.js        painel Hoje / Amanhã / Período
assets/js/relatorios.js    relatórios: vendas e comissões, clientes e produtos
assets/js/segmentos.js     segmentos do negócio: cadastro por funil, chips no
                           cartão e filtro do quadro (segmento, estado, cidade)
assets/js/produtos.js      tabela de preços do funil: linhas, sublinhas, produtos
                           com mínimo/médio/máximo e a anotação particular
assets/js/ordenacao.js     ordenação por etapa do kanban (estado, cidade,
                           segmento em destaque, cadastro, último pedido)
assets/js/exportar-agendor.js  exporta .xlsx (histórico: era p/ importar no Agendor)
assets/js/usuario.js       menu do representante e menu de funis
assets/js/main.js          amarra tudo, atalhos de teclado, escolhe banco ou arquivo

img/                       logos e ícones (ver img/LOGO-COMO-USAR.md)
banco/schema.sql           esquema do Postgres (rodar no SQL Editor do Supabase)
banco/atualizar-campos.sql      migração: campos novos do cliente
banco/atualizar-segmentos.sql   migração: tabelas de segmento (rodar uma vez)
banco/atualizar-produtos.sql    migração: tabela de preços (rodar uma vez)
banco/migrar.js            importa um crm-dados.json para o banco (Node + pg)
testes/                    suítes de verificação (ver seção 9)

publicar.bat               dois cliques: envia as alterações para o GitHub
.gitignore                 impede subir crm-dados.json e node_modules
```

**Ordem dos scripts em `index.html` importa** (escopo global compartilhado):
supabase → config → auth → xlsx → util → storage → banco → board → empresa →
negocio → pedidos → relatorios → segmentos → produtos → ordenacao → agenda →
exportar-agendor → usuario → main.

---

## 4. Modelo de dados

### 4.1 O objeto em memória (`dados`)

Toda a interface trabalha sobre **um único objeto global** chamado `dados`. Ele
tem a mesma forma tanto no modo arquivo quanto vindo do banco. Entender essa
forma é entender o sistema.

```js
dados = {
  boardName: "NST Print",         // nome do funil
  seq: 42,                        // último número de negócio usado
  usuario: "Gustavo de Oliveira",
  listas: {                       // sugestões de autocompletar
    categorias: [], origens: [], setores: [], responsaveis: [], produtos: []
  },
  columns: [ { id, name } ],      // etapas, na ordem do array
  cards: [{
    id,                 // = id do NEGÓCIO no banco
    clienteId,          // = id do CLIENTE no banco (só existe no modo banco)
    columnId,           // etapa
    numero,             // número do negócio (#5)
    posicao,            // ordem dentro da coluna
    // --- cadastro do cliente ---
    nome,                       // nome fantasia / nome do cliente
    cnpj, razaoSocial, inscricaoEstadual,
    responsavelEmpresa,         // quem responde pela empresa CLIENTE
    descricao,
    banco, agencia, contaCorrente, contaPoupanca, pix,
    email, whatsapp, telefone, celular, fax, ramal, website,
    cep, pais, estado, cidade, bairro, rua, numero_end, complemento,
    redes: { facebook, twitter, linkedin, skype, instagram },
    pessoas: [ { id, nome, cargo, email, whatsapp, celular, telefone } ],
    // --- negócio ---
    valor, status, estrelas, motivoPerda, dataInicio, dataConclusao,
    codigo, criadoEm, criadoPor, atualizadoEm, etapaEm,
    produtos: [],       // legado, praticamente não usado
    categoria, origem, setor, responsavel,   // legado: saíram da tela, ficam
                                             // no modelo só para não quebrar
                                             // arquivos e bancos antigos
    // --- atividades (nome antigo do campo, mantido de propósito) ---
    agendamentos: [{
      id, tipo, data, nota, concluido, criadoEm, criadoPor,
      comentarios: [ { id, texto, autor, criadoEm } ]
    }],
    // --- pedidos ---
    pedidos: [{
      id, numero, data, formaPagamento, comissaoPct, atual,
      itens: [ { id, produto, quantidade, preco } ],
      comentarios: [ { id, texto, autor, criadoEm } ],
      criadoEm, criadoPor, atualizadoEm
    }]
  }]
}
```

**Armadilhas conhecidas — não “arrume” sem pensar:**

- **`agendamentos` é a lista de atividades.** O nome ficou do começo do projeto.
  Renomear quebraria os arquivos `.json` que o dono ainda tem guardados.
  `storage.js` normaliza os dois nomes na leitura.
- **Um cartão = cliente + negócio juntos.** No banco são duas tabelas.
  `banco.js` junta na leitura e separa na gravação.
- **`numero_end`** é o número do endereço. `numero` é o número do negócio.
- **`uid()` gera UUID de verdade** (`util.js`). É o que faz o id da tela ser o
  mesmo id da linha no banco, sem tabela de conversão. Não voltar para id curto.
- **Comissão guarda só o percentual** (`comissaoPct`), nunca o valor calculado.
  Assim, corrigir a % ajusta todos os relatórios de uma vez.
- **Só um pedido `atual` por negócio.** Há um índice único no banco garantindo
  isso. Ao lançar um novo, os outros precisam ir para `atual: false` **antes**.

### 4.2 O banco

`banco/schema.sql` cria 16 tabelas: `perfis`, `representadas`, `funis`, `etapas`,
`clientes`, `pessoas`, `negocios`, `atividades`, `pedidos`, `pedido_itens`,
`comentarios`, `opcoes`, `segmentos`, `negocio_segmentos`, `linhas_produto`,
`produtos`. Mais 3 views de relatório: `v_pedidos`, `v_comissao_mensal`,
`v_funil_resumo`.

Quem já tem o banco criado não roda o `schema.sql` de novo: roda as migrações
`banco/atualizar-segmentos.sql` e `banco/atualizar-produtos.sql`, que criam só
as tabelas novas.

Decisões do esquema, todas deliberadas:

- **`owner_id` em toda tabela**, com `default auth.uid()`, e **RLS** ligada em
  todas. Cada usuário só enxerga as próprias linhas. É isso que torna seguro o
  navegador falar direto com o banco. Foi testado: um usuário diferente enxerga
  0 clientes.
- **Cliente pertence ao usuário, não à representada.** Assim o mesmo cliente é
  reaproveitado em funis diferentes sem cadastro duplicado. Quem pertence ao
  funil é o **negócio** — os funis nunca se misturam. Isso foi pedido
  explicitamente pelo dono.
- **Etapa é linha com `nome` editável** e `posicao` inteira. O negócio aponta
  para o `id`. Renomear etapa não afeta nada. O dono renomeia com frequência.
- **`legacy_id` em tudo**, com índice único parcial. Permite rodar a migração
  várias vezes sem duplicar (testado com 3 execuções seguidas).
- **Índice `ix_pedido_atual`**: `unique (negocio_id) where atual`.
- **Ordenação da etapa é preferência de tela, não dado.** Fica no
  `localStorage`, na chave `crmOrdemEtapas:<id do funil>`, como
  `{ etapaId: [ {tipo, dir, segId} ] }` — a ordem do array é a ordem em que os
  critérios foram marcados. Não vai para o banco de propósito: não é do
  negócio, é de como o dono quer olhar. A `posicao` (ordem manual, arrastada)
  continua sendo gravada e é sempre o desempate; limpando a ordenação, ela
  reaparece. O critério "último pedido" só é oferecido em etapas que têm pedido
  lançado — é isso que faz ele aparecer na *Cliente Comprador* sem depender do
  nome da etapa, que o dono renomeia.
- **Segmento é do funil, não global.** `segmentos` tem `funil_id`: cada
  representada tem a sua lista, com nome e cor. `negocio_segmentos` é a tabela
  de ligação (chave primária composta), então um negócio aceita nenhum, um ou
  vários segmentos. Não foi reaproveitada a tabela `opcoes` de propósito: ela
  não tem cor, não é amarrada a funil e só guarda um valor por campo.
- **Produto é do funil, e o item do pedido continua sendo texto.** A tabela de
  preços (`linhas_produto` + `produtos`) é por funil; o item do pedido guarda o
  NOME do produto, como sempre guardou. Isso mantém os pedidos antigos válidos
  e deixa o dono digitar um produto que não está cadastrado. A ligação entre o
  item e o produto é feita pelo nome (`chaveTexto`, sem acento e sem caixa), e
  renomear um produto no cadastro renomeia o nome nos pedidos, para a ligação
  não se perder.
- **Sublinha é uma linha com `pai_id`** — dois níveis na mesma tabela. Apagar a
  linha NÃO apaga produto: `produtos.linha_id` é `on delete set null`, e o
  produto reaparece em "Sem linha".
- **Três preços por unidade** (`preco_min`, `preco_med`, `preco_max`). O aviso
  de preço fora da faixa avisa e deixa salvar — nunca bloqueia. Preço 0 ou faixa
  não cadastrada nunca avisa.
- **`observacao` do produto é particular**: aparece só no cadastro. Não entra na
  ficha em PDF, na aba Pedidos, no relatório nem na planilha — foi pedido assim.
- **Segmento é opcional.** Negócio sem segmento é o normal e continua igual.
  Se as tabelas novas ainda não existirem no banco, `banco.js` percebe, avisa
  uma vez e segue funcionando sem elas (mesma ideia dos campos novos do
  cliente).
- **Comentários numa tabela só**, com `atividade_id` OU `pedido_id`, e um
  `check (num_nonnulls(...) = 1)`.

### 4.3 Como a gravação funciona (`banco.js`)

**Carregar:** ao abrir, faz ~9 consultas em paralelo, monta o objeto `dados` e
guarda uma cópia (`fotoAnterior`).

**Gravar:** 700 ms depois da última alteração, `sincronizar()` compara o estado
atual com a `fotoAnterior` e manda **só o que mudou**. A comparação é feita
sobre as linhas **já traduzidas para o formato do banco** — é isso que faz
mexer no valor do negócio não marcar o cadastro do cliente como alterado.
`atualizado_em` é ignorado na comparação (muda sozinho sempre).

Ordem de gravação: pais antes de filhos; exclusão de pedidos **antes** dos
upserts (por causa do índice do pedido atual); negócios e clientes excluídos por
último.

Por que não reescrever cada tela para fazer chamadas pontuais ao banco: seria
muito mais código e muito mais risco. O diff resolve com uma função.

---

## 5. Acessos e configuração

**Supabase**
- Projeto: `shaliach` · região São Paulo
- Project URL: `https://gpjjfjcyypsgmhqcpuxh.supabase.co`
- Chave pública (anon/publishable): está em `assets/js/config.js`
- Essas duas são **feitas para ficar no navegador**. Seguras. Quem protege é a RLS.
- **A `service_role key` e a senha do banco nunca vão para o código, nem para o
  chat.** Elas ignoram a RLS. A senha do banco só é usada localmente, no
  `migrar.js`, via variável de ambiente.

**Authentication → URL Configuration** (obrigatório para os e-mails funcionarem)
- Site URL: `https://shaliach.pages.dev`
- Redirect URLs: `https://shaliach.pages.dev/**`

**Pendências de configuração** descritas em `TROCAR-SENHA-E-EMAIL.md`: traduzir
os templates de e-mail, e ligar SMTP próprio quando entrarem mais usuários (o
servidor de e-mail embutido do Supabase é só para teste e tem limite baixo).

---

## 6. Como publicar (o dono faz sozinho)

Pré-requisito, uma vez só: Git instalado, repositório já conectado (feito).

**Caminho normal:** descompactar o zip novo por cima da pasta e dar **dois
cliques em `publicar.bat`**. Ele pergunta uma descrição, envia e o Cloudflare
republica em ~1 minuto.

**Pelo CMD**, dentro da pasta do projeto:

```cmd
git add .
git commit -m "descricao da mudanca"
git push
```

Detalhes que já causaram problema:
- O `index.html` tem que ficar na **raiz** do repositório, não dentro de uma
  subpasta. O upload pelo site do GitHub **não sobe pastas** de forma
  confiável — foi assim que faltaram `assets`, `img` e `banco` na primeira vez.
- No Cloudflare, o fluxo de **Pages** ficou escondido: em *Create application*,
  o link é **"Looking to deploy Pages? Get started"** no rodapé do quadro. A
  tela padrão é de *Workers*, que não serve (pede `npx wrangler deploy`).
- Configuração do Pages: preset `None`, build command **vazio**, output `/`.

---

## 7. Migrar dados de um `.json` para o banco

Usado quando ainda existir arquivo com dados que não estão no banco.

```cmd
cd banco
npm install pg
set DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.gpjjfjcyypsgmhqcpuxh.supabase.co:5432/postgres
set DB_PASSWORD=a-senha-do-banco
set OWNER_ID=o-uid-do-usuario
node migrar.js "C:\caminho\do\crm-dados.json"
```

- **Não trocar o `[YOUR-PASSWORD]` na URL.** A senha vai separada, em
  `DB_PASSWORD`, justamente porque senhas com `@ # ? /` quebram quando colocadas
  dentro da URL. O `migrar.js` faz a leitura da URI na mão por esse motivo.
- É transação única: se falhar, não grava nada pela metade.
- Rodar de novo **não duplica** (é o que o `legacy_id` garante).
- O `OWNER_ID` é o UID em Authentication → Users.

---

## 8. Histórico das decisões (o "por quê")

Isto existe para ninguém desfazer sem saber o motivo.

| Decisão | Motivo |
|---|---|
| Sem framework, sem build | O dono publica sozinho; qualquer etapa de build viraria obstáculo |
| Sem backend próprio | Supabase já cobre banco + auth; backend só repassaria dados |
| Supabase Auth em vez de login próprio | Hash, e-mails e sessão prontos e mais seguros do que fazer à mão |
| `dados` em memória + diff na gravação | Evita reescrever toda a interface; rápido no volume atual |
| UUID no cliente | id da tela = id do banco, sem tabela de conversão |
| Comissão só como percentual | Corrigir a % reajusta relatório inteiro |
| Comissão **fora** da ficha PDF por padrão | A ficha vai para a empresa; há caixa para incluir se for uso interno |
| Comissão em **verde**, não dourado | Depois do rebrand dourado, o valor desaparecia no meio da marca |
| Botão principal **grafite**, não dourado | Dourado com texto branco dá 2,25:1 de contraste — ilegível |
| Total do funil = pedido atual | Ao remover o campo "valor do negócio", os totais ficariam zerados |
| Exportar/Importar JSON mantido | Backup portátil e saída de emergência se o serviço cair |
| Cliente compartilhado, negócio por funil | Pedido explícito: reaproveitar cadastro sem misturar funis |
| `posicao` no cartão | Ordem/prioridade dentro da coluna, e vai junto para o banco |

**Removido a pedido do dono** (não reintroduzir sem ele pedir):
- Filtro de situação (Todos / Em andamento / Ganhos / Perdidos)
- Botões Perdido / Em andamento / Ganho no negócio, e no menu do botão direito
- Seção "Privacidade" do cadastro de empresa
- Campo editável "Valor do negócio" na lateral
- Da ficha do cliente: **Categoria**, **Origem**, **Setor** e o **Responsável no
  sentido de vendedor** ("quem cuida desse cliente"). O dono trabalha sozinho:
  o representante é sempre o usuário logado, então o campo só dava trabalho.
- Da ficha do cliente: a seção inteira **"Negócio no funil"** (Etapa, Valor do
  negócio, Data de início). A etapa passou a ser a coluna de onde o "+" foi
  clicado e a data de início é o dia do cadastro. O valor do funil já vinha do
  pedido atual, então o campo era redundante.
- Da ficha do cliente: a seção **"Produtos e serviços"**. Os produtos continuam
  existindo dentro do pedido, que é onde eles de fato importam.
- Toda menção a "Agendor" na interface (era o sistema copiado como referência;
  o rótulo dos botões de planilha virou "PLANILHAS")

**Acrescentado a pedido do dono:**
- **Relatório de clientes** (menu Relatórios → Clientes): lista com nome, CNPJ,
  telefone, cidade/estado e a etapa em que o cliente está no funil. Filtros de
  etapa, estado e cidade, todos começando em "todos"; a lista de cidades só
  mostra as do estado escolhido, e trocar o estado sempre solta a cidade.
  Quatro ordenações: nome, cidade/estado, etapa do funil e cadastro mais
  recente. Sai em PDF pela impressão do navegador e em Excel.
- "Nome" virou **"Nome fantasia / Nome do cliente"**.
- **Inscrição estadual** e **Responsável** — este último agora quer dizer *quem
  responde pela empresa cliente*, não o vendedor. Atenção ao mexer: o campo
  antigo `responsavel` continua no modelo só para não quebrar arquivos velhos;
  o campo em uso é `responsavelEmpresa`.
- Seção **"Dados bancários"**: `banco`, `agencia`, `contaCorrente`,
  `contaPoupanca`, `pix`. Aparece na ficha do pedido em PDF e na lateral do
  negócio, e some sozinha quando está tudo vazio.

**Bugs achados por teste, já corrigidos** — vale conhecer porque são do tipo que
volta se alguém mexer:
1. Arrastar cartão caía sempre no fim da coluna: o marcador de posição era
   removido antes de a posição ser lida.
2. `migrar.js` estourava na primeira linha: faltavam índices de `legacy_id` em
   `representadas` e `funis`, e `ON CONFLICT` com índice **parcial** exige
   repetir a condição `where legacy_id is not null`.
3. Senha do banco com símbolos quebrava a conexão silenciosamente.
4. O diff da sincronização marcava cliente e negócio como alterados juntos.

---

## 9. Testes

`testes/smoke.js` cobre os caminhos críticos em **37 verificações**, nos dois
modos (arquivo e banco). Roda sem navegador e sem internet, com um Supabase
simulado que registra o que *seria* enviado ao banco.

```bash
cd testes
npm install jsdom
node smoke.js          # esperado: 37 de 37 verificações passaram
```

Detalhes e limitações em `testes/LEIA-ME.md`. **Rode antes de entregar qualquer
alteração** — os 4 bugs listados acima foram achados aí, não em produção.

Durante o desenvolvimento existiram 10 suítes separadas (~237 verificações),
perdidas numa limpeza de ambiente. O `smoke.js` é a consolidação do que mais
importava. O que as originais cobriam, caso valha reconstruir em profundidade:

| Suíte | Cobria |
|---|---|
| básica | boot, colunas, cadastro, validação, cartão no board, menu do botão direito, duplicar, editar, persistência, leitura de JSON antigo |
| upgrade | comentários em atividade, agenda hoje/amanhã/atrasadas, arrastar vertical com filtro ativo |
| pedidos | pedido atual único, histórico, ordenação, comentários, editar sem perder número |
| comissão | percentual com vírgula, dois totais, acumulado, persistência |
| relatório | período por calendário, agrupamento, totais, impressão, Excel |
| autenticação | regras de senha, erros traduzidos, links expirados, redirecionamentos |
| banco | carregar do Supabase, gravar só o diferente, excluir, sessão expirada |
| ajustes | remoções pedidas pelo dono, seletor de funis, período personalizado |
| ficha | PDF do pedido, dados da empresa, comentários, comissão opcional |
| planilha | compatibilidade com o modelo .xlsx |

**Uma armadilha do harness:** no modo banco, o `main.js` inicia a carga sozinho.
Se o teste mexer no estado antes disso terminar, a carga sobrescreve e o teste
falha por motivo falso. O `smoke.js` espera a carga concluir (`esperarCarga`).

**Como testar sem navegador:** o ambiente de IA normalmente não consegue abrir
Chrome nem alcançar a internet aberta (o Supabase real é inalcançável). A
técnica usada foi: carregar os scripts num jsdom com um objeto `sb` falso que
registra as chamadas, e comparar o que foi "enviado ao banco". Também é
possível instalar um Postgres local (`apt-get install postgresql`) e rodar o
`schema.sql` de verdade com um `auth.uid()` simulado — foi assim que os bugs da
migração apareceram.

---

## 10. O que falta / próximos passos

Em ordem de utilidade, na minha leitura:

1. **Buscar cliente já cadastrado ao criar em outro funil.** Hoje, ao cadastrar
   no funil B um cliente que já existe no funil A, cria um cadastro novo. O
   combinado com o dono era reaproveitar (digita o nome → sugere os existentes →
   seleciona). O banco já suporta; falta a interface.
2. **Traduzir os e-mails do Supabase** e ligar SMTP próprio.
3. **Convidar vendedores.** As tabelas já isolam por usuário; falta a tela de
   compartilhar um funil e uma tabela de membros. O dono avisou que vai querer.
4. **Mais relatórios**, com destaque para comissões por representada e por mês —
   a view `v_comissao_mensal` já existe e não está sendo usada pela interface.
5. **Referência visual do login.** O dono citou "igual ao Almah Condos" e nunca
   mandou o print. O desenho atual (tela dividida) é escolha nossa.
6. Rever se `card.produtos` (legado) ainda serve para algo, ou remover.

---

## 11. Como trabalhar com este projeto numa nova sessão de IA

**O que o dono envia:** este arquivo, ou o zip inteiro do projeto.

**O que a IA deve fazer antes de mexer em qualquer coisa:**
1. Ler este documento inteiro.
2. Abrir `assets/js/storage.js` e `assets/js/banco.js` — são o coração.
3. Confirmar a paleta em `:root`, no topo de `assets/css/app.css`.

**Como devolver o trabalho:** um **arquivo .zip** com a pasta do projeto
inteira, mantendo a estrutura (`index.html` na raiz da pasta). O dono
descompacta por cima e dá dois cliques no `publicar.bat`. Não devolver arquivos
soltos nem pedir para ele editar código manualmente.

**Cuidados de comunicação com o dono:**
- Ele não programa. Instruções passo a passo, dizendo onde clicar.
- Não dizer "vou fazer" e encerrar a resposta: a IA só trabalha enquanto
  responde, não entre mensagens. Fazer na hora ou dizer que não vai dar.
- Sempre avisar o que **não** foi possível testar. O ambiente costuma não
  alcançar o Supabase real nem abrir navegador.
- Quando pedir print de erro: F12 → aba Console → foto da mensagem em vermelho.

**Regras de estilo do código, para manter a consistência:**
- Comentários e nomes de variáveis **em português**.
- Sem dependência nova sem necessidade real; se precisar, embutir em
  `assets/js/vendor/` (foi o caso de SheetJS e supabase-js) para não depender de
  CDN.
- Nada de `localStorage` para dados do CRM — só para preferência de interface
  (ex.: qual funil estava aberto).
- PDF é feito com **impressão do navegador** (`window.print` + CSS `@media
  print` isolando a folha), não com biblioteca. Ver `imprimirFolha()` em
  `relatorios.js`.
- Toda cor nova precisa passar em contraste (mínimo 4,5:1 para texto). O dourado
  puro `#C9A961` **não passa** sobre branco; usar `--brand` (`#8F6725`).

---

## 12. Identidade visual

Marca: monograma **GO** entrelaçado, dourado, sobre grafite.
Arquivos e medidas em `img/LOGO-COMO-USAR.md`.

Paleta (definida no `:root` de `app.css` e espelhada em `auth.css`):

| Token | Valor | Uso |
|---|---|---|
| `--ouro` | `#C9A961` | dourado sobre fundo escuro, detalhes, filetes |
| `--ouro-medio` | `#A87C2E` | bordas e ícones grandes |
| `--brand` | `#8F6725` | texto, links e ícones (é o que passa em contraste) |
| `--brand-700` | `#22211F` | grafite: títulos, botão principal, etapa atual |
| `--painel` | `#161513` | fundo escuro das telas de entrada |
| `--creme` | `#F0E7D2` | texto sobre grafite |
| `--bg` | `#F6F4EF` | fundo off-white quente |
| `--green` / `#1F6449` | | valores de comissão |

Títulos usam a pilha serifada `--serif` (Cormorant Garamond, com Georgia de
reserva — nenhuma fonte é baixada, para não depender de rede).

Logos por contexto: `logo-barra.svg` na barra do topo (34px de altura, é a única
legível nessa altura); `logo.svg` no splash e tela de conectar; `logo-branco.svg`
nas telas de entrada, sobre o painel escuro; `logo-icone.svg` e
`faviconlogo.ico` como favicon.

---

## 13. Atalhos do sistema

| Atalho | Ação |
|---|---|
| `Ctrl + K` | foca a busca |
| `Ctrl + S` | grava na hora |
| `Esc` | fecha o modal aberto (respeita a pilha de modais) |
| `Ctrl + Enter` | envia o comentário em digitação |
| Botão direito no cartão | menu de ações e agendamentos |
| Arrastar cartão na vertical | muda a prioridade dentro da coluna |
