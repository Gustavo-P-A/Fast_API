import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { precos, saborId, criar_pedido, pedido_adicionais } from "../api/auth";
import "../styles/Sabor.css";
import { AuthContext } from "../contexts/AuthContext";

export function Sabor() {
  const { id } = useParams();
  const [saborpizza, setSaborpizza] = useState("");
  const { verificar_token } = useContext(AuthContext);
  const [tamanhoSelecionado, SetTamanhoSelecionado] = useState(null);
  const [pedidoFeito, setPedidoFeito] = useState(false)

  useEffect(() => {
    async function Versabor() {
      const data = await saborId(id);
      setSaborpizza(data);
    }
    Versabor();
  }, []);

  async function fazerPedido() {
    const pedido = await criar_pedido(verificar_token)
    await pedido_adicionais(pedido.id, tamanhoSelecionado.id, verificar_token)
    setPedidoFeito(true) 
}

  const navigate = useNavigate();

  if (!saborpizza) return <div> carregando...</div>;
  return (
    <div className="container-detalhe">
      <button className="btn-voltar" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div key={saborpizza.id} className="card-detalhe">
        <div className="info">
          <p className="nome">{saborpizza.nome}</p>
          <p className="descricao">{saborpizza.descricao}</p>
          <div className="precos-lista">
            {saborpizza.preco_float.map((preco) => (
              <button
                disabled={pedidoFeito}
                onClick={() => SetTamanhoSelecionado(preco)}
                key={preco.id}
                className="preco-item"
              >
                <p>
                  <strong>{preco.tamanho_rel.nome}</strong> - R$ {preco.preco}
                </p>
              </button>
            ))}
            {tamanhoSelecionado && (
              <p>
                Tamanho: {tamanhoSelecionado.tamanho_rel.nome} - R${" "}
                {tamanhoSelecionado.preco}
              </p>
            )}
            <button
              disabled={pedidoFeito}
              onClick={() =>
                verificar_token ? fazerPedido() : navigate("/cadastro")
              }
            >
              {verificar_token ? "Finalizar Pedido" : "Criar Conta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
