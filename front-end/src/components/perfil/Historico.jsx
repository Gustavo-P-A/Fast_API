import { useEffect, useState } from "react";
import { meus_pedidos } from "../../api/auth";
import "../../styles/perfil/FormasPagamento.css";
import "../../styles/perfil/Historico.css";

const STATUS = {
  PENDENTE: { label: "Em andamento", classe: "hist-badge-pendente" },
  ENTREGUE: { label: "Entregue", classe: "hist-badge-entregue" },
  CANCELADO: { label: "Cancelado", classe: "hist-badge-cancelado" },
};

function formatarData(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarPreco(valor) {
  return (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resumoItens(pedido) {
  const totalItens = pedido.itens.length + pedido.bebidas_rel.length;
  if (totalItens === 0) return "Pedido sem itens";
  const primeiro = pedido.itens[0]
    ? pedido.itens[0].sabores_rel.map(s => s.sabor_rel.nome).join(" / ")
    : pedido.bebidas_rel[0]?.item_simples_rel.nome;
  const restantes = totalItens - 1;
  return restantes > 0 ? `${primeiro} + ${restantes} item(ns)` : primeiro;
}

function enderecoTexto(endereco) {
  if (!endereco) return null;
  return `${endereco.rua}, ${endereco.numero}${endereco.complemento ? ` - ${endereco.complemento}` : ""} · ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} · CEP ${endereco.cep}`;
}

export function Historico() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [abertoId, setAbertoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro(false);
    try {
      const data = await meus_pedidos();
      // Carrinhos abertos (nunca finalizados) também ficam com status PENDENTE
      // no backend, mas não têm forma de pagamento nem endereço definidos —
      // por isso não entram no histórico, senão apareceriam como "pedidos fantasma".
      const finalizados = (data || []).filter(
        p => p.formato_de_pagamento || p.status !== "PENDENTE"
      );
      finalizados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPedidos(finalizados);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  function alternarAberto(id) {
    setAbertoId(prev => (prev === id ? null : id));
  }

  return (
    <div className="fp-page">
      <div className="fp-header">
        <div>
          <h1 className="fp-titulo">Histórico de Compras</h1>
          <p className="fp-subtitulo">Veja seus pedidos anteriores e o status de cada um.</p>
        </div>
      </div>

      <div className="hist-lista">
        {carregando && <div className="fp-card fp-vazio">Carregando...</div>}

        {!carregando && erro && (
          <div className="fp-card fp-vazio">Não foi possível carregar seus pedidos.</div>
        )}

        {!carregando && !erro && pedidos.length === 0 && (
          <div className="fp-card fp-vazio">Você ainda não fez nenhum pedido.</div>
        )}

        {!carregando && !erro && pedidos.map(pedido => {
          const status = STATUS[pedido.status] || { label: pedido.status, classe: "hist-badge-pendente" };
          const aberto = abertoId === pedido.id;

          return (
            <div key={pedido.id} className="fp-card hist-pedido" onClick={() => alternarAberto(pedido.id)}>
              <div className="hist-pedido-topo">
                <div>
                  <span className="hist-pedido-id">Pedido #{pedido.id}</span>
                  <div className="hist-pedido-data">{formatarData(pedido.created_at)}</div>
                  <div className="hist-pedido-resumo">{resumoItens(pedido)}</div>
                </div>
                <div className="hist-pedido-direita">
                  <span className={`hist-badge ${status.classe}`}>{status.label}</span>
                  <span className="hist-pedido-preco">{formatarPreco(pedido.preco)}</span>
                  <span className={`hist-seta ${aberto ? "aberto" : ""}`}>▾</span>
                </div>
              </div>

              {aberto && (
                <div className="hist-detalhes" onClick={e => e.stopPropagation()}>
                  {pedido.formato_de_pagamento && (
                    <div>
                      <div className="hist-secao-titulo">Pagamento</div>
                      <div className="hist-pagamento">{pedido.formato_de_pagamento}</div>
                    </div>
                  )}

                  {pedido.endereco_rel && (
                    <div>
                      <div className="hist-secao-titulo">Endereço de entrega</div>
                      <div className="hist-endereco">{enderecoTexto(pedido.endereco_rel)}</div>
                    </div>
                  )}

                  {pedido.itens.length > 0 && (
                    <div>
                      <div className="hist-secao-titulo">Itens</div>
                      {pedido.itens.map(item => (
                        <div key={item.id} className="hist-item">
                          <div className="hist-item-titulo">
                            {item.quantidade}x {item.tamanho_rel.nome} — {item.sabores_rel.map(s => s.sabor_rel.nome).join(" / ")}
                          </div>
                          {item.adicionais_rel.length > 0 && (
                            <div className="hist-item-linha">
                              Adicionais: {item.adicionais_rel.map(a => a.preco_adicional_rel.adicional_rel.nome).join(", ")}
                            </div>
                          )}
                          {item.ingredientes_rel.length > 0 && (
                            <div className="hist-item-linha">
                              Ingredientes extra: {item.ingredientes_rel.map(i => `${i.quantidade}x ${i.item_simples_rel.nome}`).join(", ")}
                            </div>
                          )}
                          {item.observacoes && (
                            <div className="hist-item-linha">Obs: {item.observacoes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {pedido.bebidas_rel.length > 0 && (
                    <div>
                      <div className="hist-secao-titulo">Bebidas</div>
                      {pedido.bebidas_rel.map((bebida, idx) => (
                        <div key={idx} className="hist-item">
                          <div className="hist-item-titulo">
                            {bebida.quantidade}x {bebida.item_simples_rel.nome}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}