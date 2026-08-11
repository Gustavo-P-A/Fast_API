import { useState, useEffect } from "react";
import "../../styles/admin/AdminLista.css";
import { useNavigate } from "react-router-dom";
import {
  listar_todos_produtos, deletar_sabor,
  toggle_status_produto, listar_categoria,
} from "../../api/auth";
import { ListaPizzas } from "../../components/produto/ListaPizzas";
import { ListaMonteSuaPizza } from "../../components/produto/ListaMonteSuaPizza";

export function AdminProdutos() {
  const [aba, setAba] = useState("pizzas"); // 'pizzas' | 'monte_sua_pizza'
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function buscar() {
      const [prods, cats] = await Promise.all([
        listar_todos_produtos(),
        listar_categoria(),
      ]);
      setProdutos(prods);
      setCategorias(cats);
    }
    buscar();
  }, []);

async function handleDeletar(id) {
  if (!confirm("Deseja realmente excluir este produto?")) return;
  try {
    const data = await deletar_sabor(id);

    if (data.mensagem?.includes("inativado")) {
      // não foi excluído de verdade — só marcado como inativo
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));
      alert(data.mensagem);
    } else {
      // excluído de verdade, some da lista
      setProdutos(prev => prev.filter(p => p.id !== id));
    }
  } catch (err) {
    const msg = err.response?.data?.detail || "Erro ao excluir produto.";
    alert(msg);
  }
}

  async function handleToggle(id) {
    try {
      const data = await toggle_status_produto(id);
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: data.ativo } : p));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Produtos</h1>
          <p className="ap-subtitulo">Gerencie os produtos do cardápio da sua pizzaria.</p>
        </div>
        {aba === "pizzas" ? (
          <button className="ap-btn-primary" onClick={() => navigate("/novo-produto")}>
            + Novo Produto
          </button>
        ) : (
          <button className="ap-btn-primary" onClick={() => navigate("/admin/novo-monte-pizza")}>
            + Novo Monte Sua Pizza
          </button>
        )}
      </div>

      <div className="ap-tabs">
        <button
          className={`ap-tab ${aba === "pizzas" ? "ap-tab-ativo" : ""}`}
          onClick={() => setAba("pizzas")}
        >
          Pizzas
        </button>
        <button
          className={`ap-tab ${aba === "monte_sua_pizza" ? "ap-tab-ativo" : ""}`}
          onClick={() => setAba("monte_sua_pizza")}
        >
          Monte Sua Pizza
        </button>
      </div>

      {aba === "pizzas" ? (
        <ListaPizzas
          produtos={produtos}
          categorias={categorias}
          navigate={navigate}
          filtroNome={filtroNome} setFiltroNome={setFiltroNome}
          filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
          filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
          handleDeletar={handleDeletar}
          handleToggle={handleToggle}
        />
      ) : (
        <ListaMonteSuaPizza navigate={navigate} />
      )}
    </div>
  );
}