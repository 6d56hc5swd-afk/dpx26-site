// Bloco 1 · Editorial design — "Content as craft."
// Livro aberto em linha: margens, colunas, linha de base, maquete de conteúdos e cotas.
import { THREE, novoLote, poli, rotulo, fundo, junta, rng } from './nucleo.js';

// ── Medidas do livro (mm) — é aqui que se afina ────────────────
const W = 170, H = 240;                          // página
const M = { int: 16, sup: 20, ext: 24, inf: 32 }; // margens: interior, superior, exterior, inferior
const BASE = 4.5;                                // linha de base
const FOLIOS = ['12', '13'];

const P = {
  abertura: 160, curva: 0.5, folhas: 10, colunas: 6, medianiz: 5,
  linhaBase: true, maquete: true, cotas: true, semente: 7,
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  contorno: { n: 'principal' },
  pilha: { n: 'secundaria' },
  margem: { n: 'cota', dash: [2.2, 1.6] },
  grelha: { n: 'secundaria' },
  base: { n: 'fundo' },
  conteudo: { n: 'conteudo', destaque: true },
  cota: { n: 'cota' },
};
// ───────────────────────────────────────────────────────────────

// Mapa: coordenadas da página (u = mm desde a lombada, v = mm desde o topo) → 3D.
// A folha dobra a partir da lombada: phi(u) é o ângulo da folha a u mm da lombada.
function fazMapa(phi, lado = 1, desce = null) {
  const N = 300, xs = new Float32Array(N + 1), ys = new Float32Array(N + 1);
  for (let i = 1; i <= N; i++) { const f = phi(i - 0.5); xs[i] = xs[i - 1] + Math.cos(f); ys[i] = ys[i - 1] + Math.sin(f); }
  return (u, v) => {
    const uc = Math.max(0, Math.min(N - 1, u)), i = Math.floor(uc), t = uc - i;
    return [lado * (xs[i] + (xs[i + 1] - xs[i]) * t), ys[i] + (ys[i + 1] - ys[i]) * t + (desce ? desce(u) : 0), v - H / 2];
  };
}
function linha(lote, est, map, u1, v1, u2, v2) {
  const n = Math.max(1, Math.ceil(Math.hypot(u2 - u1, v2 - v1) / 3)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(...map(u1 + (u2 - u1) * t, v1 + (v2 - v1) * t)); }
  poli(lote, est, pts);
}
function folhaFundo(lote, map, u0, u1, v0, v1) {
  const nu = 60, pos = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = u0 + (u1 - u0) * i / nu; pos.push(...map(u, v0), ...map(u, v1));
    if (i < nu) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  fundo(lote, g);
}

