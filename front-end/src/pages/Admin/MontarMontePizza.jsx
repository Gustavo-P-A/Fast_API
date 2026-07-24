import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContext } from "react";
import {
  buscar_monte_pizza_publico, preco_adicional, itens_simples_publico, tamanhos_publico,
} from "../../api/auth";
import { AuthContext } from "../../contexts/AuthContext";
import { CartContext } from "../../contexts/CartContext";
import { PassosIndicador } from "../../components/MonteSuaPizza/PassosIndicador";
import { PassoSabores } from "../../components/MonteSuaPizza/PassoSabores";
import { PassoBorda } from "../../components/MonteSuaPizza/PassoBorda";
import { PassoIngredientes } from "../../components/MonteSuaPizza/PassoIngredientes";
import { PassoBebidas } from "../../components/MonteSuaPizza/PassoBebidas";
import "../../styles/Sabor.css";
import "../../styles/admin/MontarMontePizza.css";

export function MontarMontePizza() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const { adicionarItem, adicionarBebida } = useContext(CartContext);

  const [produto, setProduto] = useState(null);
  const [saboresEscolhidos, setSaboresEscolhidos] = useState([]); // [sabor_id]
  const [adicionaisAPI, setAdicionaisAPI] = useState([]);
  const [bebidasAPI, setBebidasAPI] = useState([]);
  const [bordasSelecionadas, setBordasSelecionadas] = useState([]);
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]);
  const [ingredientesAPI, setIngredientesAPI] = useState([]);
  const [bebidasEscolhidas, setBebidasEscolhidas] = useState([]); // [{item_simples_id, quantidade}]
  const [passo, setPasso] = useState(1); // 1 sabores, 2 borda, 3 adicionais(ingredientes), 4 bebidas
  const [tamanhoInfo, setTamanhoInfo] = useState(null);

  useEffect(() => {
    buscar_monte_pizza_publico(id).then(setProduto).catch(() => setProduto(null));
  }, [id]);

  useEffect(() => {
    if (!produto) return;
    preco_adicional(produto.tamanho_id).then(setAdicionaisAPI).catch(() => setAdicionaisAPI([]));
    itens_simples_publico("INGREDIENTE").then(setIngredientesAPI).catch(() => setIngredientesAPI([]));
    itens_simples_publico("BEBIDA").then(setBebidasAPI).catch(() => setBebidasAPI([]));
    tamanhos_publico().then(tams => {
      setTamanhoInfo(tams.find(t => t.id === produto.tamanho_id) || null);
    }).catch(() => setTamanhoInfo(null));
  }, [produto]);

  if (!produto) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;

  const qtdMax = produto.qtd_sabores;

  // Meio a meio: a restrição mais rígida entre os sabores escolhidos prevalece,
  // e a regra do produto (Monte Sua Pizza) também precisa permitir.
  const saboresObjs = produto.sabores.filter(s => saboresEscolhidos.includes(s.id));
  const permiteBorda = produto.permite_borda
    && saboresEscolhidos.length > 0
    && saboresObjs.every(s => s.permite_borda ?? true);
  const permiteIngrediente = produto.permite_ingrediente
    && saboresEscolhidos.length > 0
    && saboresObjs.every(s => s.permite_ingrediente ?? true);
  const qtdBordas = permiteBorda ? (tamanhoInfo?.qtd_bordas || 0) : 0;

  function toggleSabor(saborId) {
    setSaboresEscolhidos(prev => {
      if (prev.includes(saborId)) return prev.filter(s => s !== saborId);
      if (prev.length >= qtdMax) return prev; // limite atingido
      return [...prev, saborId];
    });
  }

  function precoDaBorda(adicionalId) {
    return adicionaisAPI.find(a => a.adicional_rel.id === adicionalId)?.preco || 0;
  }
  function precoDoIngrediente(itemId) {
    return ingredientesAPI.find(i => i.id === itemId)?.preco || 0;
  }
  function precoDaBebida(itemId) {
    return bebidasAPI.find(b => b.id === itemId)?.preco || 0;
  }

  const precoBase = saboresObjs.length > 0 ? Math.max(...saboresObjs.map(s => s.preco)) : 0;

  const distintasBordas = bordasSelecionadas.length;
  const precoBordas = distintasBordas === 0
    ? 0
    : distintasBordas === 1
      ? precoDaBorda(bordasSelecionadas[0].adicional_id)
      : bordasSelecionadas.reduce((s, b) => s + precoDaBorda(b.adicional_id) * (b.partes / qtdBordas), 0);

  const precoIngredientes = ingredientesSelecionados.reduce(
    (s, i) => s + precoDoIngrediente(i.item_simples_id) * i.quantidade, 0
  );
  const precoBebidas = bebidasEscolhidas.reduce(
    (s, b) => s + precoDaBebida(b.item_simples_id) * b.quantidade, 0
  );

  const precoEstimado = precoBase + precoBordas + precoIngredientes + precoBebidas;
  const podeAvancarPasso1 = saboresEscolhidos.length >= 1;

  function irParaProximo(atual) {
    if (atual === 1) {
      if (permiteBorda) return setPasso(2);
      if (permiteIngrediente) return setPasso(3);
      return setPasso(4);
    }
    if (atual === 2) {
      if (permiteIngrediente) return setPasso(3);
      return setPasso(4);
    }
    if (atual === 3) return setPasso(4);
  }

  function irParaAnterior(atual) {
    if (atual === 4) {
      if (permiteIngrediente) return setPasso(3);
      if (permiteBorda) return setPasso(2);
      return setPasso(1);
    }
    if (atual === 3) {
      if (permiteBorda) return setPasso(2);
      return setPasso(1);
    }
    if (atual === 2) return setPasso(1);
  }

  function alterarQtdBebida(itemId, delta) {
    setBebidasEscolhidas(prev => {
      const atual = prev.find(b => b.item_simples_id === itemId);
      const nova = (atual?.quantidade || 0) + delta;
      if (nova <= 0) return prev.filter(b => b.item_simples_id !== itemId);
      if (atual) return prev.map(b => b.item_simples_id === itemId ? { ...b, quantidade: nova } : b);
      return [...prev, { item_simples_id: itemId, quantidade: nova }];
    });
  }

  function handleFinalizar() {
    adicionarItem({
      tamanho_id: produto.tamanho_id,
      tamanho_nome: produto.tamanho_nome,
      qtd_bordas: qtdBordas,
      sabor_ids: saboresEscolhidos,
      sabor_nomes: saboresObjs.map(s => s.nome),
      sabor_imagem: produto.imagem_url,
      preco_sabor: precoBase,
      bordas: bordasSelecionadas.map(b => ({
        adicional_id: b.adicional_id,
        partes: b.partes,
        tamanho_id: produto.tamanho_id,
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

    for (const b of bebidasEscolhidas) {
      adicionarBebida({
        item_simples_id: b.item_simples_id,
        nome: bebidasAPI.find(bb => bb.id === b.item_simples_id)?.nome,
        preco: precoDaBebida(b.item_simples_id),
      }, b.quantidade);
    }

    navigate("/carrinho");
  }

  return (
    <div className="sabor-page mmp-page">
      <button className="sabor-btn-voltar" onClick={() => navigate(-1)}>← Voltar</button>

      <div className="sabor-foto mmp-foto-central">
        <img
          src={produto.imagem_url || "/pizza_padrao.png"}
          alt={produto.nome}
        />
      </div>

      <div className="sabor-info">
        <h1 className="sabor-nome mmp-titulo-central">{produto.nome}</h1>
        {produto.descricao && <p className="sabor-descricao mmp-desc-central">{produto.descricao}</p>}

        <PassosIndicador passoAtual={passo} />

        {passo === 1 && (
          <PassoSabores
            sabores={produto.sabores}
            qtdMax={qtdMax}
            saboresEscolhidos={saboresEscolhidos}
            onToggleSabor={toggleSabor}
            podeAvancar={podeAvancarPasso1}
            onContinuar={() => irParaProximo(1)}
          />
        )}

        {passo === 2 && permiteBorda && (
          <PassoBorda
            opcoes={adicionaisAPI}
            qtdBordas={qtdBordas}
            bordasSelecionadas={bordasSelecionadas}
            setBordasSelecionadas={setBordasSelecionadas}
            onVoltar={() => irParaAnterior(2)}
            onContinuar={() => irParaProximo(2)}
          />
        )}

        {passo === 3 && permiteIngrediente && (
          <PassoIngredientes
            opcoes={ingredientesAPI}
            ingredientesSelecionados={ingredientesSelecionados}
            setIngredientesSelecionados={setIngredientesSelecionados}
            onVoltar={() => irParaAnterior(3)}
            onContinuar={() => irParaProximo(3)}
          />
        )}

        {passo === 4 && (
          <PassoBebidas
            bebidas={bebidasAPI}
            bebidasEscolhidas={bebidasEscolhidas}
            onAlterarQtd={alterarQtdBebida}
            precoEstimado={precoEstimado}
            onVoltar={() => irParaAnterior(4)}
            onFinalizar={() => usuario ? handleFinalizar() : navigate("/cadastro")}
            textoBotaoFinalizar={usuario ? "Adicionar ao Carrinho" : "Criar Conta"}
          />
        )}
      </div>
    </div>
  );
}
