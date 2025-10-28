// src/utils/helpers.js

// --- Configurações R2 (Lidas das variáveis de ambiente Vite) ---
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || '';
const R2_BASE_PATH = import.meta.env.VITE_R2_BASE_PATH || '';
const LOG_PREFIX = '[Helpers]'; // Prefixo para logs

// --- Funções Auxiliares Internas ---

/**
 * Valida se as configurações essenciais do R2 (URL Pública) estão presentes.
 * Lança um erro específico se a configuração estiver em falta ou inválida.
 * @throws {Error} Se VITE_R2_PUBLIC_URL não estiver definida ou for inválida.
 */
function validateR2Config() {
    if (typeof R2_PUBLIC_URL !== 'string' || !R2_PUBLIC_URL.trim()) {
        const errorMsg = `${LOG_PREFIX} Configuração inválida: VITE_R2_PUBLIC_URL não está definida no arquivo .env ou está vazia. Verifique a configuração do frontend.`;
        console.error(errorMsg);
        // Lançar um erro interrompe a execução de getImageUrl, o que é desejável aqui.
        throw new Error(errorMsg);
    }
    // Verifica se a URL pública é minimamente válida (começa com http/https)
    if (!R2_PUBLIC_URL.startsWith('http://') && !R2_PUBLIC_URL.startsWith('https://')) {
        const errorMsg = `${LOG_PREFIX} Configuração inválida: VITE_R2_PUBLIC_URL ("${R2_PUBLIC_URL}") não parece ser uma URL válida.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
     // Apenas um aviso para BASE_PATH, pois pode ser intencionalmente vazio
     if (typeof R2_BASE_PATH !== 'string') {
        console.warn(`${LOG_PREFIX} Configuração: VITE_R2_BASE_PATH não é uma string. Assumindo caminho raiz "/".`);
     }
}

/**
 * Junta segmentos de URL/caminho de forma segura, evitando barras duplicadas
 * e tratando segmentos vazios/nulos. Normaliza barras no processo.
 * @param {...string} segments - Os segmentos a juntar.
 * @returns {string} - O caminho/URL resultante.
 */
function joinUrlSegments(...segments) {
    // Filtra segmentos vazios/nulos e remove barras extras de cada segmento
    const cleanedSegments = segments
        .filter(segment => segment !== null && segment !== undefined && String(segment).trim() !== '')
        .map(segment => String(segment).trim().replace(/^\/+|\/+$/g, '')); // Remove barras no início/fim

    // Junta com uma única barra
    return cleanedSegments.join('/');
}

// --- Funções Exportadas ---

/**
 * Gera a URL completa para uma imagem no R2 ou retorna uma URL absoluta fornecida,
 * com fallback para uma imagem placeholder. Inclui validação robusta e logs.
 *
 * @param {string | null | undefined} imagePathOrUrl - O nome/caminho relativo da imagem no R2 (ex: 'nome.jpg') ou uma URL absoluta já existente.
 * @param {string} placeholderUrl - A URL para uma imagem placeholder (relativa à pasta /public, ex: '/assets/img/placeholder.png'). Deve ser sempre fornecida.
 * @returns {string} - A URL final da imagem (R2, absoluta ou placeholder).
 */
export function getImageUrl(imagePathOrUrl, placeholderUrl) {
    const internalLogPrefix = `${LOG_PREFIX}[getImageUrl]`;

    // 1. Validação Crítica: Placeholder URL
    // Uma URL placeholder válida é essencial para o fallback.
    if (typeof placeholderUrl !== 'string' || !placeholderUrl.trim() || !placeholderUrl.startsWith('/')) {
        console.error(`${internalLogPrefix} Erro Crítico: placeholderUrl inválido fornecido ("${placeholderUrl}"). Deve ser um caminho absoluto relativo à pasta /public.`);
        // Retorna um fallback interno absoluto se o placeholder fornecido falhar
        return '/assets/img/placeholder.png'; // Garante que algo seja retornado
    }

    // 2. Validação do Input Principal (Caminho/URL da Imagem)
    if (typeof imagePathOrUrl !== 'string' || !imagePathOrUrl.trim()) {
        // Se o input for inválido (null, undefined, vazio), usa o placeholder. Isso é esperado em alguns casos.
        // console.log(`${internalLogPrefix} Input inválido ou vazio. Usando placeholder: ${placeholderUrl}`);
        return placeholderUrl;
    }

    const path = imagePathOrUrl.trim();

    try {
        // 3. Verifica se já é uma URL Absoluta Válida
        if (path.startsWith('http://') || path.startsWith('https://')) {
            try {
                // Tenta validar a estrutura da URL
                new URL(path);
                // console.log(`${internalLogPrefix} Input é uma URL absoluta válida: ${path}`);
                return path; // Retorna a URL absoluta diretamente
            } catch (urlError) {
                console.warn(`${internalLogPrefix} URL absoluta fornecida ("${path}") é inválida (${urlError.message}). Usando placeholder: ${placeholderUrl}`);
                return placeholderUrl;
            }
        }

        // 4. Se não for absoluta, assume que é um caminho relativo R2. Valida a Configuração R2.
        validateR2Config(); // Lança erro se VITE_R2_PUBLIC_URL estiver em falta ou inválida

        // 5. Constrói a URL R2
        // Remove barras extras do base path e do path antes de juntar
        const safeBasePath = (typeof R2_BASE_PATH === 'string') ? R2_BASE_PATH.trim().replace(/^\/+|\/+$/g, '') : '';
        const safePath = path.replace(/^\/+|\/+$/g, '');

        // Usa joinUrlSegments para garantir a junção correta
        const finalUrl = [
            R2_PUBLIC_URL.replace(/\/+$/g, ''), // Remove barra final da URL base
            safeBasePath,
            safePath
        ].filter(Boolean).join('/'); // Junta segmentos não vazios com '/'

        // console.log(`${internalLogPrefix} URL R2 gerada: ${finalUrl} (Base: "${R2_PUBLIC_URL}", PathPrefix: "${safeBasePath}", ImagePath: "${safePath}")`);
        return finalUrl;

    } catch (error) {
        // Captura erros de validateR2Config ou outros erros inesperados
        console.error(`${internalLogPrefix} Erro ao processar imagem ("${path}"): ${error.message}. Usando placeholder: ${placeholderUrl}`);
        return placeholderUrl; // Fallback final
    }
}

/**
 * Formata uma data (ex: vinda da API) para DD/MM/YYYY.
 * Trata casos de datas inválidas ou nulas.
 * @param {string | Date | null | undefined} dateInput - A data a formatar.
 * @param {string} [defaultValue='N/A'] - Valor a retornar se a data for inválida.
 * @returns {string} - A data formatada ou o valor padrão.
 */
export function formatDate(dateInput, defaultValue = 'N/A') {
    // ... (lógica da função formatDate - pode ser mantida como estava) ...
    if (!dateInput) return defaultValue;
    try {
        const dateStr = String(dateInput);
        const dateObj = new Date(dateStr.includes('T') && !dateStr.endsWith('Z') ? dateStr + 'Z' : dateStr);
        if (isNaN(dateObj.getTime())) {
            console.warn(`${LOG_PREFIX}[formatDate] Data inválida recebida:`, dateInput);
            return defaultValue;
        }
        const dia = String(dateObj.getUTCDate()).padStart(2, '0');
        const mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const ano = dateObj.getUTCFullYear();
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        console.error(`${LOG_PREFIX}[formatDate] Erro ao formatar data:`, dateInput, error);
        return defaultValue;
    }
}

// Poderia adicionar mais funções auxiliares aqui...