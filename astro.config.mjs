// @ts-check
import { defineConfig } from 'astro/config';

// `site` é o endereço público: entra nos links das versões para máquinas.
// Trocar quando houver domínio novo.
export default defineConfig({
  site: 'https://dpx26-site.gazellecripple.workers.dev',
  trailingSlash: 'ignore',
});
