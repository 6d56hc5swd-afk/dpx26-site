// Bloco 3 · Exhibitions and spaces — "Space as narrative."
// Planta de museografia em axonometria: três salas, percurso numerado, vitrines,
// painéis gráficos, parede de título, projecção, luz e figuras à escala.
import { THREE, novoLote, poli, seg, rotulo, fundo, caixa, plano, rng } from './nucleo.js';

// ── Medidas da sala (metros) — é aqui que se afina ─────────────
const L = 16, F = 10;          // comprimento (x) e fundo (z) do espaço
const T = 0.25, TD = 0.15;     // espessura das paredes exteriores e das divisórias
const DIV = [                  // divisórias: x, e vãos (z de/até)
  { x: 5,  vao: [6.5, 8] },
  { x: 11, vao: [2, 3.5] },
];
const ENTRADA = [1, 2.6], SAIDA = [13.4, 15];   // vãos na parede da frente (x)
const SALAS = [['A · PROLOGUE', 2.5], ['B · COLLECTION', 8], ['C · EPILOGUE', 13.5]];
const PERCURSO = [[1.8, 11.4], [1.8, 8.6], [2.5, 7.4], [4.2, 7.25], [5.8, 7.25], [6.0, 6.2], [6.0, 2.3],
  [10.2, 2.3], [11, 2.75], [12.6, 3.6], [15.2, 4.7], [15.2, 6.8], [14.2, 8.4], [14.2, 11.4]];   // contorna o banco da sala C
const PARAGENS = [[2.5, 7.4], [6.0, 4.6], [8.2, 2.3], [12.6, 3.6]];
// O percurso desenhado (Nuno, 22.11.2026): linha contínua, cantos arredondados, interrompida nas paragens.
const RAIO_CANTO = 0.9, RAIO_PARAGEM = 0.32, FOLGA = 0.07;
const CAMINHO = (() => {
  const out = [PERCURSO[0]];
  for (let i = 1; i < PERCURSO.length - 1; i++) {
    const a = PERCURSO[i - 1], b = PERCURSO[i], c = PERCURSO[i + 1];
    const la = Math.hypot(b[0] - a[0], b[1] - a[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]), r = Math.min(RAIO_CANTO, la / 2, lc / 2);
    const p = [b[0] + (a[0] - b[0]) * r / la, b[1] + (a[1] - b[1]) * r / la], q = [b[0] + (c[0] - b[0]) * r / lc, b[1] + (c[1] - b[1]) * r / lc];
    out.push(p);
    for (let k = 1; k < 12; k++) { const t = k / 12, u = 1 - t; out.push([u * u * p[0] + 2 * u * t * b[0] + t * t * q[0], u * u * p[1] + 2 * u * t * b[1] + t * t * q[1]]); }
    out.push(q);
  }
  out.push(PERCURSO.at(-1));
  const d = [out[0]];                                   // pontos de 10 em 10 cm
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1));
    for (let k = 1; k <= n; k++) d.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return d;
})();
const ACUM = [0]; for (let i = 1; i < CAMINHO.length; i++) ACUM.push(ACUM[i - 1] + Math.hypot(CAMINHO[i][0] - CAMINHO[i - 1][0], CAMINHO[i][1] - CAMINHO[i - 1][1]));
const COMPRIMENTO = ACUM.at(-1);
// ponto e direcção a uma distância d do início
function noCaminho(d) {
  let i = 1; while (i < ACUM.length - 1 && ACUM[i] < d) i++;
  const a = CAMINHO[i - 1], b = CAMINHO[i], u = (d - ACUM[i - 1]) / ((ACUM[i] - ACUM[i - 1]) || 1);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])];
}
// cada paragem assenta no ponto mais próximo da linha arredondada
const PARAGENS_C = PARAGENS.map(([x, z]) => CAMINHO.reduce((m, p) => Math.hypot(p[0] - x, p[1] - z) < Math.hypot(m[0] - x, m[1] - z) ? p : m));
const foraDasParagens = ([x, z], margem = 0) => PARAGENS_C.every(([cx, cz]) => Math.hypot(x - cx, z - cz) > RAIO_PARAGEM + FOLGA + margem);
const S = 30;                  // metros → unidades da cena
// ───────────────────────────────────────────────────────────────

