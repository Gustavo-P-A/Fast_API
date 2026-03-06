import { defineConfig } from 'vite' // 1
import react from '@vitejs/plugin-react-swc'//2

export default defineConfig({ //3
  plugins: [react()],
  server: {
    port: 3000, //4
    proxy: {
      '/api': {
        target: 'http://localhost:8000',//5
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

// RESUMO

// 1. PLUGIN: Utiliza '@vitejs/plugin-react-swc' para compilação ultra-rápida do React usando Rust.
// 2. PORTA: Define que o servidor de desenvolvimento rodará em http://localhost:3000.
// 3. PROXY: Redireciona chamadas que começam com '/api' para o backend em http://localhost:8000.
// 4. REWRITE: Remove o prefixo '/api' da URL original antes de enviar ao servidor (ex: /api/login vira apenas /login no destino).
// 5. VANTAGEM: Evita erros de CORS durante o desenvolvimento e simplifica as URLs no código do front-end.


// 1: explicação do código começamos com um import da defineConfig que a função dela é o autocompletar  inteligente 

// 2: Depois vamos para o import react @vite/plugin-react-swc que é o plugin para usar o SWC com o vite

// 3: Depois vamos para o export default defineConfig 
                          //  plugins: [react()]  Ativa o suporte react SWC sem isso o vite nao entede o JSX

//4: localhost:3000 é a porta onde o vite vai rodar o front-end

//5: o Proxy 
// API: oq faz: quando o front end faz requisicao para o /api/qualquer coisa. Sua importacia: Evita CORS (erro de segurança do navegador)
//Target: oq faz: redireciona para o backend para o FastAPI. importancia: O back end roda na porta 8000 e o front end na 3000.
// changeOrigin: oq faz: muda a origem da requisição para o target. importancia: engana o back end fazendo ele pensar que a requisição veio do mesmo domínio.
// rewrite: oq faz: reescreve a URL removendo o /api. importancia: O back end nao espera o /api na URL, entao precisamos remover ele antes de enviar a requisição para o back end.
