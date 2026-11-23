// Núcleo dos motivos 3D: o que as bancadas (_tmp-motivos/) e o site partilham.
// Ferramentas para as cenas desenharem (lotes de linhas), o estilo de linha comum
// e o Desenho, que transforma um lote em objectos three.js com o traço e as cores certas.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export { THREE };

// cores da maquete do site (21.11.2026). No site, a linha e o contraste vêm das variáveis CSS
// (--texto e --cor3, esta sorteada pela Home); nas bancadas usam-se estas.
export const CORES = { fundo: 0x23231F, linha: 0xF2F1E8, contraste: 0x8484FD };
export const hex = c => '#' + c.toString(16).padStart(6, '0').toUpperCase();
export const deHex = s => parseInt(String(s).trim().replace('#', ''), 16);

// ── Lote: o que uma cena devolve ───────────────────────────────
// polys: linhas por estilo (cada uma é [x,y,z, x,y,z, …]) · fundos: superfícies que escondem · rotulos: texto
export function novoLote() { return { polys: {}, rotulos: [], fundos: [] }; }
export function poli(lote, est, pts) { (lote.polys[est] ??= []).push(pts); }
export function seg(lote, est, a, b) { poli(lote, est, [...a, ...b]); }
// alfa (0–1) multiplica a opacidade do estilo: serve para um rótulo desvanecer numa animação
export function rotulo(lote, txt, pos, ancora = 0.5, est = 'cota', alfa = 1) { lote.rotulos.push({ txt, pos, ancora, est, alfa }); }
export function fundo(lote, geo) { lote.fundos.push(geo); }
export function junta(...lotes) {
  const l = novoLote();
  for (const o of lotes) if (o) {
    for (const [k, v] of Object.entries(o.polys)) (l.polys[k] ??= []).push(...v);
    l.rotulos.push(...o.rotulos); l.fundos.push(...o.fundos);
  }
  return l;
}
// Caixa: 12 arestas e, se pedido, superfície que esconde o que está atrás
export function caixa(lote, est, a, b, comFundo = true) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b;
  const P = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
  poli(lote, est, [...P[0], ...P[1], ...P[2], ...P[3], ...P[0]]);
  poli(lote, est, [...P[4], ...P[5], ...P[6], ...P[7], ...P[4]]);
  for (let i = 0; i < 4; i++) seg(lote, est, P[i], P[i + 4]);
  if (comFundo) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0) || 1e-3, Math.abs(y1 - y0) || 1e-3, Math.abs(z1 - z0) || 1e-3);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    fundo(lote, g);
  }
}
// Polígono plano: contorno e, se pedido, superfície (triangulada em leque — só para formas convexas ou quase)
export function plano(lote, est, pts, comFundo = true) {
  const f = pts.flat(); poli(lote, est, [...f, ...pts[0]]);
  if (comFundo) {
    const idx = []; for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(f, 3)); g.setIndex(idx);
    fundo(lote, g);
  }
}
export function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ── Estilo comum: seis níveis de linha ─────────────────────────
// Cada linha de cada cena pertence a um nível (ESTILOS[k].n). O traço e a opacidade vêm daqui.
// espessura: multiplicador geral do traço (px) · rotulo: altura do texto em px por cada 1000 px de altura da imagem
// reforco: multiplicador do traço das linhas em contraste (ESTILOS[k].destaque)
export const NIVEIS = {
  principal:  'Principal · contornos, estruturas',
  conteudo:   'Conteúdo · objectos, gráficos',
  secundaria: 'Secundária · grelhas, planos',
  cota:       'Cotas, guias, figuras',
  imaterial:  'Imaterial · luz, olhar, fluxo',
  fundo:      'Fundo · grelhas finas, furos',
};
export const PREDEF = {
  // escolhido pelo Nuno a 22.11.2026 para os seis blocos (substitui o de 21.11)
  dpx: { nome: 'DPX', espessura: 1, rotulo: 15.5, reforco: 1.5, niveis: {
    principal: { w: 1, op: 1 }, conteudo: { w: .5, op: .9 }, secundaria: { w: .6, op: .34 },
    cota: { w: 1, op: .31 }, imaterial: { w: .7, op: .32 }, fundo: { w: .3, op: .1 } } },
  tecnico: { nome: 'Técnico', espessura: 1.1, rotulo: 12, niveis: {
    principal: { w: 1, op: 1 }, conteudo: { w: .85, op: .9 }, secundaria: { w: .7, op: .45 },
    cota: { w: .7, op: .65 }, imaterial: { w: .6, op: .32 }, fundo: { w: .6, op: .15 } } },
  grafico: { nome: 'Gráfico', espessura: 1.7, rotulo: 14, niveis: {
    principal: { w: 1, op: 1 }, conteudo: { w: .8, op: .95 }, secundaria: { w: .55, op: .5 },
    cota: { w: .5, op: .7 }, imaterial: { w: .5, op: .4 }, fundo: { w: .45, op: .12 } } },
  monolinha: { nome: 'Monolinha', espessura: 1, rotulo: 11, niveis: {
    principal: { w: 1, op: .95 }, conteudo: { w: 1, op: .9 }, secundaria: { w: 1, op: .7 },
    cota: { w: 1, op: .7 }, imaterial: { w: 1, op: .5 }, fundo: { w: 1, op: .3 } } },
};

