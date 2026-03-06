import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

// createContext: Cria o "espaço" ou o reservatório onde os dados vão morar. É o contexto em si.
// useState: Cria variáveis de estado que, quando mudam, fazem a tela atualizar (ex: user, theme, carrinho).
// useEffect: Executa ações "colaterais". É muito usado dentro do Context para buscar dados de uma API assim que o app carrega.
// useContext: É o "gancho" que os componentes usam para "pescar" os dados de dentro do contexto.
// Importa o jwtDecode. Essa biblioteca é crucial porque o seu FastAPI envia um Token.

const AuthContext = createContext(null);
// Aqui você está criando o Contexto propriamente dito. Começamos com null porque, quando o app abre, ainda não temos nenhum dado de usuário circulando.

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  // AuthProvider: É o componente que vai "embrulhar" toda a sua aplicação (lá no index.js). O { children } representa todos os componentes que estarão dentro dele.
  // Estado usuario: Começa como null. Se houver alguém logado, esse estado guardará os dados dele.
  // Estado loading: Começa como true. Isso é para evitar que o React mostre a tela de "não logado" por um milésimo de segundo enquanto ele ainda está checando o localStorage.

  useEffect(() => {
    const storegeToken = localStorage.getItem("access_token");
    // useEffect: Esse hook roda uma única vez assim que o componente nasce na tela.
    // localStorage.getItem: Ele vai até a "gaveta" do navegador buscar se existe algo salvo com o nome access_token.

    if (token) {
      // Se ele encontrou uma chave, o código tenta validar.

      try {
        const decoded = jwtDecode(token);
        setUsuario({ id: decoded.sub });
        // O token do FastAPI é uma sopa de letras. Essa função traduz isso em um objeto. O campo decoded.sub geralmente contém o ID ou nome do usuário
        // Se deu tudo certo, ele "loga" o usuário automaticamente no estado do React.
      } catch {
        localStorage.clear();
        // Se o token estiver corrompido ou expirado, o jwtDecode vai dar erro. O código então limpa tudo para garantir que ninguém tente usar uma chave quebrada.
      }
    }
    setLoading(false);
  }, []);
  // setLoading(false): Independente de ter achado um usuário ou não, o processo de "checagem inicial" acabou. Agora o React pode liberar a renderização da página.
  // []: Este colchete vazio garante que essa checagem só aconteça uma vez (quando o app liga).

  const login = (tokens) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    // login (tokens): Esta função recebe o objeto que o seu FastAPI enviou (contendo o token de acesso e o de atualização).
    // localStorage.setItem: Ela guarda esses tokens na "memória" do navegador. Assim, se o usuário der F5, os dados continuam lá.

    const decoded = jwtDecode(tokens.access_token);
    setUsuario({ id: decoded.sub });
    // jwtDecode: Logo após salvar, o código "abre" o token para saber quem é o dono dele.
    // setUsuario: Atualiza o estado global com o ID do usuário (vindo do campo sub do JWT).
    // No momento que isso roda, o seu App.js percebe que usuario não é mais null e troca a tela de login pela tela principal.
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
    // localStorage.clear(): Apaga absolutamente tudo (tokens e preferências) que estava salvo no navegador.
    // setUsuario(null): "Zera" o estado do React. Como o usuario volta a ser null, o App.js barra o acesso e mostra o formulário de login novamente.
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
    //   AuthContext.Provider: É aqui que você "exporta" as ferramentas. Tudo que estiver dentro de value (usuario, funções de login/logout e o loading) fica disponível para qualquer outro componente do projeto.
    // {children}: Representa todos os componentes da sua aplicação que estão "dentro" desse provedo
  );
};

export default useAuth = () => useContext(AuthContext);

// este é um atalho (Hook). Em vez de você ter que importar useContext e AuthContext em todo arquivo, você só importa o useAuth. É o que você usou lá no seu App.js.

export const useAuth = () => useContext(AuthContext);
// createContext cria o "espaço" onde as informações de login ficarão guardadas. O useAuth é um atalho (hook) para você não precisar importar o
// useContext toda vez que quiser usar o login.
