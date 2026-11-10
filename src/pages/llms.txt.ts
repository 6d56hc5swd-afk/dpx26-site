import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/maquina';
export const GET: APIRoute = ({ site, url }) =>
  new Response(llmsTxt(site ?? new URL(url.origin)), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
