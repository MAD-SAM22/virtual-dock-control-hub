
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to the backend server
      '/_ping': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/system/info': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy QEMU API routes
      '/qemu': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy all Docker API routes
      '/containers': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/exec': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/volumes': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/networks': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/engine': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Explicitly define environment variables handling
  envPrefix: 'VITE_',
}));