const P = {
  alturaFundo: 4, alturaFrente: 0.4, alturaDivisorias: 2.4, vitrines: 3,
  percurso: true, graficos: true, luz: true, figuras: true, cotas: true, grelhaChao: true, semente: 5,
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  parede: { n: 'principal' },
  corte: { n: 'secundaria' },
  chao: { n: 'secundaria' },
  grelha: { n: 'fundo' },
  objecto: { n: 'conteudo' },
  vidro: { n: 'secundaria', dash: [3, 2.5] },
  grafico: { n: 'conteudo' },
  percurso: { n: 'principal', destaque: true },
  luz: { n: 'imaterial', dash: [4, 4] },
  figura: { n: 'cota' },
  cota: { n: 'cota' },
};

function montar(P, { f = 1 } = {}) {
  const lote = novoLote();
  const V = (x, y, z) => [(x - L / 2) * S, y * f * S, (z - F / 2) * S];
  const linha = (est, ...pts) => poli(lote, est, pts.flatMap(p => V(...p)));
  const circulo = (est, [cx, cy, cz], r, eixo = 'y', n = 28) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
      pts.push(eixo === 'y' ? [cx + c, cy, cz + s] : eixo === 'z' ? [cx + c, cy + s, cz] : [cx, cy + s, cz + c]);
    }
    linha(est, ...pts);
  };
  const r = rng(P.semente * 17);

  // chão
  plano(lote, 'chao', [V(0, 0, 0), V(L, 0, 0), V(L, 0, F), V(0, 0, F)]);
  if (P.grelhaChao) {
    for (let x = 1; x < L; x++) linha('grelha', [x, 0, 0], [x, 0, F]);
    for (let z = 1; z < F; z++) linha('grelha', [0, 0, z], [L, 0, z]);
  }

  // paredes (topo tracejado em corte, como numa planta)
  const corte = (x0, z0, x1, z1, y) => {
    const p = 0.12;
    for (let c = x0 + z0 + p; c < x1 + z1; c += p) {
      const xa = Math.max(x0, c - z1), xb = Math.min(x1, c - z0);
      if (xb > xa) linha('corte', [xa, y, c - xa], [xb, y, c - xb]);
    }
  };
  const muro = (x0, z0, x1, z1, h) => { caixa(lote, 'parede', V(x0, 0, z0), V(x1, h, z1)); corte(x0, z0, x1, z1, h); };
  const hF = P.alturaFundo, hR = P.alturaFrente, hD = Math.min(P.alturaDivisorias, hF);
  muro(-T, -T, L + T, 0, hF);                       // fundo (z = 0)
  muro(-T, 0, 0, F + T, hF);                        // esquerda (x = 0)
  muro(L, 0, L + T, F + T, hR);                     // direita, cortada
  const frente = [0, ENTRADA[0], ENTRADA[1], SAIDA[0], SAIDA[1], L];
  for (let i = 0; i < frente.length; i += 2) muro(frente[i], F, frente[i + 1], F + T, hR);
  for (const d of DIV) {
    muro(d.x - TD / 2, 0, d.x + TD / 2, d.vao[0], hD);
    muro(d.x - TD / 2, d.vao[1], d.x + TD / 2, F, hD);
  }

  // gráficos num plano vertical: origem o, direcção u (no chão), alturas em y
  const naParede = (o, u) => (a, b) => [o[0] + u[0] * a, o[1] + b, o[2] + u[2] * a];
  const rect = (est, p, a0, b0, a1, b1) => linha(est, p(a0, b0), p(a1, b0), p(a1, b1), p(a0, b1), p(a0, b0));
  const imagem = (p, a0, b0, a1, b1) => { rect('grafico', p, a0, b0, a1, b1); linha('grafico', p(a0, b0), p(a1, b1)); linha('grafico', p(a0, b1), p(a1, b0)); };
  const texto = (p, a0, a1, bTopo, bBase, passo = 0.075) => {
    let resto = 3 + Math.floor(r() * 5);
    for (let b = bTopo; b >= bBase; b -= passo) {
      if (resto === 0) { resto = 3 + Math.floor(r() * 5); continue; }
      linha('grafico', p(a0, b), p(a0 + (a1 - a0) * (resto === 1 ? 0.3 + 0.5 * r() : 1), b)); resto--;
    }
  };

  // Sala A: parede de título solta, de frente para a entrada
  caixa(lote, 'parede', V(0.8, 0, 6.15), V(4.2, Math.min(3, hF), 6.35));
  if (P.graficos) {
    const p = naParede([0.8, 0, 6.36], [1, 0, 0]);
    rect('grafico', p, 0.3, 2.15, 3.1, 2.6);
    rect('grafico', p, 0.3, 1.75, 2.0, 2.05);
    texto(p, 0.3, 1.6, 1.5, 0.95); texto(p, 1.8, 3.1, 1.5, 0.95);
    // bandeira suspensa à entrada
    const b = naParede([1.2, 0, 8.9], [1, 0, 0]);
    rect('grafico', b, 0, 2.55, 1.2, 3.2);
    linha('grafico', b(0.15, 3.0), b(1.05, 3.0)); linha('grafico', b(0.15, 2.85), b(0.7, 2.85));
    linha('luz', b(0.1, 3.2), b(0.1, hF)); linha('luz', b(1.1, 3.2), b(1.1, hF));
    plano(lote, 'grafico', [V(...b(0, 2.55)), V(...b(1.2, 2.55)), V(...b(1.2, 3.2)), V(...b(0, 3.2))], true);
  }

  // Sala B: vitrines
  const n = P.vitrines;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 8 : 7.1 + i * (2.6 / (n - 1)), z = 5 + (i % 2 ? -0.5 : 0.5) * (n > 2 ? 1 : 0);
    const w = 0.45, d = 0.3;
    caixa(lote, 'objecto', V(x - w, 0, z - d), V(x + w, 0.9, z + d));
    caixa(lote, 'vidro', V(x - w + 0.02, 0.9, z - d + 0.02), V(x + w - 0.02, 1.5, z + d - 0.02), false);
    const tipo = Math.floor(r() * 3), y0 = 0.9;
    if (tipo === 0) caixa(lote, 'objecto', V(x - 0.18, y0, z - 0.13), V(x + 0.18, y0 + 0.05, z + 0.13));
    if (tipo === 1) {
      circulo('objecto', [x, y0, z], 0.11); circulo('objecto', [x, y0 + 0.32, z], 0.08);
      for (const s of [-1, 1]) linha('objecto', [x + s * 0.11, y0, z], [x + s * 0.08, y0 + 0.32, z]);
    }
    if (tipo === 2) { for (const e of ['y', 'z', 'x']) circulo('objecto', [x, y0 + 0.16, z], 0.15, e); }
    if (P.luz) {                                      // foco de luz sobre a vitrine
      const topo = [x, hF - 0.1, z];
      circulo('luz', [x, 1.5, z], 0.38);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; linha('luz', topo, [x + Math.cos(a) * 0.38, 1.5, z + Math.sin(a) * 0.38]); }
    }
  }
  // Sala B: painéis na parede do fundo
  if (P.graficos) for (let i = 0; i < 3; i++) {
    const p = naParede([5.7 + i * 1.6, 0, 0.01], [1, 0, 0]);
    rect('grafico', p, 0, 0.9, 1.3, 2.4);
    imagem(p, 0.1, 1.6, 1.2, 2.3);
    texto(p, 0.1, 0.62, 1.48, 1.0); texto(p, 0.7, 1.2, 1.48, 1.0);
  }

  // Sala C: ecrã de projecção, projector e banco
  const ecra = naParede([11.6, 0, 0.01], [1, 0, 0]);
  rect('grafico', ecra, 0, 0.8, 3.8, Math.min(3.3, hF - 0.3));
  caixa(lote, 'objecto', V(12.3, 0, 5.4), V(14.7, 0.45, 5.85));
  if (P.luz) {
    const proj = [13.5, Math.min(3.6, hF - 0.2), 7.6];
    caixa(lote, 'objecto', V(13.3, proj[1] - 0.15, 7.45), V(13.7, proj[1] + 0.05, 7.75));
    for (const [a, b] of [[0, 0.8], [3.8, 0.8], [3.8, Math.min(3.3, hF - 0.3)], [0, Math.min(3.3, hF - 0.3)]]) linha('luz', proj, ecra(a, b));
  }

  // percurso: linha contínua e arredondada no chão, setas e paragens numeradas que a interrompem
  if (P.percurso) {
    const y = 0.02;
    let troco = [];
    for (const p of CAMINHO) {
      if (foraDasParagens(p)) troco.push([p[0], y, p[1]]);
      else { if (troco.length > 1) linha('percurso', ...troco); troco = []; }
    }
    if (troco.length > 1) linha('percurso', ...troco);
    for (let d = 1.6; d < COMPRIMENTO - 1; d += 3.2) {        // setas ao longo da linha
      const [mx, mz, ang] = noCaminho(d);
      if (!foraDasParagens([mx, mz], 0.4)) continue;
      const ux = Math.cos(ang), uz = Math.sin(ang), s = 0.22;
      linha('percurso', [mx - ux * s - uz * s, y, mz - uz * s + ux * s], [mx, y, mz], [mx - ux * s + uz * s, y, mz - uz * s - ux * s]);
    }
    PARAGENS_C.forEach(([x, z], i) => { circulo('percurso', [x, y, z], RAIO_PARAGEM); rotulo(lote, String(i + 1).padStart(2, '0'), V(x, y, z), 0.5, 'percurso'); });
    rotulo(lote, 'IN', V(PERCURSO[0][0], y, PERCURSO[0][1] + 0.4), 0.5, 'percurso');
    rotulo(lote, 'OUT', V(PERCURSO.at(-1)[0], y, PERCURSO.at(-1)[1] + 0.4), 0.5, 'percurso');
    if (P.luz) {                                       // cone de visão da paragem 03 para os painéis
      const olho = [8.2, 1.6, 2.3];
      for (const a of [5.7, 10.5]) for (const b of [0.9, 2.4]) linha('luz', olho, [a, b, 0.01]);
    }
  }
  SALAS.forEach(([t, x]) => rotulo(lote, t, V(x, 0.02, 9.1), 0.5, 'cota'));

  // figuras à escala (silhuetas planas)
  if (P.figuras) for (const [x, z, rot] of [[2.9, 7.9, 0.4], [8.9, 2.9, -0.3], [13.0, 4.6, 0.9]]) {
    const forma = [[-0.2, 1.42], [0.2, 1.42], [0.25, 0.85], [0.13, 0.85], [0.12, 0], [0.02, 0], [0, 0.78], [-0.02, 0], [-0.12, 0], [-0.13, 0.85], [-0.25, 0.85]];
    const c = Math.cos(rot), s = Math.sin(rot);
    const P3 = ([a, b]) => [x + a * c, b, z + a * s];
    linha('figura', ...[...forma, forma[0]].map(P3));
    circulo('figura', P3([0, 1.58]), 0.12, 'z');
    // superfície da silhueta, para tapar o que fica atrás
    const sh = new THREE.Shape(forma.map(([a, b]) => new THREE.Vector2(a, b)));
    const cab = new THREE.Shape(); cab.absarc(0, 1.58, 0.12, 0, Math.PI * 2);
    for (const forma2 of [sh, cab]) {
      const g = new THREE.ShapeGeometry(forma2);
      const pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) { const v = V(...P3([pos.getX(k), pos.getY(k)])); pos.setXYZ(k, ...v); }
      fundo(lote, g);
    }
  }

  // cotas no chão
  if (P.cotas) {
    const y = 0;
    const tick = (x, z) => linha('cota', [x - 0.12, y, z + 0.12], [x + 0.12, y, z - 0.12]);
    const zc = F + T + 1, xs = [0, ...DIV.map(d => d.x), L];
    linha('cota', [0, y, zc], [L, y, zc]);
    xs.forEach(x => { linha('cota', [x, y, F + T + 0.3], [x, y, zc + 0.25]); tick(x, zc); });
    xs.slice(0, -1).forEach((x, i) => rotulo(lote, (xs[i + 1] - x).toFixed(2), V((x + xs[i + 1]) / 2, y, zc + 0.4), 0.5));
    linha('cota', [0, y, zc + 1], [L, y, zc + 1]); tick(0, zc + 1); tick(L, zc + 1);
    rotulo(lote, L.toFixed(2), V(L / 2, y, zc + 1.4), 0.5);
    const xc = L + T + 1;
    linha('cota', [xc, y, 0], [xc, y, F]);
    for (const z of [0, F]) { linha('cota', [L + T + 0.3, y, z], [xc + 0.25, y, z]); tick(xc, z); }
    rotulo(lote, F.toFixed(2), V(xc + 0.3, y, F / 2), 0);
    const xa = -T - 0.8, za = -T - 0.8;              // altura, no canto do fundo
    linha('cota', [xa, 0, za], [xa, hF, za]);
    for (const h of [0, hF]) { linha('cota', [xa - 0.12, h, za], [xa + 0.12, h, za]); }
    rotulo(lote, hF.toFixed(2), V(xa - 0.2, hF / 2, za), 1);
  }
  return lote;
}

