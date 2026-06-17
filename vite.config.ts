import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const assetResolutionLogger = () => ({
    name: 'asset-resolution-logger',
    resolveId(source: string) {
      if (source.includes('.css') || source.includes('.svg') || source.includes('.png')) {
        console.log('[Vite Asset Resolve]', source);
      }
      return null;
    }
  });

  return {
    plugins: [react(), tailwindcss(), assetResolutionLogger()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      sourcemap: false, 
      minify: 'esbuild' as const,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
            }
          }
        }
      }
    },
    base: '/',
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        // Auto-detect protocol and host in the browser
        clientPort: process.env.HMR_PORT ? parseInt(process.env.HMR_PORT) : 443,
        path: '/@vite/hmr',
      },
      cors: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/tests/setup.ts',
    },
  };
});
