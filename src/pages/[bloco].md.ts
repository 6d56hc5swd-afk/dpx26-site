import type { APIRoute, GetStaticPaths } from 'astro';
import { bio, blocos, SITE_NOME, type Bloco } from '../lib/conteudo';
import { mdBloco, mdContacto } from '../lib/maquina';
export const getStaticPaths: GetStaticPaths = () => blocos.map((b) => ({ params: { bloco: b.slug }, props: { b } }));
export const GET: APIRoute = ({ props, site, url }) => {
  const b = props.b as Bloco;
  const md = `# ${b.especialidade} — ${bio.nome}, ${SITE_NOME}

${mdBloco(b, site ?? new URL(url.origin)).replace(/^### /, '## ')}

${mdContacto()}
`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
