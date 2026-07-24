import { useState, useEffect } from "react";
import {
  listar_monte_pizza, deletar_monte_pizza, toggle_status_monte_pizza,
} from "../../api/auth";

export function ListaMonteSuaPizza({ navigate }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function buscar() {
    setCarregando(true);
    try {
      const data = await listar_monte_pizza();
      setProdutos(data);
    } catch {
      alert("Erro ao carregar Monte Sua Pizza.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { buscar(); }, []);

  async function handleDeletar(id) {
    if (!confirm("Deseja realmente excluir este Monte Sua Pizza?")) return;
    await deletar_monte_pizza(id);
    setProdutos(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggle(id) {
    try {
      const data = await toggle_status_monte_pizza(id);
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: data.ativo } : p));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  if (carregando) return <div className="ap-card"><p>Carregando...</p></div>;

  return (
    <div className="ap-card">
      <div className="ap-resumo-linha">
        <span>{produtos.length} registro(s)</span>
        <span className="ap-resumo-ativo">{produtos.filter(p => p.ativo).length} ativos</span>
        <span className="ap-resumo-inativo">{produtos.filter(p => !p.ativo).length} inativos</span>
      </div>

      <div className="ap-table-wrap">
        <table className="ap-table ap-table-montepizza">
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome</th>
              <th>Tamanho</th>
              <th className="text-center">Qtd. sabores</th>
              <th className="text-center">Sabores vinculados</th>
              <th className="text-center">Status</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && (
              <tr><td colSpan={7} className="ap-vazio">Nenhum Monte Sua Pizza cadastrado.</td></tr>
            )}
            {produtos.map(p => (
              <tr key={p.id} className={!p.ativo ? "ap-row-inativo" : ""}>
                <td>
                  {p.imagem_url
                    ? <img src={p.imagem_url} alt={p.nome} className="ap-thumb" />
                    : <div className="ap-thumb-empty">🍕</div>
                  }
                </td>
                <td className="ap-nome">{p.nome}</td>
                <td>{p.tamanho_nome}</td>
                <td className="text-center">
                  {p.qtd_sabores_efetiva}
                  {p.qtd_sabores_override ? " (customizado)" : " (padrão do tamanho)"}
                </td>
                <td className="text-center">{p.sabores.length}</td>
                <td className="text-center">
                  <button
                    className={`ap-btn-status ${p.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}
                    onClick={() => handleToggle(p.id)}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td>
                  <div className="ap-acoes">
                    <button className="ap-btn-edit" onClick={() => navigate(`/admin/novo-monte-pizza/${p.id}`)}>Editar</button>
                    <button className="ap-btn-delete" onClick={() => handleDeletar(p.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
