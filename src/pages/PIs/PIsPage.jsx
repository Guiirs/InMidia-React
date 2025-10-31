// src/pages/PIs/PIsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPIs, createPI, updatePI, deletePI, downloadPI_PDF, createContrato, downloadContrato_PDF } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext'; 
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import PITable from '../../components/PITable/PITable';
import PIModalForm from '../../components/PIModalForm/PIModalForm';
import { saveAs } from 'file-saver'; 
import './PIs.css';

const pisQueryKey = (filters, page) => ['pis', filters, page];

function PIsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPI, setEditingPI] = useState(null);
    const [filters, setFilters] = useState({ status: 'todos', clienteId: 'todos' });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const showToast = useToast();
    const showConfirmation = useConfirmation();
    const queryClient = useQueryClient();

    // --- Queries ---
    const {
        data: piData,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: pisQueryKey(filters, currentPage),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                sortBy: 'createdAt',
                order: 'desc'
            });
            if (filters.status !== 'todos') params.append('status', filters.status);
            if (filters.clienteId !== 'todos') params.append('clienteId', filters.clienteId);
            return fetchPIs(params); // Esta chamada agora busca 'formaPagamento' e 'placas' (IDs)
        },
        placeholderData: (prev) => prev,
    });
    
    const pis = piData?.data ?? []; 
    const pagination = piData?.pagination ?? { currentPage: 1, totalPages: 1 };

    // --- Mutações ---
    const [actionState, setActionState] = useState({ 
        isDeleting: null, 
        isDownloading: null, 
        isCreatingContrato: null 
    });

    // Criar PI
    const createPIMutation = useMutation({
        mutationFn: createPI,
        onSuccess: () => {
            showToast('PI criada com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['pis'] });
        },
        onError: (error, _variables, context) => {
            const setModalError = context?.setModalError; 
            const apiErrors = error.response?.data?.errors; 
            if (apiErrors && setModalError) {
                try {
                    Object.keys(apiErrors).forEach((fieldName) => {
                        setModalError(fieldName, { 
                            type: 'api', 
                            message: apiErrors[fieldName] 
                        });
                    });
                } catch (e) {
                     console.error("Erro ao tentar mapear erros da API:", e);
                }
            }
            showToast(error.message || 'Erro ao criar PI.', 'error');
        }
    });

    // Update PI
    const updatePIMutation = useMutation({
        mutationFn: (vars) => updatePI(vars.id, vars.data),
        onSuccess: () => {
            showToast('PI atualizada com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['pis'] });
        },
        onError: (error, _variables, context) => { 
            const setModalError = context?.setModalError;
            const apiErrors = error.response?.data?.errors;
            if (apiErrors && setModalError) {
                 Object.keys(apiErrors).forEach((fieldName) => {
                    setModalError(fieldName, { type: 'api', message: apiErrors[fieldName] });
                });
            }
            showToast(error.message || 'Erro ao atualizar PI.', 'error');
        }
    });
    
    // Delete PI
    const deletePIMutation = useMutation({
        mutationFn: deletePI,
        onMutate: (piId) => setActionState(s => ({ ...s, isDeleting: { piId } })),
        onSuccess: () => {
            showToast('PI apagada com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['pis'] });
        },
        onError: (error) => showToast(error.message || 'Erro ao apagar PI.', 'error'),
        onSettled: () => setActionState(s => ({ ...s, isDeleting: null }))
    });

    // Download PI
    const downloadPIMutation = useMutation({
        mutationFn: downloadPI_PDF,
        onMutate: (piId) => setActionState(s => ({ ...s, isDownloading: { piId } })),
        onSuccess: (data) => {
            saveAs(data.blob, data.filename);
            showToast('Download da PI iniciado!', 'success');
        },
        onError: (error) => showToast(error.message || 'Erro ao baixar PDF da PI.', 'error'),
        onSettled: () => setActionState(s => ({ ...s, isDownloading: null }))
    });
    
    // Download Contrato
    const downloadContratoMutation = useMutation({
        mutationFn: downloadContrato_PDF,
        onSuccess: (data) => saveAs(data.blob, data.filename),
        onError: (error) => showToast(error.message || 'Erro ao baixar PDF do contrato.', 'error')
    });

    // Create Contrato
    const createContratoMutation = useMutation({
        mutationFn: createContrato,
        onMutate: (piId) => setActionState(s => ({ ...s, isCreatingContrato: { piId } })),
        onSuccess: (data) => {
            showToast('Contrato criado com sucesso!', 'success');
            downloadContratoMutation.mutate(data.id); 
        },
        onError: (error) => showToast(error.message || 'Erro ao criar contrato.', 'error'),
        onSettled: () => setActionState(s => ({ ...s, isCreatingContrato: null }))
    });


    // --- Handlers ---
    const openAddModal = () => { setEditingPI(null); setIsModalOpen(true); };
    const openEditModal = (pi) => { setEditingPI(pi); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingPI(null); };

    // Submit
    const onModalSubmit = (data, setModalError) => {
        const mutationOptions = { context: { setModalError } };
        
        if (editingPI) {
            updatePIMutation.mutate({ id: editingPI._id, data }, mutationOptions);
        } else {
            createPIMutation.mutate(data, mutationOptions);
        }
    };
    
    // Delete
    const onDeleteClick = async (pi) => {
         try {
            await showConfirmation({
                message: `Tem a certeza que deseja apagar a PI para "${pi.cliente.nome}"?`,
                title: "Confirmar Exclusão",
                confirmButtonType: "red",
            });
            deletePIMutation.mutate(pi._id);
         } catch (error) { /* Cancelado */ }
    };
    
    // Download PI
    const onDownloadPI = (pi) => downloadPIMutation.mutate(pi._id);
    
    // Create Contrato
    const onCreateContrato = (pi) => createContratoMutation.mutate(pi._id);

    // --- Renderização ---
    // --- ALTERAÇÃO AQUI --- (colSpan atualizado para 9)
    const newColSpan = 9;
    
    const renderTableContent = () => {
        if (isLoading) {
            return <tr><td colSpan={newColSpan}><Spinner message="A carregar PIs..." /></td></tr>;
        }
        if (isError) {
            return <tr><td colSpan={newColSpan} className="text-center error-message">Erro: {error.message}</td></tr>;
        }
        if (pis.length === 0) {
            return <tr><td colSpan={newColSpan} className="text-center">Nenhuma PI encontrada.</td></tr>;
        }
        return (
            <PITable
                pis={pis} // 'pis' agora contém 'formaPagamento' e 'placas' (array de IDs)
                onEditClick={openEditModal}
                onDeleteClick={onDeleteClick}
                onDownloadPI={onDownloadPI}
                onCreateContrato={onCreateContrato}
                isDeleting={actionState.isDeleting}
                isDownloading={actionState.isDownloading}
                isCreatingContrato={actionState.isCreatingContrato}
            />
        );
    };

    return (
        <div className="pis-page">
            <div className="pis-page__controls">
                <button className="pis-page__add-button" onClick={openAddModal}>
                    <i className="fas fa-plus"></i> Adicionar PI
                </button>
            </div>

            <div className="pis-page__table-wrapper">
                <table className="pis-page__table">
                    <thead>
                        {/* --- ALTERAÇÃO AQUI --- (Novas colunas) */}
                        <tr>
                            <th>Cliente</th>
                            <th>Período</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>Valor</th>
                            <th>Qtd. Placas</th> {/* Nova Coluna */}
                            <th>Pagamento</th>   {/* Nova Coluna */}
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                        {/* ------------------------------- */}
                    </thead>
                    {renderTableContent()}
                </table>
            </div>
            
            {/* TODO: Adicionar Paginação (similar a PlacasPage) */}

            <Modal
                title={editingPI ? 'Editar Proposta (PI)' : 'Adicionar Nova PI'}
                isOpen={isModalOpen}
                onClose={closeModal}
            >
                <PIModalForm
                    onSubmit={onModalSubmit}
                    onClose={closeModal}
                    isSubmitting={createPIMutation.isPending || updatePIMutation.isPending}
                    // 'editingPI' agora contém 'formaPagamento' e 'placas' (IDs)
                    initialData={editingPI || {}} 
                />
            </Modal>
        </div>
    );
}

export default PIsPage;