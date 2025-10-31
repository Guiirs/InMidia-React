// src/hooks/usePlacaFilters.js
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlacas, fetchRegioes } from '../services/api';
// Assumindo que useDebounce.js está na mesma pasta ou em /hooks
import { useDebounce } from './useDebounce'; 

/**
 * Hook customizado para gerenciar a lógica de busca,
 * filtragem e seleção de placas para o modal de PI.
 * @param {string[]} watchedPlacas - O array de IDs de placas já selecionadas (do React Hook Form).
 */
export const usePlacaFilters = (watchedPlacas) => {
    
    // --- 1. Estado dos Filtros ---
    const [selectedRegiao, setSelectedRegiao] = useState('');
    const [placaSearch, setPlacaSearch] = useState('');
    // "Atrasa" a pesquisa para não fazer pedidos API a cada tecla
    const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // --- 2. Busca de Dados (React Query) ---
    
    // Query para as Regiões (usada no dropdown de filtro)
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: ['regioes'], 
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 10 // Cache de 10 min
    });

    // Query 1: Busca TODAS as placas (limite alto)
    // Usada para preencher os nomes das placas JÁ SELECIONADAS
    const { data: allPlacasData = [], isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: ['placas', 'all'], // Chave simples
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 2000 })), 
        staleTime: 1000 * 60 * 10,
        select: (data) => data.data ?? [],
        placeholderData: { data: [] }
    });

    // Query 2: Busca as placas FILTRADAS (usada para a lista de "Disponíveis")
    // Esta query é REATIVA: ela é executada automaticamente quando os filtros mudam.
    const { data: filteredPlacasData = [], isLoading: isLoadingFilteredPlacas } = useQuery({
        // A queryKey INCLUI os filtros. Se mudarem, a query re-executa.
        queryKey: ['placas', 'filtered', selectedRegiao, debouncedPlacaSearch], 
        
        queryFn: () => {
            console.log(`[Filtro API] Buscando... Reg: "${selectedRegiao}", Busca: "${debouncedPlacaSearch}"`);
            const params = new URLSearchParams({ limit: 1000 });
            
            // Adiciona filtros na query (igual ao PlacasPage.jsx)
            if (selectedRegiao) {
                params.append('regiao_id', selectedRegiao);
            }
            if (debouncedPlacaSearch) {
                params.append('search', debouncedPlacaSearch);
            }
            
            // A API agora faz a filtragem
            return fetchPlacas(params);
        },
        staleTime: 1000 * 60 * 5, // Cache de 5 min para filtros
        select: (data) => data.data ?? [],
        placeholderData: { data: [] }
    });

    // --- 3. Lógica de 'useMemo' (Agora muito mais simples) ---
    
    // A. Lista de placas DISPONÍVEIS
    const availablePlacas = useMemo(() => {
        // Os dados de 'filteredPlacasData' já vêm filtrados da API.
        // Só precisamos remover as que já foram selecionadas.
        const selectedIds = new Set(watchedPlacas);
        
        const filteredList = filteredPlacasData.filter(placa => {
            return !selectedIds.has(placa._id); // Retorna true se NÃO estiver selecionada
        });

        return filteredList;

    }, [filteredPlacasData, watchedPlacas]); // Depende da Query Filtrada e das selecionadas

    // B. Lista de placas SELECIONADAS (objetos completos)
    const selectedPlacasObjects = useMemo(() => {
        // Usa a query 'allPlacasData' (que tem TODAS) para garantir
        // que encontramos os nomes, mesmo que não estejam no filtro atual.
        const allPlacasMap = new Map(allPlacasData.map(p => [p._id, p]));
        
        return watchedPlacas
            .map(id => allPlacasMap.get(id)) // Busca no mapa de TODAS as placas
            .filter(Boolean); // Remove nulos
    }, [watchedPlacas, allPlacasData]); // Depende das selecionadas e da Query 'all'


    // --- 4. Funções Auxiliares ---
    const getRegiaoNome = (placa) => {
        if (!placa.regiao) return 'Sem região';
        
        if (regioes.length > 0) {
             const regiaoId = (typeof placa.regiao === 'object' && placa.regiao !== null) ? placa.regiao._id : placa.regiao;
             const reg = regioes.find(r => r._id === regiaoId);
             if (reg) return reg.nome;
        }
        if (typeof placa.regiao === 'object' && placa.regiao !== null && placa.regiao.nome) {
            return placa.regiao.nome;
        }
        return 'Sem região';
    };

    // --- 5. Retorno do Hook ---
    return {
        // Estado de loading combinado
        isLoading: isLoadingRegioes || isLoadingAllPlacas || isLoadingFilteredPlacas,
        regioes,
        availablePlacas, // A lista já filtrada E que não estão selecionadas
        selectedPlacasObjects, // A lista de objetos selecionados
        getRegiaoNome,
        
        // Controlos de filtro para o seletor
        selectedRegiao,
        setSelectedRegiao,
        placaSearch,
        setPlacaSearch
    };
};