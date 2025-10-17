// Configuración de la API (usando variables de entorno de Vite)
// NOTA: En el front-end, todo lo que pongas aquí es público en el navegador.
// Nunca coloques claves privadas reales en el cliente. Usa un proxy/backend para secretos.
export const API_CONFIG = {
  // URL base de la API. Se puede definir en variables de entorno del deploy.
  // Fallback a localhost para desarrollo local.
  BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000',

  // Endpoints configurables por entorno (con valores por defecto)
  ENDPOINTS: {
    ASK_PUBLIC: (import.meta as any).env?.VITE_API_ENDPOINT_ASK || '/ask_public',
  },

  // Configuraciones adicionales
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
} as const;

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// Headers por defecto con soporte opcional de API Key pública (no secreta)
export const getDefaultHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = (import.meta as any).env?.VITE_API_KEY;
  const apiKeyHeader = (import.meta as any).env?.VITE_API_KEY_HEADER || 'x-api-key';
  if (apiKey) headers[apiKeyHeader] = apiKey;
  return headers;
};
