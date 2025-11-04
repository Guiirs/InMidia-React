// src/components/PIModalForm/pages/Page2Placas.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
// fetchPlacasDisponiveis vem do api.js
import { fetchRegioes, fetchPlacas, fetchPlacasDisponiveis } from '../../../services/api'; 
import Spinner from '../../Spinner/Spinner';
import '../css/PlacaSelector.css'; // O CSS que acabámos de corrigir

// Usamos o caminho relativo './components' dentro da pasta 'pages'
import PlacaSelectItem from './components/PlacaSelectItem';

// Chaves de Query
const regioesQueryKey = ['regioes'];
const allPlacasQueryKey = ['placas', 'all']; 

export function Page2Placas({
    name,
    control,
    isSubmitting,
    dataInicio,
    dataFim,
    placaFilters 
}) {
    // 1. Extrai o estado e os setters (vindos do hook usePIFormLogic)
    const {
        selectedRegiao,
        setSelectedRegiao,
        placaSearch,
        setPlacaSearch,
        debouncedPlacaSearch
    } = placaFilters;

    // 2. Controla o campo 'placas' do React Hook Form
    const {
        field,
        fieldState: { error }
    } = useController({ 
        name, 
        control, 
        rules: { 
            validate: value => (value && value.length > 0) || 'Selecione pelo menos uma placa.'
        } 
    });

    // --- Queries ---

    // Query 1: Regiões (para o filtro dropdown)
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: regioesQueryKey,
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 60,
    });

    // Query 2: TODAS as placas (usado como "mapa" para a lista da direita)
    const { data: allPlacasData, isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: allPlacasQueryKey,
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 10000 })), 
        staleTime: 1000 * 60 * 10,
        select: (data) => data.data ?? [],
    });


    // ========================================================================
    // === ESTA É A PARTE MAIS IMPORTANTE PARA CORRIGIR O FILTRO ===
    // ========================================================================
    
    // Query 3: Placas DISPONÍVEIS (agora filtradas pelo backend)
    const {
        data: placasDisponiveis = [],
        isLoading: isLoadingDisponiveis,
        isFetching: isFetchingDisponiveis, // Usado para o spinner
    } = useQuery({
        // 1. A queryKey AGORA DEPENDE dos filtros
        queryKey: ['placasDisponiveis', dataInicio, dataFim, selectedRegiao, debouncedPlacaSearch],
        
        queryFn: () => {
            if (!dataInicio || !dataFim) {
                return Promise.resolve({ data: [] }); 
            }
            const params = new URLSearchParams({ dataInicio, dataFim });

            // 2. Adiciona os filtros aos parâmetros da API
            // Se 'selectedRegiao' não for nulo, adiciona ao 'params'
            if (selectedRegiao) {
                params.append('regiao', selectedRegiao);
            }
            // Se 'debouncedPlacaSearch' não for nulo, adiciona ao 'params'
            if (debouncedPlacaSearch) {
                params.append('search', debouncedPlacaSearch);
            }

            // A função fetchPlacasDisponiveis (do api.js) envia os params
            return fetchPlacasDisponiveis(params);
        },
        enabled: !!dataInicio && !!dataFim,
        staleTime: 1000 * 30, // Cache de 30 segundos
        select: (data) => data.data ?? [],
    });

    const isLoading = isLoadingRegioes || isLoadingAllPlacas;

    // --- Mapeamento e Filtragem (useMemo) ---

    // Mapa ID -> Placa (para performance)
    const allPlacasMap = useMemo(() => {
        if (!allPlacasData) return new Map();
        return allPlacasData.reduce((map, placa) => {
            map.set(placa._id, placa);
            return map;
        }, new Map());
    }, [allPlacasData]);

    // Lista de placas selecionadas
    const placasSelecionadas = useMemo(() => {
        return (field.value || []).map(id => allPlacasMap.get(id)).filter(Boolean);
    }, [field.value, allPlacasMap]);


    // 3. O useMemo agora está simples: O BACKEND JÁ FILTROU TUDO
    const placasDisponiveisFiltradas = useMemo(() => {
        return (placasDisponiveis || []).filter(placa => {
            // Apenas remove placas JÁ SELECIONADAS
            if (field.value?.includes(placa._id)) {
                return false;
            }
            return true;
        });
    // 4. As dependências dos filtros (selectedRegiao, debouncedPlacaSearch) saíram daqui
    }, [placasDisponiveis, field.value]); 

    // ========================================================================
    // === FIM DA CORREÇÃO DO FILTRO ===
    // ========================================================================


    // --- Handlers (Adicionar/Remover) ---
    const handleSelectPlaca = (placaId) => {
        const newValue = [...(field.value || []), placaId];
        field.onChange(newValue);
    };

    const handleDeselectPlaca = (placaId) => {
        const newValue = (field.value || []).filter(id => id !== placaId);
        field.onChange(newValue);
    };

    // Helper para buscar o nome da região
    const findRegiaoNome = (placa) => {
        if (placa.regiao && placa.regiao.nome) return placa.regiao.nome; 
        const placaCompleta = allPlacasMap.get(placa._id);
        return placaCompleta?.regiao?.nome || 'N/A';
    };

    return (
        <div className="modal-form__input-group modal-form__input-group--full">
            {/* Filtros (O JSX não muda) */}
            <div className="pi-selector__filters">
                <div className="pi-selector__search">
                    <input
                        type="text"
                        placeholder="Buscar por Nº ou Rua..."
                        className="pi-selector__input"
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isSubmitting || isLoading}
                    />
                </div>
                <div className="pi-selector__region-filter">
                    <select
                        className="pi-selector__select"
                        value={selectedRegiao}
                        onChange={(e) => setSelectedRegiao(e.target.value)}
                        disabled={isSubmitting || isLoading}
                    >
                        <option value="">Todas as Regiões</option>
                        {regioes.map(r => (
                            <option key={r._id} value={r._id}>{r.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Listas */}
            <div className="pi-selector__list-container">
                {/* Mostra o spinner quando a query dos filtros está a ser executada */
                (isLoading || isFetchingDisponiveis) && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 10 }}>
                        <Spinner message="A filtrar placas..." />
                    </div>
                )}

                {/* Lista da Esquerda (Disponíveis) */}
                <div className="pi-selector__list">
                    <h4>Placas Disponíveis ({placasDisponiveisFiltradas.length})</h4>
                    {placasDisponiveisFiltradas.length > 0 ? (
                        <ul>
                            {placasDisponiveisFiltradas.map(placa => (
                                <li key={placa._id}>
                                    <PlacaSelectItem
                                        placa={placa}
                                        regiaoNome={findRegiaoNome(placa)}
                                        onSelect={() => handleSelectPlaca(placa._id)}
                                        type="add"
                                        disabled={isSubmitting}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="pi-selector__empty-list">Nenhuma placa disponível (verifique datas ou filtros).</p>
                    )}
                </div>

                {/* Lista da Direita (Selecionadas) */}
                <div className="pi-selector__list">
                    <h4>Placas Selecionadas ({placasSelecionadas.length})</h4>
                    {placasSelecionadas.length > 0 ? (
                        <ul>
                            {placasSelecionadas.map(placa => (
                                <li key={placa._id}>
                                    <PlacaSelectItem
                                        placa={placa}
                                        regiaoNome={findRegiaoNome(placa)}
                                        onSelect={() => handleDeselectPlaca(placa._id)}
                                        type="remove"
                                        disabled={isSubmitting}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="pi-selector__empty-list">Selecione placas da lista ao lado.</p>
                    )}
                </div>
            </div>
            
            {error && <div className="modal-form__error-message" style={{ marginTop: '1rem' }}>{error.message}</div>}
        </div>
    );
}

Page2Placas.propTypes = {
    name: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    dataFim: PropTypes.string,
    placaFilters: PropTypes.shape({
        selectedRegiao: PropTypes.string.isRequired,
        setSelectedRegiao: PropTypes.func.isRequired,
        placaSearch: PropTypes.string.isRequired,
        setPlacaSearch: PropTypes.func.isRequired,
        debouncedPlacaSearch: PropTypes.string.isRequired,
    }).isRequired,
};