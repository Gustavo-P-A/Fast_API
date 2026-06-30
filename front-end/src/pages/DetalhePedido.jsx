import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pedido_por_id } from "../api/auth.js";
import { TimelineStatus } from "../components/pedido/TimelineStatus.jsx";
import { ItemPedidoCard } from "../components/pedido/ItemPedidoCard.jsx";
import "../styles/DetalhePedido.css";

export function DetalhePedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    pedido_por_id(id).then(setPedido).catch(() => navigate("/meus-pedidos"));
  }, [id]);

  if (!pedido) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  const data = new Date(pedido.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="detalhe-pedido-container">
      <button className="detalhe-btn-voltar" onClick={() => navigate("/meus-pedidos")}>← Voltar</button>

      <h1 className="detalhe-titulo">Pedido #{pedido.id}</h1>
      <p className="detalhe-data">{data}</p>

      <TimelineStatus status={pedido.status} />

      <div className="detalhe-secao">
        <h2 className="detalhe-secao-titulo">Itens</h2>
        {pedido.itens.map(item => (
          <ItemPedidoCard key={item.id} item={item} />
        ))}
      </div>

      <div className="detalhe-secao">
        <h2 className="detalhe-secao-titulo">Endereço de entrega</h2>
        {pedido.endereco_rel ? (
          <p className="detalhe-texto">
            {pedido.endereco_rel.rua}, {pedido.endereco_rel.numero}
            {pedido.endereco_rel.complemento && ` - ${pedido.endereco_rel.complemento}`}<br />
            {pedido.endereco_rel.bairro} — {pedido.endereco_rel.cidade}/{pedido.endereco_rel.estado}<br />
            CEP: {pedido.endereco_rel.cep}
          </p>
        ) : (
          <p className="detalhe-texto">Endereço não informado.</p>
        )}
      </div>

      <div className="detalhe-secao">
        <h2 className="detalhe-secao-titulo">Forma de pagamento</h2>
        <p className="detalhe-texto">{pedido.formato_de_pagamento}</p>
      </div>

      <div className="detalhe-total">
        <span>Total</span>
        <strong>
          {Number(pedido.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </strong>
      </div>
    </div>
  );
}