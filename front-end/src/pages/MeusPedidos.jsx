import { useEffect, useState } from "react";
import { meus_pedidos } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { getImagemUrl } from "../api/axios";
import "../styles/MeusPedidos.css";

export function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function buscarPedidos() {
      try {
        const data = await meus_pedidos();
        setPedidos([...data].sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setPedidos([]);
      }
    }
    buscarPedidos();
  }, []);

  return (
    <div className="main-wrapper">
      <button className="btn-voltar" onClick={() => navigate('/')}>
        ← Voltar
      </button>

      <div className="content-area">
        <h2>Meus Pedidos</h2>

        <div className="container">
          {pedidos.length === 0 && (
            <div className="card card-vazio">
              <p className="descricao">Você ainda não fez nenhum pedido.</p>
            </div>
          )}

          {pedidos.map((pedido) => {
            // Garante que itens existe e pega o primeiro
            const item = pedido.itens && pedido.itens[0];
            
            if (!item) {
              return (
                <div key={`vazio-${pedido.id}`} className="card card-vazio">
                  <p className="descricao">Pedido sem itens</p>
                </div>
              );
            }

            const sabores = item.sabores_rel ? item.sabores_rel.map(s => s.sabor_rel).filter(Boolean) : [];
            const nomesSabores = sabores.map(s => s.nome).join(" / ") || "Sabor não informado";
            const primeiroSabor = sabores[0];
            
            const urlDaFoto = primeiroSabor?.imagem_url;

            return (
              <div
                key={pedido.id}
                className="card"
                onClick={() => navigate(`/meus-pedidos/${pedido.id}`)}
              >
                <div className="foto-container">
                  {urlDaFoto ? (
                    <img
                      src={urlDaFoto.startsWith("http") ? urlDaFoto : getImagemUrl(urlDaFoto)}
                      alt={nomesSabores}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'home-card-sem-foto';
                        fallbackDiv.innerText = '🍕';
                        e.target.parentNode.appendChild(fallbackDiv);
                      }}
                    />
                  ) : (
                    <div className="home-card-sem-foto">🍕</div>
                  )}
                </div>

                <div className="info">
                  <span className="badge-status">{pedido.status}</span>
                  <p className="nome">{nomesSabores}</p>
                  <p className="descricao">Tamanho: {item.tamanho_rel?.nome || "Padrão"}</p>
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
