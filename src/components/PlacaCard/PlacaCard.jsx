// src/components/PlacaCard/PlacaCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, formatDate } from '../../utils/helpers'; // Importa helpers
import './PlacaCard.css'; // Importa CSS

// Função auxiliar movida para dentro ou fora do componente, conforme preferência
function getStatusInfo(placa) {
  const { disponivel, cliente_nome, aluguel_data_fim } = placa;
  let statusText = '';
  let statusClass = '';
  let clienteInfoHTML = null; // Usar JSX ou null em vez de string HTML
  let toggleButtonDisabled = false;

  if (cliente_nome && aluguel_data_fim) {
    statusText = 'Alugada';
    statusClass = 'placa-card__status--alugada';
    toggleButtonDisabled = true;
    const dataFimFormatada = formatDate(aluguel_data_fim); // Usa helper

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

// O componente recebe props: placa (objeto) e funções para as ações
function PlacaCard({ placa, onToggle, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { _id, id, numero_placa, nomeDaRua, imagem, regiao, disponivel } = placa;
  // Usa _id se id não estiver presente (para compatibilidade inicial)
  const placaId = id || _id;


  const placeholderUrl = '/assets/img/placeholder.png'; // Caminho relativo a /public
  const imageUrl = getImageUrl(imagem, placeholderUrl);

  const {
    statusText,
    statusClass,
    clienteInfoHTML, // Agora é JSX ou null
    toggleButtonIcon,
    toggleButtonTitle,
    toggleButtonDisabled,
    toggleButtonDisabledTitle
  } = getStatusInfo(placa);

    // Acessa o nome da região (pode ser string ou objeto populado)
  const nomeRegiao = (typeof regiao === 'object' && regiao?.nome) ? regiao.nome : (regiao || 'Sem região');

  const handleCardClick = (e) => {
    // Navega apenas se o clique NÃO foi num botão de ação
    if (!e.target.closest('button')) {
        if(placaId) {
            navigate(`/placas/${placaId}`);
        } else {
            console.error("ID da placa ausente no card:", placa);
            // Opcional: mostrar toast de erro
        }
    }
  };

  // Handlers para os botões de ação que chamam as props passadas
  const handleToggleClick = (e) => {
    e.stopPropagation(); // Impede que o clique no botão navegue no card
    if (onToggle && placaId) onToggle(placaId, e.currentTarget); // Passa o elemento botão
  };
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit && placaId) onEdit(placaId);
  };
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && placaId) onDelete(placaId, e.currentTarget); // Passa o elemento botão
  };


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
        <div className="placa-card__header">
          <h3 className="placa-card__numero">{numero_placa || 'N/A'}</h3>
          <span className={`placa-card__status ${statusClass}`}>{statusText}</span>
        </div>

        {/* Renderiza o JSX do clienteInfoHTML */}
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
              disabled={toggleButtonDisabled}
              onClick={handleToggleClick} // Chama o handler
            >
              <i className={`fas ${toggleButtonIcon}`}></i>
            </button>
            <button
              className="placa-card__action-button placa-card__action-button--edit"
              title="Editar"
              aria-label="Editar Placa"
              onClick={handleEditClick} // Chama o handler
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              className="placa-card__action-button placa-card__action-button--delete"
              title="Apagar"
              aria-label="Apagar Placa"
              onClick={handleDeleteClick} // Chama o handler
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlacaCard;