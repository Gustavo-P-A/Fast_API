import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  admin_sabores,
  admin_tamanho,
  admin_preco_pizza,
  cardapio,
} from "../api/auth";
import "../styles/Admin.css";

export function AreaAdmin() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [sabor_id, setSabor_id] = useState("");
  const [tamanho_id, setTamanho_id] = useState("");
  const [preco, setPreco] = useState("");
  const [cardapioAPI, setCardaioAPI] = useState([]);

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

  useEffect(() => {
    async function buscarcardapio() {
      const data = await cardapio();
      setCardaioAPI(data);
    }
    buscarcardapio();
  }, []);

  return (
    <div className="login-page">
      <div className="logo-area">
        <button className="btn-voltar" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <h1>
          Área <span>Admin</span>
        </h1>
      </div>
      <div>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cardapioAPI.map((sabor) => (
                <tr key={sabor.id}>
                  <td>{sabor.nome}</td>
                  <td>{sabor.descricao}</td>
                  <td>
                    <button>Editar</button>
                    <button>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> 
      </div>
    </div>
  );
}
