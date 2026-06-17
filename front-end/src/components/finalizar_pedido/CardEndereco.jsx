import { FormEndereco } from "./FormEndereco";

export function CardEndereco({ local, selecionado, editando, onSelecionar, onIniciarEdicao, onSalvarEdicao, onCancelarEdicao, onDeletar }) {
  return (
    <div
      className={`endereco-card ${selecionado ? "selecionado" : ""}`}
      onClick={onSelecionar}
    >
      {editando ? (
        <FormEndereco
          inicial={local}
          labelSalvar="Salvar Edição"
          onSalvar={onSalvarEdicao}
          onCancelar={onCancelarEdicao}
        />
      ) : (
        <div className="endereco-info-display">
          <div className="texto-endereco">
            <p className="rua-numero">{local.rua}, {local.numero}</p>
            <p className="bairro-cidade">{local.bairro} - {local.cidade}/{local.estado}</p>
          </div>
          <button className="btn-editar-card" onClick={e => { e.stopPropagation(); onIniciarEdicao(); }}>Editar</button>
          <button onClick={e => { e.stopPropagation(); onDeletar(); }}>Excluir</button>
        </div>
      )}
    </div>
  );
}