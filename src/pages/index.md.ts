import type { APIRoute } from 'astro';
import { bio, blocos, SITE_NOME } from '../lib/conteudo';
import { mdClientes, mdContacto, mdFactos, partes } from '../lib/maquina';
export const GET: APIRoute = ({ site, url }) => {
  const s = site ?? new URL(url.origin);
  const md = `# ${bio.nome} — ${SITE_NOME}

> ${bio.texto}

${mdFactos()}

## Areas of practice
${blocos.map((b) => `- [${b.especialidade}](${new URL(`/${b.slug}.md`, s).href}) — ${b.titulo} ${partes(b).paraQuem}`).join('\n')}

${mdClientes()}

${mdContacto()}
`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
