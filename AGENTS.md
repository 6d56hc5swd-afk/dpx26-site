# DPX26 — site de portfólio

Portfólio do Nuno Rodrigues (DPX, Viseu). Substitui o Adobe Portfolio.
Conteúdos em **EN-EU**. Maquete no Figma `DPX-MIX`, ficheiro
`x7DPCAV9NeSz8wqlLCPz0E`.

**Este ficheiro guarda o COMO.** O porquê, as fases e o histórico vivem em
`WORK/Reposicionamento/DPX26 Portfolio/01_Roadmap-Web.md`. Se os dois
divergirem sobre uma decisão, ganha o roadmap; sobre uma regra de construção,
ganha este. `CLAUDE.md` é um link simbólico para aqui — um ficheiro, dois
nomes. Editar sempre este.

---

## 0 · Vocabulário — ler antes de tudo

**Zona 1 · Zona 2 · Zona 3** — os três painéis dentro do frame. As Zonas 1 e 2
são o par de cima; a Zona 3 é a base, fixa em todos os estados, e contém o
Hero mais o parágrafo dos blocos temáticos.

As Zonas 1 e 2 **não têm tipo fixo** — não são "a da imagem" e "a do texto".
O conteúdo troca conforme o estado da página:

| Estado | Zona 1 | Zona 2 |
|---|---|---|
| Home | imagem/animação | contactos + tagline |
| bloco temático | Nº + Legenda | Filosofia + lista de projectos |
| Nuno | bio | foto |

**Blocos temáticos** — coisa diferente: os 6 territórios de trabalho
(`FILES FESTIVAL` · `SYSTEM MINDED` · `SPACE WISE` · `EDITORIAL ATTENTION` ·
`E-SALES` · `CRUEL ADVISER`), que aparecem como um parágrafo corrido na Zona 3,
separados por `|`, com os nomes sublinhados a servir de navegação — não há
barra de menu. Sublinhado vermelho = por visitar · verde = activo/visitado.

⚠️ **Nunca chamar "bloco" a uma zona.** Era o termo antigo e foi abandonado a
12.09.2026 exactamente por se confundir com os blocos temáticos. Se aparecer
`Bloco 1/2/3` em documentação antiga ou na base Notion, é isto.

---

## 1 · Onde vive

| | |
|---|---|
| Código | `~/Documents/WORK/Reposicionamento/DPX26-site/` |
| Repositório | `github.com/6d56hc5swd-afk/dpx26-site` (privado) |
| Online | `https://dpx26-site.gazellecripple.workers.dev` |
| Publicação | automática a cada push para `main` — build no Cloudflare |
| Stack | Astro 7 · saída estática · Node fixado em 22.12 pelo `.nvmrc` |

---

## 2 · A regra de layout — não negociável

O site corre todo dentro de **um frame central vertical de 9:16**. Cresce até
bater no primeiro limite — **altura** em desktop, **largura** em mobile —
fica sempre centrado, e **nunca corta nada**.

Uma linha de CSS decide o tamanho:

```css
width: min(100svw - var(--margem)*2, (100svh - var(--margem)*2) * 0.5625);
aspect-ratio: 9 / 16;
container-type: inline-size;
```

E **tudo lá dentro mede-se em `cqw`** — percentagem da largura do frame. Tipo,
espaçamentos, raios, tudo. Assim o conjunto escala proporcional sem uma única
linha de JavaScript.

**Proibido: usar JavaScript para medir a janela e calcular escala.**
`innerWidth` mente no iOS — foi exactamente assim que a primeira versão do
teste falhou no telemóvel. O dimensionamento é do motor de layout, sempre.

Conversão, a partir do frame de referência de **495 px** de largura:
`valor_cqw = px ÷ 4.95`. Exemplo: 14 px → `2.83cqw`.

Validado em `../DPX26 Portfolio/_tmp-teste-crop.html` (descartável).

---

## 3 · Tokens

Vêm das variáveis do Figma. Nomes a manter.

