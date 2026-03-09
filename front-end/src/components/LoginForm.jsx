import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

function LoginForm({ irParaCadastro }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { login: fazerLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const data = await login(email, senha);
      fazerLogin(data);
    } catch (error) {
      setErro(error.response?.data?.detail || "Email ou senha inválidos");
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-box">
        <h2>🍕 Pizzaria Login</h2>

        {erro && <div className="error">{erro}</div>}

        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ width: '100%', paddingRight: '44px' }}
          />
          <button
            type="button"
            className="btn-ver-senha"
            onClick={() => setMostrarSenha(prev => !prev)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrarSenha ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          Entrar
        </button>

        <p className="link-login">
          Não tem conta?{" "}
          <button type="button" className="btn-link" onClick={irParaCadastro}>
            Cadastrar
          </button>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;