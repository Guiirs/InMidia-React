// src/pages/ClientesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '../../services/api';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { validateForm, validateCNPJ } from '../../utils/validator';
import { getImageUrl } from '../../utils/helpers'; // Para exibir o logo
import './Clientes.css';

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null); // Cliente a editar ou null para adicionar
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFormData, setModalFormData] = useState({}); // Para guardar dados do form modal
  const [modalErrors, setModalErrors] = useState({});
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null); // Para preview do logo no modal

  // Confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  const showToast = useToast();

  // --- Carregamento de Dados ---
  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClientes();
      setClientes(data);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Erro ao buscar clientes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]); // Adiciona showToast como dependência

  useEffect(() => {
    loadClientes();
  }, [loadClientes]); // Usa a função memoizada

  // --- Gestão do Modal ---
  const handleAddClick = () => {
    setEditingCliente(null);
    setModalFormData({ nome: '', cnpj: '', telefone: '' }); // Reset form data
    setLogoPreviewUrl(null); // Reset preview
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (cliente) => {
    setEditingCliente(cliente);
    setModalFormData({ // Preenche com dados existentes
      nome: cliente.nome || '',
      cnpj: cliente.cnpj || '',
      telefone: cliente.telefone || '',
    });
    // Define a URL de preview inicial (pode ser null)
    setLogoPreviewUrl(getImageUrl(cliente.logo_url, null));
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    setModalFormData({}); // Limpa dados ao fechar
    setLogoPreviewUrl(null);
    setModalErrors({});
    setIsSubmitting(false);
  };

  // Handler para mudança nos inputs do modal
  const handleModalInputChange = (event) => {
    const { name, value } = event.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para mudança no input de ficheiro (logo)
  const handleLogoInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Cria uma URL temporária para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result); // Mostra preview local
      };
      reader.readAsDataURL(file);
      // Guarda o ficheiro no estado (ou usa FormData diretamente no submit)
      setModalFormData(prev => ({ ...prev, logoFile: file }));
    } else {
      // Se o utilizador cancela, mantém o preview anterior (se editando) ou limpa
      setLogoPreviewUrl(editingCliente ? getImageUrl(editingCliente.logo_url, null) : null);
      setModalFormData(prev => ({ ...prev, logoFile: null }));
    }
  };

  // --- Submissão do Formulário do Modal ---
  const handleModalSubmit = async (event) => {
    event.preventDefault();
    setModalErrors({});
    setIsSubmitting(true);

    const validationRules = {
        nome: [{ type: 'required' }],
        cnpj: [{ type: 'optional' }, { type: 'custom', validate: validateCNPJ, message: 'CNPJ inválido.' }],
        telefone: [{ type: 'optional' }]
        // Validação de ficheiro (tamanho, tipo) pode ser adicionada aqui se necessário
    };

    // Valida modalFormData
    let formIsValid = true;
    const newErrors = {};
    for (const fieldName in validationRules) {
         const value = modalFormData[fieldName];
         // ... (Lógica de validação similar à RegioesPage, adaptada para modalFormData) ...
         // Simplificado para exemplo:
         if (validationRules[fieldName].some(r => r.type === 'required') && (!value || String(value).trim() === '')) {
             newErrors[fieldName] = validationRules[fieldName].find(r => r.type === 'required').message || 'Campo obrigatório.';
             formIsValid = false;
         }
         if (fieldName === 'cnpj' && value && !validateCNPJ(value)) {
             newErrors[fieldName] = validationRules[fieldName].find(r => r.type === 'custom').message || 'CNPJ inválido.';
             formIsValid = false;
         }
    }
    setModalErrors(newErrors);

    if (!formIsValid) {
      showToast('Formulário inválido.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Cria FormData para enviar (necessário para o ficheiro)
    const formDataApi = new FormData();
    formDataApi.append('nome', modalFormData.nome);
    if (modalFormData.cnpj) formDataApi.append('cnpj', modalFormData.cnpj);
    if (modalFormData.telefone) formDataApi.append('telefone', modalFormData.telefone);
    // Adiciona o ficheiro apenas se um novo foi selecionado
    if (modalFormData.logoFile) {
        formDataApi.append('logo', modalFormData.logoFile);
    } else if (editingCliente && !logoPreviewUrl) {
        // Se estava editando e o preview foi limpo (sem novo ficheiro), envia 'logo_url' vazio
         formDataApi.append('logo_url', ''); // Sinaliza remoção para o backend
    }
    // Se estava editando e não tocou no logo, não envia nada relativo ao logo


    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formDataApi); // API espera id
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        await createCliente(formDataApi);
        showToast('Cliente criado com sucesso!', 'success');
      }
      handleCloseModal();
      loadClientes(); // Recarrega a lista
    } catch (error) {
      showToast(error.message || 'Erro ao guardar cliente.', 'error');
      setIsSubmitting(false); // Reabilita botão no erro
    }
  };

  // --- Exclusão ---
  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente);
    // Usando window.confirm como placeholder
    if (window.confirm(`Tem a certeza que deseja apagar o cliente "${cliente.nome}"?`)) {
        confirmDelete();
    } else {
        setClienteToDelete(null);
    }
    // setShowConfirmDelete(true); // Se usar modal React
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;
    // Opcional: Desabilitar botão de apagar da linha

    try {
      await deleteCliente(clienteToDelete.id); // API espera id
      showToast('Cliente apagado com sucesso!', 'success');
      loadClientes();
    } catch (error) {
      showToast(error.message || 'Erro ao apagar cliente.', 'error');
       // Reabilitar botão se desabilitado
    } finally {
       setClienteToDelete(null);
       // setShowConfirmDelete(false); // Se usar modal React
    }
  };

   // const cancelDelete = () => { /* ... se usar modal React ... */ };


  // --- Renderização da Tabela ---
  const renderTableBody = () => {
    if (isLoading) return <tr><td colSpan="5"><Spinner message="A carregar clientes..." /></td></tr>;
    if (error) return <tr><td colSpan="5" className="text-center error-message">Erro: {error}</td></tr>;
    if (clientes.length === 0) return <tr><td colSpan="5" className="text-center">Nenhum cliente encontrado.</td></tr>;

    return clientes.map(cliente => {
      // Usa o helper para obter a URL do logo ou placeholder
      const logoUrl = getImageUrl(cliente.logo_url, '/assets/img/placeholder_company.png');
      return (
        <tr key={cliente.id} data-cliente-id={cliente.id}>
          <td className="clientes-page__logo-cell">
            <img
                src={logoUrl}
                alt={`Logo ${cliente.nome}`}
                className="clientes-page__logo-img"
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
              onClick={() => handleEditClick(cliente)}
              disabled={isLoading || isSubmitting} // Desabilita durante carregamento/submissão
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              className="clientes-page__action-button clientes-page__action-button--delete"
              title="Apagar"
              onClick={() => handleDeleteClick(cliente)}
              disabled={isLoading || isSubmitting} // Desabilita durante carregamento/submissão
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      );
    });
  };

  // --- JSX da Página ---
  return (
    <div className="clientes-page">
      <div className="clientes-page__controls">
        <button
          id="add-cliente-button"
          className="clientes-page__add-button"
          onClick={handleAddClick}
          disabled={isLoading} // Desabilita enquanto carrega a lista inicial
        >
          <i className="fas fa-plus"></i> Adicionar Cliente
        </button>
      </div>
      <div className="clientes-page__table-wrapper">
        <table className="clientes-page__table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nome do Cliente</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Modal para Adicionar/Editar Cliente */}
      <Modal
        title={editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      >
        <form id="cliente-form" className="modal-form" onSubmit={handleModalSubmit} noValidate>
          <div className="modal-form__grid">
            {/* Nome */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="nome">Nome da Empresa</label>
              <input
                type="text" id="nome" name="nome"
                className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                value={modalFormData.nome || ''}
                onChange={handleModalInputChange} required disabled={isSubmitting}
              />
              {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome}</div>}
            </div>
            {/* CNPJ */}
            <div className="modal-form__input-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input
                type="text" id="cnpj" name="cnpj"
                className={`modal-form__input ${modalErrors.cnpj ? 'input-error' : ''}`}
                value={modalFormData.cnpj || ''}
                onChange={handleModalInputChange} disabled={isSubmitting} placeholder="00.000.000/0000-00"
               />
              {modalErrors.cnpj && <div className="modal-form__error-message">{modalErrors.cnpj}</div>}
            </div>
            {/* Telefone */}
            <div className="modal-form__input-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel" id="telefone" name="telefone"
                className="modal-form__input" // Erro não implementado para telefone neste exemplo
                value={modalFormData.telefone || ''}
                onChange={handleModalInputChange} disabled={isSubmitting} placeholder="(00) 00000-0000"
              />
               {/* {modalErrors.telefone && <div className="modal-form__error-message">{modalErrors.telefone}</div>} */}
            </div>
            {/* Logo */}
            <div className="modal-form__input-group modal-form__input-group--full">
              <label htmlFor="logo">Logo do Cliente (Opcional)</label>
              <input
                type="file" id="logo" name="logo"
                className="modal-form__input" // Pode precisar de estilo específico
                accept="image/*"
                onChange={handleLogoInputChange}
                disabled={isSubmitting}
              />
              {/* Container de Preview (estilos reutilizados de PlacaFormPage.css via Modal.css ou Clientes.css) */}
              <div className="placa-form-page__image-preview-container" style={{ height: '100px', marginTop: '10px' }}>
                <img
                    id="logo-preview"
                    className={`placa-form-page__image-preview ${!logoPreviewUrl ? 'placa-form-page__image-preview--hidden' : ''}`}
                    src={logoPreviewUrl || '#'} // Usa o estado para preview
                    alt="Pré-visualização"
                />
                <span id="logo-preview-text" style={logoPreviewUrl ? { display: 'none' } : {}}>Pré-visualização</span>
                {/* Botão de remover pode ser adicionado aqui se necessário */}
              </div>
               {/* {modalErrors.logo && <div className="modal-form__error-message">{modalErrors.logo}</div>} */}
            </div>
          </div>
          <div className="modal-form__actions">
            <button type="button" className="modal-form__button modal-form__button--cancel" onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

       {/* Placeholder para ConfirmationModal de Exclusão */}
       {/* {showConfirmDelete && clienteToDelete && ( ... )} */}

    </div>
  );
}

export default ClientesPage;