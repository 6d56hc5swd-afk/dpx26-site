// Conteúdos do site. Por agora lêem-se do snapshot da Notion (src/data/).
// Quando houver token da API, só este ficheiro muda — as páginas não.
import snap from '../data/notion-snapshot.json';

export type Bloco = (typeof snap.blocos)[number];

export const hero: string[] = snap.hero;
export const tagline = snap.tagline;
export const contactos = snap.contactos;
export const blocos: Bloco[] = snap.blocos;
export const clientes = snap.clientes;
export const projectos = snap.projectos;

export const blocoPorSlug = (slug: string) => blocos.find((b) => b.slug === slug);

export const projectosDoBloco = (b: Bloco) =>
  projectos.filter((p) => p.bloco === b.base).map((p) => p.nome);

/** Tipologias ordenadas pela frequência na base. */
export const tipologias = (() => {
  const conta = new Map<string, number>();
  for (const p of projectos) for (const t of p.tipologias) conta.set(t, (conta.get(t) ?? 0) + 1);
  return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([nome, n]) => ({ nome, n }));
})();

// Paleta dos donuts: tokens do Figma + tons intermédios (provisório até à Fase 3).
const PALETA = ['#F64724', '#31E192', '#23A76B', '#1C7A50', '#4B6B5C', '#F2F1E8'];

/** Donut de Projects: uma fatia por bloco temático. */
export const donutProjectos = () =>
  blocos
    .map((b) => ({ nome: b.nome, n: projectos.filter((p) => p.bloco === b.base).length }))
    .sort((a, b) => b.n - a.n)
    .map((s, i) => ({ ...s, cor: PALETA[i % PALETA.length] }));

/**
 * Donut de Clients: voltaram vs. não voltaram.
 * Regra do Nuno (12.09): "voltaram" = todos menos Pontual e Pessoal / próprio.
 */
export const donutClientes = () => {
  const naoVoltaram = clientes.filter((c) => ['Pontual', 'Pessoal / próprio'].includes(c.relacao)).length;
  return [
    { nome: 'Returned', n: clientes.length - naoVoltaram, cor: '#31E192' },
    { nome: 'Once', n: naoVoltaram, cor: '#F2F1E8' },
  ];
};
