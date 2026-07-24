import { useState, useEffect } from "react";
import "../../styles/admin/Dashboard.css";
import { listar_todos_produtos, listar_pedidos_admin, listar_clientes_admin } from "../../api/auth";

export function AdminDashboard() {
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      try {
        const [produtos, pedidos, clientes] = await Promise.all([
          listar_todos_produtos(),
          listar_pedidos_admin(),
          listar_clientes_admin(),
        ]);

        const pedidosFinalizados = pedidos.filter(p => p.status === "ENTREGUE");
        const faturamento = pedidosFinalizados.reduce((acc, p) => acc + (p.preco || 0), 0);
        const ticketMedio = pedidosFinalizados.length > 0 ? faturamento / pedidosFinalizados.length : 0;

        const porStatus = pedidos.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});

        // Últimos 5 pedidos
        const ultimos = [...pedidos].slice(0, 5);

        // Top 3 clientes por gasto
        const topClientes = [...clientes]
          .sort((a, b) => b.gasto_total - a.gasto_total)
          .slice(0, 3);

        setResumo({ produtos, pedidos, clientes, faturamento, ticketMedio, porStatus, ultimos, topClientes });
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, []);

  if (carregando) return <div className="dash-vazio">Carregando dashboard...</div>;

  const { produtos, pedidos, clientes, faturamento, ticketMedio, porStatus, ultimos, topClientes } = resumo;

  const STATUS_COR = {
    "PENDENTE":          "#854d0e",
    "CONFIRMADO":        "#1d4ed8",
    "EM PREPARO":        "#c2410c",
    "SAIU PARA ENTREGA": "#6d28d9",
    "ENTREGUE":        "#15803d",
    "CANCELADO":         "#dc2626",
  };

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-titulo">Dashboard</h1>
          <p className="dash-subtitulo">Visão geral do desempenho da sua pizzaria.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpis">
        <div className="dash-kpi">
          <span className="dash-kpi-icon">💰</span>
          <div>
            <span className="dash-kpi-label">Faturamento Total</span>
            <span className="dash-kpi-valor">R$ {faturamento.toFixed(2)}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-icon">📋</span>
          <div>
            <span className="dash-kpi-label">Total de Pedidos</span>
            <span className="dash-kpi-valor">{pedidos.length}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-icon">🎯</span>
          <div>
            <span className="dash-kpi-label">Ticket Médio</span>
            <span className="dash-kpi-valor">R$ {ticketMedio.toFixed(2)}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-icon">👥</span>
          <div>
            <span className="dash-kpi-label">Clientes</span>
            <span className="dash-kpi-valor">{clientes.length}</span>
          </div>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi-icon">🍕</span>
          <div>
            <span className="dash-kpi-label">Produtos Ativos</span>
            <span className="dash-kpi-valor">{produtos.filter(p => p.ativo).length}</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Pedidos por status */}
        <div className="dash-card dash-subcard">
          <h2 className="dash-card-titulo">Pedidos por Status</h2>
          <div className="dash-status-lista">
            {Object.entries(porStatus).map(([status, qtd]) => (
              <div key={status} className="dash-status-item">
                <div className="dash-status-esquerda">
                  <span
                    className="dash-status-dot"
                    style={{ background: STATUS_COR[status] || "#888" }}
                  />
                  <span className="dash-status-nome">{status}</span>
                </div>
                <div className="dash-status-direita">
                  <div
                    className="dash-barra-wrap"
                    title={`${qtd} pedido(s)`}
                  >
                    <div
                      className="dash-barra"
                      style={{
                        width: `${Math.round((qtd / pedidos.length) * 100)}%`,
                        background: STATUS_COR[status] || "#888",
                      }}
                    />
                  </div>
                  <span className="dash-status-qtd">{qtd}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos pedidos */}
        <div className="dash-card dash-subcard">
          <h2 className="dash-card-titulo">Últimos Pedidos</h2>
          <table className="dash-table dash-table-inner">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ultimos.length === 0 && (
                <tr><td colSpan={4} className="dash-vazio">Sem pedidos.</td></tr>
              )}
              {ultimos.map(p => (
                <tr key={p.id}>
                  <td className="dash-nome">#{p.id}</td>
                  <td className="dash-desc">{p.cliente_nome}</td>
                  <td>R$ {p.preco?.toFixed(2) ?? "—"}</td>
                  <td>
                    <span style={{
                      color: STATUS_COR[p.status] || "#888",
                      fontWeight: 600,
                      fontSize: "0.8rem"
                    }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top clientes */}
        <div className="dash-card dash-subcard">
          <h2 className="dash-card-titulo">Top Clientes</h2>
          <div className="dash-top-clientes">
            {topClientes.length === 0 && <p className="dash-vazio">Sem dados.</p>}
            {topClientes.map((c, i) => (
              <div key={c.id} className="dash-top-cliente-item">
                <div className="dash-top-pos">{i + 1}</div>
                <div className="dash-cliente-avatar">{c.nome[0].toUpperCase()}</div>
                <div className="dash-top-info">
                  <span className="dash-nome">{c.nome}</span>
                  <span className="dash-desc">{c.total_pedidos} pedido(s)</span>
                </div>
                <span className="dash-top-gasto">R$ {c.gasto_total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo do cardápio */}
        <div className="dash-card dash-subcard">
          <h2 className="dash-card-titulo">Resumo do Cardápio</h2>
          <div className="dash-status-lista">
            <div className="dash-status-item">
              <span className="dash-status-nome">Total de produtos</span>
              <span className="dash-nome">{produtos.length}</span>
            </div>
            <div className="dash-status-item">
              <span className="dash-status-nome">Produtos ativos</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>{produtos.filter(p => p.ativo).length}</span>
            </div>
            <div className="dash-status-item">
              <span className="dash-status-nome">Produtos inativos</span>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>{produtos.filter(p => !p.ativo).length}</span>
            </div>
            <div className="dash-status-item">
              <span className="dash-status-nome">Pedidos entregues</span>
              <span className="dash-nome">{porStatus["ENTREGUE"] || 0}</span>
            </div>
            <div className="dash-status-item">
              <span className="dash-status-nome">Pedidos cancelados</span>
              <span style={{ color: "#dc2626", fontWeight: 600 }}>{porStatus["CANCELADO"] || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}