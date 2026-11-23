// Bloco 5 · E-commerce — "Conversion as a game."
// Do balcão à venda directa: a prateleira do produtor alimenta um jogo de berlindes montado num
// painel perfurado. Cada rampa é uma etapa do funil; em cada comporta uns seguem, outros saem.
// Só alguns chegam à caixa de envio.
import { THREE, novoLote, poli, rotulo, fundo, caixa, plano, rng } from './nucleo.js';

// ── Medidas (unidades da cena ≈ cm) — é aqui que se afina ──────
const PAINEL = { x0: -150, x1: 150, y1: 345, z: -24 };
const W = 9, ALTO = 9, BERLINDE = 4;                   // meia-largura e altura do canal, raio do berlinde
const RAMPAS = [                                       // x0, y0 → x1, y1 (chão do canal), nome da etapa
  [-112, 262, 112, 222, 'PRODUCT PAGE'],
  [112, 192, -112, 152, 'CART'],
  [-112, 122, 112, 82, 'CHECKOUT'],
];
const FUNIL = { x: -120, yb: 280, yt: 322, rb: 12, rt: 50 };
const CAIXA = { x0: 138, x1: 196, y: 46, z0: -18, z1: 26 };
// ───────────────────────────────────────────────────────────────

const P = {
  taxa: 0.46, visitas: 54,
  furos: true, rotulos: true, produtos: true, fluxo: true, cotas: true, semente: 27,   // semente escolhida pelo Nuno, 22.11.2026
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  painel: { n: 'secundaria' },
  furo: { n: 'fundo' },
  canal: { n: 'principal' },
  nervura: { n: 'secundaria' },
  objecto: { n: 'conteudo' },
  berlinde: { n: 'principal', destaque: true },
  fluxo: { n: 'imaterial', dash: [4, 3] },
  produto: { n: 'conteudo' },
  cota: { n: 'cota' },
};
const pct = v => v >= 0.1 ? `${Math.round(v * 100)}%` : `${(v * 100).toFixed(1)}%`;

// percurso de um berlinde: devolve os pontos e onde fica cada comporta
function percurso() {
  const pts = [[FUNIL.x, FUNIL.yb - 4, 0]], comportas = [];
  RAMPAS.forEach(([x0, y0, x1, y1], k) => {
    const s = Math.sign(x1 - x0);
    pts.push([x0, y0 + BERLINDE, 0], [x1, y1 + BERLINDE, 0]);
    comportas.push(pts.length - 1);
    const prox = RAMPAS[k + 1];
    if (prox) pts.push([x1 + s * 6, y1 - 6, 0], [prox[0], prox[1] + BERLINDE + 2, 0]);
  });
  const [, , xf, yf] = RAMPAS.at(-1);
  pts.push([xf + 10, yf - 6, 0], [(CAIXA.x0 + CAIXA.x1) / 2, CAIXA.y + 6, (CAIXA.z0 + CAIXA.z1) / 2], [(CAIXA.x0 + CAIXA.x1) / 2, 12, (CAIXA.z0 + CAIXA.z1) / 2]);
  return { pts, comportas };
}
const BANDEJAS = [[118, 40], [-118, 40], [118, 40]];    // onde cai quem sai em cada comporta (x, z)

