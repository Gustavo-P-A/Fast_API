import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saborId, criar_pedido, pedido_adicionais, preco_adicional, adicionar_adicional } from "../api/auth";
import { getImagemUrl } from "../api/axios";
import "../styles/Sabor.css";
import { AuthContext } from "../contexts/AuthContext";

export function Sabor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const [saborpizza, setSaborpizza] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [pedidoFeito, setPedidoFeito] = useState(false);
  const [adicionaisAPI, setAdicionaisAPI] = useState([]);
  const [adicionaisCliente, setAdicionaisCliente] = useState({});

  useEffect(() => {
    async function buscar() {
      const data = await saborId(id);
      setSaborpizza(data);
    }
    buscar();
  }, [id]);

  async function fazerPedido() {
  if (!tamanhoSelecionado) return;
  navigate("/finalizar-pedido", {
    state: {
      precopizza_id: tamanhoSelecionado.id,
      tamanho_id: tamanhoSelecionado.tamanho_rel.id,
      adicionais: Object.values(adicionaisCliente),
    }
  });
}

  async function buscarAdicionais(preco) {
    const data = await preco_adicional(preco.tamanho_rel.id);
    setAdicionaisAPI(data);
  }

  if (!saborpizza) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  const precosOrdenados = saborpizza.preco_float
    ? [...saborpizza.preco_float].sort((a, b) => Number(a.preco) - Number(b.preco))
    : [];

  const totalAdicionais = Object.values(adicionaisCliente).reduce((s, e) => s + e.quantidade, 0);

  return (
    <div className="sabor-page">
      <button className="sabor-btn-voltar" onClick={() => navigate(-1)}>← Voltar</button>

      <div className="sabor-foto">
        <img
          src={saborpizza.imagem_url ? getImagemUrl(saborpizza.imagem_url) : "/pizza_padrao.png"}
          alt={saborpizza.nome}
        />
      </div>

      <div className="sabor-info">
        <h1 className="sabor-nome">{saborpizza.nome}</h1>
        <p className="sabor-descricao">{saborpizza.descricao}</p>

        <div className="sabor-precos-lista">
          {precosOrdenados.map(preco => (
            <button
              key={preco.id}
              disabled={pedidoFeito}
              className={`sabor-preco-item ${tamanhoSelecionado?.id === preco.id ? "selecionado" : ""}`}
              onClick={() => { setTamanhoSelecionado(preco); buscarAdicionais(preco); }}
            >
              <strong>{preco.tamanho_rel.nome}</strong>
              <span>R$ {preco.preco.toFixed(2).replace(".", ",")}</span>
            </button>
          ))}

          {adicionaisAPI.length > 0 && (
            <div className="sabor-adicionais">
              <h3>Escolha seus adicionais</h3>
              {adicionaisAPI.map(item => (
                <div key={item.id} className="sabor-adicional-item">
                  <div>
                    <span>{item.adicional_rel.nome}</span>
                    <span style={{ color: "#888", fontSize: "0.85rem", marginLeft: 8 }}>
                      + R$ {item.preco.toFixed(2)}
                    </span>
                  </div>
                  <div className="sabor-adicional-controles">
                    <button
                      className="sabor-adicional-btn"
                      disabled={totalAdicionais >= tamanhoSelecionado.tamanho_rel.qtd_bordas}
                      onClick={() => setAdicionaisCliente(prev => ({
                        ...prev,
                        [item.id]: { item, quantidade: (prev[item.id]?.quantidade || 0) + 1 }
                      }))}
                    >+</button>
                    <span>{adicionaisCliente[item.id]?.quantidade || 0}</span>
                    <button
                      className="sabor-adicional-btn"
                      onClick={() => setAdicionaisCliente(prev => {
                        const novaQtd = (prev[item.id]?.quantidade || 0) - 1;
                        if (novaQtd <= 0) { const { [item.id]: _, ...resto } = prev; return resto; }
                        return { ...prev, [item.id]: { item, quantidade: novaQtd } };
                      })}
                    >-</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className={`sabor-btn-finalizar ${tamanhoSelecionado ? "ativo" : ""}`}
            disabled={pedidoFeito || !tamanhoSelecionado}
            onClick={() => usuario ? fazerPedido() : navigate("/cadastro")}
          >
            {usuario ? "Finalizar Pedido" : "Criar Conta"}
          </button>
        </div>
      </div>
    </div>
  );
}