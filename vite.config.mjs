/** L3-020 Vite configuration prepared, execution pending a genuine Vite installation. */
import { fileURLToPath, URL } from 'node:url';
const path = pathname => fileURLToPath(new URL(pathname, import.meta.url));
export default {
  base: './',
  publicDir: 'public',
  resolve: { alias: {
    '@game': path('./src/game'),
    '@ui': path('./src/ui'),
    '@renderer': path('./src/renderer'),
    '@domain': path('./src/domain'),
    '@': path('./src')
  }},
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true, rollupOptions: { input: { main: path('./index.html'), indexeddbQa: path('./indexeddb-qa.html') } } }
};
