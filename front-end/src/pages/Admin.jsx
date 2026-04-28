import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { admin_sabores, admin_tamanho, admin_preco_pizza } from "../api/auth";
import "../styles/Admin.css";

export function AreaAdmin() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [sabor_id, setSabor_id] = useState("");
  const [tamanho_id, setTamanho_id] = useState("");
  const [preco, setPreco] = useState("");

  const { verificar_token } = useContext(AuthContext);

  const navigate = useNavigate();

  async function handleAdmin() {
    try {
      const data = await admin_sabores(verificar_token, nome, descricao);
      if (data) {
        alert("Sabor criado com sucesso!");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleTamanho() {
    try {
      const data = await admin_tamanho(verificar_token, tamanho);
      if (data) {
        alert("Tamanho criado com sucesso!");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handlePreco() {
    try {
      const data = await admin_preco_pizza(
        verificar_token,
        sabor_id,
        tamanho_id,
        preco,
      );
      if (data) {
        alert("Preço criado com sucesso!");
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="login-page">
      <div className="logo-area"> 
        <button className="btn-voltar" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <h1>Área <span>Admin</span></h1>
      </div>

      
      <div className="login-container">
        <h2>Cadastro de Sabor</h2>
        <div className="login-form">
          <div className="input-group">
            <label>Nome e Descrição</label>
            <input
              type="text"
              placeholder="Calabresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              type="text"
              placeholder="Calabresa, Cebola..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <button className="btn-login" onClick={handleAdmin}>
            Enviar Sabor
          </button>
        </div>
      </div>

      
      <div className="login-container">
        <h2>Cadastro de Tamanho</h2>
        <div className="login-form">
          <div className="input-group">
            <label>Tamanho</label>
            <input
              type="text"
              placeholder="M ou P ..."
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
            />
          </div>
          <button className="btn-login" onClick={handleTamanho}>
            Enviar Tamanho
          </button>
        </div>
      </div>

      
      <div className="login-container">
        <h2>Vincular Sabor, Tamanho e Valor</h2>
        <div className="login-form">
          <div className="input-group">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="ID do Sabor"
                value={sabor_id}
                onChange={(e) => setSabor_id(e.target.value)}
              />
              <input
                type="text"
                placeholder="ID do Tamanho"
                value={tamanho_id}
                onChange={(e) => setTamanho_id(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Preço"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </div>
          <button className="btn-login" onClick={handlePreco}>
            Enviar Preço
          </button>
        </div>
      </div>
    </div>
  );
}

