import { useState, useEffect, useContext, use } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  saborId,
  criar_pedido,
  pedido_adicionais,
  preco_adicional,
  adicionar_adicional
} from "../api/auth";
import "../styles/Sabor.css";
import { AuthContext } from "../contexts/AuthContext";

export function Sabor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { verificar_token } = useContext(AuthContext);

  const [saborpizza, setSaborpizza] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [pedidoFeito, setPedidoFeito] = useState(false);
  const [adicionaisAPI, setAdicionaisAPI] = useState({});
  const [adicionaisCliente, setAdicionaisCliente] = useState({});
  useEffect(() => {
    async function Versabor() {
      const data = await saborId(id);
      setSaborpizza(data);
    }
    Versabor();
  }, [id]);
  
  async function fazerPedido() {
    if (!tamanhoSelecionado) return;
    setPedidoFeito(true);
    const tokenAtual = localStorage.getItem("token");
    const pedido = await criar_pedido(tokenAtual);
    const itemPedido = await pedido_adicionais(pedido.id, tamanhoSelecionado.id, tokenAtual);
    for (const entry of Object.values(adicionaisCliente)) {
      console.log(itemPedido)
      console.log("pedido:", pedido)
      console.log("itemPedido:", itemPedido)
      let i = 0;
      while (i<entry.quantidade){
        await adicionar_adicional(pedido.id, itemPedido.item_id, entry.item.id, tamanhoSelecionado.tamanho_rel.id, tokenAtual);
        i++;
      }
    }
    navigate(`/finalizar-pedido/${pedido.id}`);
  }

  async function buscarAdicionais(preco) {
    const preco_add = await preco_adicional(preco.tamanho_rel.id);
    setAdicionaisAPI(preco_add);
  }

  if (!saborpizza) return <div className="carregando">Carregando...</div>;

  const nomeImagem = `${saborpizza.nome.toLowerCase().replace(/ /g, "_")}.png`;

  return (
    <div className="container-detalhe">
      <button className="btn-voltar" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="foto-container">
        <img
          src={`/${nomeImagem}`}
          alt={saborpizza.nome}
          onError={(e) => (e.target.src = "/pizza_padrao.png")}
        />
      </div>

      <div className="card-detalhe">
        <div className="info">
          <h1 className="nome">{saborpizza.nome}</h1>
          <p className="descricao">{saborpizza.descricao}</p>

          <div className="precos-lista">
            {saborpizza.preco_float.map((preco) => (
              <button
                disabled={pedidoFeito}
                onClick={() => {
                  setTamanhoSelecionado(preco);
                  buscarAdicionais(preco);
                }}
                key={preco.id}
                className={`preco-item ${tamanhoSelecionado?.id === preco.id ? "selecionado" : ""}`}
              >
                <span>
                  <strong>{preco.tamanho_rel.nome}</strong>
                </span>
                <span>R$ {preco.preco.toFixed(2).replace(".", ",")}</span>
              </button>
            ))}

            {adicionaisAPI.length > 0 && (
              <div>
                <h3>Escolha seus adicionais</h3>
                {adicionaisAPI.map((item) => (
                  <div key={item.id}>
                    <span>{item.adicional_rel.nome}</span>
                    <span>+ R$ {item.preco.toFixed(2)}</span>
                    <button
                      disabled={Object.values(adicionaisCliente).reduce((soma, entry) => soma + entry.quantidade, 0) >= tamanhoSelecionado.tamanho_rel.qtd_bordas}
                      onClick={() => {
                        setAdicionaisCliente((prev) => ({
                          ...prev,
                          [item.id]: {
                            item: item,
                            quantidade: (prev[item.id]?.quantidade || 0) + 1,
                          },
                        }));
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        setAdicionaisCliente((prev) => {
                          const novaQtd = (prev[item.id]?.quantidade || 0) - 1;
                          if (novaQtd <= 0) {
                            const { [item.id]: _, ...resto } = prev;
                            return resto;
                          }
                          return {
                            ...prev,
                            [item.id]: { item: item, quantidade: novaQtd },
                          };
                        });
                      }}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(adicionaisCliente).length > 0 && (
              <div>
                <h4>Adicionais selecionados: </h4>
                {Object.values(adicionaisCliente).map((entry) => (
                  <div key={entry.item.id}>
                    <span>{entry.item.adicional_rel.nome}</span>
                    <span>x{entry.quantidade}</span>
                    <span>
                      + R$ {(entry.item.preco * entry.quantidade).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              className={`btn-pedido-final ${tamanhoSelecionado ? "ativo" : ""}`}
              disabled={pedidoFeito || !tamanhoSelecionado}
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
