import React, { useState, useEffect } from 'react';
import { getRegioes, clearRegioesCache } from '../../state/dataCache'; 
import { createRegiao, updateRegiao, deleteRegiao } from '../../services/api'; 
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal'; 
import { useToast } from '../../components/ToastNotification/ToastNotification'; 
import { useConfirmation } from '../../context/ConfirmationContext'; 
import './Regioes.css'; 

function RegioesPage() {
  const [regioes, setRegioes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegiao, setEditingRegiao] = useState(null); 
  const [regiaoNomeInput, setRegiaoNomeInput] = useState(''); 
  const [modalErrors, setModalErrors] = useState({}); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const showToast = useToast();
  const showConfirmation = useConfirmation(); // Inicializa o hook de confirmação

  // Função para carregar regiões (usa o cache/API do state.js)
  const loadRegioes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assumindo que getRegioes é síncrono ou assíncrono e deve ser aguardado
      const data = await getRegioes(); 
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
  }, []); 

  // --- Handlers do Modal ---
  const handleAddClick = () => {
    setEditingRegiao(null);
    setRegiaoNomeInput('');
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (regiao) => {
    setEditingRegiao(regiao);
    setRegiaoNomeInput(regiao.nome);
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRegiao(null);
    setRegiaoNomeInput('');
    setModalErrors({});
    setIsSubmitting(false);
  };
   
  // Validação e submissão do formulário do modal
  const handleModalSubmit = async (event) => {
        event.preventDefault();
        setModalErrors({}); 
        setIsSubmitting(true);

        const validationRules = {
            nome: [{ type: 'required', message: 'O nome da região é obrigatório.' }, { type: 'maxLength', param: 100 }]
        };

        // Lógica de validação manual
        let isValid = true;
        const newErrors = {};
        
        // Validação de Requisitado
        if (!regiaoNomeInput || String(regiaoNomeInput).trim() === '') {
            newErrors.nome = 'O nome da região é obrigatório.';
            isValid = false;
        } 
        
        // Validação de Tamanho Máximo
        if (isValid && regiaoNomeInput.length > 100) {
            newErrors.nome = 'O nome não pode exceder 100 caracteres.';
            isValid = false;
        }

        setModalErrors(newErrors);

        if (!isValid) {
          showToast('Formulário inválido.', 'error');
          setIsSubmitting(false);
          return;
        }

        // Caso Edição sem alteração
        if (editingRegiao && regiaoNomeInput === editingRegiao.nome) {
            handleCloseModal();
            return;
        }

        try {
          if (editingRegiao) {
            await updateRegiao(editingRegiao._id, { nome: regiaoNomeInput }); 
            showToast('Região atualizada com sucesso!', 'success');
          } else {
            await createRegiao({ nome: regiaoNomeInput });
            showToast('Região criada com sucesso!', 'success');
          }
          
          clearRegioesCache(); // Limpa o cache para forçar a recarga
          handleCloseModal(); 
          loadRegioes(); 
        } catch (error) {
          showToast(error.message || 'Erro ao guardar região.', 'error');
        } finally {
           setIsSubmitting(false);
        }
   };
  
  // Função refatorada para usar o useConfirmation
  const handleDeleteClick = async (regiao) => {
    try {
        // 1. Abre o modal de confirmação e aguarda o resultado
        await showConfirmation({
            message: `Tem a certeza de que deseja apagar a região "${regiao.nome}"? Esta ação não pode ser desfeita.`,
            title: "Confirmar Exclusão de Região",
            confirmText: "Sim, Apagar",
            confirmButtonType: "red", // Usa o botão vermelho
        });

        // 2. Se o usuário confirmou (a Promise foi resolvida), executa a exclusão
        try {
            await deleteRegiao(regiao._id);
            clearRegioesCache(); 
            showToast('Região apagada com sucesso!', 'success');
            loadRegioes(); 
        } catch (error) {
            showToast(error.message || 'Erro ao apagar região.', 'error');
        }

    } catch (error) {
        // 3. Se o usuário cancelou ou fechou o modal (a Promise foi rejeitada)
        if (error.message === "Ação cancelada pelo usuário.") {
           // Opcional: Apenas loga que foi cancelado sem mostrar Toast
           console.log("Exclusão de região cancelada.");
        } else {
           // Trata outros erros de rejeição da promessa, se houver
        }
    }
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
      <tr key={regiao._id}>
        <td>{regiao._id}</td>
        <td>{regiao.nome}</td>
        <td className="regioes-page__actions">
          <button
            className="regioes-page__action-button regioes-page__action-button--edit"
            title="Editar"
            onClick={() => handleEditClick(regiao)} 
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
          <button
            className="regioes-page__action-button regioes-page__action-button--delete"
            title="Apagar"
            onClick={() => handleDeleteClick(regiao)} 
          >
            <i className="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    ));
  };
  
  return (
    <div className="regioes-page">
      <div className="regioes-page__header">
        <h1 className="regioes-page__title">Gerenciar Regiões</h1>
        <div className="regioes-page__controls">
          <button id="add-regiao-button" className="regioes-page__add-button" onClick={handleAddClick}>
            <i className="fas fa-plus"></i> Adicionar Região
          </button>
        </div>
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

      {/* Modal Adicionar/Editar */}
      <Modal
        title={editingRegiao ? 'Editar Região' : 'Adicionar Região'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      >
        <form id="regiao-form" className="modal-form" onSubmit={handleModalSubmit} noValidate>
          <div className="modal-form__grid"> 
            <div className="modal-form__input-group modal-form__input-group--full"> 
              <label htmlFor="nome">Nome da Região</label>
              <input
                type="text"
                id="nome"
                name="nome"
                className={`modal-form__input ${modalErrors.nome ? 'input-error' : ''}`}
                value={regiaoNomeInput}
                onChange={(e) => setRegiaoNomeInput(e.target.value)}
                required
                disabled={isSubmitting} 
              />
              {modalErrors.nome && <div className="modal-form__error-message">{modalErrors.nome}</div>}
            </div>
          </div>
          <div className="modal-form__actions">
            <button
                type="button"
                className="modal-form__button modal-form__button--cancel"
                onClick={handleCloseModal}
                disabled={isSubmitting} 
             >
                Cancelar
             </button>
            <button
                type="submit"
                className="modal-form__button modal-form__button--confirm"
                disabled={isSubmitting} 
            >
              {isSubmitting ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RegioesPage;