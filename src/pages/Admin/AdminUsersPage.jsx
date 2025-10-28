// src/pages/Admin/AdminUsersPage.jsx (Refatorado com react-hook-form no modal)
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form'; // <<< NOVO IMPORT
import { fetchAllUsers, updateUserRole, deleteUser, createUser } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { useConfirmation } from '../../context/ConfirmationContext';
import './AdminUsers.css';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToast = useToast();
  const { user: loggedInUser } = useAuth();
  const showConfirmation = useConfirmation();

  // --- Inicializa react-hook-form para o MODAL ---
  const {
    register,
    handleSubmit,
    reset,
    watch, // Para validar confirmação de senha
    formState: { errors: modalErrors, isSubmitting },
    setError: setModalError // Para erros da API
  } = useForm({
    mode: 'onBlur',
    defaultValues: { nome: '', sobrenome: '', username: '', email: '', password: '', confirmPassword: '', role: 'user' }
  });
  const password = watch('password', ''); // Observa a senha para validação de confirmação

  // --- Funções de Carregamento ---
  const loadUsers = useCallback(async () => {
    // ... (lógica inalterada) ...
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

  // --- Funções do Modal (adaptadas para react-hook-form) ---
  const openAddModal = () => {
    reset({ nome: '', sobrenome: '', username: '', email: '', password: '', confirmPassword: '', role: 'user' }); // Limpa RHF
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset opcional aqui, mas já acontece ao abrir
    // reset({...});
  };

  // Função de submissão chamada pelo handleSubmit do RHF
  const onAddUserSubmit = async (data) => {
    // 'data' contém os valores validados, incluindo confirmPassword que não precisamos enviar
    const dataToSend = { ...data };
    delete dataToSend.confirmPassword;

    try {
      await createUser(dataToSend);
      showToast('Utilizador criado com sucesso!', 'success');
      closeModal();
      loadUsers(); // Recarrega
    } catch (error) {
      showToast(error.message || 'Erro ao criar utilizador.', 'error');
      // Adiciona erro específico ao campo se for duplicação
      if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('e-mail')) {
         setModalError('email', { type: 'api', message: error.message });
      } else if (error.message.toLowerCase().includes('username') || error.message.toLowerCase().includes('utilizador')) {
          setModalError('username', { type: 'api', message: error.message });
      }
      console.error("Erro submit add user:", error);
    }
     // isSubmitting é gerido pelo RHF
  };

  // --- Funções da Tabela (Update Role, Delete - inalteradas) ---
  const handleRoleChange = async (userId, newRole, selectElement) => {
    // ... (lógica inalterada, já implementada corretamente) ...
     const originalRole = users.find(u => u._id === userId)?.role;
     try {
         await updateUserRole(userId, newRole);
         showToast('Função atualizada com sucesso!', 'success');
         setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, role: newRole } : u));
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar função.', 'error');
         if(selectElement) selectElement.value = originalRole;
     }
  };

  const handleDeleteClick = async (user) => {
    // ... (lógica inalterada, já usa useConfirmation) ...
     try {
         await showConfirmation({
             message: `Tem a certeza que deseja apagar o utilizador "${user.username}"? Esta ação é irreversível.`,
             title: "Confirmar Exclusão de Utilizador",
             confirmText: "Sim, Apagar",
             confirmButtonType: "red",
         });
         try {
             await deleteUser(user._id);
             showToast('Utilizador apagado com sucesso!', 'success');
             loadUsers();
         } catch (error) { showToast(error.message || 'Erro ao apagar utilizador.', 'error'); }
     } catch (error) { /* Cancelado */ }
  };


  // --- Renderização (Tabela inalterada) ---
  const renderTableBody = () => {
    // ... (lógica inalterada) ...
    if (isLoading) return <tr><td colSpan="5"><Spinner message="A carregar utilizadores..." /></td></tr>;
    if (error) return <tr><td colSpan="5" className="text-center error-message">Erro: {error}</td></tr>;
    if (users.length === 0) return <tr><td colSpan="5" className="text-center">Nenhum utilizador encontrado.</td></tr>;
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
                    <select className="admin-users-page__role-select" value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value, e.target)} disabled={disableActions} title={disableReason} >
                        <option value="user">Utilizador</option> <option value="admin">Admin</option>
                    </select>
                </td>
                <td className="admin-users-page__actions">
                    <button className="admin-users-page__action-button admin-users-page__action-button--delete" title={disableReason || "Apagar"} onClick={() => handleDeleteClick(user)} disabled={disableActions} >
                        <i className="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        );
    });
  };

  return (
    <div className="admin-users-page">
      {/* ... Controles e Tabela ... */}
       <div className="admin-users-page__controls">
        <button id="add-user-button" className="admin-users-page__add-button" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Adicionar Utilizador
        </button>
      </div>
      <div className="admin-users-page__table-wrapper">
        <table className="admin-users-page__table">
          <thead><tr><th>ID</th><th>Username</th><th>E-mail</th><th>Função</th><th>Ações</th></tr></thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>


      {/* Modal Adicionar Utilizador (com react-hook-form) */}
      <Modal title="Adicionar Novo Utilizador" isOpen={isModalOpen} onClose={closeModal}>
        {/* handleSubmit(onAddUserSubmit) */}
        <form id="user-form" className="modal-form" onSubmit={handleSubmit(onAddUserSubmit)} noValidate>
            <div className="modal-form__grid">
                {/* Nome */}
                <div className="modal-form__input-group">
                    <label htmlFor="nome">Nome</label>
                    <input type="text" id="nome"
                           className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                           {...register('nome', { required: 'O nome é obrigatório.' })}
                           disabled={isSubmitting} />
                    {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome.message}</div>}
                </div>
                {/* Sobrenome */}
                <div className="modal-form__input-group">
                    <label htmlFor="sobrenome">Sobrenome</label>
                    <input type="text" id="sobrenome"
                           className={`modal-form__input ${modalErrors.sobrenome ? 'input-error' : ''}`}
                           {...register('sobrenome', { required: 'O sobrenome é obrigatório.' })}
                           disabled={isSubmitting} />
                    {modalErrors.sobrenome && <div className="modal-form__error-message">{modalErrors.sobrenome.message}</div>}
                </div>
                {/* Username */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="username">Nome de Utilizador</label>
                    <input type="text" id="username"
                           className={`modal-form__input ${modalErrors.username ? 'input-error' : ''}`}
                           {...register('username', {
                               required: 'O nome de utilizador é obrigatório.',
                               minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
                               maxLength: { value: 50, message: 'Máximo 50 caracteres.'}
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.username && <div className="modal-form__error-message">{modalErrors.username.message}</div>}
                </div>
                {/* Email */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="email">E-mail</label>
                    <input type="email" id="email"
                           className={`modal-form__input ${modalErrors.email ? 'input-error' : ''}`}
                           {...register('email', {
                               required: 'O e-mail é obrigatório.',
                               pattern: { value: /^\S+@\S+\.\S+$/, message: 'Formato de e-mail inválido.' },
                               maxLength: { value: 100, message: 'Máximo 100 caracteres.'}
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.email && <div className="modal-form__error-message">{modalErrors.email.message}</div>}
                </div>
                {/* Password */}
                <div className="modal-form__input-group">
                    <label htmlFor="password">Senha</label>
                    <input type="password" id="password"
                           className={`modal-form__input ${modalErrors.password ? 'input-error' : ''}`}
                           {...register('password', {
                               required: 'A senha é obrigatória.',
                               minLength: { value: 6, message: 'Mínimo 6 caracteres.' }
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.password && <div className="modal-form__error-message">{modalErrors.password.message}</div>}
                </div>
                {/* Confirmar Senha (Adicionado para consistência) */}
                 <div className="modal-form__input-group">
                    <label htmlFor="confirmPassword">Confirmar Senha</label>
                    <input type="password" id="confirmPassword"
                           className={`modal-form__input ${modalErrors.confirmPassword ? 'input-error' : ''}`}
                           {...register('confirmPassword', {
                               required: 'Confirme a senha.',
                               validate: (value) => value === password || 'As senhas não coincidem.'
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.confirmPassword && <div className="modal-form__error-message">{modalErrors.confirmPassword.message}</div>}
                 </div>
                {/* Role */}
                <div className="modal-form__input-group">
                    <label htmlFor="role">Função</label>
                    <select id="role"
                            className="modal-form__input"
                            {...register('role')}
                            disabled={isSubmitting}>
                        <option value="user">Utilizador</option>
                        <option value="admin">Admin</option>
                    </select>
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

    </div>
  );
}

export default AdminUsersPage;