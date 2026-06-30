import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Helper para converter URLs relativas em absolutas do backend
export function getImagemUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
}

let isRefreshing = false;
let filaEsperando = []; // [{ resolve, reject, config }]

function resolverFila(erro) {
  filaEsperando.forEach(({ resolve, reject, config }) => {
    if (erro) {
      reject(erro);
    } else {
      resolve(api(config));
    }
  });
  filaEsperando = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // só /auth/refresh fica fora do retry, pra não entrar em loop se o próprio refresh falhar
    const rotaAtual = error.config?.url || "";
    const ehRotaDeRefresh = rotaAtual.endsWith("/auth/refresh");

    if (error.response?.status !== 401 || ehRotaDeRefresh || error.config._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // já tem um refresh em andamento: entra na fila e espera o resultado dele
      return new Promise((resolve, reject) => {
        filaEsperando.push({ resolve, reject, config: error.config });
      });
    }

    error.config._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      isRefreshing = false;
      resolverFila(null);
      return api(error.config);
    } catch (refreshError) {
      isRefreshing = false;
      resolverFila(refreshError);

      // se o motivo foi "refresh token ausente", a pessoa nunca logou —
      // isso é estado anônimo normal (ex: visitando /cadastro, /login, Home),
      // não uma sessão que expirou. Nesse caso não força redirect nem logout.
      const motivo = refreshError.response?.data?.detail || "";
      const nuncaTevesessao = motivo.includes("ausente");

      if (!nuncaTevesessao) {
        // aqui sim existia uma sessão (cookie presente) que se tornou inválida
        // (usuário deletado, refresh expirado etc) — limpa os cookies e manda pro login
        try { await api.post("/auth/logout"); } catch { /* best-effort */ }

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      return Promise.reject(refreshError);
    }
  },
);

export default api;