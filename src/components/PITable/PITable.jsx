// src/components/PITable/PITable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/helpers'; // Importa seu helper de data

// Componente puro para exibir a tabela de PIs
function PITable({ 
    pis, 
    onEditClick, 
    onDeleteClick, 
    onDownloadPI, 
    onCreateContrato, 
    isDeleting, 
    isDownloading,
    isCreatingContrato 
}) {

    // Helper para classes CSS do status
    const getStatusClass = (status) => {
        if (status === 'concluida') return 'status-badge--concluida';
        if (status === 'vencida') return 'status-badge--vencida';
        return 'status-badge--em-andamento';
    };
    
    // Helper para texto do status
    const getStatusText = (status) => {
         if (status === 'concluida') return 'Concluída';
         if (status === 'vencida') return 'Vencida';
         return 'Em Andamento';
    };

    return (
        <tbody>
            {pis.map(pi => {
                // Controla o estado de loading por linha
                const isThisOneDeleting = isDeleting && isDeleting.piId === pi._id;
                const isThisOneDownloading = isDownloading && isDownloading.piId === pi._id;
                const isThisOneCreatingContrato = isCreatingContrato && isCreatingContrato.piId === pi._id;
                
                // Desabilita todas as ações na linha se uma estiver em progresso
                const disableActions = isThisOneDeleting || isThisOneDownloading || isThisOneCreatingContrato;

                return (
                    <tr key={pi._id}>
                        {/* 'pi.cliente' é populado com 'nome' pelo 'getAll' */}
                        <td>{pi.cliente?.nome || 'Cliente Apagado'}</td>
                        <td>{pi.tipoPeriodo === 'quinzenal' ? 'Quinzenal' : 'Mensal'}</td>
                        <td>{formatDate(pi.dataInicio)}</td>
                        <td>{formatDate(pi.dataFim)}</td>
                        <td>R$ {pi.valorTotal.toFixed(2)}</td>

                        {/* --- ALTERAÇÃO AQUI --- (Novas colunas) */}
                        {/* 'pi.placas' é um array de IDs, graças à correção no piService */}
                        <td>{pi.placas?.length || 0}</td>
                        <td>{pi.formaPagamento || '-'}</td>
                        {/* ------------------------------- */}

                        <td>
                            <span className={`status-badge ${getStatusClass(pi.status)}`}>
                                {getStatusText(pi.status)}
                            </span>
                        </td>
                        <td className="pis-page__actions"> 
                            {/* Botão Gerar Contrato */}
                            <button
                                className="pis-page__action-button pis-page__action-button--contrato"
                                title="Gerar Contrato"
                                onClick={() => onCreateContrato(pi)}
                                disabled={disableActions}
                            >
                                {isThisOneCreatingContrato ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-signature"></i>}
                            </button>
                            {/* Botão Download PDF da PI */}
                            <button
                                className="pis-page__action-button pis-page__action-button--download"
                                title="Baixar PDF da PI"
                                onClick={() => onDownloadPI(pi)}
                                disabled={disableActions}
                            >
                                {isThisOneDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                            </button>
                            {/* Botão Editar PI */}
                            <button
                                className="pis-page__action-button pis-page__action-button--edit"
                                title="Editar PI"
                                onClick={() => onEditClick(pi)}
                                disabled={disableActions}
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            {/* Botão Apagar PI */}
                            <button
                                className="pis-page__action-button pis-page__action-button--delete"
                                title="Apagar PI"
                                onClick={() => onDeleteClick(pi)}
                                disabled={disableActions}
                            >
                                {isThisOneDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

PITable.propTypes = {
    pis: PropTypes.array.isRequired,
    onEditClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    onDownloadPI: PropTypes.func.isRequired,
    onCreateContrato: PropTypes.func.isRequired,
    isDeleting: PropTypes.object,
    isDownloading: PropTypes.object,
    isCreatingContrato: PropTypes.object,
};

export default PITable;