// figura que percorre o percurso
function visitante(P, t) {
  const lote = novoLote(), V = (x, y, z) => [(x - L / 2) * S, y * S, (z - F / 2) * S];
  const [x, z, ang] = noCaminho((t * 1.1) % COMPRIMENTO), rot = ang + Math.PI / 2;
  const pc = []; for (let j = 0; j <= 24; j++) { const a = j / 24 * Math.PI * 2; pc.push(...V(x + Math.cos(a) * RAIO_PARAGEM, 0.03, z + Math.sin(a) * RAIO_PARAGEM)); }
  poli(lote, 'percurso', pc);                                   // círculo da posição do visitante
  const c = Math.cos(rot), s = Math.sin(rot);
  const forma = [[-0.2, 1.42], [0.2, 1.42], [0.25, 0.85], [0.13, 0.85], [0.12, 0], [-0.12, 0], [-0.13, 0.85], [-0.25, 0.85], [-0.2, 1.42]];
  poli(lote, 'percurso', forma.flatMap(([a, b]) => V(x + a * c, b, z + a * s)));
  const cab = []; for (let j = 0; j <= 20; j++) { const a = j / 20 * Math.PI * 2; cab.push(...V(x + Math.cos(a) * 0.12 * c, 1.58 + Math.sin(a) * 0.12, z + Math.cos(a) * 0.12 * s)); }
  poli(lote, 'percurso', cab);
  return lote;
}

