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
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true, rollupOptions: { input: { main: path('./index.html'), indexeddbQa: path('./indexeddb-qa.html'), autosaveQa: path('./autosave-qa.html'), manualSlotsQa: path('./manual-slots-qa.html'), exportImportQa: path('./export-import-qa.html'), migrationsQa: path('./migrations-qa.html'), fixturesQa: path('./fixtures-qa.html'), manifestQa: path('./manifest-qa.html'), designTokensQa: path('./design-tokens-qa.html'), typographyQa: path('./typography-qa.html'), safeAreaQa: path('./safe-area-qa.html'), panelKitQa: path('./panel-kit-qa.html'), selectionCardQa: path('./selection-card-qa.html'), confirmDialogQa: path('./confirm-dialog-qa.html') } } }
};
