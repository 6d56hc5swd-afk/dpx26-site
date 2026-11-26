# Nuno — site de portfólio (V2)

Portfólio do Nuno Rodrigues (DPX Studio, Viseu). No ar desde 21.11.2026.
Conteúdos em **EN-EU**.

**Este ficheiro guarda o COMO** (regras de construção). As decisões com
data, os pendentes e o histórico vivem em `../estado-portfolio-v2.md`; a
estrutura do projecto em `../contexto_portfolio_dpx.md`. Se divergirem
sobre uma decisão, ganha o estado. `CLAUDE.md` é um link simbólico para
aqui: editar sempre `AGENTS.md`.

A V1 (frame 9:16, Zonas, 10 páginas) está na etiqueta git **`v1`**. Nada
dela vale aqui sem decisão do Nuno.

---

## 1 · Onde vive

| | |
|---|---|
| Código | esta pasta (`Projects/Portfolio DPX/site/`), ramo `main` |
| Repositório | `github.com/6d56hc5swd-afk/dpx26-site` (**público**, ver estado) |
| Online | `https://dpx26-site.gazellecripple.workers.dev` (domínio novo por escolher) |
| Publicação | automática a cada push para `main`: Cloudflare Workers Builds (`npm run build`), ~1 min |
| Stack | Astro 7 · saída estática · three.js (pedra) · Node 24 (`.nvmrc`) |

**Fontes de verdade:** conteúdos na Notion *Portfolio V2*; **normas** (cores,
tipo, escala, espaços, regras) em `../design/normas/` desde 26.11.2026;
desenho no Figma `DPX-MIX` (`x7DPCAV9NeSz8wqlLCPz0E`, página *Portfolio
develop*, `440:2`). O site segue os três; não inventa.

---

## 2 · Estrutura

| Rota | O que é |
|---|---|
| `/` | Home: pedra de Roseta 3D + legenda |
| `/<bloco>/` | 6 blocos, slug do nome (`/editorial-design/`, …) |
| `/machine/` | versão para máquinas, mostrada a pessoas |
| `/llms.txt` · `/llms-full.txt` · `/<bloco>.md` · `/index.md` · `/resume.json` · `/sitemap.xml` · `/robots.txt` | camada para máquinas, gerada no build |

Ficheiros que importam:

- `src/data/conteudo-v2.json` — retrato da Notion. **Não editar à mão**:
  pedir um retrato novo. Títulos de projecto em itálico marcados `*assim*`.
- `src/lib/conteudo.ts` — o **único** ficheiro que lê o retrato.
  `SITE_NOME` = estúdio (DPX Studio, da Notion); `MARCA` = nome do
  portfólio (Nuno, como o logótipo).
- `src/lib/maquina.ts` — tudo o que as máquinas lêem: Markdown, llms,
  JSON-LD (schema.org), JSON Resume. Campos vazios na secção *Machine* da
  Notion não se publicam.
- `src/data/normas.json` — cópia de `../design/normas/normas.json`, feita
  por `scripts/normas.mjs` (corre antes do `dev` e do `build`; à mão:
  `npm run normas`). **Não editar a cópia.** Vai no git porque o Cloudflare
  só vê o repositório.
- `src/lib/normas.ts` — transforma as normas em variáveis CSS (`--fundo`,
  `--cor3`, `--familia`, `--t-<estilo>-corpo|entrelinha|espaco|peso|estilo`,
  `--margem-h`…), injectadas no `<head>` pelo `Base.astro`.
- `src/layouts/Base.astro` — grelha de duas colunas e estilos globais; só
  usa as variáveis das normas.
- `src/components/Painel.astro` — coluna direita (logótipo, vistas,
  blocos, bio, clientes, contactos). Persiste entre páginas
  (`transition:persist`); o bloco activo marca-se no cliente.
- `src/components/Pedra.astro` — pedra 3D e etiquetas.
- `public/icones/` — SVG tirados do Figma, **sem retoques** (vistas; logótipo
  "☺ Nuno" `logo-nuno.svg`; ícones do rodapé, da pasta *DPX26 Portfolio
  Assets*). `public/modelos/pedra.glb` — 0,9 MB.
- `src/lib/motivos/`, `src/components/Motivo.astro`, `_tmp-motivos/` —
  motivos 3D dos blocos. **Têm dono:** só a sessão "design · motivos" os
  edita; as outras lêem e usam.

**Um facto vive num sítio só:** a versão para pessoas e a para máquinas
saem do mesmo ficheiro de conteúdos. Nunca escrever um texto da Notion
directamente numa página.

---

## 3 · Layout

- **Desktop:** duas colunas separadas por um filete de 2px. A esquerda
  muda (pedra ou bloco); a direita é fixa. Os filetes de baixo das duas
  colunas alinham à mesma altura.
