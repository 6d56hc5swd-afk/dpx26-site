import type { APIRoute } from 'astro';
import { mdCompleto } from '../lib/maquina';
export const GET: APIRoute = ({ site, url }) =>
  new Response(mdCompleto(site ?? new URL(url.origin)), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
