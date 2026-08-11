import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { saborId, preco_adicional, itens_simples_publico } from "../api/auth";
import { getImagemUrl } from "../api/axios";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SeletorTamanho } from "../components/sabor/SeletorTamanho";
import { SeletorBorda } from "../components/sabor/SeletorBorda";
import { SeletorIngrediente } from "../components/sabor/SeletorIngrediente";
import "../styles/Sabor.css";

function SaborConteudo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useContext(AuthContext);
  const { adicionarItem, adicionarBebida } = useContext(CartContext);

  const ehBebida = location.pathname.startsWith("/bebida");

  const [sabor, setSabor] = useState(null);
  const [precoSelecionado, setPrecoSelecionado] = useState(null);
  const [adicionaisAPI, setAdicionaisAPI] = useState([]);
  const [ingredientesAPI, setIngredientesAPI] = useState([]);
  const [bordasSelecionadas, setBordasSelecionadas] = useState([]);
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]);
  const [quantidadeBebida, setQuantidadeBebida] = useState(1);

  useEffect(() => {
    if (ehBebida) {
      itens_simples_publico("BEBIDA")
        .then(lista => setSabor(lista.find(b => String(b.id) === id) || false));
    } else {
      saborId(id).then(setSabor);
    }
  }, [id, ehBebida]);

  useEffect(() => {
    if (!ehBebida && sabor?.permite_ingrediente) {
      itens_simples_publico("INGREDIENTE").then(setIngredientesAPI).catch(() => setIngredientesAPI([]));
    }
  }, [sabor, ehBebida]);

  function selecionarTamanho(preco) {
    setPrecoSelecionado(preco);
    setBordasSelecionadas([]);
    if (sabor?.permite_borda) {
      preco_adicional(preco.tamanho_rel.id).then(setAdicionaisAPI);
    }
  }

  if (sabor === null) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  if (sabor === false) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Item não encontrado.
        <br />
        <button className="sabor-btn-voltar" onClick={() => navigate(-1)}>← Voltar</button>
      </div>
    );
  }

  // ---------- Fluxo BEBIDA ----------
  if (ehBebida) {
    function diminuir() {
      setQuantidadeBebida(q => Math.max(1, q - 1));
    }

    function aumentar() {
      setQuantidadeBebida(q => q + 1);
    }

    function handleAdicionarBebida() {
      adicionarBebida(
        {
          item_simples_id: sabor.id,
          nome: sabor.nome,
          preco: Number(sabor.preco),
        },
        quantidadeBebida
      );
      navigate("/carrinho");
    }

    return (
      <div className="sabor-page">
        <button className="sabor-btn-voltar" onClick={() => navigate(-1)}>← Voltar</button>

        <div className="sabor-foto">
          <img
            src={sabor.imagem_url ? getImagemUrl(sabor.imagem_url) : "/bebida_padrao.png"}
            alt={sabor.nome}
          />
        </div>

        <div className="sabor-info">
          <h1 className="sabor-nome">{sabor.nome}</h1>
          {sabor.descricao && <p className="sabor-descricao">{sabor.descricao}</p>}

          <div className="sabor-preco-estimado">
            R$ {Number(sabor.preco).toFixed(2).replace(".", ",")}
          </div>

          <div className="sabor-quantidade">
            <button className="sabor-qtd-btn" onClick={diminuir}>−</button>
            <span className="sabor-qtd-valor">{quantidadeBebida}</span>
            <button className="sabor-qtd-btn" onClick={aumentar}>+</button>
          </div>

          <button
            className="sabor-btn-finalizar ativo"
            onClick={() => usuario ? handleAdicionarBebida() : navigate("/cadastro")}
          >
            {usuario
              ? `Adicionar ao Carrinho — R$ ${(Number(sabor.preco) * quantidadeBebida).toFixed(2).replace(".", ",")}`
              : "Criar Conta"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Fluxo SABOR (pizza) — igual ao original ----------
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

// Remonta o componente inteiro a cada troca de :id (ou entre /sabores e
// /bebida) via `key` -- assim o estado (sabor, seleções etc.) já nasce
// limpo no mount seguinte, sem precisar dar setSabor(null) de forma
// síncrona dentro do useEffect pra "resetar" o item anterior.
export function Sabor() {
  const location = useLocation();
  return <SaborConteudo key={location.pathname} />;
}