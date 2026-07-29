import { SeletorBorda } from "../sabor/SeletorBorda";

export function PassoBorda({
  opcoes, qtdBordas, bordasSelecionadas, setBordasSelecionadas, onVoltar, onContinuar,
}) {
  return (
    <div className="mmp-secao">
      <SeletorBorda
        opcoes={opcoes}
        qtdBordas={qtdBordas}
        bordasSelecionadas={bordasSelecionadas}
        setBordasSelecionadas={setBordasSelecionadas}
      />
      <div className="mmp-botoes-passo">
        <button className="np-btn-ghost" onClick={onVoltar}>Voltar</button>
        <button className="sabor-btn-finalizar ativo" onClick={onContinuar}>Continuar</button>
      </div>
    </div>
  );
}
