# Subir tudo pelo CMD (primeira vez)

O upload pelo navegador não sobe pastas direito — por isso faltaram
`assets`, `img` e `banco`. Pelo CMD vai tudo de uma vez.

---

## 1. Instalar o Git (só uma vez na vida)

Baixe em https://git-scm.com/download/win e instale clicando **Next** em tudo.
Depois **feche e abra o CMD de novo**, senão ele não reconhece o comando.

Para conferir se instalou, abra o CMD e digite:

```cmd
git --version
```

Se aparecer um número de versão, está pronto.

---

## 2. Abrir o CMD dentro da pasta certa

Abra a pasta onde estão o `index.html` e as pastas `assets`, `img` e `banco`.
Clique na **barra de endereço** do Explorer, apague o que estiver escrito,
digite `cmd` e aperte Enter. O CMD abre já dentro da pasta.

Confirme que você está no lugar certo digitando `dir`. Tem que listar
`index.html`, `assets`, `img` e `banco`.

---

## 3. Os comandos

Copie e cole **um bloco de cada vez**. Troque o e-mail pelo seu e-mail do GitHub.

```cmd
git init
git config user.name "Guxtavodeoliveira"
git config user.email "seu-email@exemplo.com"
git branch -M main
git remote add origin https://github.com/Guxtavodeoliveira/CRM.git
```

```cmd
git add .
git commit -m "CRM completo"
```

```cmd
git push -u origin main --force
```

Na primeira vez que você der `push`, abre uma janela do navegador pedindo para
entrar no GitHub. Faça o login e autorize — ele guarda e não pergunta mais.

O `--force` é de propósito: ele substitui aquele envio incompleto de 3 arquivos
pela versão completa. Só use `--force` nesta primeira vez.

---

## 4. Conferir

Atualize a página do repositório no GitHub. Agora deve aparecer:

```
assets/        img/        banco/
index.html     LEIA-ME.md  COMO-PUBLICAR.md
COMANDOS-GIT.md  .gitignore  publicar.bat
```

Se as pastas `assets`, `img` e `banco` estiverem lá, deu certo.

---

## Das próximas vezes: dois cliques

Toda vez que eu te mandar uma versão nova:

1. Descompacte por cima da pasta, substituindo os arquivos.
2. **Dê dois cliques em `publicar.bat`.**
3. Escreva uma descrição curta (ou só aperte Enter) e pronto.

O Cloudflare republica sozinho em cerca de um minuto.

---

## Se der erro

**`'git' não é reconhecido...`**
O Git não foi instalado, ou você não fechou e abriu o CMD depois de instalar.

**`remote origin already exists`**
Você já tinha rodado o `git remote add` antes. Use:

```cmd
git remote set-url origin https://github.com/Guxtavodeoliveira/CRM.git
```

**`Authentication failed`**
Rode `git credential-manager github login`, ou desinstale/reinstale o Git
marcando a opção *Git Credential Manager*.

**Subiu uma pasta `node_modules` gigante**
O `.gitignore` impede isso. Se já subiu antes dele existir:

```cmd
git rm -r --cached node_modules banco/node_modules
git commit -m "remove node_modules"
git push
```

---

## O que o `.gitignore` protege

Ele impede que estes arquivos subam para o GitHub:

- **`crm-dados.json`** e os backups — é onde estão os dados dos seus clientes.
  Como o repositório está **Público**, subir esse arquivo deixaria nome,
  telefone e endereço dos seus 42 clientes visíveis para qualquer pessoa.
- `node_modules/` — milhares de arquivos de dependência que não servem no site.
- Planilhas `.xlsx` que você exportar dentro da pasta.

Guarde o `crm-dados.json` **fora** da pasta do projeto. Uma pasta tipo
`Documentos\CRM-Dados` já resolve, e ainda evita apagá-lo sem querer
quando descompactar uma versão nova por cima.
