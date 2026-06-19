import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    define: {
      'process.env.VITE_SUPABASE_URL': 'import.meta.env.VITE_SUPABASE_URL',
      'process.env.VITE_SUPABASE_ANON_KEY': 'import.meta.env.VITE_SUPABASE_ANON_KEY',
      'process.env.VITE_SUPABASE_PUBLISHABLE_KEY': 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',
      'process.env.NEXT_PUBLIC_SUPABASE_URL': 'import.meta.env.VITE_SUPABASE_URL',
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': 'import.meta.env.VITE_SUPABASE_ANON_KEY',
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY'
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      sourcemap: false, 
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      assetsInlineLimit: 4096,
      rollupOptions: {
        external: ['ws'],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'framer-motion': ['framer-motion'],
            'charts-vendor': ['recharts', 'd3'],
            'supabase': ['@supabase/supabase-js']
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
        overlay: false,
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
