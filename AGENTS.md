# NUNO — site de portfólio (V2)

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

**Fontes de verdade:** conteúdos na Notion *Portfolio V2*; desenho no Figma
`DPX-MIX` (`x7DPCAV9NeSz8wqlLCPz0E`, página *Portfolio develop*, `440:2`).
O site segue os dois; não inventa.

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
  portfólio (NUNO, do Figma).
- `src/lib/maquina.ts` — tudo o que as máquinas lêem: Markdown, llms,
  JSON-LD (schema.org), JSON Resume. Campos vazios na secção *Machine* da
  Notion não se publicam.
- `src/layouts/Base.astro` — tokens, tipo, grelha de duas colunas,
  sorteio da cor de contraste.
- `src/components/Painel.astro` — coluna direita (logótipo, vistas,
  blocos, bio, clientes, contactos). Persiste entre páginas
  (`transition:persist`); o bloco activo marca-se no cliente.
- `src/components/Pedra.astro` — pedra 3D e etiquetas.
- `public/icones/` — SVG tirados do Figma, **sem retoques** (vistas, "O"
  do logótipo). `public/modelos/pedra.glb` — 0,9 MB.
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
- **Medidas vêm do Figma** (`get_design_context`), não a olho. Conferir
  no browser a 1728×1117 e 402×874 e comparar com o Figma ao píxel.

---

## 4 · Tokens

Estilos de pintura do Figma (desde 21.11.2026). Nomes a manter.

```
--fundo   Site Dark     #23231F
--texto   Site Light    #E8EAF2
--filete  Site Light    #E8EAF2
--cor3    Site Color 3  #8484FD   contraste
```

`--cor3` é fixa (Site Color 3 `#8484FD`); o sorteio entre três cores
acabou a 22.11.2026. Links dos blocos, como revisão de provas: por
visitar, ondulado `--revisao` `#F64724`; visitados, linha recta `--visto`
`#84FDE7` (guardados no browser, `localStorage` "nuno-visitados").
Sublinhados a 4% do corpo (mín. 1px), afastados `.2em + 3px` do texto.

Tipo: **Azeret Mono**, alojada no site (`@fontsource-variable/azeret-mono`,
WOFF2 variável). Sem Google Fonts. Estilos do Figma:

```
Desktop texto              Regular 15 / 1.5 / 1%
Desktop Bloco destaque     Regular 20 / 1.5 / 1%
Desktop Título Bloco link  Medium Italic 28 / 1.25 / 2%   (passo 44px)
Logótipo                   ExtraLight 36 / 1.33 / 12%, maiúsculas
Etiquetas da pedra         Italic 36 / 1.33 / 1%
Mobile texto               ExtraLight 12 / 1.25 / 1%
Mobile Título Bloco link   Bold Italic 14 / 1.25 / 1%    (passo 28px)
```

**Separadores: bullets (`·`), como na Notion**, nunca `|` (regra do Nuno,
22.11.2026): listas de projectos, clientes, a linha da bio, o rodapé.

Os SVG que mudam de cor (vistas, "O") pintam-se por **máscara CSS** com a
cor do tema, para não editar o ficheiro do Figma.

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
(textos via `use_figma`, preservando estilos; ligar cores aos estilos
`Site …`, nunca hex soltos).

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
