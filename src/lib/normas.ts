// Lê os valores das normas (cópia de design/normas/normas.json, feita por
// scripts/normas.mjs) e escreve-os como variáveis CSS. Os componentes usam só
// as variáveis: um valor muda-se nas normas, não aqui nem no CSS.
import N from '../data/normas.json';

type Estilo = { px: number; entrelinha: number | string; espaco: number; peso: number; italico: boolean };
type Espaco = { rem?: number; px?: number; svh?: number; css: string | null };

export const normas = N;

const rem = (px: number) => `${+(px / N.escala.rem_px).toFixed(4)}rem`;
// entrelinha: número (proporção do corpo) ou "44px" (passo fixo, passa a rem)
const entrelinha = (v: number | string) => (typeof v === 'number' ? String(v) : rem(parseFloat(v)));

function variaveis(): string[] {
  const v: string[] = [];
  for (const [nome, c] of Object.entries(N.cores)) {
    if (!c.css) continue;
    // o contraste leva !important: vence cores antigas presas no browser (sorteio até 22.11)
    v.push(`${c.css}: ${c.hex}${nome === 'contraste' ? ' !important' : ''}`);
  }
  v.push(`${N.tipo.css}: ${N.tipo.pilha}`);
  v.push(`${N.escala.desktop.css}: ${N.escala.desktop.raiz}`, `${N.escala.mobile.css}: ${N.escala.mobile.raiz}`);
  for (const e of Object.values(N.espacos) as Espaco[]) {
    if (!e.css) continue;
    v.push(`${e.css}: ${e.rem != null ? `${e.rem}rem` : e.px != null ? `${e.px}px` : `${e.svh}svh`}`);
  }
  for (const [id, e] of Object.entries(N.tipo.estilos) as [string, Estilo][]) {
    v.push(`--t-${id}-corpo: ${rem(e.px)}`, `--t-${id}-entrelinha: ${entrelinha(e.entrelinha)}`,
      `--t-${id}-espaco: ${e.espaco / 100}em`, `--t-${id}-peso: ${e.peso}`, `--t-${id}-estilo: ${e.italico ? 'italic' : 'normal'}`);
  }
  return v;
}

export const cssNormas = `:root {\n  ${variaveis().join(';\n  ')};\n}`;
