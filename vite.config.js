import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: 'src/main/index.js',
        vite: {
          build: {
            rollupOptions: {
              external: ['sql.js'],
            },
          },
        },
      },
      {
        // Preload script entry point
        entry: 'src/preload.js',
        onstart(options) {
          // Restart renderer process on preload script changes
          options.reload()
        },
      },
    ]),
  ],
})
