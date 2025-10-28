// src/utils/config.js
const API_BASE_URL_PROD = 'https://inmidia.squareweb.app/api';
const API_BASE_URL_DEV = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'; // Usa .env se definido, senão localhost

export const API_BASE_URL = import.meta.env.DEV ? API_BASE_URL_DEV : API_BASE_URL_PROD;

export const ITEMS_PER_PAGE = 10;