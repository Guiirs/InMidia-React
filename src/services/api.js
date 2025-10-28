// src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

// -----------------------------------------------------------------------------
// Configuração do Cliente Axios
// -----------------------------------------------------------------------------

// Cria uma instância do Axios com a URL base da API
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------------------------------------------------------
// Interceptors Axios (para gestão de tokens e erros)
// -----------------------------------------------------------------------------

// Interceptor de Requisição: Adiciona o token JWT automaticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Adiciona o cabeçalho Authorization apenas se houver token e
    // se o header ainda não estiver definido (evita sobrescrever headers customizados)
    // Não adicionamos para rotas que marcamos como públicas nas chamadas de função
    if (token && !config.headers.Authorization && !config.isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Interceptor Req] Token adicionado ao header.');
    } else if (!token && !config.isPublic) {
        console.warn('[API Interceptor Req] Token ausente para rota protegida:', config.url);
        // O backend tratará a falta de token, mas podemos adicionar lógica aqui se necessário
    } else if (config.isPublic) {
        console.log('[API Interceptor Req] Rota pública, token não adicionado:', config.url);
    }
    // Remove a flag isPublic para não a enviar ao backend
    delete config.isPublic;

    // Se o body for FormData, axios define o Content-Type automaticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    console.error('[API Interceptor Req] Erro ao configurar requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Trata erros globais, especialmente 401
apiClient.interceptors.response.use(
  (response) => {
    // Retorna diretamente a resposta se for bem-sucedida
    // Axios já coloca os dados JSON em response.data
    return response;
  },
  (error) => {
    // Verifica se há uma resposta do servidor
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API Interceptor Res] Erro ${status}:`, data);

      // Tratamento específico para 401 Unauthorized
      if (status === 401) {
        console.warn('[API Interceptor Res] Erro 401 - Limpando token e redirecionando para login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Força reload para limpar estado React completamente
        // Só redireciona se não estiver já no login
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
        // Retorna uma promessa rejeitada com uma mensagem específica para o UI
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
      }

      // Para outros erros (4xx, 5xx), extrai a mensagem do backend ou usa uma padrão
      const errorMessage = data?.message || error.message || `Erro ${status}`;
      return Promise.reject(new Error(errorMessage));

    } else if (error.request) {
      // A requisição foi feita mas não houve resposta (erro de rede?)
      console.error('[API Interceptor Res] Sem resposta do servidor:', error.request);
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique a sua conexão.'));
    } else {
      // Erro ao configurar a requisição
      console.error('[API Interceptor Res] Erro na configuração da requisição:', error.message);
      return Promise.reject(new Error('Erro ao preparar a requisição: ' + error.message));
    }
  }
);


// -----------------------------------------------------------------------------
// Funções da API Exportadas
// -----------------------------------------------------------------------------

// --- ROTAS PÚBLICAS ---

/**
 * Regista uma nova empresa e o seu utilizador administrador.
 * @param {object} empresaData - Dados da empresa e do admin.
 * @returns {Promise<object>} - Resposta da API.
 */
export const registerEmpresa = async (empresaData) => {
    try {
        // Marcamos como pública para o interceptor não adicionar token
        const response = await apiClient.post('/empresas/register', empresaData, { isPublic: true });
        return response.data;
    } catch (error) {
        console.error('[API registerEmpresa] Erro:', error);
        throw error; // Relança o erro tratado pelo interceptor
    }
};

/**
 * Autentica um utilizador.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} - { user, token }
 */
export const loginUser = async (email, password) => {
    try {
        console.log(`[API loginUser] Enviando para: ${API_BASE_URL}/auth/login`);
        // Marcamos como pública
        const response = await apiClient.post('/auth/login', { email, password }, { isPublic: true });
        return response.data;
    } catch (error) {
        // O erro já deve vir formatado do interceptor
        console.error('[API loginUser] Erro:', error.message);
        throw error;
    }
};

/**
 * Solicita a redefinição de senha.
 * @param {string} email
 * @returns {Promise<object>} - Resposta da API (geralmente só uma mensagem).
 */
export const requestPasswordReset = async (email) => {
    try {
        // Marcamos como pública
        const response = await apiClient.post('/auth/forgot-password', { email }, { isPublic: true });
        return response.data;
    } catch (error) {
        console.error('[API requestPasswordReset] Erro:', error);
        throw error;
    }
};

// Adicione aqui a função para resetPassword e verifyToken se necessário, marcando como { isPublic: true }


// --- ROTAS PROTEGIDAS (requerem token) ---

/**
 * Busca todas as regiões da empresa.
 * @returns {Promise<Array<object>>} - Lista de regiões.
 */
export const fetchRegioes = async () => {
    try {
        const response = await apiClient.get('/regioes');
        return response.data;
    } catch (error) {
        console.error('[API fetchRegioes] Erro:', error);
        throw error;
    }
};

/**
 * Busca placas com filtros e paginação.
 * @param {URLSearchParams} params - Parâmetros de query.
 * @returns {Promise<object>} - { data: Array<object>, pagination: object }.
 */
export const fetchPlacas = async (params) => {
    try {
        const response = await apiClient.get(`/placas?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('[API fetchPlacas] Erro:', error);
        throw error;
    }
};

