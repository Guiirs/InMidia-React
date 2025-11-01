// src/components/PIModalForm/PIModalFormPlacaSelector.jsx
import React, { useState, useMemo, useEffect } from 'react'; 
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchPlacas, fetchRegioes } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce'; 

/**
 * Este componente agora é "inteligente" (smart component), contendo toda a lógica
 * de estado e busca de filtros, isolando-o de re-renderizações desnecessárias do pai.
 */
function PIModalFormPlacaSelector({ 
    control, 
    name, 
    isSubmitting,
    initialData, // Recebe a prop do pai para resetar
}) {
    
    // --- 1. Lógica do Formulário (RHF) ---
    const { 
        field: { value: watchedPlacas, onChange: setWatchedPlacas }, 
        fieldState: { error: placaError } 
    } = useController({
        name,
        control,
        rules: { 
            validate: (value) => (value && value.length > 0) || 'Selecione pelo menos uma placa.'
        } 
    });

    // --- 2. Estado Interno dos Filtros (Persistente) ---
    const [selectedRegiao, setSelectedRegiao] = useState('');
    const [placaSearch, setPlacaSearch] = useState('');
    const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // --- [MECANISMO DE RESET EXPLÍCITO] ---
    // Reseta o estado local de filtros quando o modal abre (i.e., initialData muda)
    useEffect(() => {
        console.log("[Selector] Resetando filtros internos devido a nova initialData.");
        setSelectedRegiao('');
        setPlacaSearch('');
    // Roda apenas quando a referência do objeto initialData muda.
    }, [initialData]);

    // --- 3. Lógica de Busca de Dados (React Query) ---
    
    // Query A: Busca todas as Regiões
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: ['regioes'], 
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 10 
    });

    // Query B: Busca TODAS as placas (para mapear IDs selecionados)
    const { data: allPlacasData = [], isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: ['placas', 'all'], 
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 2000 })), 
        staleTime: 1000 * 60 * 10,
        select: (data) => data.data ?? [],
    });

    // Query C: Busca as placas FILTRADAS
    const { data: filteredPlacasData = [], isLoading: isLoadingFilteredPlacas } = useQuery({
        queryKey: ['placas', 'filtered', selectedRegiao, debouncedPlacaSearch], 
        queryFn: () => {
            console.log(`[Selector] Buscando API. Reg: "${selectedRegiao}", Busca: "${debouncedPlacaSearch}"`);
            const params = new URLSearchParams({ limit: 1000 });
            
            if (selectedRegiao) {
                params.append('regiao_id', selectedRegiao);
            }
            if (debouncedPlacaSearch) {
                params.append('search', debouncedPlacaSearch);
            }
            
            return fetchPlacas(params);
        },
        staleTime: 1000 * 60 * 5, 
        select: (data) => data.data ?? [],
    });

    // Loading unificado
    const isLoading = isLoadingRegioes || isLoadingAllPlacas || isLoadingFilteredPlacas;

    // --- 4. Lógica de 'useMemo' ---

    // Lista de placas DISPONÍVEIS
    const availablePlacas = useMemo(() => {
        const selectedIds = new Set(watchedPlacas || []);
        return filteredPlacasData.filter(placa => !selectedIds.has(placa._id));
    }, [filteredPlacasData, watchedPlacas]);

    // Lista de placas SELECIONADAS (objetos completos)
    const selectedPlacasObjects = useMemo(() => {
        const allPlacasMap = new Map(allPlacasData.map(p => [p._id, p]));
        return (watchedPlacas || [])
            .map(id => allPlacasMap.get(id))
            .filter(Boolean);
    }, [watchedPlacas, allPlacasData]);

    // Map de Regiões para nomes
    const regioesMap = useMemo(() => {
        return new Map(regioes.map(r => [r._id, r.nome]));
    }, [regioes]);

    const getRegiaoNome = (placa) => {
        if (!placa || !placa.regiao) return 'Sem região';
        const regiaoId = (typeof placa.regiao === 'object' && placa.regiao !== null) 
            ? placa.regiao._id 
            : placa.regiao;
        return regioesMap.get(regiaoId) || 'Sem região';
    };

    // --- 5. Handlers de Seleção ---
    const handleSelectPlaca = (placaId) => { 
        setWatchedPlacas([...(watchedPlacas || []), placaId]);
    };

    const handleRemovePlaca = (placaId) => { 
        setWatchedPlacas((watchedPlacas || []).filter(id => id !== placaId));
    };

    // --- 6. Renderização ---
    return (
        <>
            {/* 1. Placas Selecionadas */}
            <div className="modal-form__input-group modal-form__input-group--full">
                {/* [CORREÇÃO CRÍTICA] Adicionada checagem defensiva para evitar TypeError */}
                <label>Placas Selecionadas ({(selectedPlacasObjects || []).length})</label>
                <div className="modal-form__selected-list">
                    {isLoading ? (
                        <span className="modal-form__selected-empty">A carregar...</span>
                    ) : (selectedPlacasObjects || []).length === 0 ? ( // Checagem defensiva
                        <span className="modal-form__selected-empty">Nenhuma placa selecionada.</span>
                    ) : (
                        (selectedPlacasObjects || []).map(placa => ( // Checagem defensiva
                            <div key={placa._id} className="modal-form__selected-item">
                                <span>{placa.numero_placa || `ID ${placa._id}`} - {getRegiaoNome(placa)}</span>
                                <button type="button" className="modal-form__selected-remove-btn" 
                                    onClick={() => handleRemovePlaca(placa._id)}
                                    title="Remover" disabled={isSubmitting}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Placas Disponíveis (Filtros + Lista) */}
            <div className="modal-form__input-group modal-form__input-group--full modal-form__multi-select-wrapper">
                <label>Placas Disponíveis</label>
                
                {/* Filtro de Região (controla o estado interno) */}
                <select id="regiao-filtro" className="modal-form__input"
                    value={selectedRegiao} 
                    onChange={(e) => setSelectedRegiao(e.target.value)} 
                    disabled={isSubmitting || isLoading}>
                    <option value="">{isLoading ? 'A carregar...' : 'Filtrar por Região'}</option>
                    {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
                </select>

                {/* Filtro de Busca (controla o estado interno) */}
                <input type="text" className="modal-form__input"
                    placeholder="Pesquisar por número da placa..."
                    value={placaSearch}
                    onChange={(e) => setPlacaSearch(e.target.value)}
                    disabled={isSubmitting || isLoading}
                />
                
                {/* Lista de Placas Disponíveis */}
                <div id="placas-list" className="modal-form__multi-select-list" tabIndex={0}>
                    {isLoading ? (
                        <div className="modal-form__multi-select-option">A carregar placas...</div>
                    ) : (
                        availablePlacas.map(placa => (
                            <div 
                                key={placa._id}
                                className="modal-form__multi-select-option"
                                onClick={() => handleSelectPlaca(placa._id)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSelectPlaca(placa._id)}
                                tabIndex={0}
                            >
                                {placa.numero_placa || `ID ${placa._id}`} - {getRegiaoNome(placa)}
                            </div>
                        ))
                    )}
                    
                    {!isLoading && availablePlacas.length === 0 && (
                         <div className="modal-form__multi-select-option" style={{cursor: 'default', color: 'var(--text-color-light)'}}>
                            {placaSearch || selectedRegiao
                                ? 'Nenhuma placa encontrada com estes filtros.'
                                : 'Nenhuma placa disponível (ou todas já selecionadas).'
                            }
                        </div>
                    )}
                </div>
                
                {/* Exibe o erro do RHF para o campo 'placas' */}
                {placaError && <div className="modal-form__error-message">{placaError.message}</div>}
            </div>
        </>
    );
}

PIModalFormPlacaSelector.propTypes = {
    control: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    initialData: PropTypes.object,
};

export default PIModalFormPlacaSelector;