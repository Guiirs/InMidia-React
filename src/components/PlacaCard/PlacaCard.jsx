// src/components/PlacaCard/PlacaCard.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, formatDate } from '../../utils/helpers';
import './PlacaCard.css';

function getStatusInfo(placa) {
  if (!placa) {
      return { 
          statusText: 'Erro', 
          statusClass: 'placa-card__status--alugada', 
          clienteInfoHTML: null, 
          toggleButtonIcon: 'fa-exclamation-triangle', 
          toggleButtonTitle: 'Erro', 
          toggleButtonDisabled: true, 
          toggleButtonDisabledTitle: 'Erro ao carregar placa' 
      };
  }

  const { disponivel, cliente_nome, aluguel_data_fim } = placa;
  let statusText = '';
  let statusClass = '';
  let clienteInfoHTML = null;
  let toggleButtonDisabled = false;

  if (cliente_nome && aluguel_data_fim) {
    statusText = 'Alugada';
    statusClass = 'placa-card__status--alugada';
    toggleButtonDisabled = true;
    const dataFimFormatada = formatDate(aluguel_data_fim);

    clienteInfoHTML = (
      <p className="placa-card__cliente-info">
        <i className="fas fa-user-tie"></i>
        <span>{cliente_nome} (Até {dataFimFormatada})</span>
      </p>
    );
  } else if (!disponivel) {
    statusText = 'Em Manutenção';
    statusClass = 'placa-card__status--manutencao';
  } else {
    statusText = 'Disponível';
    statusClass = 'placa-card__status--disponivel';
  }

  const toggleButtonIcon = disponivel ? 'fa-eye-slash' : 'fa-eye';
  const toggleButtonTitle = disponivel ? 'Colocar em Manutenção' : 'Tirar de Manutenção';
  const toggleButtonDisabledTitle = toggleButtonDisabled ? "Não é possível alterar (placa alugada)" : toggleButtonTitle;

  return { statusText, statusClass, clienteInfoHTML, toggleButtonIcon, toggleButtonTitle, toggleButtonDisabled, toggleButtonDisabledTitle };
}

// <<< ALTERAÇÃO: Aceita a nova prop 'sequentialNumber'
function PlacaCard({ placa, sequentialNumber, onToggle, onEdit, onDelete, isToggling, isDeleting }) {
  const navigate = useNavigate();

  const {
    statusText,
    statusClass,
    clienteInfoHTML,
    toggleButtonIcon,
    toggleButtonTitle,
    toggleButtonDisabled,
    toggleButtonDisabledTitle
  } = useMemo(() => getStatusInfo(placa), [placa]);

  const { _id, id, numero_placa, nomeDaRua, imagem, regiao, disponivel } = placa || {};
  const placaId = id || _id;

  const placeholderUrl = '/assets/img/placeholder.png';
  const imageUrl = getImageUrl(imagem, placeholderUrl);

  const nomeRegiao = (typeof regiao === 'object' && regiao?.nome) ? regiao.nome : (regiao || 'Sem região');

  // <<< ALTERAÇÃO: Formata o número sequencial (ex: 1 -> "01")
  const formattedSequentialNumber = String(sequentialNumber).padStart(2, '0');

  const handleCardClick = (e) => {
    if (!e.target.closest('button')) {
        if(placaId) {
            navigate(`/placas/${placaId}`);
        } else {
            console.error("ID da placa ausente no card:", placa);
        }
    }
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (onToggle && placaId) onToggle(placaId, e.currentTarget);
  };
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit && placaId) onEdit(placaId);
  };
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && placaId) onDelete(placaId, e.currentTarget);
  };

  if (!placaId) {
      return null;
  }

  return (
    <div className="placa-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="placa-card__image-wrapper">
        <img
            src={imageUrl}
            alt={`Imagem da Placa ${numero_placa || 'N/A'}`}
            className="placa-card__image"
            onError={(e) => { e.target.onerror = null; e.target.src = placeholderUrl; }}
        />
      </div>
      <div className="placa-card__content">
        
        {/* <<< ALTERAÇÃO: Modificado o Header para incluir o Título e o Subtítulo */}
        <div className="placa-card__header">
          <div className="placa-card__header-titles">
            <h3 className="placa-card__numero">Placa {formattedSequentialNumber}</h3>
            <p className="placa-card__sub-numero">Nº: {numero_placa || 'N/A'}</p>
          </div>
          <span className={`placa-card__status ${statusClass}`}>{statusText}</span>
        </div>
        {/* Fim da Alteração */}

        {clienteInfoHTML}

        <p className={`placa-card__location ${clienteInfoHTML ? 'placa-card__location--with-client' : ''}`}>
          <i className="fas fa-map-marker-alt"></i>
          <span>{nomeDaRua || 'Endereço não informado'}</span>
        </p>

        <div className="placa-card__footer">
          <span className="placa-card__regiao">{nomeRegiao}</span>
          <div className="placa-card__actions">
            <button
              className={`placa-card__action-button placa-card__action-button--toggle placa-card__action-button--${disponivel ? 'disponivel' : 'indisponivel'}`}
              title={toggleButtonDisabledTitle}
              aria-label={toggleButtonDisabledTitle}
              disabled={toggleButtonDisabled || isToggling}
              onClick={handleToggleClick}
            >
              {isToggling ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${toggleButtonIcon}`}></i>}
            </button>
            <button
              className="placa-card__action-button placa-card__action-button--edit"
              title="Editar"
              aria-label="Editar Placa"
              onClick={handleEditClick}
              disabled={isToggling || isDeleting}
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              className="placa-card__action-button placa-card__action-button--delete"
              title="Apagar"
              aria-label="Apagar Placa"
              onClick={handleDeleteClick}
              disabled={isToggling || isDeleting}
            >
              {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlacaCard;