import { useState, useEffect } from "react";
import { listar_pedidos_admin, mudar_status_pedido } from "../../api/auth";
import "../../styles/AdminPaginas.css";

const STATUS_FLUXO = [
  "PENDENTE",
  "CONFIRMADO",
  "EM PREPARO",
  "SAIU PARA ENTREGA",
  "ENTREGUE",
  "CANCELADO",
];

const STATUS_COR = {
  PENDENTE: { bg: "#fef9c3", color: "#854d0e" },
  CONFIRMADO: { bg: "#dbeafe", color: "#1d4ed8" },
  "EM PREPARO": { bg: "#ffedd5", color: "#c2410c" },
  "SAIU PARA ENTREGA": { bg: "#ede9fe", color: "#6d28d9" },
  ENTREGUE: { bg: "#dcfce7", color: "#15803d" },
  CANCELADO: { bg: "#fee2e2", color: "#dc2626" },
};

function StatusBadge({ status }) {
  const cor = STATUS_COR[status] || { bg: "#f5f5f5", color: "#666" };
  return (
    <span
      style={{
        background: cor.bg,
        color: cor.color,
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [alterando, setAlterando] = useState(null);

  async function buscar(status = "") {
    setCarregando(true);
    try {
      const data = await listar_pedidos_admin(status);
      setPedidos(data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar(filtroStatus);
  }, [filtroStatus]);

  async function handleMudarStatus(id, novoStatus) {
    setAlterando(id);
    try {
      await mudar_status_pedido(id, novoStatus);
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p)),
      );
    } catch (err) {
      const msg = err?.response?.data?.detail || "Erro ao alterar status.";
      alert(msg);
    } finally {
      setAlterando(null);
    }
  }

  function proximoStatus(status) {
  const idx = STATUS_FLUXO.indexOf(status);
  if (idx === -1 || status === "ENTREGUE" || status === "CANCELADO") return null;
  const prox = STATUS_FLUXO[idx + 1];
  return prox === "CANCELADO" ? null : prox;
  }

  const contadores = STATUS_FLUXO.reduce((acc, s) => {
    acc[s] = pedidos.filter((p) => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Pedidos</h1>
          <p className="ap-subtitulo">
            Gerencie e acompanhe todos os pedidos da sua pizzaria.
          </p>
        </div>
      </div>

      {/* Contadores por status */}
      <div className="ap-status-cards">
        {[
          "PENDENTE",
          "CONFIRMADO",
          "EM PREPARO",
          "SAIU PARA ENTREGA",
          "ENTREGUE",
          "CANCELADO",
        ].map((s) => (
          <button
            key={s}
            className={`ap-status-card ${filtroStatus === s ? "ap-status-card-ativo" : ""}`}
            onClick={() => setFiltroStatus((prev) => (prev === s ? "" : s))}
          >
            <span className="ap-status-card-num">{contadores[s] || 0}</span>
            <span className="ap-status-card-label">{s}</span>
          </button>
        ))}
      </div>

      <div className="ap-card">
        <div className="ap-filtros">
          <select
            className="ap-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_FLUXO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="ap-btn-ghost" onClick={() => setFiltroStatus("")}>
            Limpar
          </button>
          <span className="ap-resumo-linha">{pedidos.length} pedido(s)</span>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Data</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={8} className="ap-vazio">
                    Carregando...
                  </td>
                </tr>
              )}
              {!carregando && pedidos.length === 0 && (
                <tr>
                  <td colSpan={8} className="ap-vazio">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
              {!carregando &&
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td className="ap-nome">#{p.id}</td>
                    <td>
                      <span className="ap-nome">{p.cliente_nome}</span>
                      <br />
                      <span className="ap-desc">{p.cliente_email}</span>
                    </td>
                    <td>{p.total_itens} item(s)</td>
                    <td>{p.formato_de_pagamento || "—"}</td>
                    <td className="ap-nome">R$ {p.preco?.toFixed(2) ?? "—"}</td>
                    <td className="ap-desc">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="text-center">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-center">
                      {proximoStatus(p.status) && (
                        <button
                          className="ap-btn-primary"
                          style={{ fontSize: "0.78rem", padding: "5px 10px" }}
                          disabled={alterando === p.id}
                          onClick={() =>
                            handleMudarStatus(p.id, proximoStatus(p.status))
                          }
                        >
                          {alterando === p.id
                            ? "..."
                            : `→ ${proximoStatus(p.status)}`}
                        </button>
                      )}
                      {p.status !== "CANCELADO" &&
                        p.status !== "ENTREGUE" &&
                        p.status !== "SAIU PARA ENTREGA" && (
                          <button
                            className="ap-btn-delete"
                            style={{
                              fontSize: "0.78rem",
                              padding: "5px 10px",
                              marginLeft: "6px",
                            }}
                            disabled={alterando === p.id}
                            onClick={() => handleMudarStatus(p.id, "CANCELADO")}
                          >
                            Cancelar
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
