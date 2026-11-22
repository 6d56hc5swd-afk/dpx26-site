// Bloco 2 · Information and brand systems — "Information as architecture."
// Axonometria explodida de um sistema: seis camadas empilhadas como pisos de um edifício,
// da grelha às aplicações. Cada camada assenta na de baixo.
import { THREE, novoLote, poli, rotulo, caixa, plano } from './nucleo.js';

// ── Medidas (unidades da cena) — é aqui que se afina ───────────
const W = 200, D = 140, M = 12, G = 4;   // placa, margem, medianiz
const ESPESSURA = 1.5;                   // espessura de cada placa
const CAMADAS = ['GRID', 'MARK', 'TYPE', 'TONE', 'COMPONENTS', 'APPLICATIONS'];
const NIVEIS_TIPO = ['DISPLAY', 'H1', 'H2', 'H3', 'BODY', 'CAPTION'];
// ───────────────────────────────────────────────────────────────

const P = {
  camadas: 6, separacao: 35, recuo: 0, colunas: 6, escalaTipo: 1.4,   // afinados pelo Nuno, 22.11.2026
  construcao: true, rotulos: true, ligacoes: true, cotas: true,
};
// cada linha pertence a um nível do estilo comum (ver motor.js · NIVEIS)
const ESTILOS = {
  placa: { n: 'principal', destaque: true },
  grelha: { n: 'secundaria' },
  guia: { n: 'cota', dash: [2.5, 2] },
  conteudo: { n: 'conteudo' },
  trama: { n: 'secundaria' },
  ligacao: { n: 'imaterial', dash: [3, 3] },
  cota: { n: 'cota' },
};

// A marca (abstracta, não é a DPX): quadrado com um quarto de círculo recortado e um ponto.
// Coordenadas locais: u para a direita, v para cima, meia-largura 1.
const MARCA = (() => {
  const c = [[-1, -1], [1, -1], [1, 0]];
  for (let i = 1; i < 16; i++) { const f = -Math.PI / 2 - i / 16 * Math.PI / 2; c.push([1 + Math.cos(f), 1 + Math.sin(f)]); }
  c.push([0, 1], [-1, 1], [-1, -1]);
  return c;
})();

