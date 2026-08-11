import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { visualizar_pedido } from "../../api/auth";
import "../../styles/PixPagamento.css";

export function PixPagamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function checar() {
      try {
        const data = await visualizar_pedido(id);
        setPedido(data);
        if (data.status === 'CONFIRMADO') navigate(`/meus-pedidos`);
        if (data.status === 'CANCELADO') alert("Tempo para pagamento via Pix expirou. Pedido cancelado.");
      } catch {
        alert("Erro ao consultar o pedido.");
      }
    }
    checar();
    const intervalo = setInterval(checar, 5000); // consulta status a cada 5s
    return () => clearInterval(intervalo);
  }, [id, navigate]);

  if (!pedido) return null;

  const segundosRestantes = Math.max(0, Math.floor((new Date(pedido.pix_expira_em) - new Date()) / 1000));
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  function copiarCodigo() {
    navigator.clipboard.writeText(pedido.pix_codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="pix-container">
      <h1>Pague com Pix</h1>
      <p>Escaneie o QR Code ou copie o código abaixo</p>

      <div className="pix-qr">
        <QRCodeSVG value={pedido.pix_codigo} size={220} />
      </div>

      <button className="pix-btn-copiar" onClick={copiarCodigo}>
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>

      <p className="pix-timer">
        Expira em {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
      </p>

      <p className="pix-valor">Total: R$ {pedido.preco.toFixed(2).replace(".", ",")}</p>
    </div>
  );
}