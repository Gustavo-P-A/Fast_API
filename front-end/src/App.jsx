import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import PedidoList from './components/PedidoList';
import { FormCadastro } from './components/RegisterForm';
import './App.css';

function App() {
  const { usuario, logout } = useAuth();

  const [pagina, setPagina] = useState(
    () => sessionStorage.getItem('pagina') || 'login'
  );

  const irPara = (p) => {
    sessionStorage.setItem('pagina', p);
    setPagina(p);
  };

  if (!usuario) {
    if (pagina === 'cadastro') {
      return <FormCadastro onCadastroSucesso={() => irPara('login')} irParaLogin={() => irPara('login')} />;
    }
    return <LoginForm irParaCadastro={() => irPara('cadastro')} />;
  }

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>🍕 Pizzaria API</h1>
          <button onClick={logout} className="btn btn-secondary">
            Sair
          </button>
        </div>
      </header>

      <PedidoList />
    </div>
  );
}

export default App;




// RESUMO

// - LINHA 1-4: Importa o hook de autenticação, telas (Login e Pedidos) e o CSS.
// - LINHA 6: Pega o estado do usuário e a ação de logout do contexto global.
// - LINHA 8-10: Trava de Segurança: Se não estiver logado, exibe apenas o Login.
// - LINHA 12-19: Layout Logado: Mostra o Header com título e botão de sair.
// - LINHA 21: Exibe a lista de pedidos (conteúdo principal para usuários logados).



// Explicação

// 1. Importações: useAuth:  importa o hook personalizado que permite acessar os dados de login e a funcao do logout.
// LoginForm: importa a tabela de login (sera exibida se o usuario nao estiver logado).
// PedidoList: importa a lista dos pedidos (sera exibida se o usuario estiver logado).
// App.css: importa o CSS específico para o componente App.

// 2. Função App: é o componente principal da aplicação, ele decide o que mostrar com base no estado de autenticação do usuário.
// const { usuario, logout } = useAuth(): Extrai as informacoes de dentro do contexto: o objeto 'usuario' e a funcao 'logout' para deslogar o usuario.
// if (!usuario ): verifica se o usuario nao esta logado. 


// 3. Condicional de Login: Se 'usuario' for nulo (ou seja, ninguém está logado), o componente retorna o <LoginForm />, mostrando a tela de login.
// Se 'usuario' existir, ele renderiza a estrutura principal do site, incluindo um header com o título e um botão de logout, seguido pela lista de pedidos.
// return <loginfrom />: reatorna o formulario de login.

// 4. Caso o usuario esteja logado, o codigo rederiza o lyout principal
// <header>: cria um cabecalho da pagina com uma classe para estilização.
// h1: Titulo do site.
// button: dispara a funcao de logout quando clicado, removendo o usuario do sistema.
// <PedidoList />: componente que exibe a lista de pedidos, visivel apenas para usuarios logados.