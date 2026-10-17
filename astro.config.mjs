// @ts-check
import { defineConfig } from 'astro/config';

// ASSUMPTION: GitHub project site at https://xuanduynguyen96.github.io/portfolio-app
// For a user site (repo named xuanduynguyen96.github.io) or custom domain, drop `base`.
export default defineConfig({
  site: 'https://xuanduynguyen96.github.io',
  base: '/portfolio-app',
  output: 'static',
  trailingSlash: 'ignore',
});