```
Site Light   #F2F1E8      Site Dark    #333330
Site Color 1 #F64724      (sublinhado por visitar)
Site Color 2 #31E192      (sublinhado activo/visitado)

Site Hero       Namdhinggo SemiBold 26 / 1.1
Site txt bloco  Inter Regular 14 / 1.33 / +1
Site Lista      Inter Regular 12 / 1.45 / +1
```

Espaçamentos e tamanhos por ecrã ainda não estão fechados no Figma. Até
estarem, **não inventar nomes novos** — usar os valores medidos e assinalar.
Os estilos de texto vão ser afinados com conteúdos reais.

---

## 4 · Navegação e conteúdo

**Não é página única.** Home + páginas próprias para cada bloco temático,
Clients, Projects e Nuno. Cada uma com o seu endereço — partilhável e
indexável.

Os 6 blocos: `FILES FESTIVAL` · `SYSTEM MINDED` · `SPACE WISE` ·
`EDITORIAL ATTENTION` · `E-SALES` · `CRUEL ADVISER`.

A **imagem/animação só existe na Home** (Zona 1). É onde entra a pedra 3D (modelo em
`../DPX26 Portfolio/the-rosetta-stone/`, `.obj` de 48 MB — converter para
`.glb` comprimido, alvo < 2 MB, antes de tocar na web).

**A Notion é a fonte de verdade dos conteúdos** — textos, projectos, clientes.
O site lê a Notion no build. O Nuno muda lá, publica-se, aparece. Não duplicar
conteúdo no repositório, nem alterar a estrutura das páginas Notion.

---

## 5 · Armadilhas deste ambiente

A pasta do Nuno chega até aqui por uma ponte que **não permite apagar
ficheiros**. Consequências, todas reais:

- O `.git` vive **fora** da pasta, em `~/repos/dpx26.git`; cá dentro há só um
  ficheiro `.git` com o ponteiro. Sem isto o segundo commit falha, porque o
  git não consegue remover os seus ficheiros de bloqueio.
- A referência real do histórico é o **GitHub**. Se o ambiente for reciclado,
  recupera-se com `git clone`.
- **Falham:** `git checkout <ficheiro>`, `reset --hard`, `pull`, mudar de
  branch — tudo o que substitua ficheiros no disco.
  **Alternativa que funciona:** `git show <rev>:<ficheiro> > <ficheiro>`.
- Escrever por cima com `>` e editar com `sed -i` funcionam.
- Nada se apaga. O que sobra vai para `_to_delete/`, e é o Nuno que decide.
- **Atenção aos links simbólicos:** escrever num link escreve no alvo. Foi
  assim que a primeira versão deste ficheiro se perdeu.

Se um dia a permissão de apagar for concedida, isto tudo desaparece e o `.git`
volta para dentro do projecto.

---

## 6 · Convenções

- Ficheiros temporários e testes levam prefixo **`_tmp-`**. Sem o prefixo, o
  resíduo fica indistinguível de trabalho e sobrevive.
- Commits em português, com o contexto da decisão no corpo — não só o que
  mudou, o porquê.
- Não escrever código antes da decisão estar tomada. Código escrito cedo é
  código para deitar fora, e foi acordado assim.
- O Nuno faz webdesign, não implementação. Explicar consequências em termos de
  desenho e de comportamento, não de sintaxe.

---

## 7 · Por arrumar

- O Cloudflare publicou isto como **Worker** e não como Pages, por isso o
  `wrangler` corre `astro add cloudflare` a cada build em vez de o adaptador
  estar no repositório. Funciona, mas duplica o build. Sem urgência.
- Proporção exacta do frame: o *White Frame* do Figma está a 460×850 (0,541) e
  as *Guides* a 500×890 (0,562 ≈ 9:16). Confirmar qual manda antes de travar.

---

## 8 · Astro

Servidor de desenvolvimento em segundo plano:

```
astro dev --background
```

Gerir com `astro dev stop`, `astro dev status`, `astro dev logs`.
Documentação: https://docs.astro.build — rotas, componentes, content
collections e estilos.
