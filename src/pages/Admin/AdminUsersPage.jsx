// src/pages/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllUsers, updateUserRole, deleteUser, createUser } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useAuth } from '../../context/AuthContext'; // Para obter ID do admin logado
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { validateForm } from '../../utils/validator';
// Importar ConfirmationModal React (se tiver um) ou usar window.confirm
import './AdminUsers.css'; // CSS da página

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFormData, setModalFormData] = useState({ nome: '', sobrenome: '', username: '', email: '', password: '', role: 'user' });
  const [modalErrors, setModalErrors] = useState({});

  // Confirmação de exclusão
  const [userToDelete, setUserToDelete] = useState(null);

  const showToast = useToast();
  const { user: loggedInUser } = useAuth(); // Obtém dados do admin logado

  // Carrega utilizadores
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Erro ao carregar utilizadores.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []); // Carrega ao montar

  // --- Funções do Modal (Adicionar Utilizador) ---
  const openAddModal = () => {
    setModalFormData({ nome: '', sobrenome: '', username: '', email: '', password: '', role: 'user' });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false); // Garante reset
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
    if (modalErrors[name]) {
      setModalErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setModalErrors({});
    setIsSubmitting(true);

    const validationRules = {
      nome: [{ type: 'required' }],
      sobrenome: [{ type: 'required' }],
      username: [{ type: 'required' }, { type: 'minLength', param: 3 }, { type: 'maxLength', param: 50 }],
      email: [{ type: 'required' }, { type: 'email' }, { type: 'maxLength', param: 100 }],
      password: [{ type: 'required' }, { type: 'minLength', param: 6 }]
    };

    // Adaptação da validação para React state
    let formIsValid = true;
    const newErrors = {};
    for (const fieldName in validationRules) {
        const value = modalFormData[fieldName];
        const fieldRules = validationRules[fieldName];
        let fieldIsValid = true;

        const isOptional = fieldRules.some(rule => rule.type === 'optional');
        if (isOptional && (!value || String(value).trim() === '')) continue;

        for (const rule of fieldRules) {
            if (!fieldIsValid) break;
            let isValidForRule = true;
            let errorMessage = rule.message || 'Valor inválido.';

            try {
                switch (rule.type) {
                    case 'required': isValidForRule = value && String(value).trim() !== ''; break;
                    case 'email': isValidForRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)); break;
                    case 'minLength': isValidForRule = String(value).length >= rule.param; break;
                    case 'maxLength': isValidForRule = String(value).length <= rule.param; break;
                }
            } catch (validationError) { isValidForRule = false; errorMessage = validationError.message || errorMessage; }

            if (!isValidForRule) {
                newErrors[fieldName] = errorMessage; formIsValid = false; fieldIsValid = false;
            }
        }
    }
    setModalErrors(newErrors);


    if (!formIsValid) {
      showToast('Corrija os erros no formulário.', 'error');
      setIsSubmitting(false);
      const firstErrorField = Object.keys(newErrors)[0];
       if (firstErrorField) {
           const inputElement = document.getElementById(firstErrorField); // Assume IDs correspondem a names
           inputElement?.focus();
       }
      return;
    }

    try {
      await createUser(modalFormData);
      showToast('Utilizador criado com sucesso!', 'success');
      closeModal();
      loadUsers(); // Recarrega
    } catch (error) {
      showToast(error.message || 'Erro ao criar utilizador.', 'error');
       // Adiciona erro específico ao campo se for duplicação
      if(error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('e-mail')) {
          setModalErrors(prev => ({...prev, email: error.message}));
      } else if (error.message.toLowerCase().includes('username') || error.message.toLowerCase().includes('utilizador')) {
           setModalErrors(prev => ({...prev, username: error.message}));
      }
      setIsSubmitting(false); // Reabilita botão no erro
    }
    // finally não é necessário
  };

  // --- Funções da Tabela (Update Role, Delete) ---
  const handleRoleChange = async (userId, newRole, selectElement) => {
     const originalRole = users.find(u => u._id === userId)?.role;
     if (!originalRole || !selectElement) return; // Segurança

     // Atualiza visualmente primeiro (otimista) - opcional
     // selectElement.value = newRole;

     try {
         await updateUserRole(userId, newRole);
         showToast('Função atualizada com sucesso!', 'success');
         // Atualiza o estado local para refletir a mudança
         setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, role: newRole } : u));
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar função.', 'error');
         // Reverte a mudança visual se falhar
         if(selectElement) selectElement.value = originalRole;
     }
  };

  const handleDeleteClick = (user) => {
     setUserToDelete(user);
     // Usar window.confirm como placeholder
     if (window.confirm(`Tem a certeza que deseja apagar o utilizador "${user.username}"? Esta ação é irreversível.`)) {
         confirmDelete();
     } else {
         setUserToDelete(null);
     }
     // Se usar Modal React: setShowConfirmDelete(true);
  };

   const confirmDelete = async () => {
     if (!userToDelete) return;
     const idToDelete = userToDelete._id;

     // Idealmente, desabilitar botão/linha
     try {
         await deleteUser(idToDelete);
         showToast('Utilizador apagado com sucesso!', 'success');
         loadUsers(); // Recarrega
     } catch (error) {
         showToast(error.message || 'Erro ao apagar utilizador.', 'error');
         // Reabilitar botão/linha
     } finally {
          setUserToDelete(null);
          // setShowConfirmDelete(false); // Se usar modal React
     }
  };

  // --- Renderização ---
  const renderTableBody = () => {
    if (isLoading) {
      return <tr><td colSpan="5"><Spinner message="A carregar utilizadores..." /></td></tr>;
    }
    if (error) {
      return <tr><td colSpan="5" className="text-center error-message">Erro: {error}</td></tr>;
    }
    if (users.length === 0) {
      return <tr><td colSpan="5" className="text-center">Nenhum utilizador encontrado.</td></tr>;
    }
    return users.map(user => {
      const isCurrentUser = loggedInUser && String(user._id) === String(loggedInUser.id);
      const disableActions = isCurrentUser;
      const disableReason = isCurrentUser ? "Não pode alterar a sua própria conta aqui" : "";

      return (
        // Usa _id como key
        <tr key={user._id}>
          <td>{user._id}</td>
          <td>{user.username}</td>
          <td>{user.email}</td>
          <td>
            <select
              className="admin-users-page__role-select"
              value={user.role} // Controlado pelo estado 'users'
              onChange={(e) => handleRoleChange(user._id, e.target.value, e.target)}
              disabled={disableActions}
              title={disableReason}
            >
              <option value="user">Utilizador</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td className="admin-users-page__actions">
            <button
              className="admin-users-page__action-button admin-users-page__action-button--delete"
              title={disableReason || "Apagar"}
              onClick={() => handleDeleteClick(user)}
              disabled={disableActions}
            >
              <i className="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-page__controls">
        <button id="add-user-button" className="admin-users-page__add-button" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Adicionar Utilizador
        </button>
      </div>
      <div className="admin-users-page__table-wrapper">
        <table className="admin-users-page__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome de Utilizador</th>
              <th>E-mail</th>
              <th>Função</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar Utilizador */}
      <Modal title="Adicionar Novo Utilizador" isOpen={isModalOpen} onClose={closeModal}>
        <form id="user-form" className="modal-form" onSubmit={handleAddUserSubmit} noValidate>
            <div className="modal-form__grid">
                {/* Campos do formulário (Nome, Sobrenome, Username, Email, Password, Role) */}
                 {/* Nome */}
                 <div className="modal-form__input-group">
                    <label htmlFor="nome">Nome</label>
                    <input type="text" id="nome" name="nome" value={modalFormData.nome} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome}</div>}
                 </div>
                 {/* Sobrenome */}
                 <div className="modal-form__input-group">
                    <label htmlFor="sobrenome">Sobrenome</label>
                    <input type="text" id="sobrenome" name="sobrenome" value={modalFormData.sobrenome} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.sobrenome ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.sobrenome && <div className="modal-form__error-message">{modalErrors.sobrenome}</div>}
                 </div>
                  {/* Username */}
                 <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="username">Nome de Utilizador</label>
                    <input type="text" id="username" name="username" value={modalFormData.username} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.username ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.username && <div className="modal-form__error-message">{modalErrors.username}</div>}
                 </div>
                 {/* Email */}
                  <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="email">E-mail</label>
                    <input type="email" id="email" name="email" value={modalFormData.email} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.email ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.email && <div className="modal-form__error-message">{modalErrors.email}</div>}
                 </div>
                {/* Password */}
                 <div className="modal-form__input-group">
                    <label htmlFor="password">Senha</label>
                    <input type="password" id="password" name="password" value={modalFormData.password} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.password ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.password && <div className="modal-form__error-message">{modalErrors.password}</div>}
                 </div>
                {/* Role */}
                 <div className="modal-form__input-group">
                    <label htmlFor="role">Função</label>
                    <select id="role" name="role" value={modalFormData.role} onChange={handleModalInputChange}
                            className="modal-form__input" disabled={isSubmitting}>
                        <option value="user">Utilizador</option>
                        <option value="admin">Admin</option>
                    </select>
                    {/* Não costuma ter erro aqui */}
                 </div>
            </div>
            {/* Ações do Modal */}
            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeModal} disabled={isSubmitting}>
                    Cancelar
                </button>
                <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting}>
                    {isSubmitting ? 'A criar...' : 'Criar Utilizador'}
                </button>
            </div>
        </form>
      </Modal>

       {/* Modal de Confirmação (se tiver um componente React) */}
       {/* {showConfirmDelete && userToDelete && ( ... )} */}
    </div>
  );
}

export default AdminUsersPage;