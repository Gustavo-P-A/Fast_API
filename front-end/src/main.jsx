import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);





// RESUMO

// LINHA 1-2: Importa o React e a API para renderização no navegador (DOM).
// LINHA 3:   Importa o AuthProvider, que gerencia o login globalmente.
// LINHA 4:   Importa o componente principal 'App', onde fica o resto do site.
// LINHA 5:   Importa o CSS global do projeto.
// LINHA 6:   Localiza a <div> 'root' no HTML e prepara o terreno para o React.
// LINHA 7-8: Inicia a renderização e ativa o StrictMode para validar o código.
// LINHA 9:   AuthProvider envolve o App para que todos os componentes acessem dados de usuário.
// LINHA 10:  Chama o componente App para ser desenhado na tela.



//Explicação

// 1. Importações: Importa React: importa a base do React para habilitar o uso do JSX.
//  import ReactDOM: imporrta o braco do react que lida especificamente com o DOM,  o /cliente é a nova API do React 18.
//  import { AuthProvider }: importa o contexto de autenticação ele vai 'envolver' a aplicação para que qualquer componente saiba se o usuario está logado ou nao.
//  import App: importa os componentes principais da aplicação, (app.jsx) aonde fica rotas e layout geral.
//  import './index.css': importa o CSS global.

// 2. ReactDOM.createRoot(document.getElementById('root')): localiza a div com id 'root' no index.html e cria uma raiz React nela.
// .render(): é o comando que efetivamente desenha a aplicação na tela.
// <React.StrictMode>: um componente que nao renderiza nada visual, mas ajuda a encontrar erros comuns.
// <AuthProvider>: Coloca o sistema de login em volta do APP, isso permite que use o hook useAuth em qualquer lugar dentro do app.
// <App />: Componente raiz que tem toda a estrutura da aplicação, como rotas, layout, etc. Ele é o ponto de partida para o resto do código do front-end.