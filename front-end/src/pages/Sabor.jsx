import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saborId, preco_adicional, itens_simples_publico } from "../api/auth";
import { getImagemUrl } from "../api/axios";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SeletorTamanho } from "../components/sabor/SeletorTamanho";
import { SeletorBorda } from "../components/sabor/SeletorBorda";
import { SeletorIngrediente } from "../components/sabor/SeletorIngrediente";
import "../styles/Sabor.css";

export function Sabor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const { adicionarItem } = useContext(CartContext);

  const [sabor, setSabor] = useState(null);
  const [precoSelecionado, setPrecoSelecionado] = useState(null); // objeto PrecoPizza
  const [adicionaisAPI, setAdicionaisAPI] = useState([]);
  const [ingredientesAPI, setIngredientesAPI] = useState([]);
  const [bordasSelecionadas, setBordasSelecionadas] = useState([]); // [{ adicional_id, partes }]
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]); // [{ item_simples_id, quantidade }]

  useEffect(() => {
    saborId(id).then(setSabor);
  }, [id]);

  useEffect(() => {
    if (sabor?.permite_ingrediente) {
      itens_simples_publico("INGREDIENTE").then(setIngredientesAPI).catch(() => setIngredientesAPI([]));
    }
  }, [sabor]);

  function selecionarTamanho(preco) {
    setPrecoSelecionado(preco);
    setBordasSelecionadas([]);
    if (sabor?.permite_borda) {
      preco_adicional(preco.tamanho_rel.id).then(setAdicionaisAPI);
    }
  }

  if (!sabor) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  const precosOrdenados = sabor.preco_float
    ? [...sabor.preco_float].sort((a, b) => Number(a.preco) - Number(b.preco))
    : [];

  const permiteBorda = sabor.permite_borda ?? true;
  const permiteIngrediente = sabor.permite_ingrediente ?? true;
  const qtdBordas = permiteBorda ? (precoSelecionado?.tamanho_rel.qtd_bordas || 0) : 0;

  function precoDaBorda(adicionalId) {
    return adicionaisAPI.find(a => a.adicional_rel.id === adicionalId)?.preco || 0;
  }

  function precoDoIngrediente(itemId) {
    return ingredientesAPI.find(i => i.id === itemId)?.preco || 0;
  }

  // Regra B: 1 sabor de borda = preço cheio; 2+ sabores = proporcional às partes
  const sabotesDeBordaDistintos = bordasSelecionadas.length;
  const precoBordas = sabotesDeBordaDistintos === 0
    ? 0
    : sabotesDeBordaDistintos === 1
      ? precoDaBorda(bordasSelecionadas[0].adicional_id)
      : bordasSelecionadas.reduce((soma, b) => soma + precoDaBorda(b.adicional_id) * (b.partes / qtdBordas), 0);

  const precoIngredientes = ingredientesSelecionados.reduce(
    (soma, i) => soma + precoDoIngrediente(i.item_simples_id) * i.quantidade, 0
  );

  const precoEstimado = precoSelecionado ? Number(precoSelecionado.preco) + precoBordas + precoIngredientes : null;
  const podeFinalizar = !!precoSelecionado;

  function handleFinalizar() {
    if (!podeFinalizar) return;
    adicionarItem({
      tamanho_id: precoSelecionado.tamanho_rel.id,
      tamanho_nome: precoSelecionado.tamanho_rel.nome,
      qtd_bordas: qtdBordas,
      sabor_ids: [sabor.id],
      sabor_nomes: [sabor.nome],
      sabor_imagem: sabor.imagem_url,
      preco_sabor: Number(precoSelecionado.preco),
      bordas: bordasSelecionadas.map(b => ({
        adicional_id: b.adicional_id,
        partes: b.partes,
        tamanho_id: precoSelecionado.tamanho_rel.id,
        nome: adicionaisAPI.find(a => a.adicional_rel.id === b.adicional_id)?.adicional_rel.nome,
        preco: precoDaBorda(b.adicional_id),
      })),
      ingredientes: ingredientesSelecionados.map(i => ({
        item_simples_id: i.item_simples_id,
        quantidade: i.quantidade,
        nome: ingredientesAPI.find(ing => ing.id === i.item_simples_id)?.nome,
        preco: precoDoIngrediente(i.item_simples_id),
      })),
    });
    navigate("/carrinho");
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

        {precoSelecionado && permiteBorda && (
          <SeletorBorda
            opcoes={adicionaisAPI}
            qtdBordas={qtdBordas}
            bordasSelecionadas={bordasSelecionadas}
            setBordasSelecionadas={setBordasSelecionadas}
          />
        )}

        {precoSelecionado && permiteIngrediente && (
          <SeletorIngrediente
            opcoes={ingredientesAPI}
            ingredientesSelecionados={ingredientesSelecionados}
            setIngredientesSelecionados={setIngredientesSelecionados}
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
          {usuario ? "Adicionar ao Carrinho" : "Criar Conta"}
        </button>
      </div>
    </div>
  );
}
