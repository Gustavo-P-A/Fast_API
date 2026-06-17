import { useState, useEffect } from "react";
import { listar_clientes_admin, pedidos_do_cliente } from "../../api/auth";
import "../../styles/AdminPaginas.css";

export function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);

  useEffect(() => {
    async function buscar() {
      try {
        const data = await listar_clientes_admin();
        setClientes(data);
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, []);

  async function handleVerPedidos(cliente) {
    if (clienteSelecionado?.id === cliente.id) {
      setClienteSelecionado(null);
      setPedidos([]);
      return;
    }
    setClienteSelecionado(cliente);
    setCarregandoPedidos(true);
    try {
      const data = await pedidos_do_cliente(cliente.id);
      setPedidos(data);
    } finally {
      setCarregandoPedidos(false);
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Clientes</h1>
          <p className="ap-subtitulo">Gerencie seus clientes e acompanhe suas informações.</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="ap-status-cards">
        <div className="ap-status-card">
          <span className="ap-status-card-num">{clientes.length}</span>
          <span className="ap-status-card-label">Total de Clientes</span>
        </div>
        <div className="ap-status-card">
          <span className="ap-status-card-num" style={{ color: "#16a34a" }}>
            {clientes.filter(c => c.ativo).length}
          </span>
          <span className="ap-status-card-label">Clientes Ativos</span>
        </div>
        <div className="ap-status-card">
          <span className="ap-status-card-num" style={{ color: "#dc2626" }}>
            {clientes.filter(c => !c.ativo).length}
          </span>
          <span className="ap-status-card-label">Clientes Inativos</span>
        </div>
        <div className="ap-status-card">
          <span className="ap-status-card-num">
            R$ {clientes.reduce((acc, c) => acc + (c.gasto_total || 0), 0).toFixed(2)}
          </span>
          <span className="ap-status-card-label">Faturamento Total</span>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-filtros">
          <input
            className="ap-input"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <button className="ap-btn-ghost" onClick={() => setBusca("")}>Limpar</button>
          <span className="ap-resumo-linha">{clientesFiltrados.length} cliente(s)</span>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>E-mail</th>
                <th className="text-center">Pedidos</th>
                <th className="text-center">Gasto Total</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={6} className="ap-vazio">Carregando...</td></tr>
              )}
              {!carregando && clientesFiltrados.length === 0 && (
                <tr><td colSpan={6} className="ap-vazio">Nenhum cliente encontrado.</td></tr>
              )}
              {!carregando && clientesFiltrados.map(c => (
                <>
                  <tr key={c.id} className={!c.ativo ? "ap-row-inativo" : ""}>
                    <td>
                      <div className="ap-cliente-info">
                        <div className="ap-cliente-avatar">{c.nome[0].toUpperCase()}</div>
                        <span className="ap-nome">{c.nome}</span>
                      </div>
                    </td>
                    <td className="ap-desc">{c.email}</td>
                    <td className="text-center">{c.total_pedidos}</td>
                    <td className="text-center ap-nome">R$ {c.gasto_total.toFixed(2)}</td>
                    <td className="text-center">
                      <span className={`ap-btn-status ${c.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="ap-btn-edit"
                        onClick={() => handleVerPedidos(c)}
                      >
                        {clienteSelecionado?.id === c.id ? "Fechar" : "Ver Pedidos"}
                      </button>
                    </td>
                  </tr>

                  {/* Linha expandida com pedidos do cliente */}
                  {clienteSelecionado?.id === c.id && (
                    <tr key={`pedidos-${c.id}`}>
                      <td colSpan={6} className="ap-expand">
                        <div className="ap-expand-header">
                          <strong>Pedidos de {c.nome}</strong>
                        </div>
                        {carregandoPedidos ? (
                          <p className="ap-vazio">Carregando pedidos...</p>
                        ) : pedidos.length === 0 ? (
                          <p className="ap-vazio">Nenhum pedido encontrado.</p>
                        ) : (
                          <table className="ap-table ap-table-inner">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Status</th>
                                <th>Pagamento</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pedidos.map(p => (
                                <tr key={p.id}>
                                  <td>#{p.id}</td>
                                  <td>{p.status}</td>
                                  <td>{p.formato_de_pagamento || "—"}</td>
                                  <td>R$ {p.preco?.toFixed(2) ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}