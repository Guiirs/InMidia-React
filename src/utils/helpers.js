// src/utils/helpers.js

// --- Configurações R2 (Lidas das variáveis de ambiente Vite) ---
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || ''; // Fallback para string vazia
const R2_BASE_PATH = import.meta.env.VITE_R2_BASE_PATH || ''; // Fallback para string vazia

// --- Funções Auxiliares (validateR2Config, joinUrlSegments) ---

/**
 * Valida se as constantes de configuração R2 estão definidas.
 * Lança um erro se R2_PUBLIC_URL estiver em falta.
 */
function validateR2Config() {
    if (typeof R2_PUBLIC_URL !== 'string' || !R2_PUBLIC_URL.trim()) {
        const errorMsg = '[Helpers] Configuração inválida: VITE_R2_PUBLIC_URL não está definida no .env ou está vazia.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
     // Aviso se VITE_R2_BASE_PATH não for string (menos provável com .env)
     if (typeof R2_BASE_PATH !== 'string') {
        console.warn('[Helpers] Configuração: VITE_R2_BASE_PATH não é uma string. Assumindo caminho raiz "/".');
     }
}

/**
 * Junta segmentos de URL/caminho de forma segura, evitando barras duplicadas.
 * @param {...string} segments - Os segmentos a juntar.
 * @returns {string} - O caminho/URL resultante.
 */
function joinUrlSegments(...segments) {
    // Remove segmentos nulos ou indefinidos antes de processar
    const validSegments = segments.filter(segment => segment != null);

    return validSegments
        .map((segment, index) => {
            let currentSegment = String(segment); // Garante que é string

            // Remove barra inicial (exceto no primeiro segmento)
            if (index > 0 && currentSegment.startsWith('/')) {
                currentSegment = currentSegment.slice(1);
            }
            // Remove barra final (exceto se for o último segmento ou se for apenas "/")
            if (index < validSegments.length - 1 && currentSegment.endsWith('/') && currentSegment.length > 1) {
                currentSegment = currentSegment.slice(0, -1);
            }
            // Garante barra / entre os segmentos (exceto antes do último)
            if (index < validSegments.length - 1 && !currentSegment.endsWith('/') && currentSegment !== '') {
                 currentSegment += '/';
            }


            return currentSegment;
        })
        .join(''); // Junta sem separador extra
}


// --- Função Principal getImageUrl ---

/**
 * Gera a URL correta para uma imagem, considerando URLs absolutas e relativas (R2),
 * com validação e logs adicionais.
 *
 * @param {string | null | undefined} imagePathOrUrl - O nome/caminho relativo (ex: 'nome.jpg') ou URL absoluta.
 * @param {string} placeholderUrl - A URL para uma imagem placeholder (relativa a /public).
 * @returns {string} - A URL final da imagem a ser usada no src.
 */
export function getImageUrl(imagePathOrUrl, placeholderUrl) {
    const logPrefix = '[getImageUrl]';
    //console.log(`${logPrefix} Input recebido:`, imagePathOrUrl);

    // 0. Valida Placeholder (necessário para fallback)
    if (typeof placeholderUrl !== 'string' || !placeholderUrl.trim()) {
        console.error(`${logPrefix} Erro Crítico: placeholderUrl inválido fornecido.`);
        // Retorna um placeholder padrão relativo à pasta public
        return '/assets/img/placeholder.png'; // Exemplo de fallback interno
    }

    // 1. Valida Input Principal
    if (typeof imagePathOrUrl !== 'string' || !imagePathOrUrl.trim()) {
        //console.warn(`${logPrefix} Input inválido (não é string ou está vazio). A usar placeholder: ${placeholderUrl}`);
        return placeholderUrl;
    }

    const path = imagePathOrUrl.trim();

    try {
        // 2. Valida Configuração R2
        validateR2Config();

        // 3. Verifica se é URL Absoluta
        if (path.startsWith('http://') || path.startsWith('https://')) {
            //console.log(`${logPrefix} Input parece ser uma URL absoluta.`);
            try {
                new URL(path);
                //console.log(`${logPrefix} URL absoluta validada: ${path}`);
                return path;
            } catch (urlError) {
                console.warn(`${logPrefix} URL absoluta fornecida é inválida (${urlError.message}). A usar placeholder: ${placeholderUrl}`);
                return placeholderUrl;
            }
        }

        // 4. Constrói URL Relativa (R2)
        //console.log(`${logPrefix} Input tratado como caminho relativo R2.`);
        const safeBasePath = (typeof R2_BASE_PATH === 'string') ? R2_BASE_PATH : '';
        const finalUrl = joinUrlSegments(R2_PUBLIC_URL, safeBasePath, path);

        //console.log(`${logPrefix} URL R2 gerada: ${finalUrl}`);
        return finalUrl;

    } catch (error) {
        console.error(`${logPrefix} Erro ao processar a URL da imagem: ${error.message}. A usar placeholder: ${placeholderUrl}`);
        return placeholderUrl;
    }
}

// --- Outras Funções Auxiliares (formatDate) ---

/**
 * Formata uma data (ex: vinda da API) para DD/MM/YYYY.
 * Trata casos de datas inválidas ou nulas.
 * @param {string | Date | null | undefined} dateInput - A data a formatar.
 * @param {string} [defaultValue='N/A'] - Valor a retornar se a data for inválida.
 * @returns {string} - A data formatada ou o valor padrão.
 */
export function formatDate(dateInput, defaultValue = 'N/A') {
    if (!dateInput) return defaultValue;

    try {
        const dateStr = String(dateInput);
        // Interpreta como UTC para evitar problemas de fuso horário local na formatação DD/MM/YYYY
        // Adiciona 'Z' se for ISO string sem timezone para garantir UTC
        const dateObj = new Date(dateStr.includes('T') && !dateStr.endsWith('Z') ? dateStr + 'Z' : dateStr);


        if (isNaN(dateObj.getTime())) {
            console.warn(`[formatDate] Data inválida recebida:`, dateInput);
            return defaultValue;
        }

        // Obtém dia, mês e ano em UTC para consistência
        const dia = String(dateObj.getUTCDate()).padStart(2, '0');
        const mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
        const ano = dateObj.getUTCFullYear();

        return `${dia}/${mes}/${ano}`;

    } catch (error) {
        console.error(`[formatDate] Erro ao formatar data:`, dateInput, error);
        return defaultValue;
    }
}

// Poderia adicionar mais funções aqui (ex: formatar moeda, etc.)