function montar(P, { sep = P.separacao, queda = null } = {}) {
  const lote = novoLote();
  const L = (est, ...pts) => poli(lote, est, pts.flat());
  const circ = (f, est, cu, cv, r, n = 32) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push(f(cu + Math.cos(a) * r, cv + Math.sin(a) * r)); } L(est, ...p); };
  const marca = (f, est, cu, cv, R) => {
    L(est, ...MARCA.map(([u, v]) => f(cu + u * R, cv + v * R)));
    circ(f, est, cu + 0.6 * R, cv + 0.6 * R, 0.22 * R, 20);
  };
  const tramar = (f, a0, b0, a1, b1, passo, cruzada = false) => {
    for (const s of cruzada ? [1, -1] : [1]) {
      for (let c = -(b1 - b0); c < a1 - a0; c += passo) {
        // linhas a 45°: a - a0 = c + s·(b - b0) (s = -1 para a outra direcção)
        const pts = [];
        for (const b of [b0, b1]) { const a = a0 + c + (s > 0 ? b - b0 : b1 - b); pts.push([a, b]); }
        let [[xa, ya], [xb, yb]] = pts;
        // recorta ao rectângulo
        const ta = (a0 - xa) / (xb - xa), tb = (a1 - xa) / (xb - xa);
        const t0 = Math.max(0, Math.min(ta, tb)), t1 = Math.min(1, Math.max(ta, tb));
        if (t1 <= t0) continue;
        L('trama', f(xa + (xb - xa) * t0, ya + (yb - ya) * t0), f(xa + (xb - xa) * t1, ya + (yb - ya) * t1));
      }
    }
  };
  const rrect = (f, est, a0, b0, a1, b1, r) => {
    const p = [];
    const canto = (ca, cb, ang0) => { for (let i = 0; i <= 6; i++) { const a = ang0 + i / 6 * Math.PI / 2; p.push(f(ca + Math.cos(a) * r, cb + Math.sin(a) * r)); } };
    canto(a1 - r, b0 + r, -Math.PI / 2); canto(a1 - r, b1 - r, 0); canto(a0 + r, b1 - r, Math.PI / 2); canto(a0 + r, b0 + r, Math.PI);
    p.push(p[0]); L(est, ...p);
  };

  const n = Math.min(P.camadas, CAMADAS.length);
  const cantos = [[], [], [], []];
  for (let i = 0; i < n; i++) {
    const dy = queda ? queda(i) : 0;
    if (dy === null) continue;
    const y = i * sep + dy, dz = -i * P.recuo;
    const f = (a, b) => [a - W / 2, y, b - D / 2 + dz];                 // ponto na placa (b = 0 é o fundo)
    const fv = (b0) => (a, h) => [a - W / 2, y + h, b0 - D / 2 + dz];     // ponto num plano vertical em pé na placa
    const rect = (est, a0, b0, a1, b1) => L(est, f(a0, b0), f(a1, b0), f(a1, b1), f(a0, b1), f(a0, b0));

    caixa(lote, 'placa', [-W / 2, y - ESPESSURA, -D / 2 + dz], [W / 2, y, D / 2 + dz]);
    [[0, 0], [W, 0], [W, D], [0, D]].forEach(([a, b], k) => cantos[k].push(f(a, b)));

    if (P.rotulos) {
      L('cota', f(0, D), f(-16, D));
      rotulo(lote, `${String(i + 1).padStart(2, '0')} ${CAMADAS[i]}`, f(-18, D), 1, 'cota');
    }

    if (i === 0) {                                     // 01 GRID
      const nc = P.colunas, cw = (W - 2 * M - (nc - 1) * G) / nc, nr = 4, rh = (D - 2 * M - (nr - 1) * G) / nr;
      rect(P.construcao ? 'guia' : 'grelha', M, M, W - M, D - M);
      for (let c = 0; c < nc; c++) for (let r = 0; r < nr; r++) {
        const a = M + c * (cw + G), b = M + r * (rh + G);
        rect('grelha', a, b, a + cw, b + rh);
      }
      for (const [a, b] of [[4, 4], [W - 4, 4], [W - 4, D - 4], [4, D - 4]]) { L('conteudo', f(a - 3, b), f(a + 3, b)); L('conteudo', f(a, b - 3), f(a, b + 3)); }
      if (P.cotas) {
        rotulo(lote, `${nc} COL × ${nr} ROW · GUTTER ${G}`, f(M, D + 6), 0);
        L('cota', f(W + 6, 0), f(W + 6, D)); L('cota', f(0, D + 12), f(W, D + 12));
        rotulo(lote, String(D), f(W + 9, D / 2), 0); rotulo(lote, String(W), f(W / 2, D + 16), 0.5);
      }
    }

    if (i === 1) {                                     // 02 MARK — construção
      const cx = 62, cy = D / 2, R = 30;
      const fm = (u, v) => f(cx + u, cy - v);
      if (P.construcao) {
        circ(fm, 'guia', R, R, R, 48);
        L('guia', fm(-1.5 * R, 0), fm(1.5 * R, 0)); L('guia', fm(0, -1.5 * R), fm(0, 1.5 * R));
        L('guia', fm(-R, -R), fm(R, R)); L('guia', fm(-R, R), fm(R, -R));
        const x = 0.5 * R;                               // área de protecção
        L('guia', fm(-R - x, -R - x), fm(R + x, -R - x), fm(R + x, R + x), fm(-R - x, R + x), fm(-R - x, -R - x));
        if (P.rotulos) rotulo(lote, 'X', fm(-R - x / 2, R + x / 2), 0.5, 'cota');
      }
      marca(fm, 'conteudo', 0, 0, R);
      [[14, '48'], [9, '32'], [5, 'MIN 16']].forEach(([r, t], k) => {
        const ca = 128 + [0, 30, 52][k];
        marca((u, v) => f(ca + u, cy - v), 'conteudo', 0, 0, r);
        if (P.cotas) rotulo(lote, t, f(ca, cy + 22), 0.5);
      });
    }

    if (i === 2) {                                     // 03 TYPE — escala tipográfica
      // os rótulos sobem acima da placa em escada (a altura projecta-se sempre na vertical
      // do ecrã), ligados a cada linha por uma chamada — assim não se sobrepõem
      let b = M + 2;
      const comp = [0.55, 0.78, 0.66, 0.9, 0.84, 0.95];
      for (let k = 0; k < 6; k++) {
        const s = 3.6 * Math.pow(P.escalaTipo, 5 - k);
        b += s * 1.05;
        if (b > D - M) break;
        const a0 = M, a1 = a0 + (W - 2 * M - 8) * comp[k], meio = b - s * 0.35;
        if (P.construcao) { L('guia', f(M, b), f(W - M, b)); L('guia', f(a0, b - s * 0.7), f(W - M, b - s * 0.7)); }
        rect('conteudo', a0, b - s * 0.7, a1, b);
        if (k >= 4) for (let j = 1; j < 3; j++) L('conteudo', f(a0, b + j * s * 1.3), f(a0 + (a1 - a0) * (j === 2 ? 0.6 : 1), b + j * s * 1.3));
        if (P.rotulos) {                               // chamada que sobe da linha e rótulo no topo, em escada
          const ax = W - M + 4, alto = 8 + (5 - k) * 7.5;
          const topo = f(ax, meio); topo[1] += alto;
          const fim = f(ax + 5, meio); fim[1] += alto;
          L('cota', f(a1 + 2, meio), f(ax, meio), topo, fim);
          rotulo(lote, `${NIVEIS_TIPO[k]} ${Math.round(s * 4)}`, (() => { const q = f(ax + 7, meio); q[1] += alto; return q; })(), 0, 'cota');
        }
        if (k >= 4) b += 2 * s * 1.3;
        b += s * 0.45;
      }
    }

    if (i === 3) {                                     // 04 TONE — cor por trama, como num desenho técnico
      const t = [100, 80, 60, 40, 20, 0], lado = 22, esp = (W - 2 * M - 6 * lado) / 5;
      t.forEach((v, k) => {
        const a0 = M + k * (lado + esp), b0 = M + 4;
        rect('conteudo', a0, b0, a0 + lado, b0 + lado);
        if (v > 0) tramar(f, a0, b0, a0 + lado, b0 + lado, 1.2 + (100 - v) / 100 * 5, v === 100);
        if (P.rotulos) rotulo(lote, String(v), f(a0 + lado / 2, b0 + lado + 5), 0.5, 'cota');
      });
      const b0 = 68, b1 = 88, partes = [[0.6, 80], [0.3, 40], [0.1, 0]];
      let a = M;
      for (const [p, v] of partes) {
        const a1 = a + (W - 2 * M) * p;
        rect('conteudo', a, b0, a1, b1);
        if (v > 0) tramar(f, a, b0, a1, b1, 1.2 + (100 - v) / 100 * 5);
        a = a1;
      }
      if (P.rotulos) rotulo(lote, '60 · 30 · 10', f(M, b1 + 6), 0, 'cota');
      // par de contraste
      rect('conteudo', M, 104, M + 60, D - M); tramar(f, M, 104, M + 60, D - M, 1.2, true);
      rect('conteudo', M + 66, 104, M + 126, D - M);
      if (P.rotulos) rotulo(lote, 'CONTRAST ≥ 4.5:1', f(M + 132, (104 + D - M) / 2), 0, 'cota');
    }

    if (i === 4) {                                     // 05 COMPONENTS
      const cw = (W - 2 * M) / 3, ch = (D - 2 * M) / 2;
      const cel = (c, r) => [M + c * cw, M + r * ch];
      if (P.construcao) for (let c = 1; c < 3; c++) L('guia', f(M + c * cw, M), f(M + c * cw, D - M));
      if (P.construcao) L('guia', f(M, M + ch), f(W - M, M + ch));
      let [a, b] = cel(0, 0);                          // botões
      rrect(f, 'conteudo', a + 8, b + 12, a + 50, b + 23, 3); L('conteudo', f(a + 18, b + 17.5), f(a + 40, b + 17.5));
      rrect(f, 'conteudo', a + 8, b + 30, a + 50, b + 41, 5.5); L('conteudo', f(a + 18, b + 35.5), f(a + 36, b + 35.5));
      [a, b] = cel(1, 0);                              // campo de texto
      L('conteudo', f(a + 6, b + 10), f(a + 26, b + 10));
      rect('conteudo', a + 6, b + 14, a + cw - 6, b + 25); L('conteudo', f(a + 10, b + 16.5), f(a + 10, b + 22.5));
      L('conteudo', f(a + 6, b + 31), f(a + 22, b + 31)); rect('conteudo', a + 6, b + 35, a + cw - 6, b + 46);
      [a, b] = cel(2, 0);                              // cartão
      rect('conteudo', a + 8, b + 6, a + cw - 8, b + ch - 6);
      const im = [a + 8, b + 6, a + cw - 8, b + 30];
      rect('conteudo', ...im); L('conteudo', f(im[0], im[1]), f(im[2], im[3])); L('conteudo', f(im[0], im[3]), f(im[2], im[1]));
      for (let j = 0; j < 3; j++) L('conteudo', f(a + 12, b + 36 + j * 4), f(a + cw - (j === 2 ? 30 : 12), b + 36 + j * 4));
      [a, b] = cel(0, 1);                              // interruptor e caixa de selecção
      rrect(f, 'conteudo', a + 8, b + 10, a + 30, b + 20, 5); circ((u, v) => f(u, v), 'conteudo', a + 25, b + 15, 3.6, 18);
      rect('conteudo', a + 8, b + 30, a + 18, b + 40); L('conteudo', f(a + 10, b + 35), f(a + 12.5, b + 38), f(a + 16.5, b + 32));
      L('conteudo', f(a + 24, b + 35), f(a + 46, b + 35));
      [a, b] = cel(1, 1);                              // ícones
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
        const a0 = a + 10 + c * 14, b0 = b + 6 + r * 14;
        if (P.construcao) rect('guia', a0, b0, a0 + 10, b0 + 10);
        const k = (c + r * 3) % 3;
        if (k === 0) circ((u, v) => f(u, v), 'conteudo', a0 + 5, b0 + 5, 3.5, 16);
        if (k === 1) L('conteudo', f(a0 + 5, b0 + 1.5), f(a0 + 8.5, b0 + 8.5), f(a0 + 1.5, b0 + 8.5), f(a0 + 5, b0 + 1.5));
        if (k === 2) { L('conteudo', f(a0 + 1.5, b0 + 5), f(a0 + 8.5, b0 + 5)); L('conteudo', f(a0 + 5, b0 + 1.5), f(a0 + 5, b0 + 8.5)); }
      }
      [a, b] = cel(2, 1);                              // lista
      for (let r = 0; r < 4; r++) {
        const bb = b + 8 + r * 11;
        circ((u, v) => f(u, v), 'conteudo', a + 12, bb, 2, 12);
        L('conteudo', f(a + 18, bb), f(a + cw - 18 - (r % 2) * 10, bb));
        L('conteudo', f(a + cw - 11, bb - 2.5), f(a + cw - 8.5, bb), f(a + cw - 11, bb + 2.5));
        if (r < 3) L('grelha', f(a + 6, bb + 5.5), f(a + cw - 6, bb + 5.5));
      }
    }

    if (i === 5) {                                     // 06 APPLICATIONS — objectos em pé
      const plano3 = (pts) => plano(lote, 'conteudo', pts, true);
      // papel de carta (deitado), com a grelha da camada 01
      const la = [16, 22, 58, 81];
      plano3([f(la[0], la[1]), f(la[2], la[1]), f(la[2], la[3]), f(la[0], la[3])]);
      marca((u, v) => f(la[0] + 8 + u, la[1] + 9 - v), 'conteudo', 0, 0, 3.5);
      for (let j = 0; j < 7; j++) L('conteudo', f(la[0] + 5, la[1] + 24 + j * 4), f(la[2] - (j === 6 ? 18 : 5), la[1] + 24 + j * 4));
      if (P.construcao) rect('guia', la[0] + 4, la[1] + 4, la[2] - 4, la[3] - 4);
      // cartões de visita (deitados, um sobre o outro)
      for (const [k, h] of [[0, 0], [1, 0.6]]) {
        const a0 = 18 + k * 5, b0 = 92 + k * 4;
        const fc = (a, b) => { const p = f(a, b); p[1] += h + 0.3; return p; };
        plano3([fc(a0, b0), fc(a0 + 36, b0), fc(a0 + 36, b0 + 22), fc(a0, b0 + 22)]);
        if (k === 1) { marca((u, v) => fc(a0 + 7 + u, b0 + 7 - v), 'conteudo', 0, 0, 2.6); L('conteudo', fc(a0 + 4, b0 + 15), fc(a0 + 22, b0 + 15)); L('conteudo', fc(a0 + 4, b0 + 18), fc(a0 + 16, b0 + 18)); }
      }
      // cartaz em pé
      const pc = fv(46), A0 = 74, A1 = 112, H = 54;
      plano3([pc(A0, 0), pc(A1, 0), pc(A1, H), pc(A0, H)]);
      marca((u, v) => pc((A0 + A1) / 2 + u, 34 + v), 'conteudo', 0, 0, 10);
      L('conteudo', pc(A0 + 4, 14), pc(A1 - 4, 14)); L('conteudo', pc(A0 + 4, 10), pc(A1 - 14, 10)); L('conteudo', pc(A0 + 4, 5), pc(A0 + 16, 5));
      // ecrã sobre pé
      const ps = fv(92), S0 = 128, S1 = 186, SB = 14, SH = 36;
      plano3([ps(S0, SB), ps(S1, SB), ps(S1, SB + SH), ps(S0, SB + SH)]);
      L('conteudo', ps((S0 + S1) / 2, 0), ps((S0 + S1) / 2, SB));
      rect('conteudo', (S0 + S1) / 2 - 10, 88, (S0 + S1) / 2 + 10, 96);
      L('conteudo', ps(S0 + 3, SB + SH - 5), ps(S1 - 3, SB + SH - 5));
      marca((u, v) => ps(S0 + 7 + u, SB + SH - 2.5 + v), 'conteudo', 0, 0, 1.5);
      const hi = [S0 + 4, SB + 14, S1 - 4, SB + SH - 8];
      L('conteudo', ps(hi[0], hi[1]), ps(hi[2], hi[1]), ps(hi[2], hi[3]), ps(hi[0], hi[3]), ps(hi[0], hi[1]));
      L('conteudo', ps(hi[0], hi[1]), ps(hi[2], hi[3])); L('conteudo', ps(hi[0], hi[3]), ps(hi[2], hi[1]));
      for (let j = 0; j < 2; j++) L('conteudo', ps(S0 + 4, SB + 9 - j * 4), ps(S1 - 20 - j * 10, SB + 9 - j * 4));
      // totem de sinalética
      const T0 = [150, 20], TL = 12, TH = 60;
      caixa(lote, 'conteudo', f(T0[0], T0[1]), (() => { const p = f(T0[0] + TL, T0[1] + TL); p[1] += TH; return p; })());
      const pt = fv(T0[1] + TL + 0.2);
      marca((u, v) => pt(T0[0] + TL / 2 + u, TH - 8 + v), 'conteudo', 0, 0, 3.5);
      for (let j = 0; j < 3; j++) {
        const h = TH - 22 - j * 10;
        L('conteudo', pt(T0[0] + 2, h), pt(T0[0] + 6, h)); L('conteudo', pt(T0[0] + 4.5, h + 1.8), pt(T0[0] + 6.5, h), pt(T0[0] + 4.5, h - 1.8));
        L('conteudo', pt(T0[0] + 7.5, h), pt(T0[0] + 10.5, h));
      }
    }
  }
  if (P.ligacoes) for (const c of cantos) if (c.length > 1) L('ligacao', ...c);
  return lote;
}

