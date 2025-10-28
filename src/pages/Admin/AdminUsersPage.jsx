// src/pages/AdminUsers/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllUsers, updateUserRole, deleteUser, createUser } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< NOVO IMPORT
// O validateForm original (DOM-based) foi simplificado aqui
// Se fosse usar react-hook-form (Refinamento 6), a estrutura seria diferente
import './AdminUsers.css'; 

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFormData, setModalFormData] = useState({ nome: '', sobrenome: '', username: '', email: '', password: '', role: 'user' });
  const [modalErrors, setModalErrors] = useState({});

  const showToast = useToast();
  const { user: loggedInUser } = useAuth(); 
  const showConfirmation = useConfirmation(); // <<< Inicializa o hook de confirmação

  // --- Funções de Carregamento ---
  const loadUsers = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Funções do Modal (Adicionar Utilizador) ---
  const openAddModal = () => {
    setModalFormData({ nome: '', sobrenome: '', username: '', email: '', password: '', role: 'user' });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false); 
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
    if (modalErrors[name]) {
      setModalErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Lógica de Submissão do Modal (com validação adaptada)
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setModalErrors({});
    setIsSubmitting(true);

    const data = modalFormData;
    let formIsValid = true;
    const newErrors = {};
    const requiredFields = ['nome', 'sobrenome', 'username', 'email', 'password'];

    // Validação básica
    requiredFields.forEach(field => {
        if (!data[field] || String(data[field]).trim() === '') {
            newErrors[field] = `O campo ${field} é obrigatório.`;
            formIsValid = false;
        }
    });
    if (formIsValid && data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
         newErrors.email = 'Formato de e-mail inválido.';
         formIsValid = false;
    }
    if (formIsValid && data.password && data.password.length < 6) {
         newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
         formIsValid = false;
    }

    setModalErrors(newErrors);

    if (!formIsValid) {
      showToast('Corrija os erros no formulário.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      await createUser(data);
      showToast('Utilizador criado com sucesso!', 'success');
      closeModal();
      loadUsers(); // Recarrega
    } catch (error) {
      showToast(error.message || 'Erro ao criar utilizador.', 'error');
      // Adiciona erro específico ao campo se for duplicação
      if(error.message.toLowerCase().includes('email')) {
          newErrors.email = error.message;
      } else if (error.message.toLowerCase().includes('username')) {
           newErrors.username = error.message;
      }
      setModalErrors({...newErrors});
      setIsSubmitting(false); 
    }
  };


  // --- Funções da Tabela (Update Role, Delete) ---
  const handleRoleChange = async (userId, newRole, selectElement) => {
     const originalRole = users.find(u => u._id === userId)?.role;

     try {
         await updateUserRole(userId, newRole);
         showToast('Função atualizada com sucesso!', 'success');
         // Atualiza o estado local
         setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, role: newRole } : u));
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar função.', 'error');
         // Reverte a mudança visual se falhar
         if(selectElement) selectElement.value = originalRole;
     }
  };

  // Handler de Exclusão (agora usa o hook useConfirmation)
  const handleDeleteClick = async (user) => {
     try {
         // 1. Abre o modal de confirmação
         await showConfirmation({
             message: `Tem a certeza de que deseja apagar o utilizador "${user.username}"? Esta ação é irreversível.`,
             title: "Confirmar Exclusão de Utilizador",
             confirmText: "Sim, Apagar",
             confirmButtonType: "red", 
         });
 
         // 2. Se o usuário confirmar (Promise resolvida), executa a exclusão
         try {
             await deleteUser(user._id); // Passa o ID do utilizador
             showToast('Utilizador apagado com sucesso!', 'success');
             loadUsers(); // Recarrega
         } catch (error) {
             showToast(error.message || 'Erro ao apagar utilizador.', 'error');
         }
 
     } catch (error) {
         // 3. Usuário cancelou ou tentou apagar a própria conta (erro 400 do backend)
         if (error.message !== "Ação cancelada pelo usuário.") {
            // A API pode retornar 400 se tentar apagar a própria conta
            showToast(error.message || "Ação cancelada.", 'error');
         }
     }
  };


  // --- Renderização da Tabela ---
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
      const disableReason = isCurrentUser ? "Não pode alterar/apagar a sua própria conta aqui" : "";

      return (
        <tr key={user._id}>
          <td>{user._id}</td>
          <td>{user.username}</td>
          <td>{user.email}</td>
          <td>
            <select
              className="admin-users-page__role-select"
              value={user.role} 
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
                {/* Campos do formulário */}
                 <div className="modal-form__input-group">
                    <label htmlFor="nome">Nome</label>
                    <input type="text" id="nome" name="nome" value={modalFormData.nome} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome}</div>}
                 </div>
                 <div className="modal-form__input-group">
                    <label htmlFor="sobrenome">Sobrenome</label>
                    <input type="text" id="sobrenome" name="sobrenome" value={modalFormData.sobrenome} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.sobrenome ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.sobrenome && <div className="modal-form__error-message">{modalErrors.sobrenome}</div>}
                 </div>
                  <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="username">Nome de Utilizador</label>
                    <input type="text" id="username" name="username" value={modalFormData.username} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.username ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.username && <div className="modal-form__error-message">{modalErrors.username}</div>}
                 </div>
                  <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="email">E-mail</label>
                    <input type="email" id="email" name="email" value={modalFormData.email} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.email ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.email && <div className="modal-form__error-message">{modalErrors.email}</div>}
                 </div>
                <div className="modal-form__input-group">
                    <label htmlFor="password">Senha</label>
                    <input type="password" id="password" name="password" value={modalFormData.password} onChange={handleModalInputChange}
                           className={`modal-form__input ${modalErrors.password ? 'input-error' : ''}`} required disabled={isSubmitting} />
                    {modalErrors.password && <div className="modal-form__error-message">{modalErrors.password}</div>}
                 </div>
                <div className="modal-form__input-group">
                    <label htmlFor="role">Função</label>
                    <select id="role" name="role" value={modalFormData.role} onChange={handleModalInputChange}
                            className="modal-form__input" disabled={isSubmitting}>
                        <option value="user">Utilizador</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
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

    </div>
  );
}

export default AdminUsersPage;