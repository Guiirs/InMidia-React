// src/components/PIModalForm/PIModalFormPlacaSelector.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
// REMOVIDO: import { usePlacaFilters } from '../../hooks/usePlacaFilters';

// Este componente agora é "burro". Ele recebe toda a lógica como props.
function PIModalFormPlacaSelector({ 
    control, 
    name, 
    isSubmitting,
    
    // --- Novas props recebidas do componente-pai ---
    isLoading,
    regioes,
    availablePlacas,
    selectedPlacasObjects,
    getRegiaoNome,
    selectedRegiao,
    setSelectedRegiao,
    placaSearch,
    setPlacaSearch
}) {
    
    // Liga-se ao RHF (React Hook Form)
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

    // O hook 'usePlacaFilters' foi MOVIDO para o componente-pai

    // Handlers de Seleção (chamam a função 'onChange' do RHF)
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
                <label>Placas Selecionadas ({selectedPlacasObjects.length})</label>
                <div className="modal-form__selected-list">
                    {isLoading ? (
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
            </div>

            {/* 2. Placas Disponíveis (Filtros + Lista) */}
            <div className="modal-form__input-group modal-form__input-group--full modal-form__multi-select-wrapper">
                <label>Placas Disponíveis</label>
                
                {/* Filtro de Região (agora usa props) */}
                <select id="regiao-filtro" className="modal-form__input"
                    value={selectedRegiao} 
                    onChange={(e) => setSelectedRegiao(e.target.value)} 
                    disabled={isSubmitting || isLoading}>
                    <option value="">{isLoading ? 'A carregar...' : 'Filtrar por Região'}</option>
                    {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
                </select>

                {/* Filtro de Busca (agora usa props) */}
                <input type="text" className="modal-form__input"
                    placeholder="Pesquisar por número da placa..."
                    value={placaSearch}
                    onChange={(e) => setPlacaSearch(e.target.value)}
                    disabled={isSubmitting || isLoading}
                />
                
                {/* Lista de Placas Disponíveis (usa props) */}
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

// PropTypes (atualizado para incluir as novas props)
PIModalFormPlacaSelector.propTypes = {
    control: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    // Props vindas do hook (passadas pelo pai)
    isLoading: PropTypes.bool.isRequired,
    regioes: PropTypes.array.isRequired,
    availablePlacas: PropTypes.array.isRequired,
    selectedPlacasObjects: PropTypes.array.isRequired,
    getRegiaoNome: PropTypes.func.isRequired,
    selectedRegiao: PropTypes.string.isRequired,
    setSelectedRegiao: PropTypes.func.isRequired,
    placaSearch: PropTypes.string.isRequired,
    setPlacaSearch: PropTypes.func.isRequired,
};

export default PIModalFormPlacaSelector;