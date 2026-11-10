import type { APIRoute } from 'astro';
// Decisão (10.11.2026): entram os motores e os agentes que RESPONDEM a
// perguntas; ficam de fora os robôs que só recolhem para TREINAR modelos.
const TREINO = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'Bytespider', 'cohere-training-data-crawler'];
export const GET: APIRoute = ({ site, url }) => {
  const s = site ?? new URL(url.origin);
  const txt = `# Search engines, answer engines and AI agents acting for a person: welcome.
# Start here: ${new URL('/llms.txt', s).href}
User-agent: *
Allow: /

# Crawlers that only collect content to train models: no.
${TREINO.map((b) => `User-agent: ${b}\nDisallow: /`).join('\n\n')}

Sitemap: ${new URL('/sitemap.xml', s).href}
`;
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
