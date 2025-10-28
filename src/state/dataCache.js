// src/state/dataCache.js

// Importa a função fetchRegioes do seu novo serviço de API (com Axios)
import { fetchRegioes as apiFetchRegioes } from '../services/api';

// --- Cache de Dados Comuns ---

let regioesCache = null;
// (Pode adicionar caches para outros dados aqui, se necessário)

/**
 * Busca regiões, usando cache se disponível.
 * @param {boolean} forceRefresh - Se true, ignora o cache e busca da API.
 * @returns {Promise<Array>} - A lista de regiões.
 */
export async function getRegioes(forceRefresh = false) {
    // Se não houver cache OU se for forçado a atualizar
    if (!regioesCache || forceRefresh) {
        console.log('[DataCache] Buscando regiões da API...');
        try {
            // Chama a função da API (que agora usa Axios)
            regioesCache = await apiFetchRegioes();
            console.log('[DataCache] Regiões carregadas e cacheadas:', regioesCache);
        } catch (error) {
            console.error("[DataCache] Erro ao buscar regiões para o cache:", error);
            // Limpa o cache em caso de erro para forçar nova tentativa na próxima chamada
            regioesCache = null;
            throw error; // Relança o erro para a página que chamou
        }
    } else {
         console.log('[DataCache] Retornando regiões do cache.');
    }
    // Retorna uma cópia para evitar mutações acidentais do cache original
    // Garante que retorna um array mesmo se o cache for null (por erro anterior)
    return regioesCache ? [...regioesCache] : [];
}

/**
 * Limpa o cache de regiões. Deve ser chamado após criar/editar/apagar uma região.
 */
export function clearRegioesCache() {
    console.log('[DataCache] Limpando cache de regiões.');
    regioesCache = null;
}

// --- FIM: Cache de Dados Comuns ---