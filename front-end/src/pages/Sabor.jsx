import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saborId, preco_adicional } from "../api/auth";
import { getImagemUrl } from "../api/axios";
import { AuthContext } from "../contexts/AuthContext";
import { SeletorTamanho } from "../components/sabor/SeletorTamanho";
import { SeletorBorda } from "../components/sabor/SeletorBorda";
import "../styles/Sabor.css";

export function Sabor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const [sabor, setSabor] = useState(null);
  const [precoSelecionado, setPrecoSelecionado] = useState(null); // objeto PrecoPizza
  const [adicionaisAPI, setAdicionaisAPI] = useState([]);
  const [bordasSelecionadas, setBordasSelecionadas] = useState([]); // [{ adicional_id, partes }]

  useEffect(() => {
    saborId(id).then(setSabor);
  }, [id]);

  function selecionarTamanho(preco) {
    setPrecoSelecionado(preco);
    setBordasSelecionadas([]);
    preco_adicional(preco.tamanho_rel.id).then(setAdicionaisAPI);
  }

  if (!sabor) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  const precosOrdenados = sabor.preco_float
    ? [...sabor.preco_float].sort((a, b) => Number(a.preco) - Number(b.preco))
    : [];

  const qtdBordas = precoSelecionado?.tamanho_rel.qtd_bordas || 0;

  function precoDaBorda(adicionalId) {
    return adicionaisAPI.find(a => a.adicional_rel.id === adicionalId)?.preco || 0;
  }

  // Regra B: 1 sabor de borda = preço cheio; 2+ sabores = proporcional às partes
  const sabotesDeBordaDistintos = bordasSelecionadas.length;
  const precoBordas = sabotesDeBordaDistintos === 0
    ? 0
    : sabotesDeBordaDistintos === 1
      ? precoDaBorda(bordasSelecionadas[0].adicional_id)
      : bordasSelecionadas.reduce((soma, b) => soma + precoDaBorda(b.adicional_id) * (b.partes / qtdBordas), 0);

  const precoEstimado = precoSelecionado ? Number(precoSelecionado.preco) + precoBordas : null;
  const podeFinalizar = !!precoSelecionado;

  function handleFinalizar() {
    if (!podeFinalizar) return;
    navigate("/endereco-pagamento", {
      state: {
        tamanho_id: precoSelecionado.tamanho_rel.id,
        tamanho_nome: precoSelecionado.tamanho_rel.nome,
        qtd_bordas: qtdBordas,
        sabor_ids: [sabor.id],
        sabor_nome: sabor.nome,
        sabor_imagem: sabor.imagem_url,
        preco_sabor: Number(precoSelecionado.preco),
        bordas: bordasSelecionadas.map(b => ({
          adicional_id: b.adicional_id,
          partes: b.partes,
          tamanho_id: precoSelecionado.tamanho_rel.id,
          nome: adicionaisAPI.find(a => a.adicional_rel.id === b.adicional_id)?.adicional_rel.nome,
          preco: precoDaBorda(b.adicional_id),
        })),
      },
    });
  }

  return (
    <div className="sabor-page">
      <button className="sabor-btn-voltar" onClick={() => navigate(-1)}>← Voltar</button>

      <div className="sabor-foto">
        <img
          src={sabor.imagem_url ? getImagemUrl(sabor.imagem_url) : "/pizza_padrao.png"}
          alt={sabor.nome}
        />
      </div>

      <div className="sabor-info">
        <h1 className="sabor-nome">{sabor.nome}</h1>
        <p className="sabor-descricao">{sabor.descricao}</p>

        <SeletorTamanho precos={precosOrdenados} selecionado={precoSelecionado} onSelecionar={selecionarTamanho} />

        {precoSelecionado && (
          <SeletorBorda
            opcoes={adicionaisAPI}
            qtdBordas={qtdBordas}
            bordasSelecionadas={bordasSelecionadas}
            setBordasSelecionadas={setBordasSelecionadas}
          />
        )}

        {precoSelecionado && (
          <div className="sabor-preco-estimado">
            Total estimado: <strong>R$ {precoEstimado.toFixed(2).replace(".", ",")}</strong>
          </div>
        )}

        <button
          className={`sabor-btn-finalizar ${podeFinalizar ? "ativo" : ""}`}
          disabled={!podeFinalizar}
          onClick={() => usuario ? handleFinalizar() : navigate("/cadastro")}
        >
          {usuario ? "Finalizar Pedido" : "Criar Conta"}
        </button>
      </div>
    </div>
  );
}