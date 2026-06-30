export function ItemPedidoCard({ item }) {
  const sabores = item.sabores_rel.map(s => s.sabor_rel);
  const nomesSabores = sabores.map(s => s.nome).join(" / ");
  const foto = sabores[0]?.imagem_url;
  const qtdBordas = item.tamanho_rel.qtd_bordas;

  return (
    <div className="detalhe-item-card">
      <div className="detalhe-item-foto">
        <img
          src={foto || "/pizza_padrao.png"}
          alt={nomesSabores}
          onError={e => (e.target.src = "/pizza_padrao.png")}
        />
      </div>

      <div className="detalhe-item-info">
        <p className="detalhe-item-nome">{nomesSabores}</p>
        <p className="detalhe-item-linha">Tamanho: {item.tamanho_rel.nome}</p>
        <p className="detalhe-item-linha">Quantidade: {item.quantidade}</p>

        {item.adicionais_rel.length > 0 && (
          <p className="detalhe-item-linha">
            Borda: {item.adicionais_rel.length === 1
              ? item.adicionais_rel[0].preco_adicional_rel.adicional_rel.nome
              : item.adicionais_rel.map(ia =>
                  `${ia.partes}/${qtdBordas} ${ia.preco_adicional_rel.adicional_rel.nome}`
                ).join(", ")}
          </p>
        )}

        {item.observacoes && (
          <p className="detalhe-item-obs">Obs: {item.observacoes}</p>
        )}
      </div>
    </div>
  );
}