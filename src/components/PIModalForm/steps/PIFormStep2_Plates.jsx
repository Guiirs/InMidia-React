// src/components/PIModalForm/steps/PIFormStep2_Plates.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { usePlacaFilters } from '../../../hooks/usePlacaFilters'; // O hook é usado aqui dentro!

/**
 * Etapa 2 do formulário de PI: Seleção de Placas.
 * Este componente agora encapsula toda a lógica de filtragem,
 * corrigindo o problema de perda de estado.
 */
function PIFormStep2_Plates({ control, isSubmitting }) {
    
    // Conecta este componente ao campo 'placas' do formulário principal.
    const { 
        field: { value: watchedPlacas, onChange: setWatchedPlacas }, 
        fieldState: { error: placaError } 
    } = useController({
        name: 'placas', // Nome do campo no formulário
        control,
        rules: { 
            validate: (value) => (value && value.length > 0) || 'Selecione pelo menos uma placa.'
        } 
    });

    // **CORREÇÃO PRINCIPAL**: O hook `usePlacaFilters` é chamado AQUI.
    // O estado dos filtros (selectedRegiao, placaSearch) agora vive DENTRO
    // deste componente e não é afetado por re-renderizações do pai.
    const {
        isLoading: isLoadingPlacas,
        regioes,
        availablePlacas,
        selectedPlacasObjects,
        getRegiaoNome,
        selectedRegiao,
        setSelectedRegiao,
        placaSearch,
        setPlacaSearch
    } = usePlacaFilters(watchedPlacas || []);

    // Handlers para adicionar/remover placas, que atualizam o valor no RHF.
    const handleSelectPlaca = (placaId) => { 
        setWatchedPlacas([...(watchedPlacas || []), placaId]);
    };

    const handleRemovePlaca = (placaId) => { 
        setWatchedPlacas((watchedPlacas || []).filter(id => id !== placaId));
    };

    return (
        <>
            {/* 1. Placas Selecionadas */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label>Placas Selecionadas* ({selectedPlacasObjects.length})</label>
                <div className="modal-form__selected-list">
                    {isLoadingPlacas ? (
                        <span className="modal-form__selected-empty">A carregar...</span>
                    ) : selectedPlacasObjects.length === 0 ? (
                        <span className="modal-form__selected-empty">Nenhuma placa selecionada.</span>
                    ) : (
                        selectedPlacasObjects.map(placa => (
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
                 {/* Exibe o erro do RHF para o campo 'placas' */}
                 {placaError && <div className="modal-form__error-message">{placaError.message}</div>}
            </div>

            {/* 2. Placas Disponíveis (Filtros + Lista) */}
            <div className="modal-form__input-group modal-form__input-group--full modal-form__multi-select-wrapper">
                <label>Placas Disponíveis</label>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <select id="regiao-filtro" className="modal-form__input"
                        style={{ flex: 1 }}
                        value={selectedRegiao} 
                        onChange={(e) => setSelectedRegiao(e.target.value)} 
                        disabled={isSubmitting || isLoadingPlacas}>
                        <option value="">Todas as Regiões</option>
                        {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
                    </select>

                    <input type="text" className="modal-form__input"
                        style={{ flex: 2 }}
                        placeholder="Pesquisar por nº ou rua..."
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isSubmitting || isLoadingPlacas}
                    />
                </div>
                
                <div id="placas-list" className="modal-form__multi-select-list" tabIndex={0}>
                    {isLoadingPlacas ? (
                        <div className="modal-form__multi-select-option">A carregar placas...</div>
                    ) : availablePlacas.length > 0 ? (
                        availablePlacas.map(placa => (
                            <div 
                                key={placa._id}
                                className="modal-form__multi-select-option"
                                onClick={() => handleSelectPlaca(placa._id)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSelectPlaca(placa._id)}
                                tabIndex={0}
                            >
                                {placa.numero_placa || `ID ${placa._id}`} ({getRegiaoNome(placa)})
                            </div>
                        ))
                    ) : (
                         <div className="modal-form__multi-select-option" style={{cursor: 'default', color: 'var(--text-color-light)'}}>
                            {placaSearch || selectedRegiao
                                ? 'Nenhuma placa encontrada com estes filtros.'
                                : 'Nenhuma placa disponível (ou todas já selecionadas).'
                            }
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

PIFormStep2_Plates.propTypes = {
    control: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

export default PIFormStep2_Plates;