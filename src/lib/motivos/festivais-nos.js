// Bloco 4 · Festivals and events — versão B: "Organisation as mantra." como sistema de produção.
// Um grafo de nós, à maneira do ComfyUI, deitado sobre a mesa: entradas (marca, programa, fotos,
// patrocinadores) → paginação → tradução → formatos → exportação → pilhas de impressos e ficheiros.
// A altura de cada pilha é o volume produzido.
import { THREE, novoLote, poli, rotulo, caixa, plano, rng } from './nucleo.js';

// ── Grafo — é aqui que se afina ────────────────────────────────
// nó: x, z (canto superior esquerdo), largura, título, entradas, saídas, widgets, pré-visualização
const NOS = {
  marca:     { x: -360, z: -120, w: 84, t: 'BRAND KIT',      ins: [],                     outs: ['LOGO', 'PALETTE', 'TYPE'] },
  programa:  { x: -360, z: -40,  w: 84, t: 'PROGRAMME.CSV',  ins: [],                     outs: ['ROWS'], widgets: 1 },
  fotos:     { x: -360, z: 20,   w: 84, t: 'PHOTOS',         ins: [],                     outs: ['IMAGES'], preview: true },
  patrocin:  { x: -360, z: 110,  w: 84, t: 'SPONSORS',       ins: [],                     outs: ['LOGOS'] },
  paginacao: { x: -220, z: -60,  w: 96, t: 'LAYOUT ENGINE',  ins: ['LOGO', 'PALETTE', 'TYPE', 'DATA', 'IMAGES', 'LOGOS'], outs: ['PAGES'], widgets: 2 },
  traducao:  { x: -80,  z: -40,  w: 84, t: 'TRANSLATE',      ins: ['PAGES'],              outs: ['PT', 'EN'], widgets: 1 },
  previa:    { x: -80,  z: 40,   w: 84, t: 'PREVIEW',        ins: ['PAGES'],              outs: [], preview: true },
  formatos:  { x: 50,   z: -60,  w: 92, t: 'FORMATS',        ins: ['PT', 'EN'],           outs: ['PRINT', 'DIGITAL'], widgets: 3 },
  impressao: { x: 180,  z: -90,  w: 84, t: 'EXPORT PDF/X',   ins: ['PRINT'],              outs: ['FILES'], widgets: 1 },
  digital:   { x: 180,  z: 20,   w: 84, t: 'EXPORT PNG/MP4', ins: ['DIGITAL'],            outs: ['FILES'], widgets: 1 },
};
const LIGACOES = [            // [de, saída, para, entrada]
  ['marca', 0, 'paginacao', 0], ['marca', 1, 'paginacao', 1], ['marca', 2, 'paginacao', 2],
  ['programa', 0, 'paginacao', 3], ['fotos', 0, 'paginacao', 4], ['patrocin', 0, 'paginacao', 5],
  ['paginacao', 0, 'traducao', 0], ['paginacao', 0, 'previa', 0],
  ['traducao', 0, 'formatos', 0], ['traducao', 1, 'formatos', 1],
  ['formatos', 0, 'impressao', 0], ['formatos', 1, 'digital', 0],
];
// formatos de saída: nome, largura, fundo (proporção), quantidade base, tipo
const FORMATOS = [
  ['A0 POSTER', 30, 42, 40, 'print'], ['SOCIAL 4:5', 16, 20, 240, 'digital'], ['A3 POSTER', 21, 30, 400, 'print'],
  ['FLYER A5', 15, 21, 2000, 'print'], ['STORY 9:16', 11, 20, 240, 'digital'], ['TICKET', 20, 8, 5000, 'print'],
  ['BANNER', 42, 12, 24, 'print'], ['SCREEN 16:9', 32, 18, 60, 'digital'], ['WRISTBAND', 28, 3, 8000, 'print'],
  ['FLAG', 20, 32, 60, 'print'],
];
const PILHAS = { x: 340, z: -120, dx: 105, dz: 82, colunas: 2, k: 1.5 };   // k: ampliação das folhas
const ALT_NO = 3;            // espessura dos cartões
// ───────────────────────────────────────────────────────────────

const P = {
  formatos: 7, escala: 5.3,   // afinados pelo Nuno, 23.11.2026
  portas: false, widgets: true, previas: true, canvas: true, totais: false, semente: 6,   // quantidades ocultas (Nuno, 23.11.2026)
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  no:       { n: 'principal' },
  interior: { n: 'secundaria' },
  widget:   { n: 'conteudo' },
  porta:    { n: 'conteudo' },
  cabo:     { n: 'conteudo', destaque: true },
  pulso:    { n: 'principal', destaque: true },
  folha:    { n: 'secundaria' },
  topo:     { n: 'conteudo' },
  canvas:   { n: 'fundo' },
  cota:     { n: 'cota' },
};

