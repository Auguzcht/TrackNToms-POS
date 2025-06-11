import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Include JSX in .js files
      include: "**/*.{jsx,js,ts,tsx}",
      // Auto-import React in all JSX files
      jsxImportSource: 'react',
    })
  ],
  
  // Maintain the base path as requested
  base: '/TrackNToms-POS/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // This ensures the public directory is properly copied to the output directory
    publicDir: 'public',
    emptyOutDir: true, // Clear the output directory before each build
    
    rollupOptions: {
      output: {
        // Customize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        // Add manualChunks to separate vendor code
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'supabase': ['@supabase/supabase-js']
        }
      },
    },
    // Add asset handling
    assetsInlineLimit: 4096, // 4kb - files smaller than this will be inlined as base64 
  },
  
  server: {
    watch: {
      usePolling: true
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@context': path.resolve(__dirname, './src/context'),
      // Add a public alias for easier access to public assets
      '@public': path.resolve(__dirname, './public')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  
  // Add esbuild configuration to properly handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
    jsx: 'automatic'
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@supabase/supabase-js'
    ]
  }
  
  // REMOVED: The experimental renderBuiltUrl that was causing the error
})