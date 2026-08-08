# CRM Funil

Kanban de clientes que grava tudo em **um arquivo `.json` na pasta do seu computador**.
Nada vai para a internet: o arquivo é seu, e é ele que você leva ao trocar de máquina.

## Como abrir

1. Descompacte a pasta em algum lugar fixo (ex.: `Documentos\CRM`).
2. Dê dois cliques em **`index.html`**.
3. Use **Chrome, Edge ou Opera**. (No Firefox e no Safari o navegador não deixa gravar direto
   em arquivos; o CRM continua funcionando, mas salvando dentro do navegador — nesse caso use
   Exportar/Importar como backup.)

## Primeira vez

Na tela inicial:

- **Criar novo arquivo de dados** → escolha a pasta e o nome (sugestão: `crm-dados.json`).
- **Abrir arquivo existente** → se você já tem um `.json`, inclusive **o da versão antiga**:
  ele é lido e convertido sem perder nenhum cliente, atividade ou ordem das etapas.

Depois disso o CRM reabre sozinho no mesmo arquivo. Só na primeira vez após reiniciar o
navegador ele pede um clique em **Reconectar** — é uma exigência de segurança do navegador.

## Como os dados são salvos

- Toda alteração é gravada no arquivo automaticamente (com um atraso de ~0,2s).
- `Ctrl + S` força a gravação na hora.
- O chip no topo direito mostra em qual arquivo você está gravando; **trocar** muda de arquivo.

## Trocar de computador

Duas formas, escolha a que preferir:

1. **Levar o arquivo**: copie o `crm-dados.json` (pendrive, Drive, Dropbox) e, na outra
   máquina, abra o CRM e use *Abrir arquivo existente*.
2. **Exportar / Importar**: botão **Exportar** baixa um `crm-backup-AAAA-MM-DD.json`.
   Na outra máquina, **Importar** carrega esse arquivo. Importar substitui o funil atual,
   então ele pede confirmação antes.

Dica: se apontar o arquivo para uma pasta sincronizada (OneDrive, Google Drive, Dropbox),
você tem backup automático. Só não deixe o CRM aberto em dois computadores ao mesmo tempo.

## O que dá para fazer

**No funil**
- Arrastar cartões entre etapas; renomear, reordenar e excluir etapas.
- Buscar por nome, CNPJ, telefone, cidade, produto ou pessoa de contato.
- Filtrar por Em andamento / Ganhos / Perdidos.
- Total em R$ por etapa e no funil inteiro.

**Clique com o botão direito em um cartão**
- Abrir negócio, editar empresa;
- Agendar WhatsApp, visita, ligação, reunião, e-mail, proposta ou nota;
- Abrir a conversa no WhatsApp;
- Marcar ganho/perdido, duplicar ou excluir.

**Cadastro da empresa** (botão *Adicionar negócio* ou *Editar empresa*)
Dados básicos (nome, CNPJ, razão social, categoria, origem, responsável, setor, descrição),
negócio no funil (etapa, valor, data de início), privacidade, contatos (e-mail, WhatsApp,
telefone, celular, fax, ramal, site), endereço completo, produtos e serviços, pessoas da
empresa e redes sociais.

- O **CNPJ**, telefones e **CEP** têm máscara automática.
- Ao sair do campo CEP, o endereço é preenchido sozinho (usa o ViaCEP; se estiver sem
  internet, basta digitar à mão).
- Categoria, origem, setor, responsável e produtos guardam o que você digita e passam a
  aparecer como sugestão nos próximos cadastros.

**Ordem dos cartões**
Arraste o cartão para cima ou para baixo **dentro da mesma coluna** para definir a
prioridade. Uma linha roxa mostra onde ele vai entrar. A ordem fica salva no arquivo,
então ela volta igual quando você reabrir ou migrar de computador. Arrastando para outra
coluna, ele também entra na altura em que você soltar.

