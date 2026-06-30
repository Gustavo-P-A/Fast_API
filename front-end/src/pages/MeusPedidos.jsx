import { useContext, useEffect, useState } from "react";
import { meus_pedidos } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getImagemUrl } from "../api/axios";
import "../styles/MeusPedidos.css";

export function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function buscarPedidos() {
      const data = await meus_pedidos();
      setPedidos([...data].sort((a, b) => b.id - a.id));
    }
    buscarPedidos();
  }, []);

  return (
    <div className="main-wrapper">
      <button className="btn-voltar" onClick={() => navigate('/')}>
        Voltar
      </button>

      <div className="content-area">
        <h2 style={{ color: "#3e3e3e", marginBottom: "20px" }}>Meus Pedidos</h2>

        <div className="container">
          {pedidos.map((pedido, index) => {
            const item = pedido.itens[0];
            if (!item) {
              return (
                <div key={index} className="card" style={{ padding: "20px", textAlign: "center" }}>
                  <p className="descricao">Pedido sem itens</p>
                </div>
              );
            }

            const sabores = item.sabores_rel.map(s => s.sabor_rel);
            const nomesSabores = sabores.map(s => s.nome).join(" / ");
            const primeiroSabor = sabores[0];

            return (
              <div
                key={index}
                className="card"
                onClick={() => navigate(`/meus-pedidos/${pedido.id}`)}
              >
                <div className="foto-container">
                  <img
                    src={primeiroSabor.imagem_url
                      ? (primeiroSabor.imagem_url.startsWith("http") ? primeiroSabor.imagem_url : getImagemUrl(primeiroSabor.imagem_url))
                      : "/pizza_padrao.png"}
                    alt={nomesSabores}
                    onError={(e) => (e.target.src = "/pizza_padrao.png")}
                  />
                </div>

                <div className="info">
                  <span className="badge-status">{pedido.status}</span>
                  <p className="nome">{nomesSabores}</p>
                  <p className="descricao">Tamanho: {item.tamanho_rel.nome}</p>
                  <p className="preco">
                    {Number(pedido.preco).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}