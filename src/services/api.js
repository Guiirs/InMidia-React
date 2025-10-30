// src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

// -----------------------------------------------------------------------------
// Configuração do Cliente Axios
// -----------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------------------------------------------------------
// Interceptors Axios (para gestão de tokens e erros)
// -----------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization && !config.isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.DEV) console.log('[API Interceptor Req] Token adicionado ao header.');
    } else if (!token && !config.isPublic) {
        if (import.meta.env.DEV) console.warn('[API Interceptor Req] Token ausente para rota protegida:', config.url);
    } else if (config.isPublic) {
        if (import.meta.env.DEV) console.log('[API Interceptor Req] Rota pública, token não adicionado:', config.url);
    }
    delete config.isPublic;

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) console.error('[API Interceptor Req] Erro ao configurar requisição:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (import.meta.env.DEV) console.error(`[API Interceptor Res] Erro ${status}:`, data);

      if (status === 401) {
        if (import.meta.env.DEV) console.warn('[API Interceptor Res] Erro 401 - Limpando token e redirecionando para login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
      }

      const errorMessage = data?.message || error.message || `Erro ${status}`;
      return Promise.reject(new Error(errorMessage));

    } else if (error.request) {
      if (import.meta.env.DEV) console.error('[API Interceptor Res] Sem resposta do servidor:', error.request);
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique a sua conexão.'));
    } else {
      if (import.meta.env.DEV) console.error('[API Interceptor Res] Erro na configuração da requisição:', error.message);
      return Promise.reject(new Error('Erro ao preparar a requisição: ' + error.message));
    }
  }
);


// -----------------------------------------------------------------------------
// Funções da API Exportadas
// -----------------------------------------------------------------------------

// --- ROTAS PÚBLICAS ---

export const registerEmpresa = async (empresaData) => {
    try {
        const response = await apiClient.post('/empresas/register', empresaData, { isPublic: true });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API registerEmpresa] Erro:', error);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        if (import.meta.env.DEV) console.log(`[API loginUser] Enviando para: ${API_BASE_URL}/auth/login`);
        const response = await apiClient.post('/auth/login', { email, password }, { isPublic: true });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API loginUser] Erro:', error.message);
        throw error;
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email }, { isPublic: true });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API requestPasswordReset] Erro:', error);
        throw error;
    }
};

// --- ROTAS PROTEGIDAS ---

export const fetchRegioes = async () => {
    try {
        const response = await apiClient.get('/regioes');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchRegioes] Erro:', error);
        throw error;
    }
};

export const fetchPlacas = async (params) => {
    try {
        const response = await apiClient.get(`/placas?${params.toString()}`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchPlacas] Erro:', error);
        throw error;
    }
};

export const fetchPlacaById = async (id) => {
    try {
        const response = await apiClient.get(`/placas/${id}`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API fetchPlacaById ${id}] Erro:`, error);
        throw error;
    }
};

export const addPlaca = async (formData) => {
    try {
        const response = await apiClient.post('/placas', formData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API addPlaca] Erro:', error);
        throw error;
    }
};

export const updatePlaca = async (id, formData) => {
    try {
        const response = await apiClient.put(`/placas/${id}`, formData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API updatePlaca ${id}] Erro:`, error);
        throw error;
    }
};

export const deletePlaca = async (id) => {
    try {
        await apiClient.delete(`/placas/${id}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deletePlaca ${id}] Erro:`, error);
        throw error;
    }
};

export const togglePlacaDisponibilidade = async (id) => {
    try {
        const response = await apiClient.patch(`/placas/${id}/disponibilidade`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API togglePlacaDisponibilidade ${id}] Erro:`, error);
        throw error;
    }
};

export const fetchPlacaLocations = async () => {
    try {
        const response = await apiClient.get('/placas/locations');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchPlacaLocations] Erro:', error);
        throw error;
    }
};

export const createRegiao = async (data) => {
    try {
        const response = await apiClient.post('/regioes', data);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createRegiao] Erro:', error);
        throw error;
    }
};

export const updateRegiao = async (id, data) => {
    try {
        const response = await apiClient.put(`/regioes/${id}`, data);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API updateRegiao ${id}] Erro:`, error);
        throw error;
    }
};

