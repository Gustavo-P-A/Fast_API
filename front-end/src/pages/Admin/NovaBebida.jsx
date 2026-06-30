import { ModalBebida } from "../../components/bebida/ModalBebida.jsx";

export function NovaBebida() {
  return (
    <ModalBebida
      tipo="BEBIDA"
      titulo="Bebida"
      rotaVoltar="/admin/bebidas"
      placeholderNome="Ex.: Coca-Cola 2L"
      placeholderDescricao="Descreva a bebida, tamanho, etc."
      iconePreview="🥤"
    />
  );
}