function animar(P, t) {
  if (P.animacao === 'erguer') {
    const tt = t % 6, e0 = THREE.MathUtils.clamp(tt < 3 ? (tt - 0.5) / 2 : 1 - (tt - 4) / 1.5, 0, 1);
    return { estatico: montar(P, { f: Math.max(0.001, e0 * e0 * (3 - 2 * e0)) }) };
  }
  if (P.animacao === 'visita') return { movel: visitante(P, t) };
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'exposicoes', titulo: 'Espaço', P, ESTILOS, montar, animar,
  // no site: câmara e animação escolhidas pelo Nuno na bancada (22.11.2026), enquadradas na moldura "site desktop"
  SITE: { pos: [457, 852.5, 655.2], alvo: [0, 0, 0], aspecto: 713 / 662, animacao: 'erguer' },
  // estilo próprio (Nuno, 23.11.2026): traço geral 1,05, secundárias 1,15, cotas 1,3, luz a 0,19, fundo 0,17
  ESTILO: { nome: 'Exposições', espessura: 1.05, rotulo: 15.5, reforco: 1.5, niveis: {
    principal: { w: 1, op: 1 }, conteudo: { w: .55, op: .9 }, secundaria: { w: 1.15, op: .33 },
    cota: { w: 1.3, op: .31 }, imaterial: { w: 1.05, op: .19 }, fundo: { w: .6, op: .17 } } },
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [520, 600, 720], alvo: [0, 0, 0] },
    planta:      { nome: 'Planta',      pos: [0, 1250, 1],    alvo: [0, 0, 0] },
    alcado:      { nome: 'Alçado',      pos: [-120, 160, 980], alvo: [0, 50, 0] },
    interior:    { nome: 'Interior', fixa: true,    pos: [0, 50, 110],    alvo: [0, 40, -150] },
  },
  ANIMACOES: [['erguer', 'Erguer'], ['visita', 'Visita']],
  CICLOS: { erguer: 6, visita: COMPRIMENTO / 1.1 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['alturaFundo', 'Paredes do fundo (m)', 1, 5, 0.1],
    ['alturaFrente', 'Paredes da frente (m)', 0, 4, 0.1],
    ['alturaDivisorias', 'Divisórias (m)', 0.5, 4, 0.1],
    ['vitrines', 'Vitrines', 1, 5, 1],
  ],
  CHKS: [['percurso', 'Percurso e paragens'], ['graficos', 'Gráficos (títulos, painéis)'], ['luz', 'Luz, projecção e visão'],
    ['figuras', 'Figuras à escala'], ['cotas', 'Cotas'], ['grelhaChao', 'Grelha do chão']],
};