const linhas = no => Math.max(no.ins.length, no.outs.length);
const fundoNo = no => 12 + linhas(no) * 7 + (no.widgets || 0) * 8 + (no.preview ? 34 : 0) + 3;
const portaIn = (no, i) => [no.x, ALT_NO + 0.3, no.z + 12 + 3.5 + i * 7];
const portaOut = (no, i) => [no.x + no.w, ALT_NO + 0.3, no.z + 12 + 3.5 + i * 7];
const fmtN = n => '×' + Math.round(n).toLocaleString('en-GB');

function bezier(a, b) {
  const dx = Math.max(30, Math.abs(b[0] - a[0]) * 0.5);
  const c1 = [a[0] + dx, a[1], a[2]], c2 = [b[0] - dx, b[1], b[2]];
  return t => { const u = 1 - t; return [0, 1, 2].map(k => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]); };
}

function pilhas(P) {
  return FORMATOS.slice(0, P.formatos).map((f, i) => {
    const col = i % PILHAS.colunas, lin = Math.floor(i / PILHAS.colunas);
    return { f, cx: PILHAS.x + col * PILHAS.dx, cz: PILHAS.z + lin * PILHAS.dz };
  });
}
function cabos(P) {                                      // todas as ligações como curvas
  const c = LIGACOES.map(([a, o, b, i]) => bezier(portaOut(NOS[a], o), portaIn(NOS[b], i)));
  for (const { f, cx, cz } of pilhas(P)) {
    const de = f[4] === 'print' ? NOS.impressao : NOS.digital;
    c.push(bezier(portaOut(de, 0), [cx - f[1] * PILHAS.k / 2 - 2, 1, cz]));
  }
  return c;
}

function montar(P, { e = 1 } = {}) {
  const lote = novoLote(), r = rng(P.semente * 19);
  const lin = (est, ...pts) => poli(lote, est, pts.flat());
  const circ = (est, [cx, cy, cz], rr, n = 16) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rr, cy, cz + Math.sin(a) * rr]); } lin(est, ...p); };
  const rrect = (est, x0, z0, x1, z1, y, rr) => {
    const p = [], canto = (cx, cz, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * Math.PI / 2; p.push([cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr]); } };
    canto(x1 - rr, z0 + rr, -Math.PI / 2); canto(x1 - rr, z1 - rr, 0); canto(x0 + rr, z1 - rr, Math.PI / 2); canto(x0 + rr, z0 + rr, Math.PI);
    p.push(p[0]); lin(est, ...p); return p;
  };
  const imagem = (x0, z0, x1, z1, y) => { lin('widget', [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]); lin('widget', [x0, y, z0], [x1, y, z1]); lin('widget', [x0, y, z1], [x1, y, z0]); };

  // a mesa: grelha de pontos do canvas
  if (P.canvas) for (let x = -400; x <= 500; x += 20) for (let z = -160; z <= 240; z += 20) { lin('canvas', [x - 1.2, 0, z], [x + 1.2, 0, z]); lin('canvas', [x, 0, z - 1.2], [x, 0, z + 1.2]); }

  // nós
  for (const no of Object.values(NOS)) {
    const x0 = no.x, x1 = no.x + no.w, z0 = no.z, z1 = no.z + fundoNo(no), y = ALT_NO;
    const topo = rrect('no', x0, z0, x1, z1, y, 4);
    rrect('interior', x0, z0, x1, z1, 0, 4);
    plano(lote, 'interior', topo.slice(0, -1).map(p => p), true);
    lin('interior', [x0, y, z0 + 12], [x1, y, z0 + 12]);
    rotulo(lote, no.t, [x0 + 5, y, z0 + 6], 0, 'cota');
    let z = z0 + 12;
    for (let i = 0; i < linhas(no); i++) {
      const zm = z + 3.5;
      if (no.ins[i]) { circ('porta', [x0, y + 0.3, zm], 2); lin('interior', [x0 + 5, y, zm], [x0 + 5 + 14 + r() * 8, y, zm]); if (P.portas) rotulo(lote, no.ins[i], [x0 + 5, y, zm], 0, 'cota'); }
      if (no.outs[i]) { circ('porta', [x1, y + 0.3, zm], 2); lin('interior', [x1 - 5, y, zm], [x1 - 5 - 14 - r() * 8, y, zm]); if (P.portas) rotulo(lote, no.outs[i], [x1 - 5, y, zm], 1, 'cota'); }
      z += 7;
    }
    if (P.widgets) for (let k = 0; k < (no.widgets || 0); k++) {
      const zw = z + 1.5, kx = x0 + 6 + (no.w - 12) * (0.2 + r() * 0.6);
      rrect('widget', x0 + 5, zw, x1 - 5, zw + 5.5, y, 2.7);
      lin('widget', [kx, y, zw + 0.8], [kx, y, zw + 4.7]);
      z += 8;
    } else z += (no.widgets || 0) * 8;
    if (no.preview && P.previas) imagem(x0 + 6, z + 2, x1 - 6, z + 31, y);
  }

  // cabos
  for (const c of cabos(P)) { const p = []; for (let i = 0; i <= 24; i++) p.push(c(i / 24)); lin('cabo', ...p); }

  // pilhas de saída: a altura é o volume
  let total = 0;
  const etiquetas = [];                               // rótulos das pilhas, arrumados depois numa coluna à direita
  pilhas(P).forEach(({ f, cx, cz }, i) => {
    const [nome, w0, d0, base] = f, w = w0 * PILHAS.k, d = d0 * PILHAS.k, n = base * P.escala, h = (10 + 17 * Math.log10(n)) * e, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    total += n * e;
    if (h < 0.3) return;
    caixa(lote, 'folha', [x0, 0, z0], [x1, h, z1]);
    const folhas = Math.min(14, Math.ceil(h / 3));
    for (let k = 1; k < folhas; k++) { const y = h * k / folhas; lin('folha', [x0, y, z1], [x1, y, z1], [x1, y, z0]); }
    lin('topo', [x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1], [x0, h, z0]);
    const m = Math.min(w, d) * 0.12;
    if (w > 6 && d > 6) imagem(x0 + m, z0 + m, x1 - m, z0 + (d - 2 * m) * 0.55 + m, h + 0.1);
    if (P.totais) etiquetas.push({ txt: `${fmtN(n * e)} ${nome}`, de: [x1, h, cz], cz });
  });
  // coluna à direita das pilhas (Nuno, 23.11.2026): vista de cima, rótulos a alturas diferentes sobrepunham-se.
  // Cada pilha liga-se por uma chamada em cotovelo à sua linha da coluna, pela ordem do fundo para a frente.
  if (P.totais) {
    const xc = PILHAS.x + PILHAS.dx * (PILHAS.colunas - 1) + 42 * PILHAS.k / 1.5 + 30, passo = 15;
    const z0 = PILHAS.z - 20, ord = etiquetas.sort((a, b) => a.cz - b.cz);
    ord.forEach((et, k) => {
      const zc = z0 + k * passo;
      lin('cota', et.de, [xc - 14, 0.5, et.cz], [xc - 6, 0.5, zc], [xc - 2, 0.5, zc]);
      rotulo(lote, et.txt, [xc, 0.5, zc], 0, 'cota');
    });
    rotulo(lote, `${fmtN(total)} OUTPUTS · ONE SYSTEM`, [xc, 0.5, z0 + ord.length * passo + 8], 0, 'cota');
  }
  return lote;
}

