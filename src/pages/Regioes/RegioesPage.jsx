// src/pages/RegioesPage.jsx
import React, { useState, useEffect } from 'react';
import { getRegioes, clearRegioesCache } from '../../state/dataCache'; // Funções do estado/cache
import { createRegiao, updateRegiao, deleteRegiao } from '../../services/api'; // Funções API
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal'; // O novo componente Modal
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { validateForm } from '../../utils/validator'; // Validação
// Importar ConfirmationModal React (se tiver um) ou usar window.confirm
// import ConfirmationModal from '../components/ConfirmationModal';
import './Regioes.css'; // CSS da página

function RegioesPage() {
  const [regioes, setRegioes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegiao, setEditingRegiao] = useState(null); // Guarda a região a editar (ou null para adicionar)
  const [regiaoNomeInput, setRegiaoNomeInput] = useState(''); // Estado para o input do modal
  const [modalErrors, setModalErrors] = useState({}); // Erros de validação do modal
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de submissão do modal

  // Confirmação de exclusão (exemplo simples com estado, idealmente seria um componente modal separado)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [regiaoToDelete, setRegiaoToDelete] = useState(null);

  const showToast = useToast();

  // Função para carregar regiões (usa o cache/API do state.js)
  const loadRegioes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRegioes(); // Usa a função do state.js
      setRegioes(data);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Erro ao buscar regiões.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega regiões ao montar o componente
  useEffect(() => {
    loadRegioes();
  }, []); // Executa apenas uma vez

  // Abre o modal para Adicionar
  const handleAddClick = () => {
    setEditingRegiao(null);
    setRegiaoNomeInput('');
    setModalErrors({});
    setIsModalOpen(true);
  };

  // Abre o modal para Editar
  const handleEditClick = (regiao) => {
    setEditingRegiao(regiao);
    setRegiaoNomeInput(regiao.nome); // Preenche o input
    setModalErrors({});
    setIsModalOpen(true);
  };

  // Fecha o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRegiao(null); // Limpa estado de edição
    setRegiaoNomeInput('');
    setModalErrors({});
    setIsSubmitting(false); // Garante que o estado de submissão é resetado
  };

  // Validação e submissão do formulário do modal
  const handleModalSubmit = async (event) => {
    event.preventDefault();
    setModalErrors({}); // Limpa erros
    setIsSubmitting(true);

    const validationRules = {
        nome: [{ type: 'required', message: 'O nome da região é obrigatório.' }, { type: 'maxLength', param: 100 }]
    };

    // Valida apenas o campo 'nome' com o valor do estado 'regiaoNomeInput'
    let isValid = true;
    const newErrors = {};
    const value = regiaoNomeInput;
    for (const rule of validationRules.nome) {
        let isValidForRule = true;
        let errorMessage = rule.message || 'Valor inválido.';

         switch (rule.type) {
             case 'required':
                 isValidForRule = value && String(value).trim() !== '';
                 break;
             case 'maxLength':
                 isValidForRule = String(value).length <= rule.param;
                 break;
         }
         if (!isValidForRule) {
             newErrors.nome = errorMessage;
             isValid = false;
             break; // Para no primeiro erro para este campo
         }
    }
    setModalErrors(newErrors);


    if (!isValid) {
      showToast('Formulário inválido.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Se for edição e o nome não mudou, apenas fecha
    if (editingRegiao && regiaoNomeInput === editingRegiao.nome) {
        handleCloseModal();
        return;
    }

    try {
      if (editingRegiao) {
        await updateRegiao(editingRegiao._id, { nome: regiaoNomeInput }); // Usa _id
        showToast('Região atualizada com sucesso!', 'success');
      } else {
        await createRegiao({ nome: regiaoNomeInput });
        showToast('Região criada com sucesso!', 'success');
      }
      clearRegioesCache(); // Limpa o cache
      handleCloseModal(); // Fecha o modal
      loadRegioes(); // Recarrega a lista
    } catch (error) {
      showToast(error.message || 'Erro ao guardar região.', 'error');
       // Mantém o modal aberto e reabilita o botão
       setIsSubmitting(false);
    }
     // finally não é necessário aqui, pois o estado isSubmitting controla o botão
  };

  // Abre a confirmação para apagar
  const handleDeleteClick = (regiao) => {
     setRegiaoToDelete(regiao);
     setShowConfirmDelete(true); // Abre confirmação (usando window.confirm por agora)

     // Usando window.confirm como placeholder:
     if (window.confirm(`Tem a certeza de que deseja apagar a região "${regiao.nome}"?`)) {
         confirmDelete(); // Chama a função de apagar diretamente
     } else {
         // Cancela a exclusão se usar window.confirm
         setRegiaoToDelete(null);
         setShowConfirmDelete(false);
     }

     // Lógica com Modal de Confirmação React (quando tiver um):
     // setShowConfirmDelete(true);
  };

    // Função chamada ao confirmar a exclusão (seja por window.confirm ou modal)
    const confirmDelete = async () => {
        if (!regiaoToDelete) return;
        const idToDelete = regiaoToDelete._id; // Usa _id

        // Opcional: Mostrar feedback visual na linha ou botão
        // Idealmente, desabilitaria o botão de apagar da linha específica

        try {
            await deleteRegiao(idToDelete);
            clearRegioesCache(); // Limpa cache
            showToast('Região apagada com sucesso!', 'success');
            loadRegioes(); // Recarrega
        } catch (error) {
            showToast(error.message || 'Erro ao apagar região.', 'error');
            // Reabilitaria o botão de apagar se desabilitado
        } finally {
            // Fecha o modal de confirmação e limpa o estado (se usar modal React)
             setShowConfirmDelete(false);
             setRegiaoToDelete(null);
        }
    };

    // Função para cancelar a exclusão (se usar modal React)
    const cancelDelete = () => {
         setShowConfirmDelete(false);
         setRegiaoToDelete(null);
    };


  // --- Renderização ---
  const renderTableBody = () => {
    if (isLoading) {
      return <tr><td colSpan="3"><Spinner message="A carregar regiões..." /></td></tr>;
    }
    if (error) {
      return <tr><td colSpan="3" className="text-center error-message">Erro: {error}</td></tr>;
    }
    if (regioes.length === 0) {
      return <tr><td colSpan="3" className="text-center">Nenhuma região encontrada.</td></tr>;
    }
    return regioes.map(regiao => (
      // Usa _id como key e para as ações
      <tr key={regiao._id}>
        <td>{regiao._id}</td>
        <td>{regiao.nome}</td>
        <td className="regioes-page__actions">
          <button
            className="regioes-page__action-button regioes-page__action-button--edit"
            title="Editar"
            onClick={() => handleEditClick(regiao)} // Passa o objeto regiao
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button
            className="regioes-page__action-button regioes-page__action-button--delete"
            title="Apagar"
            onClick={() => handleDeleteClick(regiao)} // Passa o objeto regiao
          >
            <i className="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="regioes-page">
      <div className="regioes-page__controls">
        <button id="add-regiao-button" className="regioes-page__add-button" onClick={handleAddClick}>
          <i className="fas fa-plus"></i> Adicionar Região
        </button>
      </div>
      <div className="regioes-page__table-wrapper">
        <table className="regioes-page__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome da Região</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="regioes-table-body">
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Modal para Adicionar/Editar */}
      <Modal
        title={editingRegiao ? 'Editar Região' : 'Adicionar Região'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      >
        {/* O formulário é renderizado como children do Modal */}
        <form id="regiao-form" className="modal-form" onSubmit={handleModalSubmit} noValidate>
          <div className="modal-form__grid"> {/* Garante grid se necessário */}
            <div className="modal-form__input-group modal-form__input-group--full"> {/* Garante largura total */}
              <label htmlFor="nome">Nome da Região</label>
              <input
                type="text"
                id="nome"
                name="nome"
                className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                value={regiaoNomeInput}
                onChange={(e) => setRegiaoNomeInput(e.target.value)}
                required
                disabled={isSubmitting} // Desabilita durante a submissão
              />
              {/* Exibe erro de validação */}
              {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome}</div>}
            </div>
          </div>
          <div className="modal-form__actions">
            <button
                type="button"
                className="modal-form__button modal-form__button--cancel"
                onClick={handleCloseModal}
                disabled={isSubmitting} // Desabilita durante a submissão
             >
                Cancelar
             </button>
            <button
                type="submit"
                className="modal-form__button modal-form__button--confirm"
                disabled={isSubmitting} // Desabilita durante a submissão
            >
              {isSubmitting ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação (Placeholder com window.confirm, ou usar um componente React) */}
       {/* {showConfirmDelete && regiaoToDelete && (
           <ConfirmationModal
               message={`Tem a certeza que deseja apagar a região "${regiaoToDelete.nome}"?`}
               onConfirm={confirmDelete}
               onCancel={cancelDelete}
           />
       )} */}

    </div>
  );
}

export default RegioesPage;