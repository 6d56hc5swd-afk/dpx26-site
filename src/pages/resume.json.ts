import type { APIRoute } from 'astro';
import { resume } from '../lib/maquina';
export const GET: APIRoute = ({ site, url }) =>
  new Response(JSON.stringify(resume(site ?? new URL(url.origin)), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
