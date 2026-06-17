import { useContext, useEffect, useState } from "react";
import { meus_pedidos } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/MeusPedidos.css";

export function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function buscarPedidos() {
      const data = await meus_pedidos();
      setPedidos(data);
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
          {pedidos.map((pedido, index) =>
            pedido.itens.length > 0 ? (
              <div
                key={index}
                className="card"
                onClick={() =>
                  navigate(
                    `/sabores/${pedido.itens[0]?.precopizza_rel.sabor_rel.id}`,
                  )
                }
              >
                <div className="foto-container">
                  <img
                    src={`/${pedido.itens[0]?.precopizza_rel.sabor_rel.nome.toLowerCase().replace(/ /g, "_")}.png`}
                    alt={pedido.itens[0].precopizza_rel.sabor_rel.nome}
                    onError={(e) => (e.target.src = "/pizza_padrao.png")}
                  />
                </div>

                <div className="info">
                  <span className="badge-status">{pedido.status}</span>
                  <p className="nome">
                    {pedido.itens[0].precopizza_rel.sabor_rel.nome}
                  </p>
                  <p className="descricao">
                    Tamanho: {pedido.itens[0].precopizza_rel.tamanho_rel.nome}
                  </p>
                  <p className="preco">
                    {Number(pedido.preco).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div
                key={index}
                className="card"
                style={{ padding: "20px", textAlign: "center" }}
              >
                <p className="descricao">Pedido sem itens</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
