import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";
import { precoItemCarrinho } from "../contexts/CartProvider";
import "../styles/Carrinho.css";

export function Carrinho() {
  const navigate = useNavigate();
  const {
    itens, bebidas, removerItem, alterarQtdBebida, removerBebida, total, vazio,
  } = useContext(CartContext);

  if (vazio) {
    return (
      <div className="carrinho-container">
        <h1 className="carrinho-titulo">Seu Carrinho</h1>
        <div className="carrinho-vazio">
          <span className="carrinho-vazio-icone">🛒</span>
          <p>Seu carrinho está vazio.</p>
          <button className="carrinho-btn-ir-checkout" onClick={() => navigate("/")}>
            Ver cardápio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho-container">
      <h1 className="carrinho-titulo">Seu Carrinho</h1>

      {itens.length > 0 && (
        <div className="carrinho-secao">
          <h2 className="carrinho-secao-titulo">Pizzas</h2>
          {itens.map(item => (
            <div key={item.id} className="carrinho-item">
              {item.sabor_imagem && (
                <img className="carrinho-item-foto" src={item.sabor_imagem} alt={item.sabor_nomes.join(" / ")} />
              )}
              <div className="carrinho-item-info">
                <p className="carrinho-item-nome">{item.sabor_nomes.join(" / ")}</p>
                <p className="carrinho-linha">Tamanho: {item.tamanho_nome}</p>
                {item.bordas.length > 0 && (
                  <p className="carrinho-linha">
                    Borda: {item.bordas.map(b => `${b.nome}${item.bordas.length > 1 ? ` (${b.partes}/${item.qtd_bordas})` : ""}`).join(", ")}
                  </p>
                )}
                {item.ingredientes.length > 0 && (
                  <p className="carrinho-linha">
                    Adicionais: {item.ingredientes.map(i => `${i.nome}${i.quantidade > 1 ? ` x${i.quantidade}` : ""}`).join(", ")}
                  </p>
                )}
                <p className="carrinho-item-preco">
                  R$ {precoItemCarrinho(item).toFixed(2).replace(".", ",")}
                </p>
                <button className="carrinho-item-remover" onClick={() => removerItem(item.id)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bebidas.length > 0 && (
        <div className="carrinho-secao">
          <h2 className="carrinho-secao-titulo">Bebidas</h2>
          {bebidas.map(b => (
            <div key={b.item_simples_id} className="carrinho-bebida-linha">
              <div>
                <p className="carrinho-bebida-nome">{b.nome}</p>
                <p className="carrinho-bebida-preco">R$ {b.preco.toFixed(2).replace(".", ",")} cada</p>
              </div>
              <div className="carrinho-contador">
                <button type="button" onClick={() => alterarQtdBebida(b.item_simples_id, -1)}>−</button>
                <span>{b.quantidade}</span>
                <button type="button" onClick={() => alterarQtdBebida(b.item_simples_id, 1)}>+</button>
              </div>
              <button className="carrinho-item-remover" onClick={() => removerBebida(b.item_simples_id)}>Remover</button>
            </div>
          ))}
        </div>
      )}

      <div className="carrinho-total">
        <span>Total</span>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>

      <div className="carrinho-acoes">
        <button className="carrinho-btn-ir-checkout" onClick={() => navigate("/endereco-pagamento")}>
          Continuar para entrega
        </button>
        <button className="carrinho-btn-continuar-comprando" onClick={() => navigate("/")}>
          Continuar comprando
        </button>
      </div>
    </div>
  );
}