function pagina(lote, map, lado, { estrutura = true, conteudo = true, cotas = true } = {}) {
  const dir = lado === 'dir';
  const U = x => dir ? x : W - x;                     // x de leitura → distância à lombada
  const L = (est, x1, y1, x2, y2) => linha(lote, est, map, U(x1), y1, U(x2), y2);
  const R = (est, x1, y1, x2, y2) => { L(est, x1, y1, x2, y1); L(est, x2, y1, x2, y2); L(est, x2, y2, x1, y2); L(est, x1, y2, x1, y1); };
  const rot = (txt, x, y, ancora, est = 'cota') => rotulo(lote, txt, map(U(x), y), ancora, est);

  const ml = dir ? M.int : M.ext, mr = dir ? M.ext : M.int;
  const x0 = ml, x1 = W - mr, y0 = M.sup, y1 = H - M.inf;
  const n = P.colunas, g = P.medianiz, cw = (x1 - x0 - (n - 1) * g) / n;
  const cx = i => x0 + i * (cw + g);
  const span = (a, b) => [cx(a), cx(b) + cw];
  const snap = y => y0 + Math.ceil((y - y0) / BASE - 1e-6) * BASE;

  R('contorno', 0, 0, W, H);
  if (!estrutura) return;
  R('margem', x0, y0, x1, y1);
  for (let i = 0; i < n; i++) {
    if (i > 0) L('grelha', cx(i), y0, cx(i), y1);
    if (i < n - 1) L('grelha', cx(i) + cw, y0, cx(i) + cw, y1);
  }
  if (P.linhaBase) for (let y = y0 + BASE; y < y1 - 1e-6; y += BASE) L('base', x0, y, x1, y);

  if (conteudo && P.maquete) {
    const r = rng(P.semente * 31 + (dir ? 101 : 0));
    const caixa = (xa, ya, xb, yb) => { R('conteudo', xa, ya, xb, yb); L('conteudo', xa, ya, xb, yb); L('conteudo', xa, yb, xb, ya); };
    const texto = (xa, xb, ya, yb) => {
      let y = snap(ya), resto = 3 + Math.floor(r() * 6);
      while (y <= yb + 1e-6) {
        if (resto === 0) { y += BASE; resto = 3 + Math.floor(r() * 6); continue; }
        const f = resto === 1 ? 0.25 + 0.6 * r() : 1;
        L('conteudo', xa, y, xa + (xb - xa) * f, y);
        resto--; y += BASE;
      }
    };
    const quadros = () => { for (const k of [3, 2]) if (n % k === 0 && n >= k) return k; return n; };

    L('conteudo', dir ? x1 - 30 : x0, M.sup / 2, dir ? x1 : x0 + 30, M.sup / 2);
    rot(FOLIOS[dir ? 1 : 0], dir ? x1 : x0, H - M.inf / 2, dir ? 1 : 0, 'conteudo');

    if (!dir) {
      const yi = snap(y0 + (y1 - y0) * 0.52);
      caixa(x0, y0, x1, yi - BASE * 0.5);
      const cs = Math.max(1, Math.round(n / 3)), [la, lb] = span(0, cs - 1);
      texto(la, lb, yi + BASE, yi + BASE * 3);
      const k = quadros(), s = n / k, yt = yi + BASE * 6;
      for (let q = 0; q < k; q++) { const [a, b] = span(q * s, q * s + s - 1); texto(a, b, yt, y1); }
    } else {
      R('conteudo', x0, y0, x0 + (x1 - x0) * 0.9, y0 + BASE * 2);
      R('conteudo', x0, y0 + BASE * 3, x0 + (x1 - x0) * 0.55, y0 + BASE * 5);
      const [ea, eb] = span(0, Math.max(1, Math.round(n * 2 / 3)) - 1);
      texto(ea, eb, y0 + BASE * 7, y0 + BASE * 10);
      const yf = y0 + BASE * 12;
      L('conteudo', x0, yf, x1, yf);
      const k = quadros(), s = n / k, yt = yf + BASE, yImg = snap(y1 - (y1 - y0) * 0.28);
      for (let q = 0; q < k; q++) {
        const [a, b] = span(q * s, q * s + s - 1);
        if (q === k - 1) { texto(a, b, yt, yImg - BASE * 2); caixa(a, yImg - BASE, b, y1); }
        else texto(a, b, yt, y1);
      }
    }
  }

  if (cotas && P.cotas) {
    const tick = (x, y) => L('cota', x - 1.6, y + 1.6, x + 1.6, y - 1.6);
    const horiz = (xs, y, yE, et) => {
      L('cota', xs[0], y, xs.at(-1), y);
      xs.forEach(x => { L('cota', x, yE, x, y + Math.sign(y - yE) * 2.5); tick(x, y); });
      et.forEach((t, i) => t && rot(t, (xs[i] + xs[i + 1]) / 2, y + Math.sign(y - yE) * 4.5, 0.5));
    };
    const vert = (ys, x, xE, et) => {
      L('cota', x, ys[0], x, ys.at(-1));
      ys.forEach(y => { L('cota', xE, y, x + Math.sign(x - xE) * 2.5, y); tick(x, y); });
      et.forEach((t, i) => t && rot(t, x + Math.sign(x - xE) * 3.5, (ys[i] + ys[i + 1]) / 2, Math.sign(x - xE) > 0 ? 0 : 1));
    };
    if (dir) {
      horiz([0, W], -12, -2, [String(W)]);
      horiz([0, x0, x1, W], H + 10, H + 2, [String(M.int), String(x1 - x0), String(M.ext)]);
      vert([0, y0, y1, H], W + 10, W + 2, [String(M.sup), String(y1 - y0), String(M.inf)]);
      vert([0, H], W + 26, W + 14, [String(H)]);
    } else {
      rot(`${n} COL · GUTTER ${g}`, x0, -7, 0);
      rot(`BASELINE ${BASE}`, -6, y0 + BASE, 1);
    }
  }
}