// ── Desenho: do lote para objectos three.js ────────────────────
// Guarda os materiais de cada estilo da cena e os dois grupos (estático e móvel).
export class Desenho {
  constructor(ESTILOS, { estilo = PREDEF.dpx, cores = {}, ocultas = () => true, fonte = 'Azeret Mono' } = {}) {
    this.ESTILOS = ESTILOS; this.cores = { ...CORES, ...cores }; this.ocultas = ocultas; this.fonte = fonte;
    this.MAT = {}; this.cacheRot = new Map(); this.res = [1, 1, 1, 1];
    this.MAT_FUNDO = new THREE.MeshBasicMaterial({ color: this.cores.fundo, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    this.grupoE = new THREE.Group(); this.grupoM = new THREE.Group();
    this.aplicaEstilo(estilo);
  }
  corDe(e) { return (e.destaque && this.estilo.contraste !== false) ? this.cores.contraste : this.cores.linha; }
  // as linhas em contraste ganham traço (× reforço) e nunca ficam abaixo de 0,9 de opacidade
  aplicaEstilo(estilo) {
    this.estilo = estilo;
    for (const [k, e] of Object.entries(this.ESTILOS)) {
      const nv = estilo.niveis[e.n] || estilo.niveis.cota, reforca = e.destaque && estilo.contraste !== false;
      e.op = reforca ? Math.max(nv.op, 0.9) : nv.op; e.w = nv.w * (reforca ? (estilo.reforco ?? 2) : 1);
      if (!this.MAT[k]) {
        const [ds, gs] = Array.isArray(e.dash) ? e.dash : [2.2, 1.6];
        this.MAT[k] = new LineMaterial({ color: this.corDe(e), transparent: true, opacity: e.op, linewidth: 1,
          dashed: !!e.dash, dashSize: ds, gapSize: gs, worldUnits: false });
      }
    }
    this.acerta(...this.res);
  }
  setCores(cores) { Object.assign(this.cores, cores); this.MAT_FUNDO.color.setHex(this.cores.fundo); this.acerta(...this.res); }
  // resolução do desenho (px CSS) e densidade; escala engrossa o traço nas exportações maiores
  acerta(w, h, dpr = 1, escala = 1) {
    this.res = [w, h, dpr, escala];
    for (const [k, e] of Object.entries(this.ESTILOS)) {
      const m = this.MAT[k]; if (!m) continue;
      m.resolution.set(w * dpr, h * dpr);
      m.opacity = e.op; m.color.setHex(this.corDe(e));
      m.linewidth = e.w * this.estilo.espessura * dpr * escala;
    }
  }
  // rótulos com altura fixa: fracção da altura da imagem, igual em todas as cenas e exportações
  fracRotulo() { return this.estilo.rotulo / 1000; }
  escalaRotulos(cam) {
    const a = 2 * this.fracRotulo() / cam.projectionMatrix.elements[5];
    for (const g of [this.grupoE, this.grupoM]) for (const o of g.children) if (o.isSprite) o.scale.set(a * o.material.userData.aspecto, a, 1);
  }
  matRotulo(txt, op, cor) {
    const chave = txt + '|' + op + '|' + cor;
    if (this.cacheRot.has(chave)) return this.cacheRot.get(chave);
    const c = document.createElement('canvas'), ctx = c.getContext('2d'), px = 64;
    ctx.font = `${px}px "${this.fonte}"`;
    c.width = Math.ceil(ctx.measureText(txt).width) + 8; c.height = px * 1.3;
    ctx.font = `${px}px "${this.fonte}"`; ctx.fillStyle = hex(cor); ctx.textBaseline = 'middle';
    ctx.fillText(txt, 4, c.height / 2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, sizeAttenuation: false });
    m.userData.aspecto = c.width / c.height;
    this.cacheRot.set(chave, m); return m;
  }
  poe(grupo, lote, cam) {
    grupo.traverse(o => { if (!o.isSprite && o.geometry) o.geometry.dispose(); });
    grupo.clear();
    if (!lote) return;
    if (this.ocultas()) for (const g of lote.fundos) grupo.add(new THREE.Mesh(g, this.MAT_FUNDO));
    else lote.fundos.forEach(g => g.dispose());
    for (const [est, polys] of Object.entries(lote.polys)) {
      if (!polys.length || !this.MAT[est]) continue;
      const s = [];
      for (const p of polys) for (let i = 0; i + 5 < p.length; i += 3) s.push(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5]);
      const geo = new LineSegmentsGeometry(); geo.setPositions(s);
      const l = new LineSegments2(geo, this.MAT[est]);
      if (this.ESTILOS[est].dash) l.computeLineDistances();
      grupo.add(l);
    }
    for (const r of lote.rotulos) {
      const e = this.ESTILOS[r.est], op = Math.round(e.op * (r.alfa ?? 1) * 20) / 20;   // em passos de 5%, para a cache não crescer
      if (op <= 0) continue;
      const sp = new THREE.Sprite(this.matRotulo(r.txt, op, this.corDe(e)));
      sp.center.set(r.ancora, 0.5);
      sp.position.set(r.pos[0], r.pos[1] + 0.3, r.pos[2]);
      grupo.add(sp);
    }
    if (cam) this.escalaRotulos(cam);
  }
  limpa() {
    for (const g of [this.grupoE, this.grupoM]) { g.traverse(o => { if (!o.isSprite && o.geometry) o.geometry.dispose(); }); g.clear(); }
    Object.values(this.MAT).forEach(m => m.dispose()); this.MAT_FUNDO.dispose();
    for (const m of this.cacheRot.values()) { m.map?.dispose(); m.dispose(); }
    this.cacheRot.clear();
  }
}

