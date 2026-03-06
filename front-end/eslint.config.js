import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

// RESUMO 
// A função dele é ser o "inspetor de qualidade" do seu código.
// O ESLint analisa seu código enquanto você escreve para encontrar erros de lógica, problemas de sintaxe ou padrões de escrita ruins 
// (como variáveis que você criou e nunca usou).


// explicacao

// Imports
// js from @eslint/js plugin oficial do ESLint que tras todas as reagras recomendadas para JavaScript.
// globals lista de variaveis globais Define que window, document, consele existem.
// reacthooks plugin react, Regras especificas para o uso de hooks do React.
// reactrefresh plugin vite , Suporta ao hot reload (fast refresh) do Vite.
// defineConfig  funcao helper ajuda o IDE com autocomplete.
// globalIgnores funcao utilitaria, Ignora arquivos/pastas de forma global.


// Export default defineConfig usa arry pq ESLint suporta multiplas configuracoes de diferentes partes do projeto.

// globalignore(['dist']) ignora a pasta dist.

// files: ['**/*.{js,jsx}'] Avisa que essas regras só valem para arquivos que terminam em .js ou .jsx.



// extends: js.configs.recommended: Te avisa sobre erros fatais como tentar reatribuir uma constante ou usar uma variável não declarada.

// React tem regras chatas (mas necessárias). Por exemplo: você nunca pode colocar um useEffect dentro de um if ou de um for.
// reactHooks.configs.flat.recommended:  Ele impede que você crie bugs de lógica muito difíceis de encontrar que acontecem quando o componente renderiza

// reactRefresh.configs.vite:  Garante que o seu código siga os padrões necessários para o Hot Module Replacement (aquela mágica de salvar o arquivo e a 
// página atualizar instantaneamente sem perder o estado).


// ecoversion: 2020: permite usar recursos modernos do JavaScript, como usuario?.nome garante se sair uma novidade amanha no JS o ESLint nao vai reclamar

// globals: globals.browser: Informa ao ESLint quais "variáveis globais" já existem por padrão no ambiente. window, document etc.

// ecamaFeatures: {jsx : true}: Ativa o suporte para o JSX, permite escrever 'HTML dentro de JS.

// SourceType: 'module': Avisa que vc esta usando o sistema de módulos moderno (import/export).


// rules: 'no-unused-vars': 'error':  proíbe variáveis que não são usadas para manter o código limpo.
// varsIgnorePattern: '^[A-Z_]' : Essa é a parte interessante. Você adicionou uma expressão regular que abre uma exceção para essa regra.
// A expressão '^[A-Z_]' significa "qualquer variável que comece com uma letra maiúscula ou um sublinhado".