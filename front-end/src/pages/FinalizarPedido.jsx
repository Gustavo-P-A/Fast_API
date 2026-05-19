import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/FinalizarPedido.css";
import {
  endereco,
  finalizar_pedido_id,
  editar_endereco,
  criar_endereco,
  delete_endereco
} from "../api/auth";

export function FinalizarPedido() {
  const { id } = useParams();
  const { verificar_token } = useContext(AuthContext);
  const [mEndereco, setMendereco] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState("");
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState("");
  const [enderecoEditado, setEnderecoEditado] = useState({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    cep: "",
    estado: "",
    complemento: "",
  });
  const [editando, setEditando] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    cep: "",
    estado: "",
    complemento: "",
  });
  const [erros, setErros] = useState({});

  const navigate = useNavigate();

  async function buscarEndereco() {
    const data = await endereco(verificar_token);
    setMendereco(data);
  }

  useEffect(() => {
    buscarEndereco();
  }, [verificar_token]);

  async function handleFinalizar() {
    const data = await finalizar_pedido_id(
      id,
      enderecoSelecionado,
      pagamentoSelecionado,
      verificar_token, 
    );
    if (data) {
      alert("Pedido finalizado com sucesso");
      navigate("/meus-pedidos");
    }
  }

  async function salvarEdicao(idEndereco) {
    if (!validarEdicao()) return;
    await editar_endereco(idEndereco, enderecoEditado, verificar_token);
    await buscarEndereco();
    setEditando(null);
  }

  function validarNovoEndereco() {
    const novosErros = {};

    if (!novoEndereco.cep) novosErros.cep = true;
    if (!novoEndereco.rua) novosErros.rua = true;
    if (!novoEndereco.numero) novosErros.numero = true;
    if (!novoEndereco.bairro) novosErros.bairro = true;

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  function validarEdicao() {
    const novosErros = {};

    if (!enderecoEditado.cep) novosErros.cep = true;
    if (!enderecoEditado.rua) novosErros.rua = true;
    if (!enderecoEditado.numero) novosErros.numero = true;
    if (!enderecoEditado.bairro) novosErros.bairro = true;

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  async function salvarCriacao() {
    if (!validarNovoEndereco()) return;
    await criar_endereco(novoEndereco, verificar_token);
    await buscarEndereco();
    setAdicionando(false);
    setNovoEndereco({
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      cep: "",
      estado: "",
      complemento: "",
    });
  }

  async function deletarEndereco(idEndereco) {
    await delete_endereco(idEndereco, verificar_token);
    await buscarEndereco();
  }

  return (
    <div className="finalizar-container">
      <h1 className="titulo-pagina">Finalizar pedido #{id}</h1>

      <div className="secao-enderecos">
        <h2 className="titulo-secao">Selecione o endereço de entrega</h2>

        {mEndereco.map((local) => (
          <div
            key={local.id}
            className={`endereco-card ${enderecoSelecionado === local.id ? "selecionado" : ""}`}
            onClick={() => setEnderecoSelecionado(local.id)}
          >
            {editando === local.id ? (
              <div
                className="formulario-edicao"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  className={`input ${erros.cep ? "input-erro" : ""}`}
                  type="text"
                  placeholder="Cep"
                  maxLength={8}
                  value={enderecoEditado.cep}
                  onChange={(e) => {
                    const novoCep = e.target.value;
                    setEnderecoEditado({ ...enderecoEditado, cep: novoCep });

                    if (novoCep.length === 8) {
                      fetch(`https://viacep.com.br/ws/${novoCep}/json/`)
                        .then((resposta) => resposta.json())
                        .then((dados) => {
                          if (!dados.erro) {
                            setEnderecoEditado({
                              ...enderecoEditado,
                              cep: novoCep,
                              rua: dados.logradouro,
                              bairro: dados.bairro,
                              estado: dados.uf,
                              cidade: dados.localidade,
                            });
                          } else {
                            alert("CEP não encontrado");
                          }
                        });
                    }
                  }}
                />
                {erros.cep && <p className="msg-erro">Adicione o cep</p>}

                <input
                  className={`input ${erros.rua ? "input-erro" : ""}`}
                  type="text"
                  placeholder="Rua"
                  value={enderecoEditado.rua}
                  onChange={(e) =>
                    setEnderecoEditado({
                      ...enderecoEditado,
                      rua: e.target.value,
                    })
                  }
                />
                {erros.rua && <p className="msg-erro">Adicione a rua/avenida</p>} 

                <input
                  className={`input ${erros.numero ? "input-erro" : ""}`}
                  type="text"
                  placeholder="Número"
                  value={enderecoEditado.numero}
                  onChange={(e) =>
                    setEnderecoEditado({
                      ...enderecoEditado,
                      numero: e.target.value,
                    })
                  }
                />
                {erros.numero && <p className="msg-erro">Adicione o número</p>} 

                <input
                  className={`input ${erros.bairro ? "input-erro" : ""}`}
                  type="text"
                  placeholder="Bairro"
                  value={enderecoEditado.bairro}
                  onChange={(e) =>
                    setEnderecoEditado({
                      ...enderecoEditado,
                      bairro: e.target.value,
                    })
                  }
                />
                {erros.bairro && <p className="msg-erro">Bairro</p>} 

                <input
                  type="text"
                  placeholder="Complemento"
                  value={enderecoEditado.complemento}
                  onChange={(e) =>
                    setEnderecoEditado({
                      ...enderecoEditado,
                      complemento: e.target.value,
                    })
                  }
                />
                <div
                  className="botoes-form-container"
                >
                  <button
                    className="btn-salvar"
                    onClick={() => salvarEdicao(local.id)}
                  >
                    Salvar Edição
                  </button>
                  <button
                    className="btn-cancelar"
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="endereco-info-display">
                <div className="texto-endereco">
                  <p className="rua-numero">
                    {local.rua}, {local.numero}
                  </p>
                  <p className="bairro-cidade">
                    {local.bairro} - {local.cidade}/{local.estado}
                  </p>
                </div>
                <button
                  className="btn-editar-card"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditando(local.id);
                    setEnderecoEditado(local);
                  }}
                >
                  Editar
                </button>
                <div>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    deletarEndereco(local.id)
                  }}
                    >Excluir</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="secao-adicionar">
        {!adicionando && (
          <button
            className="btn-abrir-novo"
            onClick={() => setAdicionando(true)}
          >
            + Adicionar novo endereço
          </button>
        )}

        {adicionando && (
          <div
            className="endereco-card selecionado"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="formulario-criacao">
              {novoEndereco.cidade && (
                <p className="preview-cidade">
                  {novoEndereco.cidade} - {novoEndereco.estado}
                </p>
              )}
              <input
                className={`input ${erros.cep ? "input-erro" : ""}`}
                type="text"
                placeholder="Cep"
                maxLength={8}
                value={novoEndereco.cep}
                onChange={(e) => {
                  const novoCep = e.target.value;
                  setNovoEndereco({ ...novoEndereco, cep: novoCep });

                  if (novoCep.length === 8) {
                    fetch(`https://viacep.com.br/ws/${novoCep}/json/`)
                      .then((resposta) => resposta.json())
                      .then((dados) => {
                        if (!dados.erro) {
                          setNovoEndereco({
                            ...novoEndereco,
                            cep: novoCep,
                            rua: dados.logradouro,
                            bairro: dados.bairro,
                            estado: dados.uf,
                            cidade: dados.localidade,
                          });
                        } else {
                          alert("CEP não encontrado");
                        }
                      });
                  }
                }}
              />
              {erros.novoCep && <p className="msg-erro">Adicione o cep</p>} 

              <input
                className={`input ${erros.rua ? "input-erro" : ""}`}
                type="text"
                placeholder="Rua"
                value={novoEndereco.rua}
                onChange={(e) =>
                  setNovoEndereco({ ...novoEndereco, rua: e.target.value })
                }
              />
              {erros.rua && <p className="msg-erro">Adicione a rua/Avenida</p>} 

              <input
                className={`input ${erros.numero ? "input-erro" : ""}`}
                type="text"
                placeholder="Número"
                value={novoEndereco.numero}
                onChange={(e) =>
                  setNovoEndereco({ ...novoEndereco, numero: e.target.value })
                }
              />
              {erros.numero && <p className="msg-erro">Adicione o número</p>} 

              <input
                className={`input ${erros.bairro ? "input-erro" : ""}`}
                type="text"
                placeholder="Bairro"
                value={novoEndereco.bairro}
                onChange={(e) =>
                  setNovoEndereco({ ...novoEndereco, bairro: e.target.value })
                }
              />
              {erros.bairro && <p className="msg-erro">Adicione o bairro</p>}

              <input
                type="text"
                placeholder="Complemento"
                value={novoEndereco.complemento}
                onChange={(e) =>
                  setNovoEndereco({
                    ...novoEndereco,
                    complemento: e.target.value,
                  })
                }
              />
              <div className="botoes-form-container">
                <button
                  className="btn-salvar"
                  onClick={salvarCriacao}                  
                >
                  Salvar Endereço
                </button>
                <button
                  className="btn-cancelar"
                  onClick={() => setAdicionando(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="secao-pagamento">
        <h2 className="titulo-secao">Forma de pagamento</h2>
        <div className="pagamento-grid">
          {["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"].map(
            (tipo) => (
              <button
                key={tipo}
                className={`btn-pagamento-item ${pagamentoSelecionado === tipo ? "ativo" : ""}`}
                onClick={() => setPagamentoSelecionado(tipo)}
              >
                {tipo}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="container-finalizar">
        <button
          className="btn-confirmar-pedido"
          onClick={handleFinalizar}
          disabled={!enderecoSelecionado || !pagamentoSelecionado}
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  );
}
