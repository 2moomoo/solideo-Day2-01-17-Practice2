import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  // 환경 변수 설정
  define: {
    'import.meta.env.VITE_OPENTRIPMAP_KEY': JSON.stringify(process.env.VITE_OPENTRIPMAP_KEY || '5ae2e3f221c38a28845f05b6a2c6e8fb5dc7a5e8b0a9c0ff09c9c19d'),
    'import.meta.env.VITE_OPENROUTE_KEY': JSON.stringify(process.env.VITE_OPENROUTE_KEY || '5b3ce3597851110001cf6248d8f5c7b8e2e9487cb4a87fe2d20e7d9f'),
  }
});
