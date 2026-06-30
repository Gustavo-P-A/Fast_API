export function SeletorTamanho({ precos, selecionado, onSelecionar }) {
  return (
    <div className="sabor-precos-lista">
      {precos.map(preco => (
        <button
          key={preco.id}
          className={`sabor-preco-item ${selecionado?.id === preco.id ? "selecionado" : ""}`}
          onClick={() => onSelecionar(preco)}
        >
          <strong>{preco.tamanho_rel.nome}</strong>
          <span>R$ {preco.preco.toFixed(2).replace(".", ",")}</span>
        </button>
      ))}
    </div>
  );
}