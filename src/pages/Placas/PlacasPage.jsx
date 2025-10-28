// src/pages/Placas/PlacasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlacas, deletePlaca, togglePlacaDisponibilidade } from '../../services/api';
import { getRegioes } from '../../state/dataCache';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< Importa o hook
import PlacaCard from '../../components/PlacaCard/PlacaCard';
import Spinner from '../../components/Spinner/Spinner';
import './Placas.css';

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
  const showConfirmation = useConfirmation(); // <<< Inicializa o hook de confirmação

  // --- Funções de Carregamento (inalteradas) ---
  const loadRegioesFilter = useCallback(async () => {
    // ... (lógica inalterada) ...
        try {
          const data = await getRegioes();
          setRegioes(data);
        } catch (err) {
          console.error("Erro ao carregar regiões para filtro:", err);
          showToast('Erro ao carregar regiões para filtro.', 'error');
        }
  }, [showToast]);

  const loadPlacas = useCallback(async (page = pagination.currentPage) => {
    // ... (lógica inalterada) ...
        setIsLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams({ /* ... */ });
          if (filters.regiao_id !== 'todas') params.append('regiao_id', filters.regiao_id);
          if (filters.search) params.append('search', filters.search);
          if (filters.disponibilidade === 'true') params.append('disponivel', 'true');
          else if (filters.disponibilidade === 'false' || filters.disponibilidade === 'manutencao') params.append('disponivel', 'false');

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


  // --- Efeitos (inalterados) ---
  useEffect(() => { loadRegioesFilter(); }, [loadRegioesFilter]);
  useEffect(() => { loadPlacas(pagination.currentPage); }, [loadPlacas]); // Agora depende só de loadPlacas
  useEffect(() => { /* Listener 'search' inalterado */ }, []);

  // --- Handlers de Ações (Edit, Toggle, Filters, Pagination - inalterados) ---
  const handleFilterChange = (event) => { /* ... */ setFilters(prev => ({...prev, [event.target.id.replace('-filter','')]: event.target.value})); setPagination(prev => ({...prev, currentPage: 1})); };
  const handlePageChange = (newPage) => { /* ... */ if (newPage >= 1 && newPage <= pagination.totalPages) setPagination(prev => ({ ...prev, currentPage: newPage })); };
  const handleAddPlaca = () => navigate('/placas/novo');
  const handleEditPlaca = (placaId) => navigate(`/placas/editar/${placaId}`);
  const handleToggleDisponibilidade = async (placaId, buttonElement) => { /* ... (lógica inalterada) ... */ };


  // --- Função de Exclusão Refatorada com useConfirmation ---
  const handleDeletePlaca = async (placaId, buttonElement) => {
    // Tenta pegar o número da placa do estado para a mensagem
    const placaToDelete = placas.find(p => String(p.id || p._id) === String(placaId));
    const numeroPlaca = placaToDelete?.numero_placa || `ID ${placaId}`;

    try {
        // 1. Abre o modal de confirmação e aguarda
        await showConfirmation({
            message: `Tem a certeza de que deseja apagar a placa "${numeroPlaca}"? Esta ação não pode ser desfeita.`,
            title: "Confirmar Exclusão de Placa",
            confirmText: "Sim, Apagar",
            confirmButtonType: "red",
        });

        // 2. Se confirmado, executa a exclusão
        let originalButtonHTML; // Guarda o HTML original do botão
        if (buttonElement) {
            originalButtonHTML = buttonElement.innerHTML;
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        try {
            await deletePlaca(placaId);
            showToast('Placa apagada com sucesso!', 'success');

            // Recarrega a página correta
            if (placas.length === 1 && pagination.currentPage > 1) {
                // Se era o último item numa página > 1, carrega a anterior
                // Precisamos chamar loadPlacas diretamente com a página anterior
                // pois handlePageChange só atualiza o estado, que só terá efeito na próxima renderização
                 await loadPlacas(pagination.currentPage - 1); // Espera recarregar
                 setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 })); // Atualiza estado da página
            } else {
                await loadPlacas(); // Recarrega a página atual
            }
        } catch (error) {
            showToast(error.message || 'Erro ao apagar placa.', 'error');
            // Restaura botão no erro
            if (buttonElement) {
                 buttonElement.innerHTML = originalButtonHTML || '<i class="fas fa-trash"></i>'; // Usa original ou fallback
                 buttonElement.disabled = false;
            }
        }
        // Não precisa restaurar botão no sucesso, pois a lista será re-renderizada

    } catch (error) {
        // 3. Usuário cancelou
        if (error.message !== "Ação cancelada pelo usuário.") {
            console.error("Erro no processo de confirmação de exclusão:", error);
        } else {
            console.log("Exclusão de placa cancelada.");
        }
    }
  };


  // --- Renderização (Pagination inalterada, Card passa handlers) ---
  const renderPaginationButtons = () => { /* ... (lógica inalterada) ... */ };

  return (
    <div className="placas-page">
      {/* ... Controles (Filtros, Botão Adicionar - inalterados) ... */}
      <div className="placas-page__controls">
         <div className="placas-page__filters">
             <select id="regiao-filter" className="placas-page__filter-select" value={filters.regiao_id} onChange={handleFilterChange} disabled={isLoading} >
                 <option value="todas">Todas as Regiões</option>
                 {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
             </select>
             <select id="disponibilidade-filter" className="placas-page__filter-select" value={filters.disponibilidade} onChange={handleFilterChange} disabled={isLoading} >
                 <option value="todos">Todos Status</option>
                 <option value="true">Disponível</option>
                 <option value="false">Indisponível (Alugada)</option>
                 <option value="manutencao">Em Manutenção</option>
             </select>
         </div>
         <button id="add-placa-button" className="placas-page__add-button" onClick={handleAddPlaca} disabled={isLoading}> <i className="fas fa-plus"></i> Adicionar Placa </button>
      </div>

      <div id="placas-grid" className="placas-page__placas-grid">
        {isLoading ? ( <Spinner message="A carregar placas..." /> )
         : error ? ( <div className="placas-page__error">Erro: {error}</div> )
         : placas.length > 0 ? (
          placas.map(placa => (
            <PlacaCard
              key={placa.id || placa._id}
              placa={placa}
              onToggle={handleToggleDisponibilidade} // Passa o handler correto
              onEdit={handleEditPlaca} // Passa o handler correto
              onDelete={handleDeletePlaca} // <<< PASSA O NOVO HANDLER
            />
          ))
        ) : ( <div className="placas-page__no-results">Nenhuma placa encontrada.</div> )}
      </div>

      {/* Paginação */}
      <div id="pagination-container" className="placas-page__pagination">
        {!isLoading && renderPaginationButtons()}
      </div>

       {/* O ConfirmationModal é renderizado pelo Provider */}
    </div>
  );
}

export default PlacasPage;