const theta = ab => (Math.PI - THREE.MathUtils.degToRad(ab)) / 2;
const GAP = 0.9;
const descida = k => u => -k * GAP * (0.4 + 0.6 * (1 - Math.exp(-u / 10)));

function montar(P, { abertura = P.abertura } = {}) {
  const lote = novoLote(), t = theta(abertura);
  const phi = u => t + P.curva * (Math.PI / 2 - t) * Math.exp(-u / 14);
  for (const [lado, s] of [['esq', -1], ['dir', 1]]) {
    const map = fazMapa(phi, s);
    pagina(lote, map, lado); folhaFundo(lote, map, 0, W, 0, H);
    for (let k = 1; k <= P.folhas; k++) {
      const mk = fazMapa(phi, s, descida(k));
      linha(lote, 'pilha', mk, 0, 0, W, 0); linha(lote, 'pilha', mk, W, 0, W, H); linha(lote, 'pilha', mk, W, H, 0, H);
      folhaFundo(lote, mk, 0, W, 0, H);
    }
    const mc = fazMapa(phi, s, descida(P.folhas + 1.5));
    const C = (u1, v1, u2, v2) => linha(lote, 'contorno', mc, u1, v1, u2, v2);
    C(0, -3, W + 3, -3); C(W + 3, -3, W + 3, H + 3); C(W + 3, H + 3, 0, H + 3); C(0, H + 3, 0, -3);
    folhaFundo(lote, mc, 0, W + 3, -3, H + 3);
  }
  return lote;
}

function folhaAVirar(P, e) {
  const lote = novoLote(), t = theta(P.abertura);
  const a = t + (Math.PI - 2 * t) * e, dobra = 0.55 * Math.sin(Math.PI * e);
  const map = fazMapa(u => a - dobra * (u / W), 1, () => 0.5);
  pagina(lote, map, 'dir', { conteudo: false, cotas: false });
  folhaFundo(lote, map, 0, W, 0, H);
  return lote;
}

function animar(P, t) {
  if (P.animacao === 'respirar') return { estatico: montar(P, { abertura: P.abertura + 12 * Math.sin(t * 0.7) }) };
  if (P.animacao === 'folhear') {
    const tt = t % 4.2, e0 = THREE.MathUtils.clamp((tt - 0.6) / 2.8, 0, 1);
    return { movel: folhaAVirar(P, e0 * e0 * (3 - 2 * e0)) };
  }
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'editorial', titulo: 'Livro', P, ESTILOS, montar, animar,
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [400, 500, 640], alvo: [10, 0, 0] },
    planta:      { nome: 'Planta',      pos: [0, 900, 1],     alvo: [10, 0, 0] },
    rasante:     { nome: 'Rasante',     pos: [-180, 80, 520], alvo: [0, 10, 0] },
    detalhe:     { nome: 'Detalhe',     pos: [70, 140, 170],  alvo: [10, 0, -30] },
  },
  ANIMACOES: [['folhear', 'Folhear'], ['respirar', 'Respirar']],
  CICLOS: { folhear: 4.2, respirar: 2 * Math.PI / 0.7 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['abertura', 'Abertura (°)', 110, 180, 1],
    ['curva', 'Curvatura na lombada', 0, 1, 0.05],
    ['folhas', 'Folhas por baixo', 0, 30, 1],
    ['colunas', 'Colunas', 1, 12, 1],
    ['medianiz', 'Medianiz (mm)', 0, 10, 0.5],
  ],
  CHKS: [['linhaBase', 'Linha de base'], ['maquete', 'Maquete de conteúdos'], ['cotas', 'Cotas']],
};
