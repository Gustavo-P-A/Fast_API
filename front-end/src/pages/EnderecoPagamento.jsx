import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  endereco, editar_endereco,
  criar_endereco, delete_endereco,
} from "../api/auth";
import { CardEndereco } from "../components/endereco_pagamento/CardEndereco";
import { FormEndereco } from "../components/endereco_pagamento/FormEndereco";
import { SecaoPagamento } from "../components/endereco_pagamento/SecaoPagamento";
import "../styles/EnderecoPagamento.css";

export function EnderecoPagamento() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(state?.endereco?.id || "");
  const [pagamento, setPagamento] = useState(state?.pagamento || "");
  const [editando, setEditando] = useState(null);
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    if (!state?.tamanho_id) { navigate("/"); return; }
    endereco().then(setEnderecos);
  }, []);

  function handleConfirmar() {
    if (!enderecoSelecionado || !pagamento) return;
    const enderecoObj = enderecos.find(e => e.id === enderecoSelecionado);
    navigate("/finalizar-pedido", {
      state: { ...state, endereco: enderecoObj, pagamento },
    });
  }

  async function buscar() { setEnderecos(await endereco()); }

  async function handleSalvarEdicao(idEnd, form) {
    await editar_endereco(idEnd, form); await buscar(); setEditando(null);
  }

  async function handleSalvarNovo(form) {
    await criar_endereco(form); await buscar(); setAdicionando(false);
  }

  return (
    <div className="enderecos-pagamento-container">
      <h1 className="titulo-pagina">Endereço e Pagamento</h1>

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
          onClick={handleConfirmar}
          disabled={!enderecoSelecionado || !pagamento}
        >
          Continuar 
        </button>
      </div>
    </div>
  );
}