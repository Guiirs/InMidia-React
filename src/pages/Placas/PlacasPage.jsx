// src/pages/Placas/PlacasPage.jsx
import React, { useState, useEffect } from 'react'; // Removido useCallback
import { useNavigate } from 'react-router-dom';
// 1. Importar hooks do React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Importa funções da API diretamente (não precisamos mais do dataCache para regioes aqui)
import { fetchPlacas, deletePlaca, togglePlacaDisponibilidade, fetchRegioes } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';
import PlacaCard from '../../components/PlacaCard/PlacaCard';
import Spinner from '../../components/Spinner/Spinner';
import './Placas.css';

const ITEMS_PER_PAGE = 10; // Ou importe de config.js

function PlacasPage() {
  // Estados locais para filtros e página atual
  const [filters, setFilters] = useState({ regiao_id: 'todas', disponibilidade: 'todos', search: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const showToast = useToast();
  const showConfirmation = useConfirmation();
  const queryClient = useQueryClient(); // Obter o cliente Query

  // --- 2. useQuery para Regiões (usado no filtro) ---
  const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
    queryKey: ['regioes'], // Chave para cache das regiões
    queryFn: fetchRegioes, // Função da API para buscar regiões
    staleTime: 1000 * 60 * 60, // Cache de 1 hora para regiões (exemplo)
    placeholderData: [], // Evita 'undefined' na primeira renderização
  });

  // --- 3. useQuery para Placas (depende de filtros e página) ---
  const queryKeyPlacas = ['placas', filters, currentPage]; // Chave de query dinâmica
  const {
    data: placasData, // Renomeia para evitar conflito com 'placas' state (removido)
    isLoading: isLoadingPlacas, // Loading das placas
    isError: isErrorPlacas, // Erro ao buscar placas
    error: errorPlacas, // Objeto de erro
    isPlaceholderData, // Indica se os dados mostrados são do cache enquanto busca novos
  } = useQuery({
    queryKey: queryKeyPlacas,
    // A função queryFn recebe o queryKey como argumento
    queryFn: async ({ queryKey }) => {
      const [_key, currentFilters, page] = queryKey; // Desestrutura a chave
      console.log(`Fetching placas - Page: ${page}, Filters:`, currentFilters);
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        order: 'desc'
      });
      if (currentFilters.regiao_id !== 'todas') params.append('regiao_id', currentFilters.regiao_id);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.disponibilidade === 'true') params.append('disponivel', 'true');
      else if (currentFilters.disponibilidade === 'false' || currentFilters.disponibilidade === 'manutencao') {
          params.append('disponivel', 'false');
      }
      const result = await fetchPlacas(params); // Chama a API
      return result; // Retorna { data: [], pagination: {} }
    },
    placeholderData: (previousData) => previousData, // Mantém dados antigos visíveis durante o refetch
    // staleTime: 1000 * 30 // Opcional: considerar dados "frescos" por 30s
  });

  // Extrai dados e paginação do resultado do useQuery
  const placas = placasData?.data ?? [];
  const pagination = placasData?.pagination ?? { currentPage: 1, totalPages: 1, totalDocs: 0 };

  // --- 4. Mutações (Delete, Toggle) ---

  // Mutação para Apagar Placa
  const deleteMutation = useMutation({
    mutationFn: deletePlaca, // API fn (recebe placaId)
    onSuccess: (_, placaId) => { // O segundo argumento é a variável passada para mutate
      showToast('Placa apagada com sucesso!', 'success');
      // Invalida a query atual para recarregar
      queryClient.invalidateQueries({ queryKey: queryKeyPlacas });

      // Lógica Opcional: Se apagou o último item de uma página > 1,
      // podemos tentar ir para a página anterior.
      if (placas.length === 1 && currentPage > 1) {
          // Pré-busca a página anterior
          queryClient.prefetchQuery({
              queryKey: ['placas', filters, currentPage - 1],
              queryFn: async () => { /* Função de fetch para a página anterior */
                  const prevPage = currentPage - 1;
                  const params = new URLSearchParams({ /* ... constrói params ... */ });
                  return await fetchPlacas(params);
              }
          });
          // Atualiza o estado da página localmente
           setCurrentPage(prev => prev - 1);
      }
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao apagar placa.', 'error');
    }
  });

  // Mutação para Alternar Disponibilidade
  const toggleMutation = useMutation({
    mutationFn: togglePlacaDisponibilidade, // API fn (recebe placaId)
    onSuccess: () => {
      showToast('Status da placa atualizado!', 'success');
      // Apenas invalida, não precisa mudar de página
      queryClient.invalidateQueries({ queryKey: queryKeyPlacas });
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao atualizar status.', 'error');
    }
  });

  // Combina estados de loading principais
  const isLoading = isLoadingRegioes || isLoadingPlacas;

  // --- Efeito para pré-buscar próxima página ---
  useEffect(() => {
    if (!isPlaceholderData && pagination.totalPages > currentPage) {
      queryClient.prefetchQuery({
        queryKey: ['placas', filters, currentPage + 1],
        queryFn: async () => {
          const nextPage = currentPage + 1;
          const params = new URLSearchParams({ page: nextPage, limit: ITEMS_PER_PAGE /* ... outros filtros ... */ });
          // Constrói params completos
          if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
          if (filters.search) params.append('search', filters.search);
          if (filters.disponibilidade === 'true') params.append('disponivel', 'true');
          else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') params.append('disponivel', 'false');
          console.log(`Prefetching page ${nextPage}`);
          return await fetchPlacas(params);
        },
      });
    }
  }, [placasData, isPlaceholderData, currentPage, pagination.totalPages, queryClient, filters]); // Dependências corretas


  // --- Listener para 'search' do Header (inalterado) ---
  useEffect(() => {
    const handleSearch = (event) => {
      const searchTerm = event.detail.query || '';
      if (window.location.pathname === '/placas') {
        setFilters(prevFilters => ({ ...prevFilters, search: searchTerm }));
        setCurrentPage(1); // Volta para a página 1 ao pesquisar
      }
    };
    document.addEventListener('search', handleSearch);
    return () => document.removeEventListener('search', handleSearch);
  }, []);

  // --- Handlers de Ações (adaptados para usar mutações) ---
  const handleFilterChange = (event) => {
    const { id, value } = event.target;
    const filterName = id.replace('-filter', '');
    setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
    setCurrentPage(1); // Volta para a página 1
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddPlaca = () => navigate('/placas/novo');
  const handleEditPlaca = (placaId) => navigate(`/placas/editar/${placaId}`);

  // Chama a mutação toggleMutation
  const handleToggleDisponibilidade = (placaId, buttonElement) => {
      // O PlacaCard pode mostrar um spinner interno baseado em toggleMutation.isPending
      toggleMutation.mutate(placaId);
  };

  // Chama a mutação deleteMutation após confirmação
  const handleDeletePlaca = async (placaId, buttonElement) => {
    const placaToDelete = placas.find(p => String(p.id || p._id) === String(placaId));
    const numeroPlaca = placaToDelete?.numero_placa || `ID ${placaId}`;

    try {
      await showConfirmation({
        message: `Tem a certeza que deseja apagar a placa "${numeroPlaca}"?`,
        title: "Confirmar Exclusão",
        confirmButtonType: "red",
      });
      // Se confirmado, chama a mutação
      deleteMutation.mutate(placaId);
    } catch {
      // Cancelado
    }
  };


  // --- Renderização ---
  const renderPaginationButtons = () => { /* ... (lógica inalterada, usa pagination do useQuery) ... */
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
            className="placas-page__filter-select"
            value={filters.regiao_id}
            onChange={handleFilterChange}
            disabled={isLoadingRegioes || isLoadingPlacas} // Desabilita se qualquer um estiver carregando
          >
            <option value="todas">Todas as Regiões</option>
            {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
          </select>
          <select
            id="disponibilidade-filter"
            className="placas-page__filter-select"
            value={filters.disponibilidade}
            onChange={handleFilterChange}
            disabled={isLoadingPlacas} // Apenas loading das placas aqui
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
            disabled={isLoadingPlacas} // Desabilita durante o loading
        >
          <i className="fas fa-plus"></i> Adicionar Placa
        </button>
      </div>

      <div id="placas-grid" className="placas-page__placas-grid">
        {isLoadingPlacas && placas.length === 0 ? ( // Mostra spinner principal só no load inicial
          <Spinner message="A carregar placas..." />
        ) : isErrorPlacas ? (
          <div className="placas-page__error">Erro: {errorPlacas.message}</div>
        ) : placas.length > 0 ? (
          placas.map(placa => (
            <PlacaCard
              key={placa.id || placa._id}
              placa={placa}
              onToggle={handleToggleDisponibilidade}
              onEdit={handleEditPlaca}
              onDelete={handleDeletePlaca}
              // Opcional: passar estados de pending das mutações para feedback no card
              isToggling={toggleMutation.isPending && toggleMutation.variables === (placa.id || placa._id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === (placa.id || placa._id)}
            />
          ))
        ) : (
          <div className="placas-page__no-results">Nenhuma placa encontrada com os filtros atuais.</div>
        )}
         {/* Opcional: mostrar um spinner menor durante refetch/placeholder */}
         {/* {isLoadingPlacas && isPlaceholderData && <Spinner message="Atualizando..." />} */}
      </div>

      <div id="pagination-container" className="placas-page__pagination">
        {!isLoadingPlacas && renderPaginationButtons()}
      </div>
    </div>
  );
}

export default PlacasPage;