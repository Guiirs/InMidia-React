// src/components/PIModalForm/steps/PIModalFormPlacaSelector.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useController } from 'react-hook-form';
// [MELHORIA] Importamos as funções de API específicas
import { fetchRegioes, fetchPlacasDisponiveis, fetchPlacas } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import Spinner from '../../Spinner/Spinner';
// [MELHORIA] Este é um novo sub-componente que enviarei em seguida
import PlacaSelectItem from './PlacaSelectItem'; 
// [MELHORIA] Este é um novo CSS que enviarei em seguida
import './PIModalFormPlacaSelector.css'; 

/**
 * Etapa 2 do formulário de PI: Seleção de Placas com filtros.
 * Este componente agora gerencia seus próprios filtros e buscas de dados.
 */
function PIModalFormPlacaSelector({
    control,
    name,
    isSubmitting,
    // [MELHORIA] Recebe as datas do pai para filtrar a busca
    dataInicio, 
    dataFim
}) {
    // --- 1. Controle do React Hook Form ---
    // 'field' contém { onChange, onBlur, value (que é o array de IDs) }
    const { field } = useController({
        name,
        control,
        rules: { required: 'Selecione pelo menos uma placa.' } // Adiciona validação
    });
    const placasSelecionadasIds = field.value || [];

    // --- 2. Lógica de Filtros (Movida para cá) ---
    const [selectedRegiao, setSelectedRegiao] = React.useState('');
    const [placaSearch, setPlacaSearch] = React.useState('');
    const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // --- 3. Buscas de Dados (Movidas para cá) ---
    
    // Busca todas as regiões para o filtro
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: ['regioes'],
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 15, // Cache de 15 min
    });

    // Busca as placas DISPONÍVEIS, dependendo das datas
    const { data: availablePlacas = [], isLoading: isLoadingAvailable } = useQuery({
        // A query depende das datas
        queryKey: ['placasDisponiveis', dataInicio, dataFim],
        queryFn: () => {
            if (!dataInicio || !dataFim) {
                return Promise.resolve({ data: [] });
            }
            const params = new URLSearchParams({ dataInicio, dataFim });
            // Usa a função de API (que estava no hook)
            return fetchPlacasDisponiveis(params); 
        },
        select: (data) => data.data ?? [], 
        staleTime: 1000 * 60 * 5, 
        enabled: !!dataInicio && !!dataFim, // Só executa se as datas existirem
    });
    
    // Busca TODAS as placas (para obter os objetos das placas já selecionadas)
    const { data: allPlacas = [], isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: ['placas', 'all'], 
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 2000 })),
        select: (data) => data.data ?? [],
        staleTime: 1000 * 60 * 15,
    });

    const isLoading = isLoadingRegioes || isLoadingAvailable || isLoadingAllPlacas;

    // --- 4. Lógica de Memoização (Movida para cá) ---

    // Filtra as placas disponíveis com base nos filtros da UI
    const availablePlacasFiltered = React.useMemo(() => {
        return availablePlacas.filter(placa => {
            const matchesRegiao = !selectedRegiao || placa.regiao?._id === selectedRegiao;
            const matchesSearch = !debouncedPlacaSearch || 
                placa.numero_placa.toLowerCase().includes(debouncedPlacaSearch.toLowerCase()) ||
                placa.nomeDaRua?.toLowerCase().includes(debouncedPlacaSearch.toLowerCase());
            
            // Exclui placas que já estão na lista de selecionadas
            const isNotSelected = !placasSelecionadasIds.includes(placa._id);

            return matchesRegiao && matchesSearch && isNotSelected;
        });
    }, [availablePlacas, selectedRegiao, debouncedPlacaSearch, placasSelecionadasIds]);

    // Obtém os OBJETOS das placas que estão na lista de IDs selecionados
    const selectedPlacasObjects = React.useMemo(() => {
        if (allPlacas.length === 0) return [];
        
        return placasSelecionadasIds
            .map(id => allPlacas.find(p => p._id === id))
            .filter(Boolean); // Remove nulos caso uma placa tenha sido deletada

    }, [placasSelecionadasIds, allPlacas]);

    // Helper para buscar nome da região
    const getRegiaoNome = React.useCallback((regiaoId) => {
        return regioes.find(r => r._id === regiaoId)?.nome || 'Sem Região';
    }, [regioes]);


    // --- 5. Handlers de Seleção ---
    
    const handleAddPlaca = (placaId) => {
        if (!placasSelecionadasIds.includes(placaId)) {
            // Atualiza o RHF
            field.onChange([...placasSelecionadasIds, placaId]);
        }
    };

    const handleRemovePlaca = (placaId) => {
        // Atualiza o RHF
        field.onChange(placasSelecionadasIds.filter(id => id !== placaId));
    };

    // --- 6. Renderização ---
    return (
        <div className="pi-placa-selector">
            
            {/* Filtros */}
            <div className="pi-placa-selector__filters">
                <div className="modal-form__input-group">
                    <label htmlFor="filtro-regiao">Filtrar por Região</label>
                    <select 
                        id="filtro-regiao" 
                        className="modal-form__input"
                        value={selectedRegiao}
                        onChange={(e) => setSelectedRegiao(e.target.value)}
                        disabled={isLoading || isSubmitting}
                    >
                        <option value="">Todas as Regiões</option>
                        {regioes.map(r => (
                            <option key={r._id} value={r._id}>{r.nome}</option>
                        ))}
                    </select>
                </div>
                <div className="modal-form__input-group">
                    <label htmlFor="filtro-busca">Buscar por Cód. ou Rua</label>
                    <input 
                        type="text" 
                        id="filtro-busca" 
                        className="modal-form__input"
                        placeholder="Digite..."
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isLoading || isSubmitting}
                    />
                </div>
            </div>

            {/* Colunas */}
            <div className="pi-placa-selector__columns">
                
                {/* Coluna de Disponíveis */}
                <div className="pi-placa-selector__column">
                    <h4 className="pi-placa-selector__column-title">
                        Placas Disponíveis ({availablePlacasFiltered.length})
                    </h4>
                    <div className="pi-placa-selector__list">
                        {isLoading && <Spinner message="Buscando placas..." mini />}
                        {!isLoading && availablePlacasFiltered.length === 0 && (
                            <div className="pi-placa-selector__empty">
                                {availablePlacas.length > 0 ? "Nenhuma placa corresponde aos filtros." : "Nenhuma placa disponível para estas datas."}
                            </div>
                        )}
                        {availablePlacasFiltered.map(placa => (
                            <PlacaSelectItem
                                key={placa._id}
                                placa={placa}
                                regiaoNome={placa.regiao?.nome || 'N/A'}
                                onSelect={() => handleAddPlaca(placa._id)}
                                type="add"
                                disabled={isSubmitting}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Coluna de Selecionadas */}
                <div className="pi-placa-selector__column">
                    <h4 className="pi-placa-selector__column-title">
                        Placas Selecionadas ({selectedPlacasObjects.length})
                    </h4>
                    <div className="pi-placa-selector__list">
                        {isLoadingAllPlacas && placasSelecionadasIds.length > 0 && <Spinner mini />}
                        {selectedPlacasObjects.length === 0 && (
                             <div className="pi-placa-selector__empty">
                                Clique em '+' para adicionar placas.
                            </div>
                        )}
                        {selectedPlacasObjects.map(placa => (
                            <PlacaSelectItem
                                key={placa._id}
                                placa={placa}
                                regiaoNome={getRegiaoNome(placa.regiao)}
                                onSelect={() => handleRemovePlaca(placa._id)}
                                type="remove"
                                disabled={isSubmitting}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

PIModalFormPlacaSelector.propTypes = {
    control: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    // [MELHORIA] Props necessárias para a query
    dataInicio: PropTypes.string, 
    dataFim: PropTypes.string,
};

export default PIModalFormPlacaSelector;