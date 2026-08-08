# O que mudou: os dados agora vêm do banco

A partir desta versão, ao abrir o sistema você entra com **e-mail e senha**, e
os dados vêm do Supabase — não mais do arquivo `crm-dados.json`.

Na prática: você abre `https://shaliach.pages.dev` de **qualquer** computador ou
do celular, faz login, e seus clientes estão lá. Sem carregar arquivo.

---

## Publicar

1. Descompacte o zip por cima da sua pasta `crm`.
2. Dois cliques em **`publicar.bat`**.
3. Espere 1 minuto e abra `https://shaliach.pages.dev`.

---

## O indicador de gravação

No topo, ao lado do seu nome, aparece um selo:

- **Salvo na nuvem** (verde) — tudo gravado
- **Salvando...** (roxo) — gravando agora
- **Erro ao salvar** (vermelho) — algo deu errado; confira a internet

Cada alteração é enviada sozinha, cerca de meio segundo depois de você parar de
mexer. E só vai o que mudou: se você alterar o valor de um negócio, o sistema
manda o negócio, não o cadastro inteiro do cliente.

---

## Uma coisa importante sobre os dados antigos

O que está no banco é o que foi migrado naquele dia. **Se você cadastrou coisas
no CRM em arquivo depois disso, elas ainda não estão no banco.**

Para trazer, rode a migração de novo, apontando para o arquivo atualizado:

```cmd
set DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.gpjjfjcyypsgmhqcpuxh.supabase.co:5432/postgres
set DB_PASSWORD=sua-senha-do-banco
set OWNER_ID=5def93d3-94d5-4f49-8b02-e2848ee7db79
node migrar.js "C:\caminho\do\crm-dados.json"
```

Rodar de novo **não duplica**: cada linha guarda o id antigo e é atualizada.

Depois disso, guarde o `crm-dados.json` como backup e pare de usá-lo — a partir
daí o banco é a fonte da verdade.

---

## Se aparecer "Não consegui carregar seus dados"

A tela oferece dois botões:

- **Tentar de novo** — recarrega. Costuma resolver quando foi queda de internet.
- **Usar arquivo local** — volta ao modo antigo, com o `.json`. Serve de
  emergência: você continua trabalhando e depois a gente sincroniza.

---

## Backup

O botão **Exportar** continua funcionando e agora baixa o que está no banco.
Vale fazer de vez em quando e guardar em outro lugar.

---

## O que ainda não existe

- **Seletor de representada/funil no topo.** O sistema abre o primeiro funil da
  sua conta. Quando você for representar a segunda marca, a gente adiciona a
  troca entre funis — o banco já está preparado para isso.
- **Convidar vendedores.** As tabelas já isolam por usuário; falta a tela para
  compartilhar um funil com outra pessoa.
