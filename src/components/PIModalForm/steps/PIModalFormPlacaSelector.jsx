// src/components/PIModalForm/steps/PIModalFormPlacaSelector.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFormContext, useController } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchRegioes, fetchPlacas, fetchPlacasDisponiveis } from '../../../services/api';
// import { useDebounce } from '../../../hooks/useDebounce'; // Removido, pois agora vem do Pai
import Spinner from '../../Spinner/Spinner';
import './PIModalFormPlacaSelector.css';

// Componente de item individual (movido para ficheiro próprio)
import PlacaSelectItem from './PlacaSelectItem';

// Chaves de Query
const regioesQueryKey = ['regioes'];
const allPlacasQueryKey = ['placas', 'all']; // Para obter todas as placas (necessário para lookup)

function PIModalFormPlacaSelector({
    name,
    control,
    isSubmitting,
    dataInicio,
    dataFim,
    // *** INÍCIO DA CORREÇÃO (BUGS DO FILTRO) ***
    // 1. Recebe o estado e os setters do componente Pai (PIModalForm)
    selectedRegiao,
    setSelectedRegiao,
    placaSearch,
    setPlacaSearch,
    debouncedPlacaSearch
    // *** FIM DA CORREÇÃO ***
}) {
    // const { control } = useFormContext(); // Já vem via props
    const {
        field,
        fieldState: { error }
    } = useController({ name, control, rules: { /* required: 'Selecione pelo menos uma placa.' */ } });

    // --- ESTADO LOCAL REMOVIDO ---
    // O estado local foi movido para o PIModalForm.jsx (Pai)
    // const [selectedRegiao, setSelectedRegiao] = useState('');
    // const [placaSearch, setPlacaSearch] = useState('');
    // const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // --- Queries ---

    // Query 1: Regiões (para o filtro dropdown)
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: regioesQueryKey,
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 60,
    });

    // Query 2: TODAS as placas (usado como um "mapa" para encontrar dados das placas selecionadas)
    const { data: allPlacasData, isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: allPlacasQueryKey,
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 10000 })), // Busca todas
        staleTime: 1000 * 60 * 10,
        select: (data) => data.data ?? [],
    });

    // Query 3: Placas DISPONÍVEIS (para a lista da esquerda)
    const {
        data: placasDisponiveis = [],
        isLoading: isLoadingDisponiveis,
        isFetching: isFetchingDisponiveis,
    } = useQuery({
        // A query agora depende das datas E dos filtros (que vêm das props)
        queryKey: ['placasDisponiveis', dataInicio, dataFim],
        queryFn: () => {
            if (!dataInicio || !dataFim) {
                return Promise.resolve({ data: [] }); // Retorna array vazio se as datas forem inválidas
            }
            const params = new URLSearchParams({ dataInicio, dataFim });
            return fetchPlacasDisponiveis(params);
        },
        enabled: !!dataInicio && !!dataFim,
        staleTime: 1000 * 60, // Cache curto, pois depende das datas
        select: (data) => data.data ?? [],
    });

    const isLoading = isLoadingRegioes || isLoadingAllPlacas;

    // --- Mapeamento e Filtragem (useMemo) ---

    // Cria um mapa ID -> Placa (para performance)
    const allPlacasMap = useMemo(() => {
        if (!allPlacasData) return new Map();
        return allPlacasData.reduce((map, placa) => {
            map.set(placa._id, placa);
            return map;
        }, new Map());
    }, [allPlacasData]);

    // Lista de placas selecionadas (IDs vêm do RHF 'field.value')
    const placasSelecionadas = useMemo(() => {
        return (field.value || []).map(id => allPlacasMap.get(id)).filter(Boolean); // Filtra IDs que não estão no mapa
    }, [field.value, allPlacasMap]);


    // *** CORREÇÃO AQUI (Lógica de Filtro) ***
    // Lista filtrada de placas disponíveis (para a lista da esquerda)
    const placasDisponiveisFiltradas = useMemo(() => {
        return (placasDisponiveis || []).filter(placa => {
            // IDs já selecionados não aparecem na lista de disponíveis
            if (field.value?.includes(placa._id)) {
                return false;
            }
            
            // 1. Filtro de Região (usa 'selectedRegiao' da prop)
            const matchRegiao = !selectedRegiao || (placa.regiao?._id === selectedRegiao);

            // 2. Filtro de Busca (usa 'debouncedPlacaSearch' da prop)
            const searchTerm = debouncedPlacaSearch.toLowerCase().trim();
            const matchSearch = !searchTerm ||
                placa.numero_placa.toLowerCase().includes(searchTerm) ||
                (placa.nomeDaRua && placa.nomeDaRua.toLowerCase().includes(searchTerm));

            return matchRegiao && matchSearch;
        });
    }, [placasDisponiveis, field.value, selectedRegiao, debouncedPlacaSearch]);
    // *** FIM DA CORREÇÃO ***


    // --- Handlers (Adicionar/Remover) ---
    const handleSelectPlaca = (placaId) => {
        const newValue = [...(field.value || []), placaId];
        field.onChange(newValue);
    };

    const handleDeselectPlaca = (placaId) => {
        const newValue = (field.value || []).filter(id => id !== placaId);
        field.onChange(newValue);
    };

    // *** CORREÇÃO AQUI (Bug do nome da Região) ***
    // Helper para buscar o nome da região no mapa completo
    const findRegiaoNome = (placa) => {
        if (placa.regiao && placa.regiao.nome) return placa.regiao.nome; // Se já estiver populado
        
        // Se não (ex: vindo do 'placasSelecionadas'), busca no mapa
        const placaCompleta = allPlacasMap.get(placa._id);
        return placaCompleta?.regiao?.nome || 'N/A';
    };
    // *** FIM DA CORREÇÃO ***

    return (
        <div className="modal-form__input-group modal-form__input-group--full">
            {/* Filtros */}
            <div className="pi-selector__filters">
                <div className="pi-selector__search">
                    <input
                        type="text"
                        placeholder="Buscar por Nº ou Rua..."
                        className="pi-selector__input"
                        // *** CORREÇÃO AQUI: Usa o estado/setter do Pai ***
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isSubmitting || isLoading}
                    />
                </div>
                <div className="pi-selector__region-filter">
                    <select
                        className="pi-selector__select"
                        // *** CORREÇÃO AQUI: Usa o estado/setter do Pai ***
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
                {/* Spinner de Loading */}
                {(isLoading || isFetchingDisponiveis) && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 10 }}>
                        <Spinner message="A carregar placas..." />
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
            
            {/* Mensagem de Erro (do RHF) */}
            {error && <div className="modal-form__error-message" style={{ marginTop: '1rem' }}>{error.message}</div>}
        </div>
    );
}

PIModalFormPlacaSelector.propTypes = {
    name: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    dataFim: PropTypes.string,
    // *** CORREÇÃO AQUI: Adiciona validação das novas props ***
    selectedRegiao: PropTypes.string.isRequired,
    setSelectedRegiao: PropTypes.func.isRequired,
    placaSearch: PropTypes.string.isRequired,
    setPlacaSearch: PropTypes.func.isRequired,
    debouncedPlacaSearch: PropTypes.string.isRequired,
};

export default PIModalFormPlacaSelector;