// src/components/PITable/PITable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ToastNotification/ToastNotification';
import {
    downloadPI_PDF,
    // createContrato, // Removido, pois é tratado pela PIsPage
} from '../../services/api';
import { handleDownload } from '../../utils/helpers';
import Spinner from '../Spinner/Spinner';

// O export é 'function', então a importação com { PIsTable } está correta.
export function PIsTable({ pis, onEdit, onDelete, onGenerateContrato, isGeneratingContrato, processingPIId, onStatusChange }) {
    
    const navigate = useNavigate();
    const showToast = useToast();
    const { user } = useAuth();
    
    const [downloadingId, setDownloadingId] = React.useState(null);
    // O 'isGeneratingContrato' agora é uma prop vinda do 'PIsPage'

    const handleDownloadClick = async (piId) => {
        setDownloadingId(piId);
        try {
            const { blob, filename } = await downloadPI_PDF(piId);
            handleDownload(blob, filename);
        } catch (error) {
            showToast(error.message || 'Erro ao gerar PDF da PI.', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCreateContratoClick = async (piId) => {
        // A lógica de confirmação e mutação agora está na PIsPage
        onGenerateContrato(piId);
    };
    
    if (!pis || pis.length === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" className="table-no-data">
                        Nenhuma proposta interna (PI) encontrada.
                    </td>
                </tr>
            </tbody>
        );
    }

    const formatShortDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yy', { locale: ptBR });
        } catch (e) {
            return 'Inválida';
        }
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ -';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <tbody>
            {pis.map((pi) => {
                const isVencida = pi.status === 'vencida';
                const isConcluida = pi.status === 'concluida';
                
                const isThisPIDownloading = downloadingId === pi._id;
                // Verifica se *esta* PI é a que está gerando um contrato
                const isThisPIProcessingContrato = processingPIId === pi._id;
                // Desabilita botões se CUALQUER download ou geração de contrato estiver ativa
                const isDisabled = isThisPIDownloading || isGeneratingContrato;

                return (
                    <tr key={pi._id} className={isVencida ? 'pi-vencida' : ''}>
                        <td>
                            <span 
                                className={`pi-status-badge pi-status--${pi.status}`}
                            >
                                {pi.status.replace('_', ' ')}
                            </span>
                        </td>
                        <td data-label="Descrição">{pi.descricao}</td>
                        <td data-label="Cliente">{pi.cliente?.nome || 'Cliente não encontrado'}</td>
                        <td data-label="Período">
                            {formatShortDate(pi.dataInicio)} - {formatShortDate(pi.dataFim)}
                        </td>
                        <td data-label="Valor">{formatCurrency(pi.valorTotal)}</td>
                        <td data-label="Ações" className="table-actions">
                            
                            {/* --- CORREÇÃO DO TYPEERROR AQUI --- */}
                            <button 
                                className="table-action-button" 
                                title="Editar PI"
                                onClick={() => onEdit(pi)} // CORRIGIDO: de onEditClick para onEdit
                                disabled={isConcluida || isVencida || isDisabled}
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            {/* --- FIM DA CORREÇÃO --- */}
                            
                            {/* --- CORREÇÃO DO TYPEERROR AQUI --- */}
                            <button 
                                className="table-action-button action-delete" 
                                title="Apagar PI"
                                onClick={() => onDelete(pi)} // CORRIGIDO: de onDeleteClick para onDelete
                                disabled={isDisabled}
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                            {/* --- FIM DA CORREÇÃO --- */}
                            
                            <button 
                                className="table-action-button" 
                                title="Baixar PDF da PI"
                                onClick={() => handleDownloadClick(pi._id)}
                                disabled={isDisabled}
                            >
                                {isThisPIDownloading ? <Spinner mini /> : <i className="fas fa-file-pdf"></i>}
                            </button>

                            <button 
                                className="table-action-button action-contrato" 
                                title="Gerar Contrato"
                                onClick={() => handleCreateContratoClick(pi._id)}
                                disabled={isDisabled} // Desabilita se qualquer ação estiver ocorrendo
                            >
                                {isThisPIProcessingContrato ? <Spinner mini /> : <i className="fas fa-file-signature"></i>}
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

PIsTable.propTypes = {
    pis: PropTypes.array.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onGenerateContrato: PropTypes.func.isRequired,
    isGeneratingContrato: PropTypes.bool,
    processingPIId: PropTypes.string, // ID da PI sendo processada
    onStatusChange: PropTypes.func,
};