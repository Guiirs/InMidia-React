// src/pages/Contratos/ContratosPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContratos, updateContrato, deleteContrato, downloadContrato_PDF } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import ContratoTable from '../../components/ContratoTable/ContratoTable';
import ContratoStatusModal from '../../components/ContratoStatusModal/ContratoStatusModal';
import { saveAs } from 'file-saver';
import './ContratosPage.css'; // Importa o novo CSS

// Chave da query para o React Query
const contratosQueryKey = (filters, page) => ['contratos', filters, page];

function ContratosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContrato, setEditingContrato] = useState(null);
    const [filters, setFilters] = useState({ status: 'todos', clienteId: 'todos' });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const showToast = useToast();
    const showConfirmation = useConfirmation();
    const queryClient = useQueryClient();

    // --- Query: Buscar Contratos ---
    const {
        data: contratoData,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: contratosQueryKey(filters, currentPage),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                sortBy: 'createdAt',
                order: 'desc'
            });
            if (filters.status !== 'todos') params.append('status', filters.status);
            if (filters.clienteId !== 'todos') params.append('clienteId', filters.clienteId);
            return fetchContratos(params);
        },
        placeholderData: (prev) => prev,
    });

    const contratos = contratoData?.data ?? [];
    const pagination = contratoData?.pagination ?? { currentPage: 1, totalPages: 1 };

    // --- Mutações ---
    const [actionState, setActionState] = useState({
        isDeleting: null,
        isDownloading: null,
    });

    // Update (Mudar Status)
    const updateContratoMutation = useMutation({
        mutationFn: (vars) => updateContrato(vars.id, vars.data),
        onSuccess: () => {
            showToast('Status do contrato atualizado!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['contratos'] });
        },
        onError: (error) => {
            showToast(error.message || 'Erro ao atualizar status.', 'error');
        }
    });

    // Delete
    const deleteContratoMutation = useMutation({
        mutationFn: deleteContrato,
        onMutate: (contratoId) => setActionState(s => ({ ...s, isDeleting: { contratoId } })),
        onSuccess: () => {
            showToast('Contrato apagado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['contratos'] });
        },
        onError: (error) => showToast(error.message || 'Erro ao apagar contrato.', 'error'),
        onSettled: () => setActionState(s => ({ ...s, isDeleting: null }))
    });

    // Download PDF
    const downloadContratoMutation = useMutation({
        mutationFn: downloadContrato_PDF,
        onMutate: (contratoId) => setActionState(s => ({ ...s, isDownloading: { contratoId } })),
        onSuccess: (data) => {
            saveAs(data.blob, data.filename);
            showToast('Download do contrato iniciado!', 'success');
        },
        onError: (error) => showToast(error.message || 'Erro ao baixar PDF.', 'error'),
        onSettled: () => setActionState(s => ({ ...s, isDownloading: null }))
    });

    // --- Handlers ---
    const openEditModal = (contrato) => { setEditingContrato(contrato); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingContrato(null); };

    // Submit do Modal de Status
    const onModalSubmit = (data) => {
        if (editingContrato) {
            updateContratoMutation.mutate({ id: editingContrato._id, data: { status: data.status } });
        }
    };

    // Delete
    const onDeleteClick = async (contrato) => {
        try {
            await showConfirmation({
                message: `Tem a certeza que deseja apagar o contrato do cliente "${contrato.cliente.nome}"? (Apenas rascunhos podem ser apagados).`,
                title: "Confirmar Exclusão",
                confirmButtonType: "red",
            });
            deleteContratoMutation.mutate(contrato._id);
        } catch (error) { /* Cancelado */ }
    };

    // Download PDF
    const onDownloadPDF = (contrato) => downloadContratoMutation.mutate(contrato._id);

    // --- Renderização ---
    const colSpan = 7; // Ajuste o número de colunas

    const renderTableContent = () => {
        if (isLoading) {
            return <tr><td colSpan={colSpan}><Spinner message="A carregar contratos..." /></td></tr>;
        }
        if (isError) {
            return <tr><td colSpan={colSpan} className="text-center error-message">Erro: {error.message}</td></tr>;
        }
        if (contratos.length === 0) {
            return <tr><td colSpan={colSpan} className="text-center">Nenhum contrato encontrado.</td></tr>;
        }
        return (
            <ContratoTable
                contratos={contratos}
                onEditStatusClick={openEditModal}
                onDeleteClick={onDeleteClick}
                onDownloadPDF={onDownloadPDF}
                isDeleting={actionState.isDeleting}
                isDownloading={actionState.isDownloading}
            />
        );
    };

    return (
        // Usamos o 'pis-page' como classe base para reutilizar estilos
        <div className="pis-page"> 
            
            {/* TODO: Adicionar Filtros (similar a PIsPage) */}
            
            <div className="pis-page__table-wrapper">
                <table className="pis-page__table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>PI (Valor)</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>Status</th>
                            <th>Criado Em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>

            {/* TODO: Adicionar Paginação (similar a PIsPage) */}

            <Modal
                title="Alterar Status do Contrato"
                isOpen={isModalOpen}
                onClose={closeModal}
            >
                <ContratoStatusModal
                    onSubmit={onModalSubmit}
                    onClose={closeModal}
                    isSubmitting={updateContratoMutation.isPending}
                    initialData={editingContrato}
                />
            </Modal>
        </div>
    );
}

export default ContratosPage;