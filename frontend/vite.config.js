import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path" // <-- 1. IMPORT THE 'path' MODULE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // It's good practice to call the plugin as a function

  // v-- 2. ADD THIS ENTIRE 'resolve' BLOCK --v
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})