// src/pages/PlacasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlacas, deletePlaca, togglePlacaDisponibilidade } from '../../services/api';
import { getRegioes } from '../../state/dataCache'; 
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< NOVO HOOK
import PlacaCard from '../../components/PlacaCard/PlacaCard'; 
import Spinner from '../../components/Spinner/Spinner';
import './Placas.css'; // CSS da página

const ITEMS_PER_PAGE = 10; 

function PlacasPage() {
  const [placas, setPlacas] = useState([]);
  const [regioes, setRegioes] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalDocs: 0 });
  const [filters, setFilters] = useState({ regiao_id: 'todas', disponibilidade: 'todos', search: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const showToast = useToast();
  const showConfirmation = useConfirmation(); // Inicializa o hook de confirmação

  // --- Funções de Carregamento ---

  // Carrega regiões para o filtro (usa cache)
  const loadRegioesFilter = useCallback(async () => {
    try {
      const data = await getRegioes(); 
      setRegioes(data);
    } catch (err) {
      console.error("Erro ao carregar regiões para filtro:", err);
      showToast('Erro ao carregar regiões para filtro.', 'error');
    }
  }, [showToast]); 

  // Carrega placas com base no estado atual (filtros, página)
  const loadPlacas = useCallback(async (page = pagination.currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        order: 'desc'
      });

      if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
      if (filters.search) params.append('search', filters.search);
      
      if (filters.disponibilidade === 'true') {
          params.append('disponivel', 'true');
      } else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') {
          params.append('disponivel', 'false');
      }

      const result = await fetchPlacas(params);
      setPlacas(result.data || []);
      setPagination(result.pagination || { currentPage: 1, totalPages: 1, totalDocs: 0 });

    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Erro ao carregar placas.', 'error');
      setPlacas([]); 
      setPagination({ currentPage: 1, totalPages: 1, totalDocs: 0 }); 
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage, showToast]); 


  // --- Efeitos ---

  useEffect(() => {
    loadRegioesFilter();
  }, [loadRegioesFilter]);

  useEffect(() => {
    loadPlacas(pagination.currentPage); 
  }, [loadPlacas]); 

    // Listener para o evento 'search' do Header
    useEffect(() => {
        const handleSearch = (event) => {
            const searchTerm = event.detail.query || '';
            if (window.location.pathname === '/placas') {
                setFilters(prevFilters => {
                    if (prevFilters.search !== searchTerm) {
                         setPagination(prev => ({ ...prev, currentPage: 1 }));
                         return { ...prevFilters, search: searchTerm };
                    }
                    return prevFilters;
                });
            }
        };

        document.addEventListener('search', handleSearch);
        return () => {
            document.removeEventListener('search', handleSearch);
        };
    }, []); 


  // --- Handlers de Ações ---

  const handleFilterChange = (event) => {
    const { id, value } = event.target;
    const filterName = id.replace('-filter', ''); 

    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleAddPlaca = () => navigate('/placas/novo');

  const handleEditPlaca = (placaId) => navigate(`/placas/editar/${placaId}`);

  // Alterna o status de disponibilidade
  const handleToggleDisponibilidade = async (placaId, buttonElement) => {
     // A lógica de desabilitar/spinner deve ser gerenciada pelo estado local do PlacaCard
     // ou pelo estado global do ConfirmationContext (se fosse pedido confirmação).
     // Aqui, fazemos a chamada direta
     if (!buttonElement) return;

     // Feedback visual temporário direto no botão (opcional)
     const originalIconHTML = buttonElement.innerHTML;
     buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
     buttonElement.disabled = true;

     try {
         await togglePlacaDisponibilidade(placaId);
         showToast('Status da placa atualizado com sucesso!', 'success');
         loadPlacas(); // Recarrega a página atual para refletir a mudança
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar status da placa.', 'error');
         // Restaura o botão em caso de erro
         buttonElement.innerHTML = originalIconHTML;
         buttonElement.disabled = false;
     }
  };

  /**
   * Função de exclusão refatorada para usar useConfirmation.
   */
  const handleDeletePlaca = async (placaId, buttonElement) => {
    // Tenta pegar o número da placa do estado para a mensagem
    const placaToDelete = placas.find(p => String(p.id || p._id) === String(placaId));
    const numeroPlaca = placaToDelete?.numero_placa || `ID ${placaId}`;

    try {
        // 1. Abre o modal de confirmação e aguarda a confirmação
        await showConfirmation({
            message: `Tem a certeza de que deseja apagar a placa "${numeroPlaca}"? Esta ação não pode ser desfeita.`,
            title: "Confirmar Exclusão de Placa",
            confirmText: "Sim, Apagar",
            confirmButtonType: "red", 
        });

        // 2. Se confirmado, executa a exclusão
        try {
            // Feedback visual: desabilita o botão *temporariamente* no Card que chamou
            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            
            await deletePlaca(placaId); 
            showToast('Placa apagada com sucesso!', 'success');
            
            // Lógica para recarregar a página correta após a exclusão
            if (placas.length === 1 && pagination.currentPage > 1) {
                handlePageChange(pagination.currentPage - 1);
            } else {
                loadPlacas();
            }

        } catch (error) {
            showToast(error.message || 'Erro ao apagar placa.', 'error');
            // Restaura botão em caso de erro
            if (buttonElement) {
                 buttonElement.innerHTML = '<i class="fas fa-trash"></i>';
                 buttonElement.disabled = false;
            }
        }

    } catch (error) {
        // 3. Usuário cancelou ou fechou o modal
        if (error.message !== "Ação cancelada pelo usuário.") {
            console.error("Erro no processo de confirmação:", error);
        }
    }
  };


  // --- Renderização ---

  const renderPaginationButtons = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const buttons = [];
    buttons.push(
      <button
        key="prev"
        className="placas-page__pagination-button"
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
      >
        &laquo; Ant
      </button>
    );

    for (let i = 1; i <= pagination.totalPages; i++) {
      buttons.push(
        <button
          key={i}
          className={`placas-page__pagination-button ${i === pagination.currentPage ? 'placas-page__pagination-button--active' : ''}`}
          onClick={() => handlePageChange(i)}
          disabled={i === pagination.currentPage}
        >
          {i}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        className="placas-page__pagination-button"
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage === pagination.totalPages}
      >
        Próx &raquo;
      </button>
    );
    return buttons;
  };


  return (
    <div className="placas-page">
      <div className="placas-page__controls">
        <div className="placas-page__filters">
          <select
            id="regiao-filter"
            className="placas-page__filter-select"
            value={filters.regiao_id}
            onChange={handleFilterChange}
            disabled={isLoading}
          >
            <option value="todas">Todas as Regiões</option>
            {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
          </select>
          <select
            id="disponibilidade-filter"
            className="placas-page__filter-select"
            value={filters.disponibilidade}
            onChange={handleFilterChange}
            disabled={isLoading}
          >
            <option value="todos">Todos Status</option>
            <option value="true">Disponível</option>
            <option value="false">Indisponível (Alugada)</option>
            <option value="manutencao">Em Manutenção</option>
          </select>
        </div>
        <button
            id="add-placa-button"
            className="placas-page__add-button"
            onClick={handleAddPlaca}
            disabled={isLoading}
        >
          <i className="fas fa-plus"></i> Adicionar Placa
        </button>
      </div>

      <div id="placas-grid" className="placas-page__placas-grid">
        {isLoading ? (
          <Spinner message="A carregar placas..." />
        ) : error ? (
          <div className="placas-page__error">Erro: {error}</div>
        ) : placas.length > 0 ? (
          placas.map(placa => (
            <PlacaCard
              key={placa.id || placa._id} 
              placa={placa}
              onToggle={handleToggleDisponibilidade}
              onEdit={handleEditPlaca}
              onDelete={handleDeletePlaca} // <<< CHAMA NOVO HOOK
            />
          ))
        ) : (
          <div className="placas-page__no-results">Nenhuma placa encontrada com os filtros atuais.</div>
        )}
      </div>

      <div id="pagination-container" className="placas-page__pagination">
        {!isLoading && renderPaginationButtons()}
      </div>
    </div>
  );
}

export default PlacasPage;