- **Escala:** `1rem` = 16px num ecrã de 1728×1117 (o frame do Figma);
  `font-size: min(100vw/108, 100svh/69.8)`. Tudo em `rem`, para escalar
  inteiro sem JavaScript.
- **Mobile** (`max-width: 860px` **ou** janela mais alta que larga):
  uma coluna; o conteúdo da esquerda ocupa 65,7% da altura e a coluna
  direita começa no último terço (filete a 574 de 874, como no Figma).
  `1rem` = 16px a 402 de largura.
- **Medidas vêm das normas e do Figma**, não a olho. O MCP do Figma não
  tem quota (plano Starter): pedir screenshots ao Nuno ou usar o plugin
  `../design/figma-sync/`. Conferir no browser a 1728×1117 e 402×874.

---

## 4 · Normas (cores, tipo, espaços)

**Os valores não se escrevem aqui nem no CSS.** Vivem em
`../design/normas/normas.json` (valores) e `normas.md` (regras), desde
26.11.2026. O disco manda e o Figma é espelho. Para mudar uma cor ou um
corpo: editar as normas, `npm run normas`, conferir no browser.

- No CSS usam-se só as variáveis: cores `var(--fundo|--texto|--filete|--cor3|--revisao)`,
  família `var(--familia)`, estilos `var(--t-desktop-texto-corpo)` etc.,
  espaços `var(--margem-v|--margem-h|--intervalo|--divisor|--rodape|…)`.
- **Pontos de corte** não podem ser variáveis: o texto das media queries
  tem de ser igual a `pontos_de_corte` das normas. `npm run normas` avisa
  se divergir.
- `--cor3` leva `!important` (gerado em `normas.ts`): vence cores antigas
  presas no browser.
- Os SVG que mudam de cor (vistas, logótipo) pintam-se por máscara CSS ou
  `currentColor`, sem editar o ficheiro do Figma.
- Regras de escrita (separador `·`, itálico, nomes) estão em `normas.md`.

---

## 5 · A pedra

- Modelo convertido do `.obj` de 48 MB (`../Assets/the-rosetta-stone/`)
  para `.glb` de 0,9 MB: 48 mil triângulos, textura 2048, meshopt. Teste
  e originais em `_tmp-pedra/` (fora do git).
- A orientação (de pé, face escrita à frente) está fixa em `CENTRO` e
  `ROT` no componente. A digitalização vem de costas.
- Segue o rato (~14°). Sem cursor: balanço lento; parada com
  `prefers-reduced-motion`.
- Etiquetas presas às três escritas (hieróglifos, demótico, grego),
  com traço na `--cor3`. Pontos e deslocamentos medidos no Figma.

---

## 6 · Fluxo de conteúdos

O Nuno edita na Notion e pede a actualização. O Claude lê a página pelo
MCP, escreve `conteudo-v2.json` e **mostra o que mudou antes de
publicar**. Não há token da API da Notion. O Figma sincroniza-se a pedido
com o plugin `../design/figma-sync/` (o Nuno corre-o no Figma desktop):
acerta textos e cria a página *Normas*. Cores sempre ligadas aos estilos
`Site …`, nunca hex soltos.

---

## 7 · Ambiente

- Git normal nesta pasta. Push com a deploy key:
  ```bash
  export GIT_SSH_COMMAND="ssh -i $HOME/Documents/WORK/Reposicionamento/.dpx26-deploy/id_ed25519 -o IdentitiesOnly=yes"
  ```
- Servidor de desenvolvimento: `.claude/launch.json` (`site` = astro dev
  na 4321; `site-dist` = serve o `dist/` na 4430, útil quando outra
  sessão já tem o dev server a correr).
- **Armadilhas já pagas:**
  - O Astro exige Node ≥ 22.23.4: o Cloudflare lê o `.nvmrc` (24).
  - Sem `wrangler.jsonc` a publicação falha ("Missing entry-point"): é
    ele que diz que o site é a pasta `dist/`.
  - A pedra não desenha se a área tiver tamanho zero (separador
    escondido): evita traços com NaN.

---

## 8 · Convenções

- **Várias sessões partilham esta pasta** (regras completas em
  `../contexto_portfolio_dpx.md`, "Sessões em paralelo"): trabalha-se no
  `main`, sem mudar de ramo nem fazer pull/merge/reset sem o Nuno pedir;
  commit só dos próprios ficheiros com `git commit -- <caminhos>` (nunca
  `add -A` ou `commit -a`); **push para o `main` publica, só a pedido**.

- Commits em português, com o porquê no corpo.
- Temporários com prefixo `_tmp-` (ignorados pelo git).
- Nada se apaga: o que sai vai para `~/Documents/Purgatorio/`, registado
  no `contexto_purgatorio.md`.
- Decisões primeiro, código depois. O Nuno faz o desenho; explicar
  consequências em termos de desenho e comportamento, não de sintaxe.
- No fim de cada sessão que mude alguma coisa, actualizar o
  `../estado-portfolio-v2.md`.