// ── Enquadramento: o desenho enche o quadro ────────────────────
// Mantém a direcção da câmara (o ângulo escolhido) e ajusta só a distância e o centro, até o
// lote ocupar o quadro com uma margem curta (Nuno, 22.11.2026: "o máximo de espaço disponível").
// lote: o desenho completo · pos/alvo: a câmara escolhida · aspecto: largura/altura do quadro
// margem: fracção do quadro a ocupar (0,92), ou { x, y } em separado (o site passa uma reserva fixa em px)
export function enquadrar(lote, pos, alvo, aspecto, { fov = 30, margem = 0.92 } = {}) {
  const pts = [];
  for (const polys of Object.values(lote.polys)) for (const p of polys) for (let i = 0; i + 2 < p.length; i += 9) pts.push(new THREE.Vector3(p[i], p[i + 1], p[i + 2]));
  for (const r of lote.rotulos) pts.push(new THREE.Vector3(...r.pos));
  const t = new THREE.Vector3(...alvo), dir = new THREE.Vector3(...pos).sub(t);
  let d = dir.length(); dir.normalize();
  if (!pts.length) return { pos: [...pos], alvo: [...alvo] };
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 1, 1e7), v = new THREE.Vector3();
  const dx = new THREE.Vector3(), dy = new THREE.Vector3(), tanMeio = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  for (let it = 0; it < 8; it++) {
    cam.position.copy(t).addScaledVector(dir, d); cam.lookAt(t); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { v.copy(p).project(cam); if (v.z > 1) continue; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ex = (x1 - x0) / 2, ey = (y1 - y0) / 2;
    dx.setFromMatrixColumn(cam.matrixWorld, 0); dy.setFromMatrixColumn(cam.matrixWorld, 1);
    const h = d * tanMeio;                               // meia-altura do quadro à distância do alvo
    t.addScaledVector(dx, cx * h * aspecto).addScaledVector(dy, cy * h);
    const mx = typeof margem === 'number' ? margem : margem.x, my = typeof margem === 'number' ? margem : margem.y;
    d *= Math.max(ex / mx, ey / my);
  }
  const p = t.clone().addScaledVector(dir, d);
  return { pos: p.toArray(), alvo: t.toArray() };
}
