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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const rotasIgnoradas = ["/auth/refresh", "/auth/me"];
    const rotaAtual = error.config?.url || "";

    const deveIgnorar = rotasIgnoradas.some((rota) => rotaAtual.endsWith(rota));

    if (
      error.response?.status === 401 &&
      !error.config._retry &&
      !deveIgnorar &&
      !isRefreshing
    ) {
      error.config._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        isRefreshing = false;
        return api(error.config);
      } catch (refreshError) {
        isRefreshing = false;
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
