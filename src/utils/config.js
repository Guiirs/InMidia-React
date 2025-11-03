const API_BASE_URL_PROD = 'https://inmidia.squareweb.app/api/v1'; // <-- Adicionei /v1 aqui
const API_BASE_URL_DEV = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'; // <-- Corrigido o fallback

// Seleciona a URL correta (DEV ou PROD)
export const API_BASE_URL = import.meta.env.DEV ? API_BASE_URL_DEV : API_BASE_URL_PROD;

export const ITEMS_PER_PAGE = 10;