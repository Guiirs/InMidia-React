// src/pages/Clientes/ClientesPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { validateCNPJ } from '../../utils/validator'; // Importa validação CNPJ
import { getImageUrl } from '../../utils/helpers';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< NOVO IMPORT
import { useForm } from 'react-hook-form'; // <<< NOVO IMPORT
import './Clientes.css';


function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null); // Mantém estado para preview

  const showToast = useToast();
  const showConfirmation = useConfirmation();

  // --- Inicializa react-hook-form para o MODAL ---
  const {
    register,
    handleSubmit,
    reset,
    watch, // Para observar o campo 'logo' para preview
    setValue, // Para definir valores
    formState: { errors: modalErrors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { nome: '', cnpj: '', telefone: '', logo: null } // Inclui 'logo'
  });

  // --- Funções de Carregamento ---
  const loadClientes = useCallback(async () => {
      // ... (lógica inalterada) ...
        setIsLoading(true);
        setError(null);
        try {
          const data = await fetchClientes();
          setClientes(data);
        } catch (err) {
          setError(err.message);
          showToast(err.message || 'Erro ao carregar clientes.', 'error');
        } finally {
          setIsLoading(false);
        }
  }, [showToast]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Observa o campo 'logo' para atualizar a preview
  const logoField = watch('logo');
  useEffect(() => {
      if (logoField && logoField[0] instanceof File) {
          // Se um ficheiro foi selecionado, gera preview
          const file = logoField[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogoPreview(reader.result);
          };
          reader.readAsDataURL(file);
      } else if (!editingCliente?.logo_url) {
          // Se não há ficheiro e não está editando (ou editando sem logo original), limpa preview
           // setLogoPreview(null); // Mantém preview se existir logo original
      }
  }, [logoField, editingCliente]); // Depende do campo 'logo' e se está editando


  // --- Funções do Modal (adaptadas para react-hook-form) ---
  const openAddModal = () => {
    setEditingCliente(null);
    reset({ nome: '', cnpj: '', telefone: '', logo: null }); // Reseta o formulário
    setLogoPreview(null); // Limpa preview
    setIsModalOpen(true);
  };

  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    reset({ // Preenche o formulário RHF
      nome: cliente.nome || '',
      cnpj: cliente.cnpj || '',
      telefone: cliente.telefone || '',
      logo: null // Input file sempre começa vazio
    });
    // Define o preview inicial com base no logo existente
    setLogoPreview(cliente.logo_url ? getImageUrl(cliente.logo_url, null) : null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    // Não precisa resetar aqui, pois o reset ocorre ao abrir
  };

  // Limpa a preview e o valor do input file (usado no botão Limpar)
  const handleClearLogo = () => {
      setValue('logo', null); // Limpa o valor no RHF
      setLogoPreview(null); // Limpa a preview
  };


  // --- Submissão do Formulário (usando handleSubmit do RHF) ---
  const onModalSubmit = async (data) => {
    // 'data' contém os valores validados, incluindo data.logo (FileList)
    const dataToSend = new FormData();
    dataToSend.append('nome', data.nome);
    dataToSend.append('cnpj', data.cnpj || '');
    dataToSend.append('telefone', data.telefone || '');

    const logoFile = data.logo?.[0]; // Pega o primeiro ficheiro do FileList

    if (logoFile instanceof File) {
      // Se um *novo* ficheiro foi selecionado
      dataToSend.append('logo', logoFile);
    } else if (editingCliente && !logoPreview) {
      // Se está editando E a preview foi limpa (manualmente pelo botão Limpar)
      dataToSend.append('logo', ''); // Envia vazio para indicar remoção
    }
    // Se está editando, não selecionou novo ficheiro e a preview existe,
    // não envia nada no campo 'logo', backend manterá o existente.

    try {
      if (editingCliente) {
        await updateCliente(editingCliente._id, dataToSend);
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        await createCliente(dataToSend);
        showToast('Cliente criado com sucesso!', 'success');
      }
      closeModal();
      loadClientes();
    } catch (error) {
      showToast(error.message || 'Erro ao guardar cliente.', 'error');
      console.error("Erro submit cliente:", error);
      // O estado isSubmitting é gerido pelo RHF
    }
  };

  // --- Função de Exclusão (inalterada, já usa useConfirmation) ---
  const handleDeleteClick = async (cliente) => {
     try {
         await showConfirmation({ /* ... opções ... */
             message: `Tem a certeza que deseja apagar o cliente "${cliente.nome}"?`,
             title: "Confirmar Exclusão de Cliente",
             confirmText: "Sim, Apagar",
             confirmButtonType: "red",
         });
         try {
             await deleteCliente(cliente._id);
             showToast('Cliente apagado com sucesso!', 'success');
             loadClientes();
         } catch (error) { showToast(error.message || 'Erro ao apagar cliente.', 'error'); }
     } catch (error) { /* Cancelado */ }
  };


  // --- Renderização (Tabela inalterada) ---
   const renderTableBody = () => {
     // ... (lógica inalterada) ...
    if (isLoading) return <tr><td colSpan="5"><Spinner message="A carregar clientes..." /></td></tr>;
    if (error) return <tr><td colSpan="5" className="text-center error-message">Erro: {error}</td></tr>;
    if (clientes.length === 0) return <tr><td colSpan="5" className="text-center">Nenhum cliente encontrado.</td></tr>;
     return clientes.map(cliente => (
        <tr key={cliente._id}>
            <td className="clientes-page__logo-cell">
                <img src={getImageUrl(cliente.logo_url, '/assets/img/placeholder_company.png')} alt={`Logo ${cliente.nome}`} className="clientes-page__logo-img" onError={(e) => { e.target.onerror = null; e.target.src = '/assets/img/placeholder_company.png'; }} />
            </td>
            <td>{cliente.nome}</td>
            <td>{cliente.cnpj || 'N/A'}</td>
            <td>{cliente.telefone || 'N/A'}</td>
            <td className="clientes-page__actions">
                <button className="clientes-page__action-button clientes-page__action-button--edit" title="Editar" onClick={() => openEditModal(cliente)}> <i className="fas fa-pencil-alt"></i> </button>
                <button className="clientes-page__action-button clientes-page__action-button--delete" title="Apagar" onClick={() => handleDeleteClick(cliente)}> <i className="fas fa-trash"></i> </button>
            </td>
        </tr>
     ));
   };


  return (
    <div className="clientes-page">
      {/* ... Controles e Tabela ... */}
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


      {/* Modal Adicionar/Editar Cliente (com react-hook-form) */}
      <Modal
        title={editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        {/* handleSubmit(onModalSubmit) */}
        <form id="cliente-form" className="modal-form" onSubmit={handleSubmit(onModalSubmit)} noValidate>
          <div className="modal-form__grid">
            {/* Nome */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="nome">Nome da Empresa</label>
              <input type="text" id="nome"
                     className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                     {...register('nome', { required: 'O nome da empresa é obrigatório.' })}
                     disabled={isSubmitting} />
              {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome.message}</div>}
            </div>
            {/* CNPJ */}
            <div className="modal-form__input-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input type="text" id="cnpj"
                     className={`modal-form__input ${modalErrors.cnpj ? 'input-error' : ''}`}
                     {...register('cnpj', {
                         validate: (value) => !value || validateCNPJ(value) || 'CNPJ inválido.' // Valida só se preenchido
                     })}
                     disabled={isSubmitting} />
               {modalErrors.cnpj && <div className="modal-form__error-message">{modalErrors.cnpj.message}</div>}
            </div>
            {/* Telefone */}
            <div className="modal-form__input-group">
              <label htmlFor="telefone">Telefone</label>
              <input type="tel" id="telefone"
                     className={`modal-form__input ${modalErrors.telefone ? 'input-error' : ''}`}
                     {...register('telefone')} // Sem validação específica aqui
                     disabled={isSubmitting} />
               {modalErrors.telefone && <div className="modal-form__error-message">{modalErrors.telefone.message}</div>}
            </div>
            {/* Logo */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="logo">Logo do Cliente (Opcional)</label>
              <input type="file" id="logo"
                     className={`modal-form__input ${modalErrors.logo ? 'input-error' : ''}`}
                     accept="image/*"
                     {...register('logo')} // Regista o input file
                     disabled={isSubmitting} />
               {/* Preview usa estado 'logoPreview', não diretamente do RHF */}
               <div className="placa-form-page__image-preview-container" style={{ height: '100px', marginTop: '10px' }}>
                   {logoPreview ? (
                       <img src={logoPreview} alt="Pré-visualização" className="placa-form-page__image-preview" />
                   ) : (
                       <span>Pré-visualização</span>
                   )}
                    {logoPreview && (
                        <button type="button"
                            className="placa-form-page__remove-image-button"
                            onClick={handleClearLogo} // Chama função para limpar
                            disabled={isSubmitting}
                            style={{ bottom: '0.5rem', right: '0.5rem' }} >
                            <i className="fas fa-times"></i> Limpar
                        </button>
                    )}
               </div>
              {modalErrors.logo && <div className="modal-form__error-message">{modalErrors.logo.message}</div>}
            </div>
          </div>
          {/* Ações do Modal */}
          <div className="modal-form__actions">
            <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeModal} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

       {/* O ConfirmationModal é renderizado pelo Provider */}
    </div>
  );
}

export default ClientesPage;