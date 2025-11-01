// src/pages/Clientes/ClientesPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import './Clientes.css';

const clientesQueryKey = 'clientes'; // Chave de query

function ClientesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    // TODO: Adicionar estado de paginação
    const [currentPage, setCurrentPage] = useState(1);
    
    const showToast = useToast();
    const showConfirmation = useConfirmation();
    const queryClient = useQueryClient();

    // --- Formulário ---
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors: formErrors }
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            nome: '',
            email: '',
            telefone: '',
            cnpj: '',
            endereco: '',
            bairro: '',
            cidade: '',
            responsavel: '', // Adicionado
            segmento: ''      // Adicionado
        }
    });

    // Resetar o form quando o modal abrir
    useEffect(() => {
        if (isModalOpen) {
            reset(editingCliente || { 
                nome: '', 
                email: '', 
                telefone: '', 
                cnpj: '', 
                endereco: '', 
                bairro: '', 
                cidade: '',
                responsavel: '', // Adicionado
                segmento: ''      // Adicionado
            });
        }
    }, [isModalOpen, editingCliente, reset]);


    // --- [CORREÇÃO APLICADA AQUI] ---
    const { data: clientes, isLoading, isError, error } = useQuery({
        queryKey: [clientesQueryKey, currentPage], // Depende da página
        queryFn: () => fetchClientes(new URLSearchParams({ page: currentPage, limit: 10 })), // Passa params
        
        // --- ESTA É A CORREÇÃO PRINCIPAL ---
        // Verifica se a API retornou um array (ex: /clientes)
        // ou um objeto de paginação (ex: /clientes?page=1)
        select: (data) => Array.isArray(data) ? data : (data.data ?? []),
        
        // O placeholder deve ser um array, para corresponder ao que 'select' retorna.
        placeholderData: [] 
    });
    // 'clientes' agora é diretamente o array de clientes.

    const handleApiError = (error, context) => {
        const apiErrors = error.response?.data?.errors;
        if (apiErrors) {
            Object.keys(apiErrors).forEach((fieldName) => {
                setError(fieldName, { type: 'api', message: apiErrors[fieldName] });
            });
        }
        showToast(error.message || 'Ocorreu um erro', 'error');
    };

    const createClienteMutation = useMutation({
        mutationFn: createCliente,
        onSuccess: () => {
            showToast('Cliente criado com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: [clientesQueryKey] });
        },
        onError: handleApiError
    });

    const updateClienteMutation = useMutation({
        mutationFn: (vars) => updateCliente(vars.id, vars.data),
        onSuccess: () => {
            showToast('Cliente atualizado com sucesso!', 'success');
            closeModal();
            queryClient.invalidateQueries({ queryKey: [clientesQueryKey] });
        },
        onError: handleApiError
    });

    const deleteClienteMutation = useMutation({
        mutationFn: deleteCliente,
        onSuccess: () => {
            showToast('Cliente apagado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: [clientesQueryKey] });
        },
        onError: (error) => showToast(error.message || 'Erro ao apagar cliente.', 'error')
    });

    // --- Handlers ---
    const openAddModal = () => { setEditingCliente(null); setIsModalOpen(true); };
    const openEditModal = (cliente) => { setEditingCliente(cliente); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingCliente(null); };

    const onModalSubmit = (data) => {
        if (editingCliente) {
            updateClienteMutation.mutate({ id: editingCliente._id, data });
        } else {
            createClienteMutation.mutate(data);
        }
    };

    const onDeleteClick = async (cliente) => {
        try {
            await showConfirmation({
                message: `Tem a certeza que deseja apagar o cliente "${cliente.nome}"? Esta ação não pode ser revertida.`,
                title: "Confirmar Exclusão",
                confirmButtonType: "red",
            });
            deleteClienteMutation.mutate(cliente._id);
        } catch (error) { /* Cancelado */ }
    };

    // --- Renderização ---
    const renderTableContent = () => {
        if (isLoading) {
            return <tr><td colSpan="5"><Spinner message="A carregar clientes..." /></td></tr>;
        }
        if (isError) {
            return <tr><td colSpan="5" className="text-center error-message">Erro: {error.message}</td></tr>;
        }
        if (clientes.length === 0) {
            return <tr><td colSpan="5" className="text-center">Nenhum cliente encontrado.</td></tr>;
        }
        return clientes.map(cliente => (
            <tr key={cliente._id}>
                <td>{cliente.nome}</td>
                <td>{cliente.email}</td>
                <td>{cliente.telefone || '-'}</td>
                <td>{cliente.cnpj || '-'}</td>
                <td className="clientes-page__actions">
                    <button
                        className="clientes-page__action-button clientes-page__action-button--edit"
                        title="Editar"
                        onClick={() => openEditModal(cliente)}
                    >
                        <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                        className="clientes-page__action-button clientes-page__action-button--delete"
                        title="Apagar"
                        onClick={() => onDeleteClick(cliente)}
                        disabled={deleteClienteMutation.isPending && deleteClienteMutation.variables === cliente._id}
                    >
                        {deleteClienteMutation.isPending && deleteClienteMutation.variables === cliente._id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fas fa-trash"></i>
                        )}
                    </button>
                </td>
            </tr>
        ));
    };

    const isSubmitting = createClienteMutation.isPending || updateClienteMutation.isPending;

    return (
        <div className="clientes-page">
            <div className="clientes-page__controls">
                <button className="clientes-page__add-button" onClick={openAddModal}>
                    <i className="fas fa-plus"></i> Adicionar Cliente
                </button>
            </div>

            <div className="clientes-page__table-wrapper">
                <table className="clientes-page__table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>CNPJ</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>

            {/* TODO: Adicionar controles de paginação aqui */}

            <Modal
                title={editingCliente ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                isOpen={isModalOpen}
                onClose={closeModal}
            >
                {/* Usamos os estilos genéricos de modal-form */}
                <form id="cliente-form" className="modal-form" onSubmit={handleSubmit(onModalSubmit)} noValidate>
                    <div className="modal-form__grid">
                        
                        {/* Nome */}
                        <div className="modal-form__input-group modal-form__input-group--full">
                            <label htmlFor="nome">Nome / Razão Social</label>
                            <input type="text" id="nome"
                                   className={`modal-form__input ${formErrors.nome ? 'input-error' : ''}`}
                                   {...register('nome', { required: 'O nome é obrigatório.' })}
                                   disabled={isSubmitting} />
                            {formErrors.nome && <div className="modal-form__error-message">{formErrors.nome.message}</div>}
                        </div>

                        {/* Email */}
                        <div className="modal-form__input-group">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email"
                                   className={`modal-form__input ${formErrors.email ? 'input-error' : ''}`}
                                   {...register('email', { 
                                       required: 'O email é obrigatório.',
                                       pattern: { value: /^\S+@\S+$/i, message: 'Email inválido.'}
                                   })}
                                   disabled={isSubmitting} />
                            {formErrors.email && <div className="modal-form__error-message">{formErrors.email.message}</div>}
                        </div>
                        
                        {/* Telefone */}
                        <div className="modal-form__input-group">
                            <label htmlFor="telefone">Telefone</label>
                            <input type="tel" id="telefone"
                                   className={`modal-form__input ${formErrors.telefone ? 'input-error' : ''}`}
                                   {...register('telefone')}
                                   disabled={isSubmitting} />
                        </div>
                        
                        {/* CNPJ */}
                        <div className="modal-form__input-group">
                            <label htmlFor="cnpj">CNPJ</label>
                            <input type="text" id="cnpj"
                                   className={`modal-form__input ${formErrors.cnpj ? 'input-error' : ''}`}
                                   {...register('cnpj')}
                                   disabled={isSubmitting} />
                            {formErrors.cnpj && <div className="modal-form__error-message">{formErrors.cnpj.message}</div>}
                        </div>

                        {/* Endereço */}
                        <div className="modal-form__input-group">
                            <label htmlFor="endereco">Endereço</label>
                            <input type="text" id="endereco"
                                   className={`modal-form__input ${formErrors.endereco ? 'input-error' : ''}`}
                                   {...register('endereco')}
                                   disabled={isSubmitting} />
                        </div>

                        {/* Bairro */}
                        <div className="modal-form__input-group">
                            <label htmlFor="bairro">Bairro</label>
                            <input type="text" id="bairro"
                                   className={`modal-form__input ${formErrors.bairro ? 'input-error' : ''}`}
                                   {...register('bairro')}
                                   disabled={isSubmitting} />
                        </div>

                        {/* Cidade */}
                        <div className="modal-form__input-group">
                            <label htmlFor="cidade">Cidade</label>
                            <input type="text" id="cidade"
                                   className={`modal-form__input ${formErrors.cidade ? 'input-error' : ''}`}
                                   {...register('cidade')}
                                   disabled={isSubmitting} />
                        </div>

                        {/* --- NOVO CAMPO: RESPONSÁVEL --- */}
                        <div className="modal-form__input-group">
                            <label htmlFor="responsavel">Responsável</label>
                            <input type="text" id="responsavel"
                                   className={`modal-form__input ${formErrors.responsavel ? 'input-error' : ''}`}
                                   {...register('responsavel')}
                                   disabled={isSubmitting} />
                            {formErrors.responsavel && <div className="modal-form__error-message">{formErrors.responsavel.message}</div>}
                        </div>
                        
                        {/* --- NOVO CAMPO: SEGMENTO --- */}
                        <div className="modal-form__input-group">
                            <label htmlFor="segmento">Segmento</label>
                            <input type="text" id="segmento"
                                   placeholder="Ex: Escolas, Lojas de Roupas"
                                   className={`modal-form__input ${formErrors.segmento ? 'input-error' : ''}`}
                                   {...register('segmento')}
                                   disabled={isSubmitting} />
                            {formErrors.segmento && <div className="modal-form__error-message">{formErrors.segmento.message}</div>}
                        </div>

                    </div>

                    <div className="modal-form__actions">
                        <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeModal} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting}>
                            {isSubmitting ? 'A guardar...' : (editingCliente ? 'Guardar Alterações' : 'Criar Cliente')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ClientesPage;