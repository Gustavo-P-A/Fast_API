import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { criar_pedido, pedido_adicionais, adicionar_adicional, finalizar_pedido_id } from "../api/auth";
import "../styles/FinalizarPedido.css";

export function FinalizarPedido() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [enviando, setEnviando] = useState(false);

  if (!state?.tamanho_id || !state?.endereco || !state?.pagamento) {
    navigate("/");
    return null;
  }

  // mesma regra B usada no Sabor.jsx: 1 sabor de borda = preço cheio, 2+ = proporcional
  const bordas = state.bordas || [];
  const precoBordas = bordas.length === 0
    ? 0
    : bordas.length === 1
      ? bordas[0].preco
      : bordas.reduce((soma, b) => soma + b.preco * (b.partes / state.qtd_bordas), 0);

  const total = state.preco_sabor + precoBordas;

  async function handleFinalizarEnviar() {
    setEnviando(true);
    try {
      const pedido = await criar_pedido();
      const item = await pedido_adicionais(pedido.id, {
        tamanho_id: state.tamanho_id,
        sabor_ids: state.sabor_ids,
      });

      for (const borda of bordas) {
        await adicionar_adicional(pedido.id, item.item_id, borda.adicional_id, borda.tamanho_id, borda.partes);
      }

      await finalizar_pedido_id(pedido.id, state.endereco.id, state.pagamento);
      navigate("/meus-pedidos");
    } catch {
      alert("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="revisao-container">
      <h1 className="revisao-titulo">Revise seu pedido</h1>

      <div className="revisao-secao">
        <h2 className="revisao-secao-titulo">Item</h2>
        <div className="revisao-item">
          {state.sabor_imagem && (
            <img className="revisao-item-foto" src={state.sabor_imagem} alt={state.sabor_nome} />
          )}
          <div className="revisao-item-info">
            <p className="revisao-item-nome">{state.sabor_nome}</p>
            <p className="revisao-linha">Tamanho: {state.tamanho_nome}</p>
            {bordas.length > 0 ? (
              <p className="revisao-linha">
                Borda: {bordas.map(b => `${b.nome}${bordas.length > 1 ? ` (${b.partes}/${state.qtd_bordas})` : ""}`).join(", ")}
              </p>
            ) : (
              <p className="revisao-linha">Sem borda</p>
            )}
          </div>
        </div>
      </div>

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
        <p className="revisao-linha">{state.pagamento}</p>
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