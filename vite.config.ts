import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Cult Ninja",
        short_name: "Cult Ninja",
        description: "Your fitness journey companion",
        theme_color: "#0a1628",
        background_color: "#0a1628",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Cache images from Supabase storage
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime - rarely changes
          'vendor-react': ['react', 'react-dom'],
          // Routing
          'vendor-router': ['react-router-dom'],
          // Animation library - large
          'vendor-motion': ['framer-motion'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI primitives (radix)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
          ],
          // Query library
          'vendor-query': ['@tanstack/react-query'],
          // Frame components (loaded when viewing stories)
          'frames': [
            './src/components/frames/ShakyFrame.tsx',
            './src/components/frames/VogueFrame.tsx',
            './src/components/frames/JournalFrame.tsx',
            './src/components/frames/Journal2Frame.tsx',
            './src/components/frames/FitnessFrame.tsx',
            './src/components/frames/TicketFrame.tsx',
            './src/components/frames/TokenFrame.tsx',
            './src/components/frames/HolographicFrame.tsx',
            './src/components/frames/ScrapbookFrame.tsx',
            './src/components/frames/ArcadeFrame.tsx',
            './src/components/frames/BoldFrame.tsx',
          ],
        },
      },
    },
    // Increase chunk warning threshold (some vendor chunks will be >500kb)
    chunkSizeWarningLimit: 800,
  },
}));
