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


// --- [CORREÇÃO APLICADA AQUI] ---
// O interceptor de resposta foi atualizado para preservar o objeto de erro completo
// (incluindo `error.response.data.errors`) para o React Query.
apiClient.interceptors.response.use(
  (response) => {
    // Sucesso, apenas retorna a resposta
    return response;
  },
  async (error) => { // Tornamos a função async
    if (error.response) {
      const { status, data } = error.response;
      if (import.meta.env.DEV) console.error(`[API Interceptor Res] Erro ${status}:`, data);

      // Lógica 401 (inalterada)
      if (status === 401) {
        if (import.meta.env.DEV) console.warn('[API Interceptor Res] Erro 401 - Limpando token e redirecionando para login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
      }
      
      let errorMessage = 'Ocorreu um erro desconhecido.';
      let errorData = data; // Assume que 'data' é o objeto JSON

      // Lógica de Blob (Corrigida para ser assíncrona)
      if (data instanceof Blob && (data.type === "application/json" || data.type === "application/pdf")) {
        try {
          const errorText = await data.text();
          // Tenta decodificar o JSON do blob de erro
          if (data.type === "application/json") {
             errorData = JSON.parse(errorText);
             errorMessage = errorData?.message || 'Erro ao processar o arquivo.';
          } else {
             // Se for um PDF que deu erro, pode não ser JSON
             errorMessage = "Erro ao gerar PDF (Blob recebido).";
          }
          if (import.meta.env.DEV) console.error(`[API Interceptor Res] Erro ${status} (Blob Decodificado):`, errorData);
        } catch (e) {
          errorMessage = 'Erro ao ler a resposta de erro (Blob).';
        }
      } else if (data) {
        errorMessage = data?.message || error.message || `Erro ${status}`;
      }
      
      // [A CORREÇÃO PRINCIPAL]
      // Criamos um novo erro, mas anexamos a RESPOSTA COMPLETA
      // para que o React Query possa aceder a error.response.data.errors
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response; // Anexa a resposta original
      enhancedError.response.data = errorData; // Garante que a 'data' (seja JSON ou o Blob decodificado) esteja lá
      
      return Promise.reject(enhancedError); // Rejeita com o erro melhorado

    } else if (error.request) {
      if (import.meta.env.DEV) console.error('[API Interceptor Res] Sem resposta do servidor:', error.request);
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique a sua conexão.'));
    } else {
      if (import.meta.env.DEV) console.error('[API Interceptor Res] Erro na configuração da requisição:', error.message);
      return Promise.reject(new Error('Erro ao preparar a requisição: ' + error.message));
    }
  }
);
// --- [FIM DA CORREÇÃO] ---


// -----------------------------------------------------------------------------
// Funções da API Exportadas (Inalteradas)
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

export const downloadRelatorioOcupacaoPDF = async (data_inicio, data_fim) => {
    try {
        const params = new URLSearchParams({ data_inicio, data_fim });
        
        const response = await apiClient.get(
            `/relatorios/export/ocupacao-por-periodo?${params.toString()}`,
            {
                responseType: 'blob' 
            }
        );
        
        return {
            blob: response.data,
            filename: response.headers['content-disposition']
                ?.split('filename=')[1]
                ?.replace(/"/g, '') || 'relatorio_ocupacao.pdf'
        };

    } catch (error) {
        if (error.response && error.response.data instanceof Blob) {
             try {
                const errorJson = JSON.parse(await error.response.data.text());
                throw new Error(errorJson.message || 'Erro ao gerar PDF');
             } catch(e) {
                throw error;
             }
        }
        if (import.meta.env.DEV) console.error('[API downloadRelatorioOcupacaoPDF] Erro:', error);
        throw error;
    }
};

// --- [NOVO] Rotas de Propostas Internas (PIs) ---

/**
 * Busca a lista paginada de PIs.
 * @param {URLSearchParams} params - Parâmetros de query (page, limit, status, clienteId).
 * @returns {Promise<object>} - Objeto com { data: Array<PI>, pagination: object }.
 */
export const fetchPIs = async (params) => {
    try {
        const response = await apiClient.get(`/pis?${params.toString()}`);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API fetchPIs] Erro:', error);
        throw error;
    }
};

/**
 * Cria uma nova Proposta Interna (PI).
 * @param {object} piData - Dados da PI (clienteId, tipoPeriodo, datas, valor, etc.).
 * @returns {Promise<object>} - A nova PI criada.
 */
export const createPI = async (piData) => {
    try {
        const response = await apiClient.post('/pis', piData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createPI] Erro:', error);
        throw error;
    }
};

/**
 * Atualiza uma Proposta Interna (PI).
 * @param {string} id - ID da PI.
 * @param {object} piData - Dados da PI a atualizar.
 * @returns {Promise<object>} - A PI atualizada.
 */
export const updatePI = async (id, piData) => {
    try {
        const response = await apiClient.put(`/pis/${id}`, piData);
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API updatePI ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Apaga uma Proposta Interna (PI).
 * @param {string} id - ID da PI.
 * @returns {Promise<void>}
 */
export const deletePI = async (id) => {
    try {
        await apiClient.delete(`/pis/${id}`);
    } catch (error) {
        if (import.meta.env.DEV) console.error(`[API deletePI ${id}] Erro:`, error);
        throw error;
    }
};

/**
 * Solicita o download do PDF da PI.
 * @param {string} id - ID da PI.
 * @returns {Promise<{blob: Blob, filename: string}>} - O arquivo PDF.
 */
export const downloadPI_PDF = async (id) => {
    try {
        const response = await apiClient.get(`/pis/${id}/download`, {
            responseType: 'blob' 
        });
        return {
            blob: response.data,
            filename: response.headers['content-disposition']
                ?.split('filename=')[1]
                ?.replace(/"/g, '') || `PI_${id}.pdf`
        };
    } catch (error) {
        // Lógica de tratamento de erro de blob
        if (error.response && error.response.data instanceof Blob) {
             try {
                const errorJson = JSON.parse(await error.response.data.text());
                throw new Error(errorJson.message || 'Erro ao gerar PDF da PI');
             } catch(e) { throw error; }
        }
        if (import.meta.env.DEV) console.error(`[API downloadPI_PDF ${id}] Erro:`, error);
        throw error;
    }
};


// --- [NOVO] Rotas de Contratos ---

/**
 * Cria um Contrato a partir de uma PI.
 * @param {string} piId - ID da Proposta Interna.
 * @returns {Promise<object>} - O novo Contrato criado.
 */
export const createContrato = async (piId) => {
    try {
        const response = await apiClient.post('/contratos', { piId });
        return response.data;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[API createContrato] Erro:', error);
        throw error;
    }
};

/**
 * Solicita o download do PDF do Contrato.
 * @param {string} id - ID do Contrato.
 * @returns {Promise<{blob: Blob, filename: string}>} - O arquivo PDF.
 */
export const downloadContrato_PDF = async (id) => {
    try {
        const response = await apiClient.get(`/contratos/${id}/download`, {
            responseType: 'blob' 
        });
        return {
            blob: response.data,
            filename: response.headers['content-disposition']
                ?.split('filename=')[1]
                ?.replace(/"/g, '') || `Contrato_${id}.pdf`
        };
    } catch (error) {
        // Lógica de tratamento de erro de blob
        if (error.response && error.response.data instanceof Blob) {
             try {
                const errorJson = JSON.parse(await error.response.data.text());
                throw new Error(errorJson.message || 'Erro ao gerar PDF do Contrato');
             } catch(e) { throw error; }
        }
        if (import.meta.env.DEV) console.error(`[API downloadContrato_PDF ${id}] Erro:`, error);
        throw error;
    }
};


export default apiClient;