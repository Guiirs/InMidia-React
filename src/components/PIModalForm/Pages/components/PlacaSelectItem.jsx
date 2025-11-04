// src/components/PIModalForm/Pages/components/PlacaSelectItem.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de item individual para as listas de seleção de placas.
 * (Movido de 'steps/' para 'Pages/components/')
 */
function PlacaSelectItem({ placa, regiaoNome, onSelect, type, disabled }) {
    const isAdd = type === 'add';
    const buttonIcon = isAdd ? 'fa-plus' : 'fa-minus';
    const buttonTitle = isAdd ? 'Adicionar placa' : 'Remover placa';

    // Usa os estilos do PlacaSelector.css (importado na Page2Placas.jsx)
    return (
        <div className="placa-select-item">
            <div className="placa-select-item__info">
                <span className="placa-select-item__codigo">{placa.numero_placa}</span>
                <span className="placa-select-item__regiao">{regiaoNome}</span>
                <span className="placa-select-item__rua">{placa.nomeDaRua || 'Endereço não cadastrado'}</span>
            </div>
            <button
                type="button"
                className={`placa-select-item__button placa-select-item__button--${type}`}
                title={buttonTitle}
                onClick={onSelect}
                disabled={disabled}
            >
                <i className={`fas ${buttonIcon}`}></i>
            </button>
        </div>
    );
}

PlacaSelectItem.propTypes = {
    placa: PropTypes.object.isRequired,
    regiaoNome: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
    type: PropTypes.oneOf(['add', 'remove']).isRequired,
    disabled: PropTypes.bool.isRequired,
};

export default PlacaSelectItem;