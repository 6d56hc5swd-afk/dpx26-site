// Bloco 6 · Creative direction and mentoring — "The outsider as unblocker."
// Um labirinto (o projecto, visto de dentro por quem está perto demais) e uma torre de observação
// fora dele (quem vê de fora). Da IDEA à PRODUCTION: o caminho, os becos, as notas de crítica.
import { THREE, novoLote, poli, rotulo, fundo, caixa, plano, rng } from './nucleo.js';

// ── Medidas — é aqui que se afina ──────────────────────────────
const LADO = 400;          // largura do labirinto em unidades da cena
const MODULO = 2;          // metros por célula (só para as cotas)
const T = 0.07;            // meia-espessura das paredes, em células
// ───────────────────────────────────────────────────────────────

const P = {
  celulas: 12, altura: 0.6, semente: 4,
  solucao: true, becos: true, notas: true, observador: true, figuras: true, cotas: true, grelha: true,
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  parede: { n: 'principal' },
  chao: { n: 'secundaria' },
  grelha: { n: 'fundo' },
  solucao: { n: 'principal', dash: [6, 4], destaque: true },
  beco: { n: 'secundaria' },
  nota: { n: 'conteudo' },
  olhar: { n: 'imaterial', dash: [4, 4] },
  estrutura: { n: 'conteudo' },
  figura: { n: 'cota' },
  cota: { n: 'cota' },
};

// labirinto por retrocesso recursivo; h[j][i] = parede horizontal na linha z = j, v[j][i] = vertical em x = i
function gera(C, R, seed) {
  const r = rng(seed * 101 + C);
  const h = Array.from({ length: R + 1 }, () => Array(C).fill(true));
  const v = Array.from({ length: R }, () => Array(C + 1).fill(true));
  const vis = Array.from({ length: R }, () => Array(C).fill(false));
  const pilha = [[0, 0]]; vis[0][0] = true;
  while (pilha.length) {
    const [i, j] = pilha.at(-1);
    const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b, a, b]).filter(([x, z]) => x >= 0 && z >= 0 && x < C && z < R && !vis[z][x]);
    if (!viz.length) { pilha.pop(); continue; }
    const [x, z, a, b] = viz[Math.floor(r() * viz.length)];
    if (a === 1) v[j][i + 1] = false; if (a === -1) v[j][i] = false;
    if (b === 1) h[j + 1][i] = false; if (b === -1) h[j][i] = false;
    vis[z][x] = true; pilha.push([x, z]);
  }
  v[0][0] = false; v[R - 1][C] = false;            // entrada (IDEA) e saída (PRODUCTION)
  const abertas = (i, j) => [[1, 0, !v[j][i + 1]], [-1, 0, !v[j][i]], [0, 1, !h[j + 1][i]], [0, -1, !h[j][i]]]
    .filter(([a, b, ok]) => ok && i + a >= 0 && j + b >= 0 && i + a < C && j + b < R).map(([a, b]) => [i + a, j + b]);
  // caminho mais curto (BFS)
  const ant = new Map(), fila = [[0, 0]], k = (i, j) => j * C + i; ant.set(0, null);
  while (fila.length) {
    const [i, j] = fila.shift();
    if (i === C - 1 && j === R - 1) break;
    for (const [x, z] of abertas(i, j)) if (!ant.has(k(x, z))) { ant.set(k(x, z), [i, j]); fila.push([x, z]); }
  }
  const caminho = []; let c = [C - 1, R - 1];
  while (c) { caminho.unshift(c); c = ant.get(k(...c)); }
  const noCaminho = new Set(caminho.map(([i, j]) => k(i, j)));
  const becos = [];
  for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
    const n = abertas(i, j).length + ((i === 0 && j === 0) || (i === C - 1 && j === R - 1) ? 1 : 0);
    if (n === 1 && !noCaminho.has(k(i, j))) becos.push([i, j]);
  }
  return { h, v, caminho, becos, r };
}

const FORMA = [[-0.2, 1.42], [0.2, 1.42], [0.25, 0.85], [0.13, 0.85], [0.12, 0], [0.02, 0], [0, 0.78], [-0.02, 0], [-0.12, 0], [-0.13, 0.85], [-0.25, 0.85]];

