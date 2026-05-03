import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@react-flow-ui-engine/core': fileURLToPath(new URL('../../packages/core/src', import.meta.url)),
      '@react-flow-ui-engine/react': fileURLToPath(new URL('../../packages/react/src', import.meta.url)),
    },
  },
});
