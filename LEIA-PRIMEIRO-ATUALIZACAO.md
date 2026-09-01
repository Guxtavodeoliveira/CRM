# Leia isto antes de substituir a pasta

## ATENÇÃO: não apague a pasta antiga

Agora a sua pasta `crm` tem dentro dela uma pasta **oculta chamada `.git`**.
É ela que guarda a ligação com o GitHub e faz o `publicar.bat` funcionar.

Se você **apagar a pasta e extrair a nova no lugar**, essa ligação some, e o
`publicar.bat` vai dizer *"esta pasta ainda nao foi conectada ao GitHub"*.

### O jeito certo de substituir

1. Descompacte o zip novo em qualquer lugar (a Área de Trabalho serve).
2. Abra a pasta `crm` que saiu do zip e selecione **tudo** que está dentro
   dela (Ctrl+A) — os arquivos e as pastas `assets`, `banco`, `img`, `testes`.
3. Copie (Ctrl+C).
4. Abra a sua pasta `crm` de sempre, em
   `D:\TRABALHO\...\CRM_GUSTAVO_FINAL\CRM GUSTAVO FINAL\crm`, e cole (Ctrl+V).
5. Quando o Windows perguntar, escolha **Substituir os arquivos no destino**.

Assim os arquivos são trocados e o `.git` continua no lugar.

> Se mesmo assim der o erro de "não conectada ao GitHub", não tem problema:
> é só rodar de novo os comandos do `COMANDOS-GIT.md`.

---

## Publicar

Dois cliques no **`publicar.bat`**. Ele pergunta uma descrição da mudança
(pode apertar Enter), envia para o GitHub e o Cloudflare republica sozinho em
cerca de 1 minuto.

Depois, no site, aperte **Ctrl+Shift+R** para o navegador largar a versão
antiga que ele guarda em cache.

---

## O que mudou nesta versão

**Novo relatório de clientes.** No botão *Relatórios*, agora tem duas opções:
*Vendas e comissões* (a que já existia) e *Clientes*.

O relatório de clientes abre com três filtros, todos começando em **Todos**:

- **Etapa** — todas as colunas do funil, ou apenas uma delas.
- **Estado** — só aparecem os estados onde você realmente tem cliente.
- **Cidade** — quando você escolhe um estado, a lista passa a mostrar só as
  cidades daquele estado. Trocar de estado solta a cidade automaticamente.

E um seletor de **Ordenar por**, com quatro opções: nome (A→Z),
cidade/estado, etapa do funil e cadastro mais recente.

A lista traz: número do cliente, nome, CNPJ, telefone, cidade/estado e, na
última coluna, **em qual etapa do funil ele está**. Sai em PDF pelo botão
*Imprimir* e em planilha pelo botão *Excel*.

Detalhes que valem saber:

- Quem não tem telefone fixo aparece com o celular ou o WhatsApp.
- Quem está sem endereço aparece com um traço e, na ordenação por
  cidade/estado, vai para o fim da lista.
- O botão **Limpar filtros** devolve tudo para "Todos".

---

## Ainda pendente do pacote anterior

Se você ainda não rodou o **`banco/atualizar-campos.sql`** no Supabase, faça
isso: SQL Editor → New query → colar o conteúdo do arquivo → Run. Sem ele, a
inscrição estadual e os dados bancários do cliente não são salvos na nuvem.
