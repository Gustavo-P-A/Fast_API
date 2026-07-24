import { ModalIngrediente } from "../../components/Ingrediente/ModalIngrediente.jsx";

export function NovoIngrediente() {
  return (
    <ModalIngrediente
      tipo="INGREDIENTE"
      titulo="Ingrediente"
      rotaVoltar="/admin/ingredientes"
      placeholderNome="Ex.: Mussarela"
    />
  );
}