export const deleteRegiao = async (id) => {
    try {
        await apiClient.delete(`/regioes/${id}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deleteRegiao ${id}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Utilizador ---
export const fetchUserData = async () => {
    try {
        const response = await apiClient.get('/user/me');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchUserData] Erro:', error);
        throw error;
    }
};

export const updateUserData = async (data) => {
    try {
        const response = await apiClient.put('/user/me', data);
        return response.data; 
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API updateUserData] Erro:', error);
        throw error;
    }
};

export const fetchEmpresaData = async () => {
    try {
        const response = await apiClient.get('/user/me/empresa');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchEmpresaData] Erro:', error);
        throw error;
    }
};

export const regenerateApiKey = async (password) => {
    try {
        const response = await apiClient.post('/user/me/empresa/regenerate-api-key', { password });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API regenerateApiKey] Erro:', error);
        throw error;
    }
};

// --- Rotas de Clientes ---
export const fetchClientes = async () => {
    try {
        const response = await apiClient.get('/clientes');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchClientes] Erro:', error);
        throw error;
    }
};

export const createCliente = async (formData) => {
    try {
        const response = await apiClient.post('/clientes', formData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createCliente] Erro:', error);
        throw error;
    }
};

export const updateCliente = async (id, formData) => {
    try {
        const response = await apiClient.put(`/clientes/${id}`, formData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API updateCliente ${id}] Erro:`, error);
        throw error;
    }
};

export const deleteCliente = async (id) => {
    try {
        await apiClient.delete(`/clientes/${id}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deleteCliente ${id}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Alugueis ---
export const createAluguel = async (aluguelData) => {
    try {
        const response = await apiClient.post('/alugueis', aluguelData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createAluguel] Erro:', error);
        throw error;
    }
};

export const deleteAluguel = async (aluguelId) => {
    try {
        await apiClient.delete(`/alugueis/${aluguelId}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deleteAluguel ${aluguelId}] Erro:`, error);
        throw error;
    }
};

export const fetchAlugueisByPlaca = async (placaId) => {
    try {
        const response = await apiClient.get(`/alugueis/placa/${placaId}`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API fetchAlugueisByPlaca ${placaId}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Admin ---
export const fetchAllUsers = async () => {
    try {
        const response = await apiClient.get('/admin/users');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchAllUsers] Erro:', error);
        throw error;
    }
};

export const updateUserRole = async (id, role) => {
    try {
        const response = await apiClient.put(`/admin/users/${id}/role`, { role });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API updateUserRole ${id}] Erro:`, error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        await apiClient.delete(`/admin/users/${id}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deleteUser ${id}] Erro:`, error);
        throw error;
    }
};

export const createUser = async (userData) => {
    try {
        const response = await apiClient.post('/admin/users', userData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createUser] Erro:', error);
        throw error;
    }
};

// --- Rotas de Relatórios ---
export const fetchPlacasPorRegiaoReport = async () => {
    try {
        const response = await apiClient.get('/relatorios/placas-por-regiao');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchPlacasPorRegiaoReport] Erro:', error);
        throw error;
    }
};

export const fetchDashboardSummary = async () => {
    try {
        const response = await apiClient.get('/relatorios/dashboard-summary');
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchDashboardSummary] Erro:', error);
        throw error;
    }
};

// <<< NOVO: Função para o relatório de ocupação por período >>>
/**
 * Busca o relatório de ocupação por período.
 * @param {string} data_inicio - Data de início (YYYY-MM-DD)
 * @param {string} data_fim - Data de fim (YYYY-MM-DD)
 * @returns {Promise<object>} - Dados do relatório.
 */
export const fetchRelatorioOcupacao = async (data_inicio, data_fim) => {
    try {
        const params = new URLSearchParams({ data_inicio, data_fim });
        const response = await apiClient.get(`/relatorios/ocupacao-por-periodo?${params.toString()}`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchRelatorioOcupacao] Erro:', error);
        throw error;
    }
};


export default apiClient;