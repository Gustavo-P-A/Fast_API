import { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  criar_pedido, pedido_adicionais, adicionar_adicional, adicionar_ingrediente,
  adicionar_bebida_pedido, finalizar_pedido_id,
} from "../api/auth";
import { CartContext } from "../contexts/CartContext";
import { precoItemCarrinho } from "../contexts/carrinhoCalculos";
import "../styles/FinalizarPedido.css";

export function FinalizarPedido() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { itens, bebidas, total, vazio, limparCarrinho } = useContext(CartContext);
  const [enviando, setEnviando] = useState(false);
  // Depois que o pedido é enviado com sucesso, limparCarrinho() esvazia o
  // carrinho -- o que faria "vazio" virar true e o efeito abaixo nos
  // mandar de volta pro /carrinho, atropelando o navigate pro Pix (ou
  // pra /meus-pedidos) que acabamos de disparar. Essa flag desliga esse
  // redirecionamento automático assim que o pedido já foi enviado.
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const faltaDadosParaRevisar = !pedidoEnviado && (vazio || !state?.endereco || !state?.pagamento);

  // navigate() precisa rodar como efeito, não durante o render --
  // chamá-lo direto no corpo do componente dispara o aviso do React
  // Router "Cannot update a component while rendering a different
  // component".
  useEffect(() => {
    if (faltaDadosParaRevisar) navigate("/carrinho");
  }, [faltaDadosParaRevisar, navigate]);

  if (faltaDadosParaRevisar) {
    return null;
  }

  async function handleFinalizarEnviar() {
    setEnviando(true);
    try {
      const pedido = await criar_pedido();

      for (const item of itens) {
        const itemCriado = await pedido_adicionais(pedido.id, {
          tamanho_id: item.tamanho_id,
          sabor_ids: item.sabor_ids,
        });

        for (const borda of item.bordas || []) {
          await adicionar_adicional(pedido.id, itemCriado.item_id, borda.adicional_id, borda.tamanho_id, borda.partes);
        }

        for (const ingrediente of item.ingredientes || []) {
          await adicionar_ingrediente(pedido.id, itemCriado.item_id, ingrediente.item_simples_id, ingrediente.quantidade);
        }
      }

      for (const bebida of bebidas) {
        await adicionar_bebida_pedido(pedido.id, bebida.item_simples_id, bebida.quantidade);
      }

      await finalizar_pedido_id(
        pedido.id,
        state.endereco.id,
        state.pagamento,
        state.formaPagamentoId,
        state.parcelas,
        state.trocoPara,
      );

      limparCarrinho();
      setPedidoEnviado(true);

      if (state.pagamento === "Pix") {
        navigate(`/pedido/${pedido.id}/pix`);
      } else {
        navigate("/meus-pedidos");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao enviar pedido. Tente novamente.";
      alert(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="revisao-container">
      <h1 className="revisao-titulo">Revise seu pedido</h1>

      {itens.map(item => (
        <div key={item.id} className="revisao-secao">
          <h2 className="revisao-secao-titulo">Item</h2>
          <div className="revisao-item">
            {item.sabor_imagem && (
              <img className="revisao-item-foto" src={item.sabor_imagem} alt={item.sabor_nomes.join(" / ")} />
            )}
            <div className="revisao-item-info">
              <p className="revisao-item-nome">{item.sabor_nomes.join(" / ")}</p>
              <p className="revisao-linha">Tamanho: {item.tamanho_nome}</p>
              {item.bordas.length > 0 ? (
                <p className="revisao-linha">
                  Borda: {item.bordas.map(b => `${b.nome}${item.bordas.length > 1 ? ` (${b.partes}/${item.qtd_bordas})` : ""}`).join(", ")}
                </p>
              ) : (
                <p className="revisao-linha">Sem borda</p>
              )}
              {item.ingredientes.length > 0 && (
                <p className="revisao-linha">
                  Adicionais: {item.ingredientes.map(i => `${i.nome}${i.quantidade > 1 ? ` x${i.quantidade}` : ""}`).join(", ")}
                </p>
              )}
              <p className="revisao-linha"><strong>R$ {precoItemCarrinho(item).toFixed(2).replace(".", ",")}</strong></p>
            </div>
          </div>
        </div>
      ))}

      {bebidas.length > 0 && (
        <div className="revisao-secao">
          <h2 className="revisao-secao-titulo">Bebidas</h2>
          {bebidas.map(b => (
            <p key={b.item_simples_id} className="revisao-linha">
              {b.quantidade}x {b.nome} — R$ {(b.preco * b.quantidade).toFixed(2).replace(".", ",")}
            </p>
          ))}
        </div>
      )}

      <div className="revisao-secao">
        <h2 className="revisao-secao-titulo">Endereço de entrega</h2>
        <p className="revisao-linha">
          {state.endereco.rua}, {state.endereco.numero}
          {state.endereco.complemento && ` - ${state.endereco.complemento}`}<br />
          {state.endereco.bairro} — {state.endereco.cidade}/{state.endereco.estado}<br />
          CEP: {state.endereco.cep}
        </p>
      </div>

      <div className="revisao-secao">
        <h2 className="revisao-secao-titulo">Forma de pagamento</h2>
        <p className="revisao-linha">
          {state.pagamento}
          {state.parcelas > 1 && ` em ${state.parcelas}x`}
          {state.pagamento === "Dinheiro" && state.trocoPara ? ` — troco para R$ ${Number(state.trocoPara).toFixed(2).replace(".", ",")}` : ""}
        </p>
      </div>

      <div className="revisao-total">
        <span>Total</span>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>

      <div className="revisao-acoes">
        <button className="revisao-btn-voltar" onClick={() => navigate(-1)} disabled={enviando}>
          ← Voltar e corrigir
        </button>
        <button className="revisao-btn-confirmar" onClick={handleFinalizarEnviar} disabled={enviando}>
          {enviando ? "Enviando..." : "Finalizar e Enviar Pedido"}
        </button>
      </div>
    </div>
  );
}