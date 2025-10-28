// src/pages/Clientes/ClientesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
// 1. Importar hooks do React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchClientes, createCliente, updateCliente, deleteCliente } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { validateCNPJ } from '../../utils/validator';
import { getImageUrl } from '../../utils/helpers';
import { useConfirmation } from '../../context/ConfirmationContext';
import './Clientes.css';

function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const showToast = useToast();
  const showConfirmation = useConfirmation();
  const queryClient = useQueryClient(); // 2. Obter o cliente Query

  // 3. useQuery para Clientes
  const {
    data: clientes = [], // Fornece os dados, com fallback para array vazio
    isLoading,         // Estado de loading
    isError,           // Estado booleano de erro
    error              // Objeto de erro
  } = useQuery({
    queryKey: ['clientes'], // Chave única para o cache de clientes
    queryFn: fetchClientes, // Função da API para buscar os dados
    placeholderData: [],    // Evita 'undefined' na primeira renderização
  });

  // --- Configuração RHF para o Modal (inalterada) ---
  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors: modalErrors }, // Removemos isSubmitting daqui
  } = useForm({ /* ... opções ... */ });
  const logoField = watch('logo');
  useEffect(() => { /* ... lógica de preview inalterada ... */ }, [logoField, editingCliente]);

  // --- 4. Mutações (Create, Update, Delete) ---

  // Mutação para Criar Cliente
  const createClienteMutation = useMutation({
    mutationFn: createCliente, // API fn (recebe FormData)
    onSuccess: () => {
      showToast('Cliente criado com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['clientes'] }); // Invalida cache
      closeModal();
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao criar cliente.', 'error');
    }
  });

  // Mutação para Atualizar Cliente
  const updateClienteMutation = useMutation({
    mutationFn: (variables) => updateCliente(variables.id, variables.formData), // API fn (recebe {id, formData})
    onSuccess: () => {
      showToast('Cliente atualizado com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      closeModal();
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao atualizar cliente.', 'error');
    }
  });

  // Mutação para Apagar Cliente
  const deleteClienteMutation = useMutation({
    mutationFn: deleteCliente, // API fn (recebe clienteId)
    onSuccess: () => {
      showToast('Cliente apagado com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao apagar cliente.', 'error');
    }
  });

  // Combina estados de 'pending' das mutações de escrita
  const isSubmitting = createClienteMutation.isPending || updateClienteMutation.isPending;

  // --- Funções do Modal (adaptadas) ---
  const openAddModal = () => {
    setEditingCliente(null);
    reset({ nome: '', cnpj: '', telefone: '', logo: null });
    setLogoPreview(null);
    setIsModalOpen(true);
  };
  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    reset({
      nome: cliente.nome || '', cnpj: cliente.cnpj || '',
      telefone: cliente.telefone || '', logo: null
    });
    setLogoPreview(cliente.logo_url ? getImageUrl(cliente.logo_url, null) : null);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); /* Reset não é estritamente necessário aqui */ };
  const handleClearLogo = () => {
    setValue('logo', null, { shouldValidate: false, shouldDirty: true });
    setLogoPreview(null);
  };

  // --- Submissão do Formulário (chama mutações) ---
  const onModalSubmit = (data) => {
    // 'data' contém os valores validados { nome, cnpj, telefone, logo: FileList }
    const dataToSend = new FormData();
    dataToSend.append('nome', data.nome);
    dataToSend.append('cnpj', data.cnpj || '');
    dataToSend.append('telefone', data.telefone || '');
    const logoFile = data.logo?.[0];

    if (logoFile instanceof File) {
      dataToSend.append('logo', logoFile);
    } else if (editingCliente && !logoPreview) {
      dataToSend.append('logo', ''); // Remover
    }

    if (editingCliente) {
      updateClienteMutation.mutate({ id: editingCliente._id, formData: dataToSend });
    } else {
      createClienteMutation.mutate(dataToSend);
    }
  };

  // --- Função de Exclusão (chama mutação) ---
  const handleDeleteClick = async (cliente) => {
     try {
         await showConfirmation({
             message: `Tem a certeza que deseja apagar o cliente "${cliente.nome}"?`,
             title: "Confirmar Exclusão",
             confirmButtonType: "red",
         });
         // Chama a mutação (o estado pending será gerido pelo ConfirmationContext ou botão)
         deleteClienteMutation.mutate(cliente._id); // Passa o ID

     } catch (error) { /* Cancelado */ }
  };


  // --- Renderização (adaptada para useQuery) ---
  const renderTableBody = () => {
    if (isLoading) { // Do useQuery
      return <tr><td colSpan="5"><Spinner message="A carregar clientes..." /></td></tr>;
    }
    if (isError) { // Do useQuery
      return <tr><td colSpan="5" className="text-center error-message">Erro: {error.message}</td></tr>;
    }
    // Usa 'clientes' que vem do useQuery data
    if (clientes.length === 0) {
      return <tr><td colSpan="5" className="text-center">Nenhum cliente encontrado.</td></tr>;
    }
    return clientes.map(cliente => (
      <tr key={cliente._id}>
        <td className="clientes-page__logo-cell">
          <img
            src={getImageUrl(cliente.logo_url, '/assets/img/placeholder_company.png')}
            alt={`Logo ${cliente.nome}`} className="clientes-page__logo-img"
            onError={(e) => { e.target.onerror = null; e.target.src = '/assets/img/placeholder_company.png'; }}
          />
        </td>
        <td>{cliente.nome}</td>
        <td>{cliente.cnpj || 'N/A'}</td>
        <td>{cliente.telefone || 'N/A'}</td>
        <td className="clientes-page__actions">
          <button
            className="clientes-page__action-button clientes-page__action-button--edit"
            title="Editar"
            onClick={() => openEditModal(cliente)}
            disabled={deleteClienteMutation.isPending} // Desabilita enquanto apaga
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button
            className="clientes-page__action-button clientes-page__action-button--delete"
            title="Apagar"
            onClick={() => handleDeleteClick(cliente)}
            // Desabilita se este item específico estiver a ser apagado
            disabled={deleteClienteMutation.isPending && deleteClienteMutation.variables === cliente._id}
          >
             {/* Mostra spinner se este item estiver a ser apagado */}
             {(deleteClienteMutation.isPending && deleteClienteMutation.variables === cliente._id) ?
               <i className="fas fa-spinner fa-spin"></i> :
               <i className="fas fa-trash"></i>
             }
          </button>
        </td>
      </tr>
    ));
  };


  return (
    <div className="clientes-page">
      <div className="clientes-page__controls">
        <button id="add-cliente-button" className="clientes-page__add-button" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Adicionar Cliente
        </button>
      </div>

      <div className="clientes-page__table-wrapper">
        <table className="clientes-page__table">
          <thead><tr><th>Logo</th><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Ações</th></tr></thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      {/* Modal (usa isSubmitting das mutações) */}
      <Modal
        title={editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}
        isOpen={isModalOpen} onClose={closeModal}
      >
        <form id="cliente-form" className="modal-form" onSubmit={handleSubmit(onModalSubmit)} noValidate>
          <div className="modal-form__grid">
            {/* Nome */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="nome">Nome da Empresa</label>
              <input type="text" id="nome"
                     className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                     {...register('nome', { required: 'O nome é obrigatório.' })}
                     disabled={isSubmitting} />
              {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome.message}</div>}
            </div>
            {/* CNPJ */}
            <div className="modal-form__input-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input type="text" id="cnpj"
                     className={`modal-form__input ${modalErrors.cnpj ? 'input-error' : ''}`}
                     {...register('cnpj', { validate: (v) => !v || validateCNPJ(v) || 'CNPJ inválido.' })}
                     disabled={isSubmitting} />
               {modalErrors.cnpj && <div className="modal-form__error-message">{modalErrors.cnpj.message}</div>}
            </div>
            {/* Telefone */}
            <div className="modal-form__input-group">
              <label htmlFor="telefone">Telefone</label>
              <input type="tel" id="telefone"
                     className={`modal-form__input ${modalErrors.telefone ? 'input-error' : ''}`}
                     {...register('telefone')} disabled={isSubmitting} />
               {modalErrors.telefone && <div className="modal-form__error-message">{modalErrors.telefone.message}</div>}
            </div>
            {/* Logo */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="logo">Logo (Opcional)</label>
              <input type="file" id="logo" accept="image/*"
                     className={`modal-form__input ${modalErrors.logo ? 'input-error' : ''}`}
                     {...register('logo')} disabled={isSubmitting} />
               {/* Preview */}
               <div className="placa-form-page__image-preview-container" style={{ height: '100px', marginTop: '10px' }}>
                   {logoPreview ? ( <img src={logoPreview} alt="Preview" className="placa-form-page__image-preview" /> ) : ( <span>Preview</span> )}
                    {logoPreview && ( <button type="button" className="placa-form-page__remove-image-button" onClick={handleClearLogo} disabled={isSubmitting} style={{ bottom: '0.5rem', right: '0.5rem' }} > <i className="fas fa-times"></i> Limpar </button> )}
               </div>
              {modalErrors.logo && <div className="modal-form__error-message">{modalErrors.logo.message}</div>}
            </div>
          </div>
          <div className="modal-form__actions">
            <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeModal} disabled={isSubmitting}> Cancelar </button>
            <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting}> {isSubmitting ? 'A guardar...' : 'Guardar'} </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ClientesPage;