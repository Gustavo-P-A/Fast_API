import api from './client';

export const listarMeusPedidos = () => api.get('/order/listar/meus-pedidos');
export const criarPedido = (idUsuario) => api.post('/order/pedido', { id_usuario: idUsuario });
export const adicionarItem = (idPedido, item) => api.post(`/order/pedidos/adicionar-item/${idPedido}`, item);
export const cancelarPedido = (idPedido) => api.post(`/order/pedido/cancelar/${idPedido}`);
export const finalizarPedido = (idPedido) => api.post(`/order/pedido/finalizar/${idPedido}`);
export const verPedido = (idPedido) => api.get(`/order/pedido/${idPedido}`);