function montar(P, { q = 1, fh = 1, alvo = null } = {}) {
  const lote = novoLote();
  const C = P.celulas, R = Math.max(4, Math.round(C * 0.7)), S = LADO / C, H = P.altura * fh;
  const { h, v, caminho, becos, r } = gera(C, R, P.semente);
  const V = (x, y, z) => [(x - C / 2) * S, y * S, (z - R / 2) * S];
  const lin = (est, ...pts) => poli(lote, est, pts.flatMap(p => V(...p)));
  const circ = (est, [cx, cy, cz], rr, eixo = 'y', n = 24) => {
    const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a) * rr, s = Math.sin(a) * rr; pts.push(eixo === 'y' ? [cx + c, cy, cz + s] : [cx + c, cy + s, cz]); }
    lin(est, ...pts);
  };
  const figura = (x, y0, z, rot, esc) => {
    const c = Math.cos(rot), s = Math.sin(rot), P3 = ([a, b]) => [x + a * c * esc, y0 + b * esc, z + a * s * esc];
    lin('figura', ...[...FORMA, FORMA[0]].map(P3));
    circ('figura', P3([0, 1.58]), 0.12 * esc, 'z', 14);
    const cab = new THREE.Shape(); cab.absarc(0, 1.58, 0.12, 0, Math.PI * 2);
    for (const sh of [new THREE.Shape(FORMA.map(([a, b]) => new THREE.Vector2(a, b))), cab]) {
      const g = new THREE.ShapeGeometry(sh), pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) pos.setXYZ(k, ...V(...P3([pos.getX(k), pos.getY(k)])));
      fundo(lote, g);
    }
  };
  const esc = 0.42;                                   // figura de 1,7 m numa célula de 2 m ≈ 0,85 células… reduzida para leitura

  // chão e grelha de módulos
  plano(lote, 'chao', [V(-0.6, 0, -0.6), V(C + 0.6, 0, -0.6), V(C + 0.6, 0, R + 0.6), V(-0.6, 0, R + 0.6)]);
  if (P.grelha) { for (let i = 1; i < C; i++) lin('grelha', [i, 0, 0], [i, 0, R]); for (let j = 1; j < R; j++) lin('grelha', [0, 0, j], [C, 0, j]); }

  // paredes (troços contínuos juntos numa só caixa)
  if (H > 0.005) {
    for (let j = 0; j <= R; j++) for (let i = 0; i < C;) {
      if (!h[j][i]) { i++; continue; }
      let k = i; while (k < C && h[j][k]) k++;
      caixa(lote, 'parede', V(i - T, 0, j - T), V(k + T, H, j + T)); i = k;
    }
    for (let i = 0; i <= C; i++) for (let j = 0; j < R;) {
      if (!v[j][i]) { j++; continue; }
      let k = j; while (k < R && v[k][i]) k++;
      caixa(lote, 'parede', V(i - T, 0, j - T), V(i + T, H, k + T)); j = k;
    }
  }

  // o caminho, da ideia à produção
  const pts = [[-1.2, 0.5], ...caminho.map(([i, j]) => [i + 0.5, j + 0.5]), [C + 1.2, R - 0.5]];
  const acum = [0]; for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const ponto = f => { const d = acum.at(-1) * f; let i = 1; while (i < acum.length - 1 && acum[i] < d) i++; const t = (d - acum[i - 1]) / (acum[i] - acum[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, i]; };
  if (P.solucao && q > 0) {
    const [xe, ze, ie] = ponto(q);
    lin('solucao', ...pts.slice(0, ie).map(([x, z]) => [x, 0.02, z]), [xe, 0.02, ze]);
    if (q < 1) circ('solucao', [xe, 0.02, ze], 0.18, 'y', 16);
    else lin('solucao', [C + 0.9, 0.02, R - 0.75], [C + 1.2, 0.02, R - 0.5], [C + 0.9, 0.02, R - 0.25]);
  }
  rotulo(lote, 'IDEA', V(-1.4, 0.02, 0.5), 1, 'nota');
  rotulo(lote, 'PRODUCTION', V(C + 1.4, 0.02, R - 0.5), 0, 'nota');

  // becos sem saída
  if (P.becos) for (const [i, j] of becos) { const x = i + 0.5, z = j + 0.5, d = 0.14; lin('beco', [x - d, 0.02, z - d], [x + d, 0.02, z + d]); lin('beco', [x - d, 0.02, z + d], [x + d, 0.02, z - d]); }

  // notas de crítica: ✓ no caminho, ? em becos
  if (P.notas) {
    [0.33, 0.66].forEach(f => { if (q >= f) { const [x, z] = ponto(f); circ('nota', [x, 0.03, z], 0.32); rotulo(lote, '✓', V(x, 0.03, z), 0.5, 'nota'); } });
    const escolhidos = [...becos].sort(() => r() - 0.5).slice(0, 3);
    escolhidos.forEach(([i, j]) => { const x = i + 0.5, z = j + 0.5; circ('nota', [x, 0.03, z], 0.32); rotulo(lote, '?', V(x, Math.max(H, 0.2) + 0.25, z), 0.5, 'nota'); lin('nota', [x, 0.03, z], [x, Math.max(H, 0.2) + 0.12, z]); });
  }

  // a equipa: figuras dentro, em becos
  if (P.figuras) [...becos].sort(() => r() - 0.5).slice(0, 3).forEach(([i, j], k) => figura(i + 0.5, 0, j + 0.5, k * 1.3, esc));

  // quem vê de fora: torre de observação no canto da frente, com escada
  if (P.observador) {
    const tx = -2.2, tz = R + 1.6, lado = 0.45, ht = Math.max(2.4, P.altura * 2.6);
    const cantos = [[tx - lado, tz - lado], [tx + lado, tz - lado], [tx + lado, tz + lado], [tx - lado, tz + lado]];
    cantos.forEach(([x, z]) => lin('estrutura', [x, 0, z], [x, ht + 0.5, z]));
    caixa(lote, 'estrutura', V(tx - lado, ht - 0.06, tz - lado), V(tx + lado, ht, tz + lado));
    lin('estrutura', ...[...cantos, cantos[0]].map(([x, z]) => [x, ht + 0.5, z]));
    for (let y = 0.5; y < ht; y += 0.6) for (let k = 0; k < 4; k++) { const a = cantos[k], b = cantos[(k + 1) % 4]; lin('estrutura', [a[0], y, a[1]], [b[0], y + 0.6 < ht ? y + 0.6 : ht, b[1]]); }
    // escada
    const ex = tx + lado + 0.35;
    for (const dz of [-0.2, 0.2]) lin('estrutura', [ex + 0.6, 0, tz + dz], [ex, ht, tz + dz]);
    for (let k = 1; k < 10; k++) { const t = k / 10; lin('estrutura', [ex + 0.6 * (1 - t), ht * t, tz - 0.2], [ex + 0.6 * (1 - t), ht * t, tz + 0.2]); }
    figura(tx, ht, tz, -0.7, esc);
    const olho = [tx, ht + 1.5 * esc, tz];
    if (alvo == null) {                               // linhas de vista para os quatro cantos
      for (const [x, z] of [[0, 0], [C, 0], [C, R], [0, R]]) lin('olhar', olho, [x, H, z]);
    } else {                                          // o olhar segue o caminho
      const [x, z] = ponto(alvo);
      circ('olhar', [x, 0.03, z], 0.55);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.3; lin('olhar', olho, [x + Math.cos(a) * 0.55, 0.03, z + Math.sin(a) * 0.55]); }
    }
  }

  // cotas
  if (P.cotas) {
    const tick = (x, z) => lin('cota', [x - 0.12, 0, z + 0.12], [x + 0.12, 0, z - 0.12]);
    const zc = -1.4;
    lin('cota', [0, 0, zc], [C, 0, zc]); tick(0, zc); tick(C, zc);
    for (const x of [0, C]) lin('cota', [x, 0, -0.75], [x, 0, zc - 0.2]);
    rotulo(lote, (C * MODULO).toFixed(2), V(C / 2, 0, zc - 0.45), 0.5);
    const xc = C + 1.4;
    lin('cota', [xc, 0, 0], [xc, 0, R]); tick(xc, 0); tick(xc, R);
    for (const z of [0, R]) lin('cota', [C + 0.75, 0, z], [xc + 0.2, 0, z]);
    rotulo(lote, (R * MODULO).toFixed(2), V(xc + 0.3, 0, R / 2), 0);
    rotulo(lote, `MODULE ${MODULO.toFixed(2)}`, V(0, 0, zc - 0.45), 0);
  }
  return lote;
}

