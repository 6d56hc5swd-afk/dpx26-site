// Conteúdos do site V2. Lêem-se do retrato da Notion em src/data/.
// É o único ficheiro que lê esse retrato: a versão para pessoas e a versão
// para máquinas saem ambas daqui, para que cada facto viva num sítio só.
import c from '../data/conteudo-v2.json';

export const SITE_NOME = 'DPX Studio';

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export type Bloco = (typeof c.blocos)[number] & { slug: string; href: string };

export const hero = c.hero;
export const bio = c.bio;
export const contactos = c.contactos;
export const clientes = c.clientes;
export const blocos: Bloco[] = c.blocos.map((b) => {
  const slug = slugify(b.especialidade);
  return { ...b, slug, href: `/${slug}/` };
});

export const blocoPorSlug = (slug: string) => blocos.find((b) => b.slug === slug);

/** Texto provisório da Notion ("Projeto Oooooo…") não conta como projecto real. */
export const ehProvisorio = (s: string) => /^Projeto O+/.test(s.trim());
export const projectosReais = (b: Bloco) => b.projectos.filter((p) => !ehProvisorio(p));

/** HTML mínimo da Notion (<b>) para texto simples. */
export const semHtml = (s: string) => s.replace(/<[^>]+>/g, '');
