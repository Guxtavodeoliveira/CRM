# Logo — Gustavo de Oliveira · Consultoria e Representação

Opção 3 (monograma entrelaçado), nas duas versões. Jogue a pasta `img` por cima
da sua, substituindo os arquivos de mesmo nome.

---

## Os arquivos

| Arquivo | Medida | Fundo | Onde é usado hoje |
|---|---|---|---|
| `logo.svg` | 590 × 187 (3,15:1) | claro | `index.html`: splash, tela de conectar e barra de cima |
| `logo-branco.svg` | 590 × 187 (3,15:1) | escuro | `login.html`, `cadastro.html`, `recuperar-senha.html`, `nova-senha.html` |
| `logo-icone.svg` | 64 × 64 | — | favicon SVG, em todas as páginas |
| `faviconlogo.ico` | 16 / 32 / 48 / 64 | — | favicon clássico |
| `icone-180.png` | 180 × 180 | — | `apple-touch-icon` |
| `logo-barra.svg` | 601 × 68 (8,86:1) | claro | **extra** — ver observação abaixo |
| `logo-barra-branco.svg` | 601 × 68 (8,86:1) | escuro | **extra** |

O nome do arquivo continua `logo-branco.svg` porque é o que o HTML já procura —
mas o conteúdo é a versão dourada com o texto em creme, para o painel escuro.

**A pasta `img` original não subiu no upload** (chegou como arquivo vazio, o
mesmo problema que você teve no GitHub), então não deu para conferir a proporção
dos arquivos antigos. Se algo aparecer maior ou menor do que antes, é ajuste de
CSS — veja a seção seguinte.

---

## Como dimensionar no CSS

Todos os SVG têm `viewBox`, então defina **só a altura** e deixe a largura em
`auto`. Assim a proporção nunca distorce:

```css
.brand-logo      { height: 30px; width: auto; }   /* barra de cima */
.connect-logo-img{ height: 84px; width: auto; }   /* tela de conectar */
#splash img      { height: 96px; width: auto; }
.auth-marca img  { height: 108px; width: auto; }  /* telas de login */
```

Se no seu CSS atual estiver `width: 180px` em vez de altura, troque por `height`
— com a logo antiga a proporção era outra e a conta não fecha.

### Sobre a versão da barra

A logo vertical tem 3,15:1. Numa barra de 30 px de altura, a assinatura
"Consultoria e Representação" fica com menos de 3 px e vira um borrão. Por isso
existe a `logo-barra.svg`, com o monograma à esquerda e o nome em duas linhas à
direita — na barra ela fica legível. Se quiser usá-la, é uma troca de `src` na
linha 41 do `index.html`:

```html
<img src="img/logo-barra.svg" alt="Gustavo de Oliveira" class="brand-logo">
```

E no CSS: `.brand-logo { height: 34px; width: auto; }`

Se preferir não mexer, a `logo.svg` funciona na barra também — só não dá para ler
a segunda linha.

---

## Paleta: substituir o indigo pelo dourado

No começo do `assets/css/app.css` (e do `auth.css`), dentro do `:root`:

```css
--ouro:        #C9A961;   /* dourado principal */
--ouro-escuro: #A87C2E;   /* para texto e ícones sobre fundo claro */
--ouro-fundo:  #907338;   /* o segundo tom, do O do monograma */
--grafite:     #22211F;   /* texto principal */
--grafite-2:   #6E6A62;   /* texto secundário */
--painel:      #161513;   /* fundo escuro das telas de login */
--creme:       #F0E7D2;   /* texto sobre o painel escuro */
```

O nome da variável no seu CSS provavelmente é outro (algo como `--roxo` ou
`--primaria`, valendo `#4F46E5`). Troque o **valor** dela por `#A87C2E` e o
sistema inteiro muda de cor de uma vez.

Um cuidado: dourado puro (`#C9A961`) sobre branco tem contraste baixo — em
texto, link e ícone use o `--ouro-escuro`. Reserve o `--ouro` para fundo escuro,
preenchimentos e detalhes.

E nos 5 arquivos HTML, troque a linha do `theme-color`:

```html
<meta name="theme-color" content="#161513">
```

---

## Detalhe técnico

O texto já está convertido em vetor, não é texto editável. Isso é de propósito:
a logo aparece igual em qualquer computador, celular ou PDF, mesmo sem a fonte
instalada. As fontes usadas são Cormorant Garamond (nome) e Montserrat
(assinatura), as duas com licença SIL Open Font License — uso comercial
liberado, inclusive em marca.

Como é vetor, dá para ampliar até tamanho de fachada sem perder nitidez. Se
precisar de PNG em alta para gráfica ou brinde, me peça o tamanho.