function montar(P, { berlindes = null } = {}) {
  const lote = novoLote(), r = rng(P.semente * 7);
  const lin = (est, ...pts) => poli(lote, est, pts.flat());
  const circ = (est, [cx, cy, cz], rr, eixo = 'y', n = 20) => {
    const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a) * rr, s = Math.sin(a) * rr; p.push(eixo === 'y' ? [cx + c, cy, cz + s] : eixo === 'z' ? [cx + c, cy + s, cz] : [cx, cy + s, cz + c]); }
    lin(est, ...p);
  };
  const quad = (est, a, b, c, d, comFundo = true) => plano(lote, est, [a, b, c, d], comFundo);
  const berlinde = ([x, y, z]) => { circ('berlinde', [x, y, z], BERLINDE, 'z', 14); circ('berlinde', [x, y, z], BERLINDE, 'x', 14); };
  const torno = (perfil, x, y, z, est = 'produto') => {           // objecto de revolução: perfil [[raio, altura]]
    perfil.forEach(([rr, h]) => circ(est, [x, y + h, z], rr, 'y', 18));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; lin(est, ...perfil.map(([rr, h]) => [x + Math.cos(a) * rr, y + h, z + Math.sin(a) * rr])); }
    const g = new THREE.LatheGeometry(perfil.map(([rr, h]) => new THREE.Vector2(rr, h)), 18); g.translate(x, y, z); fundo(lote, g);
  };
  const garrafa = (x, y, z, e = 1) => torno([[0, 0], [6, 0], [6, 20], [2.4, 26], [2.2, 33], [2.6, 34]].map(([a, b]) => [a * e, b * e]), x, y, z);
  const frasco = (x, y, z) => torno([[0, 0], [7, 0], [7, 11], [7.6, 11.5], [7.6, 14.5], [0, 14.5]], x, y, z);

  // painel perfurado
  const { x0, x1, y1, z } = PAINEL;
  quad('painel', [x0, 0, z], [x1, 0, z], [x1, y1, z], [x0, y1, z]);
  if (P.furos) for (let x = x0 + 15; x < x1; x += 20) for (let y = 15; y < y1; y += 20) circ('furo', [x, y, z + 0.2], 2, 'z', 10);
  lin('painel', [x0 - 40, 0, 60], [x1 + 70, 0, 60]);                    // linha de chão

  // funil de entrada
  const f = FUNIL;
  for (const t of [0, 0.33, 0.66, 1]) circ('canal', [f.x, f.yb + (f.yt - f.yb) * t, 0], f.rb + (f.rt - f.rb) * t, 'y', 32);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; lin('canal', [f.x + Math.cos(a) * f.rb, f.yb, Math.sin(a) * f.rb], [f.x + Math.cos(a) * f.rt, f.yt, Math.sin(a) * f.rt]); }
  { const g = new THREE.CylinderGeometry(f.rt, f.rb, f.yt - f.yb, 32, 1, true); g.translate(f.x, (f.yb + f.yt) / 2, 0); fundo(lote, g); }
  const nf = Math.min(P.visitas, 24);
  for (let i = 0; i < nf; i++) { const a = r() * Math.PI * 2, rr = r() * 30, h = f.yt - 12 + r() * 10; berlinde([f.x + Math.cos(a) * rr * 0.9, h, Math.sin(a) * rr * 0.6]); }
  lin('objecto', [f.x - 4, f.yb, z], [f.x - 4, f.yb, -f.rb]);         // suporte ao painel

  // rampas em canal, com nervuras e suportes
  RAMPAS.forEach(([xa, ya, xb, yb, nome], k) => {
    const A = (zz, dy = 0) => [xa, ya + dy, zz], B = (zz, dy = 0) => [xb, yb + dy, zz];
    for (const zz of [-W, W]) { lin('canal', A(zz), B(zz)); lin('canal', A(zz, ALTO), B(zz, ALTO)); }
    lin('canal', A(-W, ALTO), A(-W), A(W), A(W, ALTO));
    quad('canal', A(-W), B(-W), B(W), A(W), true);
    quad('canal', A(-W), B(-W), B(-W, ALTO), A(-W, ALTO), true);
    quad('canal', A(W), B(W), B(W, ALTO), A(W, ALTO), true);
    for (let t = 0.1; t < 0.96; t += 0.1) {
      const x = xa + (xb - xa) * t, y = ya + (yb - ya) * t;
      lin('nervura', [x, y + ALTO, -W], [x, y, -W], [x, y, W], [x, y + ALTO, W]);
    }
    for (const t of [0.2, 0.8]) {                                   // esquadros de fixação ao painel
      const x = xa + (xb - xa) * t, y = ya + (yb - ya) * t;
      lin('objecto', [x, y, -W], [x, y, z], [x, y - 14, z], [x, y, -W]);
    }
    // comporta no fim: um lado segue, o outro sai
    const s = Math.sign(xb - xa), xg = xb + s * 6;
    lin('canal', [xg, yb + ALTO + 4, -W], [xg, yb - 8, -W]); lin('canal', [xg, yb + ALTO + 4, W], [xg, yb - 8, W]);
    lin('objecto', [xg, yb + ALTO + 2, -W], [xg - s * 8, yb + 1, W * 0.2]);    // a pá da comporta
    const prox = RAMPAS[k + 1];
    if (prox) {                                                    // tubo até à rampa seguinte
      for (const zz of [-W, W]) lin('canal', [xg - s * 2, yb - 8, zz], [prox[0] - s * 2, prox[1] + ALTO, zz]);
    }
    const [bx, bz] = BANDEJAS[k];
    if (P.fluxo) lin('fluxo', [xg, yb, W], [xg, yb, bz], [bx, 14, bz]);
    const taxa = Math.pow(P.taxa, k + 1);
    if (P.rotulos) rotulo(lote, `${nome} · ${pct(taxa)}`, [xg + s * 10, yb + ALTO + 8, 0], s > 0 ? 0 : 1, 'cota');
  });
  if (P.rotulos) rotulo(lote, 'VISITS · 100%', [f.x, f.yt + 14, 0], 0.5, 'cota');

  // bandejas de quem sai
  const bandejas = new Map();
  BANDEJAS.forEach(([bx, bz]) => { const k = `${bx},${bz}`; if (!bandejas.has(k)) bandejas.set(k, [bx, bz]); });
  for (const [bx, bz] of bandejas.values()) {
    caixa(lote, 'objecto', [bx - 16, 0, bz - 12], [bx + 16, 14, bz + 12], false);
    if (P.rotulos) rotulo(lote, 'LEFT', [bx, 0, bz + 20], 0.5, 'cota');
  }
  [[-118, 40, 9], [118, 40, 12]].forEach(([bx, bz, n]) => { for (let i = 0; i < n; i++) berlinde([bx - 11 + (i % 4) * 7.3, BERLINDE + Math.floor(i / 4) * 6, bz - 5 + (i % 2) * 8]); });

  // caixa de envio, aberta, com uma garrafa
  const C = CAIXA, cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2;
  caixa(lote, 'objecto', [C.x0, 0, C.z0], [C.x1, C.y, C.z1]);
  const ab = 18, ang = 0.5;
  quad('objecto', [C.x0, C.y, C.z1], [C.x1, C.y, C.z1], [C.x1, C.y + ab * Math.cos(ang), C.z1 + ab * Math.sin(ang)], [C.x0, C.y + ab * Math.cos(ang), C.z1 + ab * Math.sin(ang)]);
  quad('objecto', [C.x0, C.y, C.z0], [C.x1, C.y, C.z0], [C.x1, C.y + ab * Math.cos(ang), C.z0 - ab * Math.sin(ang)], [C.x0, C.y + ab * Math.cos(ang), C.z0 - ab * Math.sin(ang)]);
  lin('objecto', [cx, 0, C.z1], [cx, C.y, C.z1]);                           // fita
  garrafa(cx + 8, 0.5, cz, 1.3);
  if (P.rotulos) rotulo(lote, `ORDER · ${pct(Math.pow(P.taxa, RAMPAS.length))}`, [C.x1 + 8, C.y / 2, C.z1], 0, 'cota');

  // a prateleira do produtor
  if (P.produtos) {
    const sx0 = -285, sx1 = -185, sz0 = -16, sz1 = 18;
    for (const [x, zz] of [[sx0, sz0], [sx1, sz0], [sx0, sz1], [sx1, sz1]]) lin('objecto', [x, 0, zz], [x, 170, zz]);
    [6, 60, 114, 168].forEach(y => caixa(lote, 'objecto', [sx0, y - 2, sz0], [sx1, y, sz1]));
    [[-268, 6], [-250, 6], [-232, 6], [-208, 6]].forEach(([x, y], i) => i < 3 ? garrafa(x, y, 0) : frasco(x, y, 0));
    [[-266, 60], [-244, 60], [-222, 60], [-200, 60]].forEach(([x, y]) => frasco(x, y, 0));
    caixa(lote, 'produto', [-275, 114, -8], [-255, 132, 8]); caixa(lote, 'produto', [-250, 114, -8], [-232, 128, 8]);
    garrafa(-212, 114, 0);
    if (P.rotulos) rotulo(lote, 'SHELF', [(sx0 + sx1) / 2, 186, 0], 0.5, 'cota');
    if (P.fluxo) {                                                     // da prateleira para o funil
      const p0 = [-235, 180, 0], p1 = [-235, 345, 0], p2 = [f.x - f.rt - 6, f.yt + 6, 0], pts = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; pts.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1], 0]); }
      lin('fluxo', ...pts);
      lin('fluxo', [p2[0] - 9, p2[1] + 5, 0], p2, [p2[0] - 4, p2[1] + 10, 0]);
      if (P.rotulos) rotulo(lote, 'ONLINE', [-212, 312, 0], 0.5, 'cota');
    }
  }

  // cotas do painel
  if (P.cotas) {
    const zc = z - 0.1;
    lin('cota', [x0, -14, zc], [x1, -14, zc]); for (const x of [x0, x1]) lin('cota', [x - 3, -11, zc], [x + 3, -17, zc]);
    rotulo(lote, String(x1 - x0), [0, -22, zc], 0.5);
    lin('cota', [x1 + 14, 0, zc], [x1 + 14, y1, zc]); for (const y of [0, y1]) lin('cota', [x1 + 11, y - 3, zc], [x1 + 17, y + 3, zc]);
    rotulo(lote, String(y1), [x1 + 20, y1 / 2, zc], 0);
  }

  // berlindes em jogo (animação)
  if (berlindes) berlindes.forEach(berlinde);
  return lote;
}

