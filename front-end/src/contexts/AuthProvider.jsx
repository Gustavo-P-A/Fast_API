import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, cadastro, me } from "../api/auth";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";


export function AuthProvider({ children }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  async function handleLogin(email, senha) {
    setCarregando(true);
    try {
      await login(email, senha);
      const userData = await me();
      if (!userData) throw new Error("Não foi possível obter os dados do usuário.");
      setUsuario(userData);
      navigate(userData.adm ? "/admin" : "/");
    } catch (error) {
      const msgErro = error.response?.data?.detail || error.message || "Dados inválidos.";
      alert(msgErro);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro(nome, email, senha) {
    setCarregando(true);
    try {
      const data = await cadastro(nome, email, senha);
      if (!data) { alert("Erro ao cadastrar, tente novamente."); return; }
      const userData = await me();
      if (!userData) throw new Error("Não foi possível obter os dados do usuário.");
      setUsuario(userData);
      navigate("/perfil");
    } catch (error) {
      const msgErro = error.response?.data?.detail || error.message || "Falha ao registrar conta.";
      alert(msgErro);
    } finally {
      setCarregando(false);
    }
  }

  async function logout() {
    setUsuario(null);
    window.location.href = "/login";
  }

  useEffect(() => {
    async function buscarDados() {
      try {
        const data = await me();
        if (data) setUsuario(data);
      } catch {
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    }
    buscarDados();
  }, []);

  if (carregando && !usuario) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Carregando aplicação...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ handleLogin, handleCadastro, usuario, logout, handleLogout: logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}