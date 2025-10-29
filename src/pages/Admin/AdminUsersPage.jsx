// src/pages/Admin/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
// import { useForm } from 'react-hook-form'; // Não é mais usado diretamente aqui
import { fetchAllUsers, updateUserRole, deleteUser, createUser } from '../../services/api'; //
import { useToast } from '../../components/ToastNotification/ToastNotification'; //
import { useAuth } from '../../context/AuthContext'; //
import Spinner from '../../components/Spinner/Spinner'; //
import Modal from '../../components/Modal/Modal'; //
import { useConfirmation } from '../../context/ConfirmationContext'; //
import UserTable from '../../components/UserTable/UserTable';
import UserModalForm from '../../components/UserModalForm/UserModalForm';
import './AdminUsers.css'; //

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const showToast = useToast();
  const { user: loggedInUser } = useAuth();
  const showConfirmation = useConfirmation();

  // --- Funções de Carregamento ---
  const loadUsers = useCallback(async () => { //
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAllUsers(); //
        setUsers(data);
      } catch (err) {
        setError(err.message);
        showToast(err.message || 'Erro ao carregar utilizadores.', 'error');
      } finally {
        setIsLoading(false);
      }
  }, [showToast]);

  useEffect(() => { //
    loadUsers();
  }, [loadUsers]);

  // --- Funções do Modal ---
  const openAddModal = () => { //
    setIsModalOpen(true);
  };

  const closeModal = () => { //
    setIsModalOpen(false);
  };

  const onAddUserSubmit = async (dataFromForm, setModalErrorRHF) => { //
    setIsSubmittingForm(true);
    try {
      const dataToSend = { ...dataFromForm };
      // Remove o campo 'role' antes de enviar
      delete dataToSend.role;

      await createUser(dataToSend); //
      showToast('Utilizador criado com sucesso!', 'success');
      closeModal();
      loadUsers();
    } catch (error) {
      showToast(error.message || 'Erro ao criar utilizador.', 'error');
      if (setModalErrorRHF) { //
          if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('e-mail')) { //
             setModalErrorRHF('email', { type: 'api', message: error.message });
          } else if (error.message.toLowerCase().includes('username') || error.message.toLowerCase().includes('utilizador')) { //
              setModalErrorRHF('username', { type: 'api', message: error.message });
          }
      }
      console.error("Erro submit add user:", error); //
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // --- Funções da Tabela ---
  const handleRoleChange = async (userId, newRole, selectElement) => { //
     const originalRole = users.find(u => u._id === userId)?.role;
     try {
         await updateUserRole(userId, newRole); //
         showToast('Função atualizada com sucesso!', 'success');
         setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, role: newRole } : u));
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar função.', 'error');
         if(selectElement) selectElement.value = originalRole; //
     }
  };

  const handleDeleteClick = async (user) => { //
     try {
         await showConfirmation({ //
             message: `Tem a certeza que deseja apagar o utilizador "${user.username}"? Esta ação é irreversível.`, //
             title: "Confirmar Exclusão de Utilizador", //
             confirmText: "Sim, Apagar", //
             confirmButtonType: "red", //
         });
         try {
             await deleteUser(user._id); //
             showToast('Utilizador apagado com sucesso!', 'success');
             loadUsers();
         } catch (error) {
             showToast(error.message || 'Erro ao apagar utilizador.', 'error');
         }
     } catch (error) {
         if (error.message !== "Ação cancelada pelo usuário.") { //
            console.error("Erro no processo de confirmação:", error);
         } else {
            console.log("Exclusão cancelada.");
         }
     }
  };

  // --- Renderização ---
  const renderTableContent = () => { //
    if (isLoading) {
      return (
        <tbody>
          <tr><td colSpan="5"><Spinner message="A carregar utilizadores..." /></td></tr>
        </tbody>
      );
    }
    if (error) {
      return (
        <tbody>
          <tr><td colSpan="5" className="text-center error-message">Erro: {error}</td></tr>
        </tbody>
      );
    }
    if (users.length === 0) { //
      return (
        <tbody>
          <tr><td colSpan="5" className="text-center">Nenhum utilizador encontrado.</td></tr>
        </tbody>
      );
    }
    return (
      <UserTable
        users={users}
        loggedInUserId={loggedInUser?.id}
        onRoleChange={handleRoleChange}
        onDeleteClick={handleDeleteClick}
      />
    );
  };

  return (
    <div className="admin-users-page"> {/* */}
       <div className="admin-users-page__controls"> {/* */}
          <button id="add-user-button" className="admin-users-page__add-button" onClick={openAddModal}> {/* */}
              <i className="fas fa-plus"></i> Adicionar Utilizador
          </button>
      </div>

      <div className="admin-users-page__table-wrapper"> {/* */}
        {/* --- CORREÇÃO: Remover espaço em branco aqui --- */}
        <table className="admin-users-page__table"> {/* */}
           <thead>
                <tr><th>ID</th><th>Username</th><th>E-mail</th><th>Função</th><th>Ações</th></tr>
            </thead>
           {renderTableContent()}
        </table>
      </div>

      <Modal title="Adicionar Novo Utilizador" isOpen={isModalOpen} onClose={closeModal}> {/* */}
        <UserModalForm
            onSubmit={onAddUserSubmit}
            onClose={closeModal}
            isSubmitting={isSubmittingForm}
        />
      </Modal>

    </div>
  );
}

export default AdminUsersPage;