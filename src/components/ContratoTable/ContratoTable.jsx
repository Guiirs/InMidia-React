// src/components/ContratoTable/ContratoTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/helpers';

function ContratoTable({
    contratos,
    onEditStatusClick,
    onDeleteClick,
    onDownloadPDF,
    isDeleting,
    isDownloading
}) {

    const getStatusClass = (status) => {
        switch (status) {
            case 'ativo': return 'status-badge--ativo'; // Crie esta classe CSS
            case 'concluido': return 'status-badge--concluida';
            case 'cancelado': return 'status-badge--vencida'; // Reutiliza o estilo de 'vencida'
            case 'rascunho':
            default:
                return 'status-badge--em-andamento'; // Reutiliza o estilo de 'em-andamento'
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ativo': return 'Ativo';
            case 'concluido': return 'Concluído';
            case 'cancelado': return 'Cancelado';
            case 'rascunho':
            default:
                return 'Rascunho';
        }
    };

    return (
        <tbody>
            {contratos.map(contrato => {
                const isThisOneDeleting = isDeleting && isDeleting.contratoId === contrato._id;
                const isThisOneDownloading = isDownloading && isDownloading.contratoId === contrato._id;
                const disableActions = isThisOneDeleting || isThisOneDownloading;
                
                // Os campos 'cliente' e 'pi' são populados seletivamente pelo backend
                const clienteNome = contrato.cliente?.nome || 'Cliente Apagado';
                const piValor = contrato.pi?.valorTotal || 0;
                const piDataInicio = contrato.pi?.dataInicio ? formatDate(contrato.pi.dataInicio) : '-';
                const piDataFim = contrato.pi?.dataFim ? formatDate(contrato.pi.dataFim) : '-';

                return (
                    <tr key={contrato._id}>
                        <td>{clienteNome}</td>
                        <td>R$ {piValor.toFixed(2)}</td>
                        <td>{piDataInicio}</td>
                        <td>{piDataFim}</td>
                        <td>
                            <span className={`status-badge ${getStatusClass(contrato.status)}`}>
                                {getStatusText(contrato.status)}
                            </span>
                        </td>
                        <td>{formatDate(contrato.createdAt)}</td>
                        <td className="pis-page__actions">
                            {/* Download PDF do Contrato */}
                            <button
                                className="pis-page__action-button pis-page__action-button--download"
                                title="Baixar PDF do Contrato"
                                onClick={() => onDownloadPDF(contrato)}
                                disabled={disableActions}
                            >
                                {isThisOneDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                            </button>
                            {/* Editar Status */}
                            <button
                                className="pis-page__action-button pis-page__action-button--edit"
                                title="Alterar Status"
                                onClick={() => onEditStatusClick(contrato)}
                                disabled={disableActions}
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            {/* Apagar Contrato (se for rascunho) */}
                            {contrato.status === 'rascunho' && (
                                <button
                                    className="pis-page__action-button pis-page__action-button--delete"
                                    title="Apagar Rascunho"
                                    onClick={() => onDeleteClick(contrato)}
                                    disabled={disableActions}
                                >
                                    {isThisOneDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                                </button>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

ContratoTable.propTypes = {
    contratos: PropTypes.array.isRequired,
    onEditStatusClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    onDownloadPDF: PropTypes.func.isRequired,
    isDeleting: PropTypes.object,
    isDownloading: PropTypes.object,
};

export default ContratoTable;