**Relatórios** (botão na barra)
Abre um menu com os relatórios disponíveis.

- **Vendas e comissões**: escolha o período no calendário (ou use os atalhos:
  este mês, mês passado, últimos 30/90 dias, este ano, tudo). Ele traz todos os
  pedidos do período agrupados por cliente, com data, número do pedido, forma de
  pagamento, valor da venda, o percentual e o valor da comissão — com subtotal por
  cliente e o total geral. Dá para desmarcar *Agrupar por cliente* e ver como lista
  corrida.
- **Imprimir / Salvar PDF**: abre a impressão do navegador já com a folha formatada
  em A4, com a logo no cabeçalho. No destino, escolha *Salvar como PDF*.
- **Excel**: baixa a mesma informação em planilha, com totais no rodapé.

**Hoje / Amanhã** (botões na barra, ao lado da busca)
Abrem o painel com as atividades agendadas do dia. O botão mostra o número de pendências.
Em *Hoje* aparece primeiro a seção **Atrasadas**, com o que passou do prazo. Em cada item
você pode marcar *Finalizar*, abrir a conversa no WhatsApp ou clicar para abrir o negócio.

**Pedidos** (aba dentro da tela do negócio)
Registra o que o cliente efetivamente fechou.

- **Pedido atual**: sempre um só. Ao lançar um novo, o anterior desce sozinho para o
  histórico — nada é apagado.
- **Novo pedido**: informe a data, e monte os itens com **produto, quantidade e preço
  unitário**. O subtotal de cada linha e o total do pedido são calculados na hora.
  O botão **+ Adicionar item** cria uma nova linha (`Enter` em qualquer campo também).
  A **forma de pagamento** é um campo livre — escreva do seu jeito ("28/56 dias",
  "Pix à vista com 5%", "boleto para 30").
- **Histórico de pedidos**: todos os anteriores, com um seletor de ordenação por
  data, número do pedido ou valor (crescente e decrescente), a soma do que já foi
  fechado, e cada pedido expandindo para mostrar os itens.
- **Comissão (%)**: informe o percentual no pedido e ele mostra os dois valores —
  **Total do pedido** e **Total comissão** —, tanto na hora de lançar quanto no card do
  pedido. No topo da aba fica o acumulado do cliente: quantos pedidos, total fechado e
  comissão gerada. Aceita vírgula (3,5) e o histórico pode ser ordenado por comissão.
- **Comentários em cada pedido**, igual às atividades: prazo de entrega, combinação de
  frete, atraso da transportadora, o que for.
- Você pode **editar** um pedido depois (mantém o número e os comentários) ou excluí-lo.
  Se excluir o pedido atual, o mais recente do histórico volta a ser o atual.
- Os produtos digitados nos pedidos viram sugestão nos próximos.

**Tela do negócio** (clique no cartão)
- Etapas em sequência, com o tempo parado na etapa atual; clique na etapa para mover.
- Perdido / Em andamento / Ganho e classificação por estrelas.
- Registrar atividade: Nota, E-mail, Ligação, WhatsApp, Proposta, Reunião, Visita — com
  prazo e opção de já marcar como concluída.
- Histórico com prazo, atraso destacado em vermelho e caixa *Finalizar*.
- **Comentários em cada atividade**: no rodapé da atividade, ao lado de *Excluir*, o botão
  *Comentários* abre a conversa daquela atividade. É onde você escreve o resumo do que
  aconteceu — como foi a visita, o que o cliente respondeu no WhatsApp, o que ficou
  combinado. Vale para qualquer tipo (visita, ligação, nota, proposta...), aceita vários
  comentários em ordem, mostra a contagem no botão e `Ctrl + Enter` envia. Assim, quando
  você agendar a próxima atividade, o histórico do que já foi feito continua registrado.
- Ações rápidas: e-mail (abre o programa de e-mail), ligação (abre o discador),
  WhatsApp (abre a conversa) e proposta.
