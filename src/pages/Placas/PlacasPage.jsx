// src/pages/PlacasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlacas, deletePlaca, togglePlacaDisponibilidade } from '../../services/api'; // Funções API Placas
import { getRegioes } from '../../state/dataCache'; // Função do estado/cache para regiões
import { useToast } from '../../components/ToastNotification/ToastNotification';
// Importar ConfirmationModal React (se tiver um) ou usar window.confirm
// import ConfirmationModal from '../components/ConfirmationModal';
import PlacaCard from '../../components/PlacaCard/PlacaCard'; // Componente Card
import Spinner from '../../components/Spinner/Spinner';
import './Placas.css'; // CSS da página

const ITEMS_PER_PAGE = 10; // Ou importe de config.js

function PlacasPage() {
  const [placas, setPlacas] = useState([]);
  const [regioes, setRegioes] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalDocs: 0 });
  const [filters, setFilters] = useState({ regiao_id: 'todas', disponibilidade: 'todos', search: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const showToast = useToast();

  // --- Funções de Carregamento ---

  // Carrega regiões para o filtro (usa cache)
  const loadRegioesFilter = useCallback(async () => {
    try {
      const data = await getRegioes(); // Usa cache do state.js
      setRegioes(data);
    } catch (err) {
      console.error("Erro ao carregar regiões para filtro:", err);
      showToast('Erro ao carregar regiões para filtro.', 'error');
    }
  }, [showToast]); // useCallback com dependências

  // Carrega placas com base no estado atual (filtros, página)
  const loadPlacas = useCallback(async (page = pagination.currentPage) => {
    setIsLoading(true);
    setError(null);
    console.log(`Loading placas - Page: ${page}, Filters:`, filters); // Log para depuração
    try {
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        order: 'desc'
      });

      if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.disponibilidade === 'true') params.append('disponivel', 'true');
      else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') {
        params.append('disponivel', 'false');
      }

      const result = await fetchPlacas(params);
      setPlacas(result.data || []);
      setPagination(result.pagination || { currentPage: 1, totalPages: 1, totalDocs: 0 });

    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Erro ao carregar placas.', 'error');
      setPlacas([]); // Limpa placas em caso de erro
      setPagination({ currentPage: 1, totalPages: 1, totalDocs: 0 }); // Reseta paginação
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage, showToast]); // Depende dos filtros e página atual


  // --- Efeitos ---

  // Carrega regiões ao montar
  useEffect(() => {
    loadRegioesFilter();
  }, [loadRegioesFilter]);

  // Carrega placas ao montar ou quando filtros/página mudam
  // Usamos um useEffect separado para evitar recarregar regiões sempre
  useEffect(() => {
    loadPlacas(pagination.currentPage); // Usa a página atual do estado de paginação
  }, [loadPlacas]); // Depende da função loadPlacas (que por sua vez depende dos filtros)

    // Listener para o evento 'search' do Header
    useEffect(() => {
        const handleSearch = (event) => {
            const searchTerm = event.detail.query || '';
            // Atualiza o filtro apenas se o termo mudou e estamos na página certa
            if (window.location.pathname === '/placas') {
                setFilters(prevFilters => {
                    if (prevFilters.search !== searchTerm) {
                         // Volta para a página 1 ao pesquisar
                         setPagination(prev => ({ ...prev, currentPage: 1 }));
                         return { ...prevFilters, search: searchTerm };
                    }
                    return prevFilters; // Sem mudança
                });
            }
        };

        document.addEventListener('search', handleSearch);
        // Cleanup: remove o listener quando o componente desmonta
        return () => {
            document.removeEventListener('search', handleSearch);
        };
    }, []); // Executa apenas uma vez ao montar


  // --- Handlers de Ações ---

  const handleFilterChange = (event) => {
    const { id, value } = event.target;
    const filterName = id.replace('-filter', ''); // ex: 'regiao', 'disponibilidade'

    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
    // Volta para a página 1 ao mudar qualquer filtro
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // O useEffect que depende de 'loadPlacas' (que depende de 'filters') vai recarregar
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      // O useEffect vai recarregar as placas para a nova página
    }
  };

  const handleAddPlaca = () => navigate('/placas/novo');

  const handleEditPlaca = (placaId) => navigate(`/placas/editar/${placaId}`);

  const handleToggleDisponibilidade = async (placaId, buttonElement) => {
     if (!buttonElement || buttonElement.disabled) return;
     buttonElement.disabled = true;
     const originalIconHTML = buttonElement.innerHTML;
     buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

     try {
         await togglePlacaDisponibilidade(placaId);
         showToast('Status da placa atualizado!', 'success');
         loadPlacas(); // Recarrega a página atual
     } catch (error) {
         showToast(error.message || 'Erro ao atualizar status.', 'error');
         buttonElement.innerHTML = originalIconHTML; // Restaura em caso de erro
         buttonElement.disabled = false;
     }
     // Não precisa reabilitar no sucesso, pois loadPlacas() rerenderiza
  };

  const handleDeletePlaca = (placaId, buttonElement) => {
      if (!buttonElement || buttonElement.disabled) return;
      const card = buttonElement.closest('.placa-card');
      const numeroPlaca = card?.querySelector('.placa-card__numero')?.textContent || `ID ${placaId}`;

       // Usar window.confirm como placeholder
       if (window.confirm(`Tem a certeza de que deseja apagar a placa "${numeroPlaca}"?`)) {
           const performDelete = async () => {
               buttonElement.disabled = true;
               buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
               try {
                   await deletePlaca(placaId);
                   showToast('Placa apagada com sucesso!', 'success');
                   // Decide se recarrega a página atual ou vai para a anterior se for o último item
                   if (placas.length === 1 && pagination.currentPage > 1) {
                       handlePageChange(pagination.currentPage - 1);
                   } else {
                       loadPlacas();
                   }
               } catch (error) {
                   showToast(error.message || 'Erro ao apagar placa.', 'error');
                   buttonElement.innerHTML = '<i class="fas fa-trash"></i>'; // Restaura no erro
                   buttonElement.disabled = false;
               }
           };
           performDelete();
       }
       // Se usar Modal de Confirmação React, a lógica de chamada vai aqui
  };

  // --- Renderização ---

  const renderPaginationButtons = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const buttons = [];
    // Botão Anterior
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

    // Botões de Página (simplificado, pode adicionar lógica de '...')
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

    // Botão Próximo
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
              key={placa.id || placa._id} // Usa id ou _id como chave
              placa={placa}
              onToggle={handleToggleDisponibilidade}
              onEdit={handleEditPlaca}
              onDelete={handleDeletePlaca}
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