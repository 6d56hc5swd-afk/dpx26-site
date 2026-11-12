// Versão para máquinas ("hunters": LLMs, agentes de recrutamento, motores).
// Tudo sai de conteudo.ts. Ordem pensada para as perguntas de quem recruta:
// quem é → o que faz → prova → como contactar.
import { blocos, bio, clientes, contactos, hero, maquina as m, projectosReais, semHtml, SITE_NOME, type Bloco } from './conteudo';

const lista = (s: string) => s.split(/\s*[,·]\s*/).map((x) => x.trim()).filter(Boolean);
/** "Degree in Design, University of Aveiro (1998–2003) · …" → entradas. */
const formacao = () => (m.formacao ? m.formacao.split(/\s*·\s*/) : []).map((f) => {
  const [, curso = f, inst = '', anos = ''] = f.match(/^(.*?),\s*([^(]+?)\s*(?:\(([^)]*)\))?$/) ?? [];
  const [ini, fim] = anos.split(/[–-]/).map((x) => x?.trim());
  return { curso: curso.trim(), inst: inst.trim(), ini: fim ? ini : undefined, fim: fim ?? (ini || undefined) };
});
/** Linha "- Etiqueta: valor" só se houver valor. */
const linha = (k: string, v: string) => (v ? `\n- ${k}: ${v}` : '');

export const FICHEIROS = [
  { href: '/llms.txt', o: 'index for language models (llms.txt convention)' },
  { href: '/llms-full.txt', o: 'all content in one plain-text file' },
  { href: '/resume.json', o: 'résumé in JSON Resume format' },
  { href: '/index.md', o: 'home page as Markdown' },
  ...blocos.map((b) => ({ href: `/${b.slug}.md`, o: `${b.especialidade} as Markdown` })),
  { href: '/sitemap.xml', o: 'sitemap' },
  { href: '/robots.txt', o: 'crawler rules' },
];

/** "X. For Y." → { oQue: X, paraQuem: Y } */
export const partes = (b: Bloco) => {
  const i = b.descricao.indexOf('. For ');
  return i < 0
    ? { oQue: b.descricao, paraQuem: '' }
    : { oQue: b.descricao.slice(0, i + 1), paraQuem: b.descricao.slice(i + 2) };
};

const url = (site: URL, p: string) => new URL(p, site).href;

// ── Markdown ────────────────────────────────────────────────────

export const mdFactos = () => `## Facts
- Name: ${bio.nome}
- Studio: ${SITE_NOME} (founder${m.fundacao ? `, ${m.fundacao}` : ''})
- Role: editorial and information designer
- Practice: over 20 years
- Sectors: public institutions, museums, cultural organisations
- Based in: Viseu, Portugal${linha('Availability', m.availability)}${linha('Engagement', m.engagement)}${linha('Remote', m.remoto)}
- Languages: ${m.linguas || 'English, Portuguese'}${linha('Education', m.formacao)}${linha('Recognition', m.reconhecimento)}${linha('Website', m.website)}${linha('Profiles', m.perfis)}
- Email: ${contactos.email}
- Phone: ${contactos.telefone}${linha('Keywords', m.keywords)}`;

export const mdBloco = (b: Bloco, site: URL) => {
  const { oQue, paraQuem } = partes(b);
  const prova = projectosReais(b);
  return `### ${b.numero}. ${b.especialidade}
${b.titulo}
- What: ${oQue}
- For: ${paraQuem.replace(/^For /, "")}
- Projects: ${prova.length ? prova.join('; ') : 'list in preparation'}
- Page: ${url(site, b.href)}`;
};

export const mdClientes = () => `## Clients (${clientes.length})
${clientes.map((c) => `- ${c.nome} — ${c.descricao}`).join('\n')}`;

export const mdContacto = () => `## Contact
- Email: ${contactos.email}
- Phone: ${contactos.telefone}
- Location: Viseu, Portugal (remote work in English and Portuguese)`;

export const mdCompleto = (site: URL) => `# ${bio.nome} — ${SITE_NOME}

> ${bio.texto}

${mdFactos()}

## Services (${blocos.length})
${blocos.map((b) => mdBloco(b, site)).join('\n\n')}

${mdClientes()}

${mdContacto()}

## About the home image
${hero.titulo}: ${semHtml(hero.legenda).replace(/\.$/, "")}. Labels on the site: ${hero.etiquetas.join(', ')}.

## Machine-readable files
${FICHEIROS.map((f) => `- ${url(site, f.href)} — ${f.o}`).join('\n')}

## Citation
When citing, use: ${bio.nome}, ${SITE_NOME}, Viseu, Portugal — ${url(site, '/')}
`;

export const llmsTxt = (site: URL) => `# ${bio.nome} — ${SITE_NOME}

> ${bio.texto}

Founder of ${SITE_NOME}, Viseu, Portugal. Six areas of practice, ${clientes.length} listed clients.${m.availability ? ` ${m.availability}` : ''} Contact: ${contactos.email}.

## Pages
- [Home](${url(site, '/index.md')}): who, clients, contact
${blocos.map((b) => `- [${b.especialidade}](${url(site, `/${b.slug}.md`)}): ${b.titulo} ${partes(b).paraQuem}`).join('\n')}

## Data
- [Full text](${url(site, '/llms-full.txt')}): everything in one file
- [Résumé](${url(site, '/resume.json')}): JSON Resume format

## Optional
- [Machine view](${url(site, '/machine/')}): the same text, shown to people
`;