function animar(P, t) {
  if (P.animacao === 'desbloquear') {
    const tt = t % 9, q = THREE.MathUtils.clamp((tt - 0.6) / 5.5, 0, 1), e = q * q * (3 - 2 * q);
    return { estatico: montar(P, { q: e, fh: 1 - 0.8 * e }) };
  }
  if (P.animacao === 'olhar') return { estatico: montar(P, { alvo: (t * 0.08) % 1 }) };
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'direccao', titulo: 'Labirinto', P, ESTILOS, montar, animar,
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [400, 600, 760], alvo: [-70, 20, 50] },
    planta:      { nome: 'Planta',      pos: [0, 1300, 31],   alvo: [0, 0, 30] },
    observador:  { nome: 'Do observador', fixa: true, pos: [-440, 250, 380], alvo: [20, 0, -20] },
    rasante:     { nome: 'Rasante',     pos: [-80, 70, 760],  alvo: [-40, 20, 0] },
  },
  ANIMACOES: [['desbloquear', 'Desbloquear'], ['olhar', 'Olhar']],
  CICLOS: { desbloquear: 9, olhar: 12.5 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['celulas', 'Células por lado', 6, 24, 1],
    ['altura', 'Altura das paredes', 0.2, 2, 0.05],
  ],
  CHKS: [['solucao', 'Caminho'], ['becos', 'Becos sem saída'], ['notas', 'Notas de crítica'], ['observador', 'Observador e torre'],
    ['figuras', 'Figuras dentro'], ['cotas', 'Cotas'], ['grelha', 'Grelha de módulos']],
};
