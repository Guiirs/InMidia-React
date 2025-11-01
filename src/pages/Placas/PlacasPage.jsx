// src/pages/Placas/PlacasPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// *** 🐞 CORREÇÃO: Corrigido 'fetchRegiões' para 'fetchRegioes' (sem acento) ***
import { fetchPlacas, deletePlaca, togglePlacaDisponibilidade, fetchRegioes } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';
import PlacaCard from '../../components/PlacaCard/PlacaCard';
import Spinner from '../../components/Spinner/Spinner';
import './Placas.css';

const ITEMS_PER_PAGE = 10; // Ou importe de config.js

function PlacasPage() {
  const [filters, setFilters] = useState({ regiao_id: 'todas', disponibilidade: 'todos', search: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const showToast = useToast();
  const showConfirmation = useConfirmation();
  const queryClient = useQueryClient();

  // --- useQuery para Regiões (Filtro) ---
  const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
    queryKey: ['regioes'],
    queryFn: fetchRegioes, // Agora corresponde à importação correta
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
  });

  // --- useQuery para Placas ---
  const queryKeyPlacas = ['placas', filters, currentPage];
  const {
    data: placasData,
    isLoading: isLoadingPlacas,
    isError: isErrorPlacas,
    error: errorPlacas,
    isPlaceholderData,
  } = useQuery({
    queryKey: queryKeyPlacas,
    queryFn: async ({ queryKey }) => {
      const [_key, currentFilters, page] = queryKey;
      if (import.meta.env.DEV) console.log(`Fetching placas - Page: ${page}, Filters:`, currentFilters);
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        order: 'asc' // Ordenar da mais antiga para a mais nova
      });
      if (currentFilters.regiao_id !== 'todas') params.append('regiao_id', currentFilters.regiao_id);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.disponibilidade === 'true') params.append('disponivel', 'true');
      else if (currentFilters.disponibilidade === 'false' || currentFilters.disponibilidade === 'manutencao') {
          params.append('disponivel', 'false');
      }
      const result = await fetchPlacas(params);
      return result;
    },
    placeholderData: (previousData) => previousData,
  });

  const placas = placasData?.data ?? [];
  const pagination = placasData?.pagination ?? { currentPage: 1, totalPages: 1, totalDocs: 0 };

  // --- Mutações (Delete, Toggle) ---

  // Mutação para Apagar Placa
  const deleteMutation = useMutation({
    mutationFn: deletePlaca,
    onSuccess: (_, placaId) => {
      showToast('Placa apagada com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeyPlacas });

      const validPlacasCount = placas.filter(p => !!p).length;
      
      if (validPlacasCount === 1 && currentPage > 1) {
          const prevPage = currentPage - 1;
          queryClient.prefetchQuery({
              queryKey: ['placas', filters, prevPage],
              queryFn: async () => {
                  const params = new URLSearchParams({
                    page: prevPage,
                    limit: ITEMS_PER_PAGE,
                    sortBy: 'createdAt',
                    order: 'asc' 
                  });
                   if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
                   if (filters.search) params.append('search', filters.search);
                   if (filters.disponibilidade === 'true') params.append('disponivel', 'true');
                   else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') {
                       params.append('disponivel', 'false');
                   }
                  return await fetchPlacas(params);
              }
          });
           setCurrentPage(prevPage);
      }
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao apagar placa.', 'error');
    }
  });

  // Mutação para Alternar Disponibilidade
  const toggleMutation = useMutation({
    mutationFn: togglePlacaDisponibilidade,
    onSuccess: (updatedPlaca) => {
      showToast('Status da placa atualizado!', 'success');
      
      queryClient.setQueryData(queryKeyPlacas, (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          
          const updatedPlacaId = updatedPlaca.id || updatedPlaca._id;

          return {
              ...oldData,
              data: oldData.data
                  .filter(p => !!p) 
                  .map(p => {
                      const currentPlacaId = p.id || p._id;
                      return currentPlacaId === updatedPlacaId ? updatedPlaca : p;
                  }
              )
          };
      });
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao atualizar status.', 'error');
    }
  });

  const isLoading = isLoadingRegioes || isLoadingPlacas;

  // --- Efeito para pré-buscar próxima página ---
  useEffect(() => {
    if (!isPlaceholderData && pagination.totalPages > currentPage) {
      queryClient.prefetchQuery({
        queryKey: ['placas', filters, currentPage + 1],
        queryFn: async () => {
          const nextPage = currentPage + 1;
          const params = new URLSearchParams({ 
              page: nextPage, 
              limit: ITEMS_PER_PAGE,
              sortBy: 'createdAt',
              order: 'asc'
            });
          if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
          if (filters.search) params.append('search', filters.search);
          if (filters.disponibilidade === 'true') params.append('disponivel', 'true');
          else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') params.append('disponivel', 'false');
          if (import.meta.env.DEV) console.log(`Prefetching page ${nextPage}`);
          return await fetchPlacas(params);
        },
      });
    }
  }, [placasData, isPlaceholderData, currentPage, pagination.totalPages, queryClient, filters]);


  // --- Listener para 'search' do Header ---
  useEffect(() => {
    const handleSearch = (event) => {
      const searchTerm = event.detail.query || '';
      if (window.location.pathname === '/placas') {
        setFilters(prevFilters => ({ ...prevFilters, search: searchTerm }));
        setCurrentPage(1);
      }
    };
    document.addEventListener('search', handleSearch);
    return () => document.removeEventListener('search', handleSearch);
  }, []);

  // --- Handlers de Ações ---
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
        ...prevFilters,
        [name]: value
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddPlaca = () => navigate('/placas/novo');
  const handleEditPlaca = (placaId) => navigate(`/placas/editar/${placaId}`);

  const handleToggleDisponibilidade = (placaId, buttonElement) => {
      toggleMutation.mutate(placaId);
  };

  const handleDeletePlaca = async (placaId, buttonElement) => {
    const placaToDelete = placas.filter(p => !!p).find(p => String(p.id || p._id) === String(placaId));
    const numeroPlaca = placaToDelete?.numero_placa || `ID ${placaId}`;

    try {
      await showConfirmation({
        message: `Tem a certeza que deseja apagar a placa "${numeroPlaca}"?`,
        title: "Confirmar Exclusão",
        confirmButtonType: "red",
      });
      deleteMutation.mutate(placaId);
    } catch {
      // Cancelado
    }
  };


  // --- Renderização ---
  const renderPaginationButtons = () => {
      if (!pagination || pagination.totalPages <= 1) return null;
      const buttons = [];
      buttons.push( <button key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isPlaceholderData}> &laquo; Ant </button> );
      for (let i = 1; i <= pagination.totalPages; i++) { buttons.push( <button key={i} className={i === currentPage ? 'placas-page__pagination-button--active' : ''} onClick={() => handlePageChange(i)} disabled={i === currentPage || isPlaceholderData}> {i} </button> ); }
      buttons.push( <button key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || isPlaceholderData}> Próx &raquo; </button> );
      return buttons.map(btn => React.cloneElement(btn, { className: `${btn.props.className || ''} placas-page__pagination-button` }));
   };


  return (
    <div className="placas-page">
      <div className="placas-page__controls">
        <div className="placas-page__filters">
          <select
            id="regiao-filter"
            name="regiao_id" 
            className="placas-page__filter-select"
            value={filters.regiao_id}
            onChange={handleFilterChange}
            disabled={isLoadingRegioes || isLoadingPlacas}
          >
            <option value="todas">Todas as Regiões</option>
            {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
          </select>
          
          <select
            id="disponibilidade-filter"
            name="disponibilidade"
            className="placas-page__filter-select"
            value={filters.disponibilidade}
            onChange={handleFilterChange}
            disabled={isLoadingPlacas}
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
            disabled={isLoadingPlacas}
        >
          <i className="fas fa-plus"></i> Adicionar Placa
        </button>
      </div>

      <div id="placas-grid" className="placas-page__placas-grid">
        {isLoadingPlacas && placas.length === 0 ? (
          <Spinner message="A carregar placas..." />
        ) : isErrorPlacas ? (
          <div className="placas-page__error">Erro: {errorPlacas.message}</div>
        ) : placas.length > 0 ? (
          placas
            .filter(placa => !!placa) 
            .map((placa, index) => { 
                const placaId = placa.id || placa._id;
                if (!placaId) return null; 
                
                const sequentialNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                return (
                    <PlacaCard
                    key={placaId}
                    placa={placa}
                    sequentialNumber={sequentialNumber} 
                    onToggle={handleToggleDisponibilidade}
                    onEdit={handleEditPlaca}
                    onDelete={handleDeletePlaca}
                    isToggling={toggleMutation.isPending && toggleMutation.variables === placaId}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === placaId}
                    />
                );
            })
        ) : (
          (placas.filter(p => !!p).length === 0 && placasData?.pagination?.totalDocs > 0) ?
            <div className="placas-page__no-results">Problema ao carregar dados. Tente atualizar a página.</div> :
            <div className="placas-page__no-results">Nenhuma placa encontrada com os filtros atuais.</div>
        )}
      </div>

      <div id="pagination-container" className="placas-page__pagination">
        {!isLoadingPlacas && renderPaginationButtons()}
      </div>
    </div>
  );
}

export default PlacasPage;