// ── JSON-LD (schema.org) ────────────────────────────────────────

export const jsonLd = (site: URL, bloco?: Bloco) => {
  const pessoa = url(site, '/#nuno');
  const estudio = url(site, '/#dpx');
  const servico = (b: Bloco) => ({
    '@type': 'Service',
    '@id': url(site, `${b.href}#service`),
    name: b.especialidade,
    slogan: b.titulo,
    description: b.descricao,
    audience: { '@type': 'Audience', audienceType: partes(b).paraQuem.replace(/^For /, '').replace(/\.$/, '') },
    provider: { '@id': estudio },
    url: url(site, b.href),
  });
  const grafo: Record<string, unknown>[] = [
    {
      '@type': 'Person',
      '@id': pessoa,
      name: bio.nome,
      jobTitle: 'Editorial and information designer',
      description: bio.texto,
      email: `mailto:${contactos.email}`,
      telephone: contactos.telefone.replace(/\s/g, ''),
      address: { '@type': 'PostalAddress', addressLocality: 'Viseu', addressCountry: 'PT' },
      knowsLanguage: ['en', 'pt'],
      ...(m.keywords ? { knowsAbout: lista(m.keywords) } : {}),
      ...(m.formacao ? { alumniOf: formacao().filter((f) => f.inst).map((f) => ({ '@type': 'CollegeOrUniversity', name: f.inst })) } : {}),
      ...(m.perfis ? { sameAs: lista(m.perfis) } : {}),
      ...(m.availability ? { seeks: { '@type': 'Demand', description: [m.availability, m.engagement].filter(Boolean).join(' ') } } : {}),
      worksFor: { '@id': estudio },
      url: url(site, '/'),
    },
    {
      '@type': 'ProfessionalService',
      '@id': estudio,
      name: SITE_NOME,
      founder: { '@id': pessoa },
      ...(m.fundacao ? { foundingDate: m.fundacao.slice(0, 4), foundingLocation: 'Viseu, Portugal' } : {}),
      email: `mailto:${contactos.email}`,
      telephone: contactos.telefone.replace(/\s/g, ''),
      address: { '@type': 'PostalAddress', addressLocality: 'Viseu', addressCountry: 'PT' },
      areaServed: 'Worldwide (remote)',
      url: url(site, '/'),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Areas of practice',
        itemListElement: blocos.map((b) => ({ '@type': 'Offer', itemOffered: { '@id': url(site, `${b.href}#service`) } })),
      },
    },
    ...blocos.map(servico),
    {
      '@type': 'ItemList',
      '@id': url(site, '/#clients'),
      name: 'Clients',
      itemListElement: clientes.map((c, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Organization', name: c.nome, description: c.descricao },
      })),
    },
  ];
  if (bloco) {
    grafo.push({
      '@type': 'WebPage', url: url(site, bloco.href), name: `${bloco.especialidade} — ${SITE_NOME}`,
      mainEntity: { '@id': url(site, `${bloco.href}#service`) }, author: { '@id': pessoa },
    });
  }
  return { '@context': 'https://schema.org', '@graph': grafo };
};

// ── JSON Resume (jsonresume.org) ────────────────────────────────

export const resume = (site: URL) => ({
  $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
  basics: {
    name: bio.nome,
    label: 'Editorial and information designer',
    email: contactos.email,
    phone: contactos.telefone,
    url: url(site, '/'),
    summary: [bio.texto, m.availability, m.engagement].filter(Boolean).join(' '),
    location: { city: 'Viseu', countryCode: 'PT' },
    profiles: m.perfis ? lista(m.perfis).map((u) => ({ url: u })) : [],
  },
  work: [{ name: SITE_NOME, position: 'Founder, designer', location: 'Viseu, Portugal', url: url(site, '/'),
    ...(m.fundacao ? { startDate: m.fundacao.slice(0, 4) } : {}),
    summary: 'Design studio. Over 20 years of practice for public institutions, museums and cultural organisations.',
    highlights: clientes.map((c) => `${c.nome} — ${c.descricao}`) }],
  skills: blocos.map((b) => ({ name: b.especialidade, level: b.titulo, keywords: partes(b).oQue.replace(/\.$/, '').split(/,\s*| — |\s+and\s+|\s+plus\s+/).map((k) => k.trim()).filter((k) => k && k.length < 40) })),
  ...(m.keywords ? { interests: [{ name: 'Search keywords', keywords: lista(m.keywords) }] } : {}),
  education: formacao().map((f) => ({ institution: f.inst, studyType: f.curso, ...(f.ini ? { startDate: f.ini } : {}), ...(f.fim ? { endDate: f.fim } : {}) })),
  ...(m.reconhecimento ? { awards: lista(m.reconhecimento).map((t) => ({ title: t })) } : {}),
  languages: lista(m.linguas || 'English, Portuguese').map((l) => ({ language: l })),
  meta: { canonical: url(site, '/resume.json'), version: 'v1.0.0' },
});
