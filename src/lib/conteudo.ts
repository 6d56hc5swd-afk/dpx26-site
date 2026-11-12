// Conteúdos do site V2. Lêem-se do retrato da Notion em src/data/.
// É o único ficheiro que lê esse retrato: a versão para pessoas e a versão
// para máquinas saem ambas daqui, para que cada facto viva num sítio só.
import c from '../data/conteudo-v2.json';

export const SITE_NOME = c.estudio;

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export type Bloco = (typeof c.blocos)[number] & { slug: string; href: string };

export const hero = c.hero;
export const bio = c.bio;
export const contactos = c.contactos;
export const clientes = c.clientes;
/** Secção Machine da Notion: só para a versão máquina. Campo vazio = não publicar. */
export const maquina = c.maquina;
export const blocos: Bloco[] = c.blocos.map((b) => {
  const slug = slugify(b.especialidade);
  return { ...b, slug, href: `/${slug}/` };
});

export const blocoPorSlug = (slug: string) => blocos.find((b) => b.slug === slug);

/** Texto provisório da Notion ("Projeto Oooooo…") não conta como projecto real. */
export const ehProvisorio = (s: string) => /^Projeto O+/.test(s.trim());
export const projectosReais = (b: Bloco) => b.projectos.filter((p) => !ehProvisorio(p));

/** Títulos em itálico vêm marcados *assim* (como na Notion). */
const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const comItalico = (s: string) => escapar(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
export const semItalico = (s: string) => s.replace(/\*([^*]+)\*/g, '$1');

/** HTML mínimo da Notion (<b>) para texto simples. */
export const semHtml = (s: string) => s.replace(/<[^>]+>/g, '');
