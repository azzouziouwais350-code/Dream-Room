import { defineConfig } from 'vite';

// base: './' => chemins relatifs, le build fonctionne sous n'importe quel nom de dépôt
// GitHub Pages (https://user.github.io/<repo>/), en local, ou depuis un simple dossier.
export default defineConfig({
  base: './',
  build: { target: 'es2020', outDir: 'dist', assetsInlineLimit: 0, sourcemap: false },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
