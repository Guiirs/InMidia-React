// src/components/PlacaDetailsInfo/PlacaDetailsInfo.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Opcional, mas recomendado para validação de props
import { formatDate } from '../../utils/helpers'; // Importa helper necessário

// Recebe a placa, URLs, status e a função para abrir o modal como props
function PlacaDetailsInfo({
    placa,
    imageUrl,
    placeholderUrl,
    statusText,
    statusClass,
    onOpenAluguelModal,
    clientesCount // Recebe a contagem de clientes
}) {

    // Extrai dados da placa para facilitar o acesso
    const {
        numero_placa,
        nomeDaRua,
        regiao,
        tamanho,
        coordenadas,
        cliente_nome,
        aluguel_data_fim,
        disponivel
    } = placa;

    const nomeRegiao = regiao?.nome || 'N/A';

    return (
        <>
            {/* --- Seção da Imagem --- */}
            <div className="placa-details-page__image-container">
                <img
                    src={imageUrl}
                    alt={`Imagem da Placa ${numero_placa}`}
                    className="placa-details-page__image"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderUrl; }}
                />
            </div>

            {/* --- Seção de Informações --- */}
            <div className="placa-details-page__info-container">
                {/* Cabeçalho */}
                <div className="placa-details-page__header">
                    <h2 className="placa-details-page__numero">{numero_placa}</h2>
                    <span className={`placa-details-page__status ${statusClass}`}>{statusText}</span>
                </div>

                {/* Grelha de Informações */}
                <div className="placa-details-page__info-grid">
                    <div className="placa-details-page__info-item">
                        <span className="placa-details-page__info-label">Localização</span>
                        <p className="placa-details-page__info-value">{nomeDaRua || 'N/A'}</p>
                    </div>
                    <div className="placa-details-page__info-item">
                        <span className="placa-details-page__info-label">Região</span>
                        <p className="placa-details-page__info-value">{nomeRegiao}</p>
                    </div>
                    <div className="placa-details-page__info-item">
                        <span className="placa-details-page__info-label">Tamanho</span>
                        <p className="placa-details-page__info-value">{tamanho || 'N/A'}</p>
                    </div>
                    <div className="placa-details-page__info-item">
                        <span className="placa-details-page__info-label">Coordenadas</span>
                        <p className="placa-details-page__info-value">{coordenadas || 'N/A'}</p>
                    </div>
                    {/* Exibe cliente atual se existir */}
                    {cliente_nome && (
                        <div className="placa-details-page__info-item">
                            <span className="placa-details-page__info-label">Cliente Atual</span>
                            <p className="placa-details-page__info-value">{cliente_nome} (até {formatDate(aluguel_data_fim)})</p>
                        </div>
                    )}
                </div>

                {/* Ações (Botão Alugar) */}
                <div className="placa-details-page__actions">
                    <button
                        id="alugar-placa-btn" // Mantém ID se necessário para testes/estilos específicos
                        className="placa-details-page__alugar-button"
                        onClick={onOpenAluguelModal} // Chama a função passada via props
                        disabled={!disponivel || clientesCount === 0}
                        title={!disponivel ? 'Placa indisponível' : (clientesCount === 0 ? 'Nenhum cliente cadastrado' : 'Alugar esta placa')}
                    >
                        <i className="fas fa-calendar-plus"></i>
                        {/* Texto do botão baseado na disponibilidade */}
                        {disponivel ? 'Alugar esta Placa' : statusText}
                    </button>
                </div>
            </div>
        </>
    );
}

// Opcional: Define PropTypes para validação
PlacaDetailsInfo.propTypes = {
    placa: PropTypes.shape({
        numero_placa: PropTypes.string,
        nomeDaRua: PropTypes.string,
        regiao: PropTypes.shape({ nome: PropTypes.string }),
        tamanho: PropTypes.string,
        coordenadas: PropTypes.string,
        cliente_nome: PropTypes.string,
        aluguel_data_fim: PropTypes.string,
        disponivel: PropTypes.bool,
        imagem: PropTypes.string // Adicionado para cálculo de imageUrl
    }).isRequired,
    imageUrl: PropTypes.string.isRequired,
    placeholderUrl: PropTypes.string.isRequired,
    statusText: PropTypes.string.isRequired,
    statusClass: PropTypes.string.isRequired,
    onOpenAluguelModal: PropTypes.func.isRequired,
    clientesCount: PropTypes.number.isRequired,
};


export default PlacaDetailsInfo;