function animar(P, t) {
  if (P.animacao === 'explodir') {
    const tt = t % 6, e0 = THREE.MathUtils.clamp(tt < 3 ? (tt - 0.4) / 2.2 : 1 - (tt - 3.8) / 1.8, 0, 1);
    return { estatico: montar(P, { sep: P.separacao * (0.06 + 0.94 * e0 * e0 * (3 - 2 * e0)) }) };
  }
  if (P.animacao === 'montar') {
    const tt = t % 8;
    return { estatico: montar(P, { queda: i => {
      const e = THREE.MathUtils.clamp((tt - 0.4 - i * 0.7) / 0.6, 0, 1);
      if (e === 0) return null;
      return (1 - e * e * (3 - 2 * e)) * 220;
    } }) };
  }
}

// a cena: as bancadas (_tmp-motivos/) e o site (components/Motivo.astro) usam este mesmo objecto
export default {
  id: 'sistemas', titulo: 'Sistema', P, ESTILOS, montar, animar,
  // no site: câmara e animação escolhidas pelo Nuno na bancada (22.11.2026), enquadradas na moldura "site desktop"
  SITE: { pos: [352.2, 300.9, 495.2], alvo: [-28, 100.6, -3.8], aspecto: 713 / 662, animacao: 'montar' },
  // estilo próprio: o DPX com contornos e conteúdos mais finos (Nuno, 22.11.2026)
  ESTILO: { nome: 'Sistemas', espessura: 1, rotulo: 15.5, reforco: 1.5, niveis: {
    principal: { w: .5, op: 1 }, conteudo: { w: .55, op: .9 }, secundaria: { w: .6, op: .34 },
    cota: { w: 1, op: .31 }, imaterial: { w: .7, op: .32 }, fundo: { w: .3, op: .1 } } },
  VISTAS: {
    axonometria: { nome: 'Axonometria', pos: [560, 470, 680], alvo: [0, 175, -55] },
    alcado:      { nome: 'Alçado',      pos: [-30, 190, 1150], alvo: [0, 175, -55] },
    planta:      { nome: 'Planta',      pos: [0, 1400, -55], alvo: [0, 0, -56] },
    detalhe:     { nome: 'Detalhe',     pos: [180, 260, 210],  alvo: [-20, 60, -20] },
  },
  ANIMACOES: [['explodir', 'Explodir'], ['montar', 'Montar']],
  CICLOS: { explodir: 6, montar: 8 },     // duração de um ciclo (s): o vídeo fecha em loop
  REGS: [
    ['camadas', 'Camadas', 1, 6, 1],
    ['separacao', 'Separação entre camadas', 10, 120, 1],
    ['recuo', 'Recuo de cada camada', 0, 80, 1],
    ['colunas', 'Colunas da grelha', 2, 12, 1],
    ['escalaTipo', 'Escala tipográfica', 1.1, 1.6, 0.01],
  ],
  CHKS: [['construcao', 'Linhas de construção'], ['rotulos', 'Rótulos das camadas'], ['ligacoes', 'Ligações entre camadas'], ['cotas', 'Cotas']],
};