// animação: impulsos a correr nos cabos e pilhas a crescer
function animar(P, t) {
  if (P.animacao !== 'produzir') return;
  const per = 9, tt = t % per, e = THREE.MathUtils.clamp((tt - 0.5) / 6.5, 0, 1);
  const mov = novoLote();
  cabos(P).forEach((c, i) => {
    for (const fase of [0, 0.5]) {
      const [x, y, z] = c((t * 4 / 9 + fase + i * 0.13) % 1), p = [];
      for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI * 2; p.push(x + Math.cos(a) * 1.8, y + 0.4, z + Math.sin(a) * 1.8); }
      poli(mov, 'pulso', p);
    }
  });
  return { estatico: montar(P, { e: e * e * (3 - 2 * e) }), movel: mov };
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'festivais-nos', titulo: 'Produção', P, ESTILOS, montar, animar, aspectoMin: 1.1,
  // no site: planta vista de cima, com a animação Produzir (Nuno, 22.11.2026), enquadrada na moldura "site desktop"
  SITE: { pos: [49.4, 1582.9, 40.6], alvo: [49.4, 0, 39.4], aspecto: 713 / 662, animacao: 'produzir', inclina: false },   // planta direita: sem inclinação
  // estilo próprio (Nuno, 23.11.2026): traço geral 0,8, reforço 1,3, secundárias e cotas mais presentes (0,52 · 0,56)
  ESTILO: { nome: 'Festivais', espessura: 0.8, rotulo: 15.5, reforco: 1.3, niveis: {
    principal: { w: 1, op: 1 }, conteudo: { w: .5, op: .9 }, secundaria: { w: .6, op: .52 },
    cota: { w: 1, op: .56 }, imaterial: { w: .7, op: .32 }, fundo: { w: .3, op: .1 } } },
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [1050, 560, 420], alvo: [40, 0, 30] },
    planta:      { nome: 'Planta',      pos: [50, 1300, 41],   alvo: [50, 0, 40] },
    rasante:     { nome: 'Rasante',     pos: [-700, 140, 380], alvo: [60, 20, 0] },
    volume:      { nome: 'Volume',      fixa: true, pos: [760, 300, 520], alvo: [390, 40, 50] },
  },
  ANIMACOES: [['produzir', 'Produzir']],
  CICLOS: { produzir: 9 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['formatos', 'Formatos de saída', 3, 10, 1],
    ['escala', 'Escala da produção', 0.2, 10, 0.1],
  ],
  CHKS: [['portas', 'Nomes das portas'], ['widgets', 'Widgets'], ['previas', 'Pré-visualizações'],
    ['canvas', 'Grelha do canvas'], ['totais', 'Quantidades']],
};