- Valor do negócio e produtos editáveis ali mesmo; responsável, datas e descrição também.
- Dados do contato com link para o Google Maps, pessoas da empresa e redes sociais.
- Código do negócio com botão de copiar.

## Atalhos

| Atalho | O que faz |
|---|---|
| `Ctrl + K` | vai para a busca |
| `Ctrl + S` | grava no arquivo agora |
| `Esc` | fecha o modal aberto |
| Botão direito no cartão | menu de ações e agendamentos |
| `Ctrl + Enter` | envia o comentário que você está escrevendo |
| Arrastar cartão na vertical | muda a prioridade dentro da coluna |

## Arquivos da pasta

```
index.html            a tela do CRM — é este que você abre
assets/css/app.css    aparência
assets/js/util.js     formatação, máscaras, avisos, ícones
assets/js/storage.js  leitura e gravação do .json, exportar/importar
assets/js/board.js    funil, cartões, arrastar, menu do botão direito
assets/js/empresa.js  modal de cadastro/edição da empresa
assets/js/negocio.js  modal do negócio, agendamentos e comentários
assets/js/agenda.js   painel Hoje / Amanhã
assets/js/pedidos.js  aba Pedidos: pedido atual, histórico e itens
assets/js/relatorios.js  relatórios, impressão em PDF e Excel
img/                  logo, favicon e ícones
banco/                schema.sql e migrar.js (para quando ligar o Supabase)
assets/js/main.js     inicialização e atalhos
```

Pode editar o CSS à vontade: as cores estão todas no bloco `:root` no começo do `app.css`.

---

## Exportar para o Agendor

Os dois botões **AGENDOR** na barra de ferramentas geram planilhas `.xlsx`:

- **Negócios** → arquivo no layout idêntico ao modelo oficial
  `exemplo-importacao-negocios.xlsx`: uma aba chamada `Negócios` com as 16 colunas na
  ordem exata. É este que você joga no importador do Agendor. Respeita o filtro e a busca
  ativos na tela, então dá para importar em lotes.
- **Cadastros** → planilha de conferência com três abas (Empresas, Pessoas, Atividades),
  contendo tudo o que o modelo de negócios **não** carrega. Não é para importar: serve para
  você não perder nada e conferir depois.

### Como cada campo é convertido

| Coluna do Agendor | Vem de |
|---|---|
| Título do negócio | `nº - Nome` |
| CNPJ da empresa relacionada | CNPJ (com ou sem máscara, gravado como texto) |
| Nome da empresa relacionada | Nome |
| Pessoa relacionada | primeira pessoa cadastrada na empresa |
| Usuário responsável | Responsável (ou o usuário do funil) |
| Data de início / conclusão | datas reais, formato `dd/mm/aaaa` |
| Valor Total | Valor do negócio |
| Funil / Etapa | nome do funil / nome da etapa |
| Status | Em andamento · Ganho · Perdido |
| Motivo de perda | preenchido quando você marca o negócio como perdido |
| Ranking | estrelas (1 a 5) |
| Descrição | Descrição |
| Produtos e Serviços | produtos separados por vírgula |

### Antes de importar de verdade

1. No Agendor, crie o **funil** e as **etapas** com os mesmos nomes que você usa aqui,
   e os **usuários** com os mesmos nomes de responsável. Nome que não existe lá costuma
   fazer a linha ser recusada ou cair na etapa errada.
2. Teste com **2 ou 3 linhas primeiro**. Se o importador reclamar da coluna
   *Pessoa relacionada*, apague essa coluna e importe de novo — o vínculo pela empresa
   já é suficiente.
3. O modelo de negócios não importa **histórico de atividades**, nem endereço, telefones e
   redes sociais da empresa. Para esses, o Agendor tem modelos separados de Empresas e
   Pessoas — a aba *Cadastros* já tem os dados prontos para remapear.
