// src/pages/PlacaDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchPlacaById, fetchClientes, createAluguel, fetchAlugueisByPlaca, deleteAluguel } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { validateForm } from '../../utils/validator';
import { getImageUrl, formatDate } from '../../utils/helpers';
import './PlacaDetailsPage.css'; // CSS da página

// Corrigir ícones Leaflet (como em MapPage)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para invalidar tamanho do mapa (Leaflet pode precisar disso em layouts dinâmicos)
function InvalidateMapSize() {
    const map = useMap();
    useEffect(() => {
        // Pequeno delay para garantir que o container tem o tamanho final
        const timer = setTimeout(() => {
             console.log("Invalidating map size...");
             map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer); // Cleanup
    }, [map]);
    return null;
}

function PlacaDetailsPage() {
  const { id: placaId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [placa, setPlaca] = useState(null);
  const [alugueis, setAlugueis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoadingPlaca, setIsLoadingPlaca] = useState(true);
  const [isLoadingAlugueis, setIsLoadingAlugueis] = useState(true);
  const [errorPlaca, setErrorPlaca] = useState(null);
  const [errorAlugueis, setErrorAlugueis] = useState(null);

  // Estados do Modal de Aluguel
  const [isAluguelModalOpen, setIsAluguelModalOpen] = useState(false);
  const [aluguelFormData, setAluguelFormData] = useState({ cliente_id: '', data_inicio: new Date().toISOString().split('T')[0], data_fim: '' });
  const [aluguelModalErrors, setAluguelModalErrors] = useState({});
  const [isSubmittingAluguel, setIsSubmittingAluguel] = useState(false);

  // Estado para confirmação de exclusão de aluguel
  const [aluguelToDelete, setAluguelToDelete] = useState(null);

  // --- Funções de Carregamento ---
  const loadPlacaDetalhes = useCallback(async () => {
    setIsLoadingPlaca(true);
    setErrorPlaca(null);
    try {
      const data = await fetchPlacaById(placaId);
      setPlaca(data);
    } catch (err) {
      setErrorPlaca(err.message);
      showToast(err.message || 'Erro ao carregar detalhes da placa.', 'error');
       // Se a placa não for encontrada, volta para a lista
       if (err.message.includes('não encontrada')) {
            navigate('/placas', { replace: true });
       }
    } finally {
      setIsLoadingPlaca(false);
    }
  }, [placaId, showToast, navigate]);

  const loadAlugueis = useCallback(async () => {
    setIsLoadingAlugueis(true);
    setErrorAlugueis(null);
    try {
      const data = await fetchAlugueisByPlaca(placaId);
      setAlugueis(data);
    } catch (err) {
      setErrorAlugueis(err.message);
      // showToast(err.message || 'Erro ao carregar histórico.', 'error'); // Opcional
    } finally {
      setIsLoadingAlugueis(false);
    }
  }, [placaId]);

  const loadClientes = useCallback(async () => {
      try {
          const data = await fetchClientes();
          setClientes(data);
      } catch (err) {
          console.error("Erro ao carregar clientes para modal:", err);
          // Não mostra toast aqui para não poluir, mas guarda erro se necessário
      }
  }, []);


  // --- Efeitos ---
  useEffect(() => {
    // Verifica ID válido antes de carregar
    if (!placaId || String(placaId).trim() === '' || String(placaId) === 'undefined') {
        showToast('ID da placa inválido.', 'error');
        navigate('/placas', { replace: true });
        return; // Interrompe se ID for inválido
    }
    loadPlacaDetalhes();
    loadAlugueis();
    loadClientes();
  }, [placaId, loadPlacaDetalhes, loadAlugueis, loadClientes, navigate, showToast]); // Adiciona dependências

  // --- Funções do Modal de Aluguel ---
  const openAluguelModal = () => {
    if (!placa || !placa.disponivel) {
      showToast('Esta placa não está disponível para aluguer.', 'warning');
      return;
    }
    if (clientes.length === 0) {
      showToast('Nenhum cliente disponível. Crie um cliente primeiro.', 'warning');
      return;
    }
    // Reseta formulário
    setAluguelFormData({ cliente_id: '', data_inicio: new Date().toISOString().split('T')[0], data_fim: '' });
    setAluguelModalErrors({});
    setIsAluguelModalOpen(true);
  };

  const closeAluguelModal = () => setIsAluguelModalOpen(false);

  const handleAluguelInputChange = (e) => {
    const { name, value } = e.target;
    setAluguelFormData(prev => ({ ...prev, [name]: value }));
    if (aluguelModalErrors[name]) {
      setAluguelModalErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAluguelSubmit = async (e) => {
      e.preventDefault();
      setAluguelModalErrors({});
      setIsSubmittingAluguel(true);

      const validationRules = {
           cliente_id: [{ type: 'required', message: 'Cliente é obrigatório.' }],
           data_inicio: [{ type: 'required', message: 'Data de início é obrigatória.' }],
           data_fim: [{ type: 'required', message: 'Data final é obrigatória.' }],
      };

      // Adaptação da validação
      let formIsValid = true;
      const newErrors = {};
       for (const fieldName in validationRules) {
           const value = aluguelFormData[fieldName];
           const fieldRules = validationRules[fieldName];
           let fieldIsValid = true;
           // ... (lógica de validação similar às outras páginas) ...
            if (fieldName === 'data_fim' && aluguelFormData.data_inicio && value <= aluguelFormData.data_inicio) {
                newErrors.data_fim = 'A data final deve ser posterior à inicial.';
                formIsValid = false;
                fieldIsValid = false;
            } else {
                for (const rule of fieldRules) {
                    if (!fieldIsValid) break;
                     let isValidForRule = true;
                     let errorMessage = rule.message || 'Valor inválido.';
                     if (rule.type === 'required' && (!value || String(value).trim() === '')) {
                         isValidForRule = false;
                     }
                     // Adicionar outras validações se necessário
                     if (!isValidForRule) {
                         newErrors[fieldName] = errorMessage; formIsValid = false; fieldIsValid = false;
                     }
                }
            }
       }
      setAluguelModalErrors(newErrors);

      if (!formIsValid) {
        showToast('Corrija os erros no formulário.', 'error');
        setIsSubmittingAluguel(false);
         const firstErrorField = Object.keys(newErrors)[0];
         if (firstErrorField) document.getElementById(firstErrorField)?.focus();
        return;
      }

      const dataToSend = {
        placa_id: placaId, // ID da placa atual
        cliente_id: aluguelFormData.cliente_id,
        data_inicio: aluguelFormData.data_inicio,
        data_fim: aluguelFormData.data_fim,
      };

      try {
        await createAluguel(dataToSend);
        showToast('Placa alugada com sucesso!', 'success');
        closeAluguelModal();
        // Recarrega placa (para status) e alugueis
        await Promise.all([loadPlacaDetalhes(), loadAlugueis()]);
      } catch (error) {
        showToast(error.message || 'Erro ao reservar a placa.', 'error');
        // Adiciona erro específico se for conflito
        if(error.message.toLowerCase().includes('reservada')) {
            setAluguelModalErrors({ data_inicio: error.message, data_fim: error.message });
        }
      } finally {
        setIsSubmittingAluguel(false);
      }
  };

  // --- Funções de Exclusão de Aluguel ---
   const handleDeleteAluguelClick = (aluguel) => {
     setAluguelToDelete(aluguel);
     // Usar window.confirm como placeholder
     if (window.confirm(`Tem a certeza que deseja cancelar o aluguel para "${aluguel.cliente_nome || 'Cliente Apagado'}"?`)) {
         confirmDeleteAluguel();
     } else {
         setAluguelToDelete(null);
     }
     // Se usar Modal React: setShowConfirmDelete(true);
  };

   const confirmDeleteAluguel = async () => {
     if (!aluguelToDelete) return;
     const idToDelete = aluguelToDelete.id; // API usa 'id'

     // Desabilitar botão visualmente (mais complexo sem refs diretas)
     // Podemos adicionar um estado isLoadingDelete se necessário

     try {
         await deleteAluguel(idToDelete);
         showToast('Aluguel cancelado com sucesso!', 'success');
         // Recarrega placa e alugueis
         await Promise.all([loadPlacaDetalhes(), loadAlugueis()]);
     } catch (error) {
         showToast(error.message || 'Erro ao cancelar aluguel.', 'error');
     } finally {
          setAluguelToDelete(null);
          // setShowConfirmDelete(false); // Se usar modal React
     }
  };


  // --- Renderização ---
  if (isLoadingPlaca) {
    return <Spinner message="A carregar detalhes da placa..." />;
  }

  if (errorPlaca) {
    return <div className="placa-details-page"><p className="error-message">Erro ao carregar placa: {errorPlaca}</p></div>;
  }

  if (!placa) {
    // Se chegou aqui sem placa após loading, algo deu errado (ou ID inválido inicial)
    return <div className="placa-details-page"><p>Placa não encontrada.</p></div>;
  }

  // Prepara dados para renderizar
  const statusText = placa.disponivel ? 'Disponível' : (placa.cliente_nome ? 'Alugada' : 'Em Manutenção');
  const statusClass = placa.disponivel ? 'placa-details-page__status--disponivel' : 'placa-details-page__status--indisponivel';
  const placeholderUrl = '/assets/img/placeholder.png';
  const imageUrl = getImageUrl(placa.imagem, placeholderUrl);
  const mapPosition = placa.coordenadas?.split(',').map(Number).filter(n => !isNaN(n));

  return (
    <> {/* Fragmento para agrupar detalhes e histórico */}
      <div className="placa-details-page">
        {/* Detalhes da Placa */}
        <div className="placa-details-page__image-container">
          <img src={imageUrl} alt={`Imagem da Placa ${placa.numero_placa}`} className="placa-details-page__image" onError={(e) => { e.target.onerror = null; e.target.src = placeholderUrl; }} />
        </div>
        <div className="placa-details-page__info-container">
          <div className="placa-details-page__header">
            <h2 className="placa-details-page__numero">{placa.numero_placa}</h2>
            <span className={`placa-details-page__status ${statusClass}`}>{statusText}</span>
          </div>
          {/* Info Grid */}
          <div className="placa-details-page__info-grid">
             {/* Localização */}
             <div className="placa-details-page__info-item">
                <span className="placa-details-page__info-label">Localização</span>
                <p className="placa-details-page__info-value">{placa.nomeDaRua || 'N/A'}</p>
             </div>
             {/* Região */}
             <div className="placa-details-page__info-item">
                 <span className="placa-details-page__info-label">Região</span>
                 {/* Assume que API retorna nome populado em placa.regiao.nome */}
                 <p className="placa-details-page__info-value">{placa.regiao?.nome || 'N/A'}</p>
             </div>
              {/* Tamanho */}
             <div className="placa-details-page__info-item">
                <span className="placa-details-page__info-label">Tamanho</span>
                <p className="placa-details-page__info-value">{placa.tamanho || 'N/A'}</p>
             </div>
             {/* Coordenadas */}
             <div className="placa-details-page__info-item">
                <span className="placa-details-page__info-label">Coordenadas</span>
                <p className="placa-details-page__info-value">{placa.coordenadas || 'N/A'}</p>
             </div>
             {/* Cliente (se alugada) */}
              {placa.cliente_nome && (
                  <div className="placa-details-page__info-item">
                      <span className="placa-details-page__info-label">Cliente Atual</span>
                      <p className="placa-details-page__info-value">{placa.cliente_nome} (até {formatDate(placa.aluguel_data_fim)})</p>
                  </div>
              )}
          </div>
          {/* Ações (Botão Alugar) */}
          <div className="placa-details-page__actions">
            <button
              id="alugar-placa-btn"
              className="placa-details-page__alugar-button"
              onClick={openAluguelModal}
              disabled={!placa.disponivel || clientes.length === 0} // Desabilita se indisponível OU sem clientes
              title={!placa.disponivel ? 'Placa indisponível' : (clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Alugar esta placa')}
            >
              <i className="fas fa-calendar-plus"></i>
              {placa.disponivel ? 'Alugar esta Placa' : statusText /* Mostra Alugada/Manutenção */}
            </button>
          </div>
        </div>

        {/* Mapa */}
        <div id="details-map" className="placa-details-page__map-container">
          {mapPosition && mapPosition.length === 2 ? (
            <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
               <InvalidateMapSize /> {/* Componente para corrigir tamanho */}
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={mapPosition}>
                <Popup>{placa.numero_placa || 'Localização'}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p>Mapa indisponível (coordenadas inválidas).</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Alugueis */}
      <div className="placa-details-page__alugueis-container">
        <h3>Histórico de Alugueis</h3>
        <div id="alugueis-list">
          {isLoadingAlugueis ? (
            <Spinner message="A carregar histórico..." />
          ) : errorAlugueis ? (
            <p className="error-message">Erro ao carregar histórico: {errorAlugueis}</p>
          ) : alugueis.length === 0 ? (
            <p>Nenhum aluguel encontrado para esta placa.</p>
          ) : (
            <table className="regioes-page__table"> {/* Reutiliza estilo */}
              <thead>
                <tr><th>Cliente</th><th>Início</th><th>Fim</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {alugueis.map(a => (
                  <tr key={a.id}>
                    <td>{a.cliente_nome || 'Cliente Apagado'}</td>
                    <td>{formatDate(a.data_inicio)}</td>
                    <td>{formatDate(a.data_fim)}</td>
                    <td className="regioes-page__actions">
                      <button
                        className="regioes-page__action-button regioes-page__action-button--delete delete-aluguel-btn"
                        title="Cancelar Aluguel"
                        onClick={() => handleDeleteAluguelClick(a)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Alugar */}
      <Modal title="Alugar Placa" isOpen={isAluguelModalOpen} onClose={closeAluguelModal}>
          <form id="aluguel-form" className="modal-form" onSubmit={handleAluguelSubmit} noValidate>
             <div className="modal-form__grid">
                 {/* Cliente */}
                 <div className="modal-form__input-group modal-form__input-group--full">
                     <label htmlFor="cliente_id">Cliente</label>
                     <select id="cliente_id" name="cliente_id"
                             className={`modal-form__input ${aluguelModalErrors.cliente_id ? 'input-error' : ''}`}
                             value={aluguelFormData.cliente_id} onChange={handleAluguelInputChange}
                             required disabled={isSubmittingAluguel}>
                         <option value="">Selecione um cliente...</option>
                         {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                     </select>
                     {aluguelModalErrors.cliente_id && <div className="modal-form__error-message">{aluguelModalErrors.cliente_id}</div>}
                 </div>
                 {/* Data Início */}
                 <div className="modal-form__input-group">
                     <label htmlFor="data_inicio">Data de Início</label>
                     <input type="date" id="data_inicio" name="data_inicio"
                            className={`modal-form__input ${aluguelModalErrors.data_inicio ? 'input-error' : ''}`}
                            value={aluguelFormData.data_inicio} onChange={handleAluguelInputChange}
                            required disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_inicio && <div className="modal-form__error-message">{aluguelModalErrors.data_inicio}</div>}
                 </div>
                 {/* Data Fim */}
                  <div className="modal-form__input-group">
                     <label htmlFor="data_fim">Data Final</label>
                     <input type="date" id="data_fim" name="data_fim"
                            className={`modal-form__input ${aluguelModalErrors.data_fim ? 'input-error' : ''}`}
                            value={aluguelFormData.data_fim} onChange={handleAluguelInputChange}
                            required disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_fim && <div className="modal-form__error-message">{aluguelModalErrors.data_fim}</div>}
                 </div>
             </div>
             <div className="modal-form__actions">
                 <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeAluguelModal} disabled={isSubmittingAluguel}>
                     Cancelar
                 </button>
                 <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmittingAluguel}>
                     {isSubmittingAluguel ? 'A reservar...' : 'Reservar Placa'}
                 </button>
             </div>
         </form>
      </Modal>

       {/* Modal de Confirmação para Apagar Aluguel (se tiver um componente React) */}
       {/* {showConfirmDelete && aluguelToDelete && ( ... )} */}
    </>
  );
}

export default PlacaDetailsPage;