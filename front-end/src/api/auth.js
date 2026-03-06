import api from './client';

export const login = async (email, senha) => {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
};

export const criarUsuario = (usuario) => api.post('/auth/criar_usuario', usuario);

export const logout = () => localStorage.clear();