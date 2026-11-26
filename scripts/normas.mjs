// Copia os valores das normas (fonte: ../design/normas/normas.json, fora do
// repositório) para src/data/normas.json, que vai no git porque o Cloudflare
// só vê o repositório. Corre sozinho antes do build e do dev; à mão:
// npm run normas. A cópia não se edita: muda-se a fonte.
// Também avisa se os pontos de corte escritos no CSS divergirem das normas
// (as media queries não aceitam variáveis).
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fonte = join(raiz, '../design/normas/normas.json');
const copia = join(raiz, 'src/data/normas.json');

if (existsSync(fonte)) {
  const txt = readFileSync(fonte, 'utf8');
  JSON.parse(txt); // falha já se a fonte estiver partida
  const antes = existsSync(copia) ? readFileSync(copia, 'utf8') : '';
  if (antes !== txt) { writeFileSync(copia, txt); console.log('normas: cópia actualizada a partir de design/normas/normas.json'); }
  else console.log('normas: cópia em dia');
} else {
  console.log('normas: fonte fora do repositório não encontrada (normal no Cloudflare); uso a cópia do git');
}

const N = JSON.parse(readFileSync(copia, 'utf8'));
const validos = [N.pontos_de_corte.coluna_unica, N.pontos_de_corte.duas_colunas];
const ficheiros = [];
const andar = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? andar(p) : /\.(astro|css)$/.test(f) && ficheiros.push(p); });
andar(join(raiz, 'src'));
let avisos = 0;
for (const f of ficheiros) {
  for (const m of readFileSync(f, 'utf8').matchAll(/@media\s+([^{]*(?:width|aspect-ratio)[^{]*)\{/g)) {
    const q = m[1].trim();
    if (!validos.includes(q)) { avisos++; console.warn(`normas: ponto de corte fora das normas em ${f.slice(raiz.length + 1)}: ${q}`); }
  }
}
if (!avisos) console.log('normas: pontos de corte iguais às normas');