/**
 * Busca uma placa específica pelo ID.
 * @param {string} id - ID da placa.
 * @returns {Promise<object>} - Dados da placa.
 */
export const fetchPlacaById = async (id) => {
    try {
        const response = await apiClient.get(`/placas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`[API fetchPlacaById ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Adiciona uma nova placa (com possível upload de imagem).
 * @param {FormData} formData - Dados da placa e ficheiro.
 * @returns {Promise<object>} - A placa criada.
 */
export const addPlaca = async (formData) => {
    try {
        // Axios deteta FormData e define Content-Type automaticamente
        const response = await apiClient.post('/placas', formData);
        return response.data;
    } catch (error) {
        console.error('[API addPlaca] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza uma placa existente (com possível upload).
 * @param {string} id - ID da placa.
 * @param {FormData} formData - Novos dados e/ou ficheiro.
 * @returns {Promise<object>} - A placa atualizada.
 */
export const updatePlaca = async (id, formData) => {
    try {
        const response = await apiClient.put(`/placas/${id}`, formData);
        return response.data;
    } catch (error) {
        console.error(`[API updatePlaca ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Apaga uma placa.
 * @param {string} id - ID da placa.
 * @returns {Promise<void>}
 */
export const deletePlaca = async (id) => {
    try {
        await apiClient.delete(`/placas/${id}`);
        // DELETE bem-sucedido não retorna conteúdo (status 204)
    } catch (error) {
        console.error(`[API deletePlaca ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Alterna a disponibilidade (manutenção) de uma placa.
 * @param {string} id - ID da placa.
 * @returns {Promise<object>} - A placa com o estado atualizado.
 */
export const togglePlacaDisponibilidade = async (id) => {
    try {
        const response = await apiClient.patch(`/placas/${id}/disponibilidade`);
        return response.data;
    } catch (error) {
        console.error(`[API togglePlacaDisponibilidade ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Busca as localizações (coordenadas) de todas as placas.
 * @returns {Promise<Array<object>>} - Lista de localizações.
 */
export const fetchPlacaLocations = async () => {
    try {
        const response = await apiClient.get('/placas/locations');
        return response.data;
    } catch (error) {
        console.error('[API fetchPlacaLocations] Erro:', error);
        throw error;
    }
};

/**
 * Cria uma nova região.
 * @param {object} data - { nome: string }.
 * @returns {Promise<object>} - A região criada.
 */
export const createRegiao = async (data) => {
    try {
        const response = await apiClient.post('/regioes', data);
        return response.data;
    } catch (error) {
        console.error('[API createRegiao] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza uma região.
 * @param {string} id - ID da região.
 * @param {object} data - { nome: string }.
 * @returns {Promise<object>} - A região atualizada.
 */
export const updateRegiao = async (id, data) => {
    try {
        const response = await apiClient.put(`/regioes/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`[API updateRegiao ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Apaga uma região.
 * @param {string} id - ID da região.
 * @returns {Promise<void>}
 */
export const deleteRegiao = async (id) => {
    try {
        await apiClient.delete(`/regioes/${id}`);
    } catch (error) {
        console.error(`[API deleteRegiao ${id}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Utilizador ---
/**
 * Busca os dados do perfil do utilizador logado.
 * @returns {Promise<object>} - Dados do utilizador.
 */
export const fetchUserData = async () => {
    try {
        const response = await apiClient.get('/user/me');
        return response.data;
    } catch (error) {
        console.error('[API fetchUserData] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza os dados do perfil do utilizador logado.
 * @param {object} data - Dados a atualizar (nome, sobrenome, username, email, password?, avatar_url?).
 * @returns {Promise<object>} - Resposta da API, incluindo o utilizador atualizado.
 */
export const updateUserData = async (data) => {
    try {
        const response = await apiClient.put('/user/me', data);
        return response.data; // A API retorna { message, user }
    } catch (error) {
        console.error('[API updateUserData] Erro:', error);
        throw error;
    }
};

/**
 * Busca os dados da empresa associada ao utilizador (requer permissão de admin no backend).
 * @returns {Promise<object>} - Dados da empresa.
 */
export const fetchEmpresaData = async () => {
    try {
        const response = await apiClient.get('/user/me/empresa');
        return response.data;
    } catch (error) {
        console.error('[API fetchEmpresaData] Erro:', error);
        throw error;
    }
};

/**
 * Solicita a regeneração da API Key da empresa (requer senha do admin).
 * @param {string} password - Senha atual do admin.
 * @returns {Promise<object>} - Resposta da API com a nova chave e prefixo.
 */
export const regenerateApiKey = async (password) => {
    try {
        const response = await apiClient.post('/user/me/empresa/regenerate-api-key', { password });
        return response.data;
    } catch (error) {
        console.error('[API regenerateApiKey] Erro:', error);
        throw error;
    }
};

// --- Rotas de Clientes ---
/**
 * Busca todos os clientes da empresa.
 * @returns {Promise<Array<object>>} - Lista de clientes.
 */
export const fetchClientes = async () => {
    try {
        const response = await apiClient.get('/clientes');
        return response.data;
    } catch (error) {
        console.error('[API fetchClientes] Erro:', error);
        throw error;
    }
};

/**
 * Cria um novo cliente (com possível upload de logo).
 * @param {FormData} formData - Dados do cliente e ficheiro.
 * @returns {Promise<object>} - O cliente criado.
 */
export const createCliente = async (formData) => {
    try {
        const response = await apiClient.post('/clientes', formData);
        return response.data;
    } catch (error) {
        console.error('[API createCliente] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza um cliente (com possível upload de logo).
 * @param {string} id - ID do cliente.
 * @param {FormData} formData - Novos dados e/ou ficheiro.
 * @returns {Promise<object>} - O cliente atualizado.
 */
export const updateCliente = async (id, formData) => {
    try {
        const response = await apiClient.put(`/clientes/${id}`, formData);
        return response.data;
    } catch (error) {
        console.error(`[API updateCliente ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Apaga um cliente.
 * @param {string} id - ID do cliente.
 * @returns {Promise<void>}
 */
export const deleteCliente = async (id) => {
    try {
        await apiClient.delete(`/clientes/${id}`);
    } catch (error) {
        console.error(`[API deleteCliente ${id}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Alugueis ---
/**
 * Cria um novo aluguel (reserva).
 * @param {object} aluguelData - { placa_id, cliente_id, data_inicio, data_fim }.
 * @returns {Promise<object>} - O aluguel criado.
 */
export const createAluguel = async (aluguelData) => {
    try {
        const response = await apiClient.post('/alugueis', aluguelData);
        return response.data;
    } catch (error) {
        console.error('[API createAluguel] Erro:', error);
        throw error;
    }
};

/**
 * Apaga (cancela) um aluguel.
 * @param {string} aluguelId - ID do aluguel.
 * @returns {Promise<void>}
 */
export const deleteAluguel = async (aluguelId) => {
    try {
        await apiClient.delete(`/alugueis/${aluguelId}`);
    } catch (error) {
        console.error(`[API deleteAluguel ${aluguelId}] Erro:`, error);
        throw error;
    }
};

/**
 * Busca todos os alugueis de uma placa específica.
 * @param {string} placaId - ID da placa.
 * @returns {Promise<Array<object>>} - Lista de alugueis.
 */
export const fetchAlugueisByPlaca = async (placaId) => {
    try {
        const response = await apiClient.get(`/alugueis/placa/${placaId}`);
        return response.data;
    } catch (error) {
        console.error(`[API fetchAlugueisByPlaca ${placaId}] Erro:`, error);
        throw error;
    }
};

// --- Rotas de Admin ---
/**
 * Busca todos os utilizadores da empresa (requer admin).
 * @returns {Promise<Array<object>>} - Lista de utilizadores.
 */
export const fetchAllUsers = async () => {
    try {
        const response = await apiClient.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error('[API fetchAllUsers] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza a role de um utilizador (requer admin).
 * @param {string} id - ID do utilizador.
 * @param {string} role - Nova role ('user' ou 'admin').
 * @returns {Promise<object>} - Mensagem de sucesso.
 */
export const updateUserRole = async (id, role) => {
    try {
        const response = await apiClient.put(`/admin/users/${id}/role`, { role });
        return response.data;
    } catch (error) {
        console.error(`[API updateUserRole ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Apaga um utilizador (requer admin).
 * @param {string} id - ID do utilizador.
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
    try {
        await apiClient.delete(`/admin/users/${id}`);
    } catch (error) {
        console.error(`[API deleteUser ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Cria um novo utilizador (requer admin).
 * @param {object} userData - Dados do novo utilizador.
 * @returns {Promise<object>} - O utilizador criado.
 */
export const createUser = async (userData) => {
    try {
        const response = await apiClient.post('/admin/users', userData);
        return response.data;
    } catch (error) {
        console.error('[API createUser] Erro:', error);
        throw error;
    }
};

// --- Rotas de Relatórios ---
/**
 * Busca o relatório de contagem de placas por região.
 * @returns {Promise<Array<object>>} - Dados do relatório.
 */
export const fetchPlacasPorRegiaoReport = async () => {
    try {
        const response = await apiClient.get('/relatorios/placas-por-regiao');
        return response.data;
    } catch (error) {
        console.error('[API fetchPlacasPorRegiaoReport] Erro:', error);
        throw error;
    }
};

/**
 * Busca o resumo de dados para o dashboard.
 * @returns {Promise<object>} - Dados do resumo.
 */
export const fetchDashboardSummary = async () => {
    try {
        const response = await apiClient.get('/relatorios/dashboard-summary');
        return response.data;
    } catch (error) {
        console.error('[API fetchDashboardSummary] Erro:', error);
        throw error;
    }
};

// Exporta a instância do apiClient caso precise usá-la diretamente
// ou para configurar mais interceptors externamente
export default apiClient;