import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cadastro.css";

export function Cadastro() {
  const [Nome, setNome] = useState("");
  const [Senha, setSenha] = useState("");
  const [Email, setEmail] = useState("");
  const { handleCadastro } = useContext(AuthContext);

  async function handleSubmit(e) {
    e.preventDefault();
    handleCadastro(Nome, Email, Senha);
  }
  const navigate = useNavigate();

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <h2>Criar Conta</h2>
        <p>Preencha os dados abaixo para começar</p>

        <form className="cadastro-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Nome completo"
              value={Nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              value={Email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Crie uma senha"
              value={Senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button className="btn-entrar" type="submit">
            Cadastrar
          </button>
        </form>

        <p className="login-link">
          Já tem conta?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ cursor: "pointer", color: "#ea1d2c", fontWeight: "bold" }}
          >
            Entrar
          </span>
        </p>
      </div>
    </div>
  );
}
