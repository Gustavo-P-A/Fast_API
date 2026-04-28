import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, cadastro, me } from "../api/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [verificar_token, setVerificar_Token] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState('')

  const navigate = useNavigate();

  async function handleLogin(email, senha) {
    const data = await login(email, senha);

    if (data && data.access_token) {
      setVerificar_Token(data.access_token);
      localStorage.setItem("token", data.access_token);
      navigate("/");
    } else {
      alert("Email ou Senha incorretos");
    }
  }

  /////////////CADASTRO////////////////
  async function handleCadastro(nome, email, senha) {
    const data = await cadastro(nome, email, senha);

    try {
      if (data && data.access_token) {
        setVerificar_Token(data.access_token);
        localStorage.setItem("token", data.access_token);
        navigate("/perfil");
      } else {
        alert("Erro ao cadastrar, tente novamente");
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    async function buscarDados() {
        const tokenSalvo = localStorage.getItem("token");
        if (tokenSalvo) {
            const data = await me(tokenSalvo);
            setVerificar_Token(tokenSalvo);
            setUsuario(data);
        }
        setCarregando(false);
    }
    buscarDados();
}, []);

  if (carregando) {
    return <div>carregando...</div>;
  }
  return (
    <AuthContext.Provider
      value={{ verificar_token, handleLogin, handleCadastro, usuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}
