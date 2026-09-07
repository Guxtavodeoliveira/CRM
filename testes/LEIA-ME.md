# Testes

Verificação automática dos caminhos críticos. Roda **sem navegador e sem
internet**: os scripts do sistema são carregados num jsdom, e o Supabase é
simulado por um objeto que registra tudo que *seria* enviado ao banco.

## Rodar

```bash
cd testes
npm install jsdom
node smoke.js
node campos-novos.js
node relatorio-clientes.js
```

Saída esperada: `37 de 37`, `18 de 18` e `23 de 23` verificações passaram.

O `relatorio-clientes.js` cobre o relatório de clientes: filtros de etapa,
estado e cidade, a dependência da cidade em relação ao estado, as quatro
ordenações, as colunas da folha e a exportação para Excel.

As três suítes carregam também o `assets/js/segmentos.js` (a ordem dos arquivos
no array `arquivos` de cada uma é a mesma do `index.html`). Os **segmentos do
negócio** ainda não têm suíte própria em jsdom: eles foram verificados em
navegador de verdade (cadastro por funil, chips no cartão, seletor com vários
marcados, filtro segmento/estado/cidade, exclusão de segmento em uso e a
gravação no Supabase, inclusive com o banco ainda sem as tabelas novas). Ao
mexer nessa parte, confira esses caminhos na mão — ou escreva a suíte,
seguindo o modelo do `relatorio-clientes.js`.

O `campos-novos.js` cobre a mudança da ficha do cliente: campos removidos,
inscrição estadual, responsável da empresa, dados bancários, etapa automática,
a ficha em PDF e o caso do banco que ainda não recebeu o
`banco/atualizar-campos.sql`.

## O que é coberto

**Modo arquivo** (sem login, dados do `.json`)
- abertura, marca aplicada, remoções pedidas pelo dono
- `uid()` gerando UUID
- cadastro de cliente: validação, numeração, cidade travada sem estado
- atividades e comentários
- pedidos: pedido atual único, totais, comissão, percentual com vírgula
- ficha em PDF: conteúdo, comissão opcional, isolamento da impressão
- agenda: hoje / amanhã / atrasadas / período
- relatório: soma do período e planilha
- arrastar cartão respeitando a posição do marcador
- leitura de arquivos antigos e conserto de arquivo inconsistente
- regras de senha

**Modo banco** (Supabase simulado)
- carga pelo caminho real de abertura
- cliente + negócio virando um cartão só, guardando os dois ids
- gravação enviando **apenas** o que mudou
- vínculos corretos (atividade→negócio, comentário→pedido)
- ordem das operações no lançamento de pedido
- exclusões

## Por que vale manter

Os quatro bugs mais chatos do projeto foram achados aqui, não em produção:

1. arrastar cartão caindo sempre no fim da coluna;
2. `migrar.js` estourando por índice de `legacy_id` ausente e `ON CONFLICT` com
   índice parcial;
3. senha do banco com símbolos quebrando a conexão;
4. sincronização marcando cliente e negócio como alterados juntos.

## Ao adicionar recurso

Acrescente um bloco `t("descrição", () => { ... })` (ou `await ta(...)` se for
assíncrono) na seção correspondente. As funções internas do sistema ficam
disponíveis em `w.__x` — veja a lista no fim de `montar()`.

## Limitações honestas

- **Não substitui olhar a tela.** jsdom não calcula layout: não pega cor errada,
  texto cortado nem elemento fora de lugar.
- **Não fala com o Supabase real.** Erros que só aparecem contra o servidor de
  verdade (política de RLS mal escrita, coluna com nome diferente) passam
  batido. Teste no ar depois de publicar.
- Um Postgres local ajuda a testar `banco/schema.sql` e `banco/migrar.js` de
  verdade: `apt-get install postgresql`, criar um schema `auth` com a tabela
  `users` e a função `auth.uid()`, e rodar o `schema.sql`.
