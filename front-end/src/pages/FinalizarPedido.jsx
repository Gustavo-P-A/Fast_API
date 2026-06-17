import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  endereco, finalizar_pedido_id, editar_endereco,
  criar_endereco, delete_endereco,
  criar_pedido, pedido_adicionais, adicionar_adicional,
} from "../api/auth";
import { CardEndereco } from "../components/finalizar_pedido/CardEndereco";
import { FormEndereco } from "../components/finalizar_pedido/FormEndereco";
import { SecaoPagamento } from "../components/finalizar_pedido/SecaoPagamento";
import "../styles/FinalizarPedido.css";

export function FinalizarPedido() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [editando, setEditando] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!state?.precopizza_id) { navigate("/"); return; }
    endereco().then(setEnderecos);
  }, []);

  async function handleFinalizar() {
    if (!enderecoSelecionado || !pagamento) return;
    setConfirmando(true);
    try {
      const pedido = await criar_pedido();
      const item = await pedido_adicionais(pedido.id, state.precopizza_id);
      for (const entry of state.adicionais) {
        for (let i = 0; i < entry.quantidade; i++) {
          await adicionar_adicional(pedido.id, item.item_id, entry.item.id, state.tamanho_id);
        }
      }
      await finalizar_pedido_id(pedido.id, enderecoSelecionado, pagamento);
      alert("Pedido realizado com sucesso!");
      navigate("/meus-pedidos");
    } catch {
      alert("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setConfirmando(false);
    }
  }

  async function buscar() { setEnderecos(await endereco()); }

  async function handleSalvarEdicao(idEnd, form) {
    await editar_endereco(idEnd, form); await buscar(); setEditando(null);
  }

  async function handleSalvarNovo(form) {
    await criar_endereco(form); await buscar(); setAdicionando(false);
  }

  return (
    <div className="finalizar-container">
      <h1 className="titulo-pagina">Finalizar Pedido</h1>

      <div className="secao-enderecos">
        <h2 className="titulo-secao">Endereço de entrega</h2>
        {enderecos.map(local => (
          <CardEndereco
            key={local.id}
            local={local}
            selecionado={enderecoSelecionado === local.id}
            editando={editando === local.id}
            onSelecionar={() => setEnderecoSelecionado(local.id)}
            onIniciarEdicao={() => setEditando(local.id)}
            onCancelarEdicao={() => setEditando(null)}
            onSalvarEdicao={form => handleSalvarEdicao(local.id, form)}
            onDeletar={async () => { await delete_endereco(local.id); buscar(); }}
          />
        ))}
      </div>

      <div className="secao-adicionar">
        {!adicionando
          ? <button className="btn-abrir-novo" onClick={() => setAdicionando(true)}>+ Adicionar endereço</button>
          : <FormEndereco labelSalvar="Salvar Endereço" onSalvar={handleSalvarNovo} onCancelar={() => setAdicionando(false)} />
        }
      </div>

      <SecaoPagamento selecionado={pagamento} onSelecionar={setPagamento} />

      <div className="container-finalizar">
        <button
          className="btn-confirmar-pedido"
          onClick={handleFinalizar}
          disabled={!enderecoSelecionado || !pagamento || confirmando}
        >
          {confirmando ? "Processando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  );
}