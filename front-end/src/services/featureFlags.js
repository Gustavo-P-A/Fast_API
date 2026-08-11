export const FEATURE_FLAGS = {
  enderecos: import.meta.env.VITE_FEATURE_ENDERECOS === "true",
  seguranca: import.meta.env.VITE_FEATURE_SEGURANCA === "true",
  historico: import.meta.env.VITE_FEATURE_HISTORICO === "true",
};