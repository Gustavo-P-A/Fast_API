import { defineConfig } from "vite"; // 1
import react from "@vitejs/plugin-react-swc"; //2

export default defineConfig({
  //3
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 'all: true' inclui no relatório os arquivos que nenhum teste
      // ainda toca -- sem isso, o % mostrado só considera os arquivos
      // que os testes existentes chegam a importar, o que infla a
      // cobertura aparente.
      all: true,
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/main.jsx", "src/**/*.css"],
    },
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