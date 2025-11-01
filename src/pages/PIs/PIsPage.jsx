// src/pages/PIs/PIsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPI, deletePI, fetchPIs, updatePI, createContrato } from '../../services/api'; // Adicionado createContrato
// import { usePlacaFilters } from '../../hooks/usePlacaFilters'; // <-- IMPORT REMOVIDO
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';

import Modal from '../../components/Modal/Modal';
import { PIsTable } from '../../components/PITable/PITable';
import PIModalForm from '../../components/PIModalForm/PIModalForm';
import Spinner from '../../components/Spinner/Spinner';

import './PIs.css'; // O seu CSS original é importado aqui
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const pisQueryKey = 'pis';

function PIsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPI, setEditingPI] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        clienteId: '',
        sortBy: 'createdAt',
        order: 'desc',
    });

    const showToast = useToast();
    const showConfirmation = useConfirmation();
    const queryClient = useQueryClient();

    // O hook 'usePlacaFilters' foi removido.

    // --- Data Fetching ---
    const { data: piData, isLoading, isError, error } = useQuery({
        queryKey: [pisQueryKey, currentPage, filters],
        queryFn: () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...filters,
            });
            if (!filters.status) params.delete('status');
            if (!filters.clienteId) params.delete('clienteId');
            return fetchPIs(params);
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60, // 1 minuto
    });

    const pis = piData?.data || [];
    const pagination = piData?.pagination || { currentPage: 1, totalPages: 1 };

    // --- Mutações ---
    const handleApiError = (error, context, setErrorFn) => {
        const apiErrors = error.response?.data?.errors;
        if (apiErrors && setErrorFn) {
            Object.keys(apiErrors).forEach((fieldName) => {
                setErrorFn(fieldName, { type: 'api', message: apiErrors[fieldName] });
            });
        }
        showToast(error.message || 'Ocorreu um erro', 'error');
    };

    const createPIMutation = useMutation({
        mutationFn: createPI,
        onSuccess: () => {
            showToast('Proposta criada com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: [pisQueryKey] });
        },
        onError: (error, vars, context) => handleApiError(error, context, vars.setModalError)
    });

    const updatePIMutation = useMutation({
        mutationFn: (vars) => updatePI(vars.id, vars.data),
        onSuccess: () => {
            showToast('Proposta atualizada com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: [pisQueryKey] });
        },
        onError: (error, vars, context) => handleApiError(error, context, vars.setModalError)
    });
    
    // Mutação para Gerar Contrato (passada para a tabela)
    const createContratoMutation = useMutation({
        mutationFn: createContrato, // Usando a função importada da api.js
        onSuccess: (data) => {
            showToast('Contrato gerado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['contratos'] }); // Invalida a query de contratos
        },
        onError: (error) => handleApiError(error)
    });

    const deletePIMutation = useMutation({
        mutationFn: deletePI,
        onSuccess: () => {
            showToast('Proposta apagada com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: [pisQueryKey] });
        },
        onError: (error) => showToast(error.message || 'Erro ao apagar proposta.', 'error')
    });

    // --- Handlers ---
    const openAddModal = () => {
        setEditingPI(null);
        setIsModalOpen(true);
    };
    
    const openEditModal = (pi) => {
        setEditingPI(pi);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPI(null);
    };

    const onModalSubmit = (data, setModalError) => {
        // Validação simples para dataFim (evita erro de data)
        if (!data.dataFim || new Date(data.dataFim) < new Date(data.dataInicio)) {
             if (setModalError) {
                setModalError('dataFim', { type: 'manual', message: 'Data final deve ser após a data inicial.' });
            } else {
                showToast('Data final deve ser após a data inicial.', 'error');
            }
            return; 
        }

        const piData = {
            ...data,
            dataInicio: format(new Date(data.dataInicio + 'T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            dataFim: format(new Date(data.dataFim + 'T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            valorTotal: Number(data.valorTotal),
        };
        
        if (editingPI) {
            updatePIMutation.mutate({ id: editingPI._id, data: piData, setModalError });
        } else {
            createPIMutation.mutate({ ...piData, setModalError });
        }
    };

    const onDeleteClick = async (pi) => {
        try {
            await showConfirmation({
                message: `Tem a certeza que deseja apagar a PI "${pi.descricao}"? Esta ação não pode ser revertida.`,
                title: "Confirmar Exclusão",
                confirmButtonType: "red",
            });
            deletePIMutation.mutate(pi._id);
        } catch (error) { /* Cancelado */ }
    };
    
    const onGenerateContratoClick = async (piId) => {
         try {
            await showConfirmation({
                message: `Gerar um contrato a partir desta PI? Esta ação não pode ser revertida.`,
                title: "Confirmar Geração de Contrato",
                confirmText: "Gerar Contrato",
            });
            createContratoMutation.mutate(piId);
        } catch (error) { /* Cancelado */ }
    };
    
    const isMutating = createPIMutation.isPending || updatePIMutation.isPending;
    const isGeneratingContrato = createContratoMutation.isPending;

    return (
        <div className="pis-page">
            <div className="pis-page__controls">
                <button className="pis-page__add-button" onClick={openAddModal}>
                    <i className="fas fa-plus"></i> Criar Nova PI
                </button>
            </div>

            {isLoading && <Spinner message="A carregar propostas..." />}
            {isError && <div className="error-message">Erro ao carregar propostas: {error.message}</div>}
            
            {/* --- CORREÇÃO DE HTML: Adicionado <table> e <thead> --- */}
            {!isLoading && !isError && (
                <div className="table-wrapper"> {/* Mantém o wrapper para scroll */}
                    <table className="pis-page__table"> {/* Tag <table> obrigatória */}
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Descrição</th>
                                <th>Cliente</th>
                                <th>Período</th>
                                <th>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        {/* PITable renderiza o <tbody> */}
                        <PIsTable
                            pis={pis}
                            onEdit={openEditModal}
                            onDelete={onDeleteClick}
                            onGenerateContrato={onGenerateContratoClick} 
                            isGeneratingContrato={isGeneratingContrato}
                            // Passando o ID da PI que está sendo processada
                            processingPIId={createContratoMutation.isPending ? createContratoMutation.variables : null}
                        />
                    </table>
                </div>
            )}
            {/* --- FIM DA CORREÇÃO DE HTML --- */}
            
            {/* TODO: Paginação */}

            <Modal
                title={editingPI ? 'Editar Proposta Interna (PI)' : 'Criar Nova Proposta Interna (PI)'}
                isOpen={isModalOpen}
                onClose={closeModal}
                isLarge={true} 
            >
                <PIModalForm
                    onSubmit={onModalSubmit}
                    onClose={closeModal}
                    isSubmitting={isMutating}
                    initialData={editingPI || {}}
                />
            </Modal>
        </div>
    );
}

export default PIsPage;