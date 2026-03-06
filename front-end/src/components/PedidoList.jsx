import { useEffect, useState } from 'react';
import { listarMeusPedidos, cancelarPedido } from '../api/orders';

function PedidoList() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const { data } = await listarMeusPedidos();
      setPedidos(data);
    } catch (error) {
      alert('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!confirm('Cancelar este pedido?')) return;
    
    try {
      await cancelarPedido(id);
      alert('Pedido cancelado!');
      carregarPedidos();
    } catch (error) {
      alert('Erro: ' + error.response?.data?.detail);
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'PENDENTE': return 'status status-pendente';
      case 'FINALIZADO': return 'status status-finalizado';
      case 'CANCELADO': return 'status status-cancelado';
      default: return 'status';
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="container">
      <h2 style={{marginBottom: '20px', fontSize: '28px'}}>Meus Pedidos</h2>
      
      {pedidos.length === 0 && <p>Nenhum pedido ainda 🍕</p>}
      
      {pedidos.map(pedido => (
        <div key={pedido.id} className="pedido-card">
          <div className="pedido-header">
            <span className="pedido-id">Pedido #{pedido.id}</span>
            <span className={getStatusClass(pedido.status)}>{pedido.status}</span>
          </div>
          
          <p className="pedido-info">Itens: {pedido.itens?.length || 0}</p>
          <p className="pedido-preco">R$ {pedido.preco?.toFixed(2)}</p>
          
          {pedido.status === 'PENDENTE' && (
            <button 
              onClick={() => handleCancelar(pedido.id)}
              className="btn btn-danger"
            >
              Cancelar Pedido
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default PedidoList;