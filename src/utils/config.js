// src/utils/config.js (Exemplo ajustado)
const API_BASE_URL_DEV = 'http://localhost:4000/api'; // Ajuste a porta se necessário
const API_BASE_URL_PROD = 'https://inmidia.squareweb.app/api'; // Sua URL de produção

export const API_BASE_URL = import.meta.env.DEV ? API_BASE_URL_DEV : API_BASE_URL_PROD;
// Vite usa import.meta.env.DEV para verificar o ambiente

export const ITEMS_PER_PAGE = 10;