import { defineConfig } from "vite"; // 1
import react from "@vitejs/plugin-react-swc"; //2

export default defineConfig({
  //3
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
  server: {
    port: 3000, //4
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        cookieDomainRewrite: "localhost",
      },
    },
  },
});