// animação: cada berlinde desce até à comporta onde sai, e cai na bandeja
const CAMINHO = percurso();
function posicao(t, saida) {
  const { pts, comportas } = CAMINHO;
  const fim = saida < comportas.length ? comportas[saida] + 1 : pts.length;
  const seq = pts.slice(0, fim);
  if (saida < comportas.length) {
    const [g] = [pts[comportas[saida]]], [bx, bz] = BANDEJAS[saida], s = saida % 2 ? -1 : 1;
    seq.push([g[0] + s * 8, g[1], W + 4], [bx, 20, bz], [bx, BERLINDE, bz]);
  }
  let d = t * 130;
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1], b = seq[i], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (d <= l) { const u = d / l; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
    d -= l;
  }
  return null;                                           // já chegou: deixa de se desenhar
}

function animar(P, t) {
  if (P.animacao !== 'jogo') return;
  const r = rng(P.semente * 31), N = P.visitas, periodo = N * 0.45 + 7, tt = t % periodo, bs = [];
  for (let i = 0; i < N; i++) {
    let saida = 0; while (saida < RAMPAS.length && r() < P.taxa) saida++;
    const ti = tt - i * 0.45;
    if (ti < 0) continue;
    const p = posicao(ti, saida);
    if (p) bs.push(p);
  }
  return { movel: (() => { const l = novoLote(); bs.forEach(([x, y, z]) => {
    for (const eixo of ['z', 'x']) { const pts = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI * 2, c = Math.cos(a) * BERLINDE, s = Math.sin(a) * BERLINDE; pts.push(...(eixo === 'z' ? [x + c, y + s, z] : [x, y + s, z + c])); } poli(l, 'berlinde', pts); }
  }); return l; })() };
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'ecommerce', titulo: 'Funil', P, ESTILOS, montar, animar,
  // no site: câmara e animação escolhidas pelo Nuno na bancada (22.11.2026), enquadradas na moldura "site desktop"
  SITE: { pos: [279.4, 538.2, 743.2], alvo: [-22.9, 150.4, -4.1], aspecto: 713 / 662, animacao: 'jogo' },
  // estilo próprio (Nuno, 23.11.2026): traço 0,65, estruturas 1,65, painel e furos mais presentes, fluxo a 0,53
  ESTILO: { nome: 'E-commerce', espessura: 0.65, rotulo: 15.5, reforco: 1.8, niveis: {
    principal: { w: 1.65, op: 1 }, conteudo: { w: .9, op: .9 }, secundaria: { w: 1.85, op: .45 },
    cota: { w: 1.45, op: .22 }, imaterial: { w: .65, op: .53 }, fundo: { w: .8, op: .16 } } },
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [480, 420, 640], alvo: [-40, 165, 0] },
    frente:      { nome: 'Frente',      pos: [-40, 170, 1000], alvo: [-40, 170, 0] },
    lado:        { nome: 'Lado',        pos: [950, 190, 120],  alvo: [-40, 170, 0] },
    detalhe:     { nome: 'Comporta',    fixa: true, pos: [230, 280, 190], alvo: [115, 215, 0] },
  },
  ANIMACOES: [['jogo', 'Jogo']],
  CICLOS: { jogo: P => P.visitas * 0.45 + 7 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['taxa', 'Passam em cada etapa', 0.1, 0.8, 0.01],
    ['visitas', 'Visitas (berlindes)', 5, 80, 1],
  ],
  CHKS: [['furos', 'Furos do painel'], ['rotulos', 'Etapas e percentagens'], ['produtos', 'Prateleira do produtor'],
    ['fluxo', 'Linhas de fluxo'], ['cotas', 'Cotas']],
};
