import '../../styles/pedido/Pedido.css';
const ETAPAS = ["PENDENTE", "CONFIRMADO", "EM PREPARO", "SAIU PARA ENTREGA", "ENTREGUE"];

export function TimelineStatus({ status }) {
  if (status === "CANCELADO") {
    return (
      <div className="timeline-cancelado">
        <span className="timeline-cancelado-bolinha" />
        Pedido cancelado
      </div>
    );
  }

  const indiceAtual = ETAPAS.indexOf(status);

  return (
    <div className="timeline-status">
      {ETAPAS.map((etapa, i) => (
        <div key={etapa} className={`timeline-etapa ${i <= indiceAtual ? "concluida" : ""} ${i === indiceAtual ? "atual" : ""}`}>
          <span className="timeline-bolinha" />
          <span className="timeline-label">{etapa}</span>
          {i < ETAPAS.length - 1 && <span className="timeline-linha" />}
        </div>
      ))}
    </div>
  );
}