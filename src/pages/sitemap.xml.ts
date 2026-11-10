import type { APIRoute } from 'astro';
import { blocos } from '../lib/conteudo';
export const GET: APIRoute = ({ site, url }) => {
  const s = site ?? new URL(url.origin);
  const paths = ['/', ...blocos.map((b) => b.href), '/machine/'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, s).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
