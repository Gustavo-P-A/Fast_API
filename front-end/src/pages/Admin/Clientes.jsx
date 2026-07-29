import { useState, useEffect } from "react";
import "../../styles/admin/Clientes.css";
import { listar_clientes_admin, pedidos_do_cliente } from "../../api/auth";

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
    <div className="cli-page">
      <div className="cli-header">
        <div>
          <h1 className="cli-titulo">Clientes</h1>
          <p className="cli-subtitulo">Gerencie seus clientes e acompanhe suas informações.</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="cli-status-cards">
        <div className="cli-status-card">
          <span className="cli-status-card-num">{clientes.length}</span>
          <span className="cli-status-card-label">Total de Clientes</span>
        </div>
        <div className="cli-status-card">
          <span className="cli-status-card-num" style={{ color: "#16a34a" }}>
            {clientes.filter(c => c.ativo).length}
          </span>
          <span className="cli-status-card-label">Clientes Ativos</span>
        </div>
        <div className="cli-status-card">
          <span className="cli-status-card-num" style={{ color: "#dc2626" }}>
            {clientes.filter(c => !c.ativo).length}
          </span>
          <span className="cli-status-card-label">Clientes Inativos</span>
        </div>
        <div className="cli-status-card">
          <span className="cli-status-card-num">
            R$ {clientes.reduce((acc, c) => acc + (c.gasto_total || 0), 0).toFixed(2)}
          </span>
          <span className="cli-status-card-label">Faturamento Total</span>
        </div>
      </div>

      <div className="cli-card">
        <div className="cli-filtros">
          <input
            className="cli-input"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <button className="cli-btn-ghost" onClick={() => setBusca("")}>Limpar</button>
          <span className="cli-resumo-linha">{clientesFiltrados.length} cliente(s)</span>
        </div>

        <div className="cli-table-wrap">
          <table className="cli-table cli-table-clientes">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col className="cli-col-filler" />
            </colgroup>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>E-mail</th>
                <th className="text-center">Pedidos</th>
                <th className="text-center">Gasto Total</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={7} className="cli-vazio">Carregando...</td></tr>
              )}
              {!carregando && clientesFiltrados.length === 0 && (
                <tr><td colSpan={7} className="cli-vazio">Nenhum cliente encontrado.</td></tr>
              )}
              {!carregando && clientesFiltrados.map(c => (
                <>
                  <tr key={c.id} className={!c.ativo ? "cli-row-inativo" : ""}>
                    <td>
                      <div className="cli-cliente-info">
                        <div className="cli-cliente-avatar">{c.nome[0].toUpperCase()}</div>
                        <span className="cli-nome">{c.nome}</span>
                      </div>
                    </td>
                    <td className="cli-desc">{c.email}</td>
                    <td className="text-center">{c.total_pedidos}</td>
                    <td className="text-center cli-nome">R$ {c.gasto_total.toFixed(2)}</td>
                    <td className="text-center">
                      <span className={`cli-btn-status ${c.ativo ? "cli-status-ativo" : "cli-status-inativo"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="cli-btn-edit"
                        onClick={() => handleVerPedidos(c)}
                      >
                        {clienteSelecionado?.id === c.id ? "Fechar" : "Ver Pedidos"}
                      </button>
                    </td>
                    <td></td>
                  </tr>

                  {/* Linha expandida com pedidos do cliente */}
                  {clienteSelecionado?.id === c.id && (
                    <tr key={`pedidos-${c.id}`}>
                      <td colSpan={7} className="cli-expand">
                        <div className="cli-expand-header">
                          <strong>Pedidos de {c.nome}</strong>
                        </div>
                        {carregandoPedidos ? (
                          <p className="cli-vazio">Carregando pedidos...</p>
                        ) : pedidos.length === 0 ? (
                          <p className="cli-vazio">Nenhum pedido encontrado.</p>
                        ) : (
                          <table className="cli-table cli-table-inner">
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