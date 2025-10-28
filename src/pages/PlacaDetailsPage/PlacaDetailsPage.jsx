// src/pages/PlacaDetailsPage/PlacaDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // <<< Refinamento 6
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchPlacaById, fetchClientes, createAluguel, fetchAlugueisByPlaca, deleteAluguel } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
// validateForm não é mais necessário aqui
import { getImageUrl, formatDate } from '../../utils/helpers';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< Refinamento 5
import './PlacaDetailsPage.css';

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
        const timer = setTimeout(() => {
             if(map) map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer); // Cleanup
    }, [map]);
    return null;
}

function PlacaDetailsPage() {
  const { id: placaId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const showConfirmation = useConfirmation(); // <<< Refinamento 5

  const [placa, setPlaca] = useState(null);
  const [alugueis, setAlugueis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoadingPlaca, setIsLoadingPlaca] = useState(true);
  const [isLoadingAlugueis, setIsLoadingAlugueis] = useState(true);
  const [errorPlaca, setErrorPlaca] = useState(null);
  const [errorAlugueis, setErrorAlugueis] = useState(null);
  const [isAluguelModalOpen, setIsAluguelModalOpen] = useState(false);

  // --- Refinamento 6: Inicializa react-hook-form para o MODAL DE ALUGUEL ---
  const {
    register: registerAluguel,
    handleSubmit: handleAluguelFormSubmit,
    reset: resetAluguelForm,
    watch: watchAluguelForm,
    formState: { errors: aluguelModalErrors, isSubmitting: isSubmittingAluguel },
    setError: setAluguelError
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      cliente_id: '',
      data_inicio: new Date().toISOString().split('T')[0], // Data de hoje como padrão
      data_fim: ''
    }
  });
  // Observa data_inicio para validar data_fim
  const dataInicioAluguel = watchAluguelForm('data_inicio');

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
      }
  }, []);


  // --- Efeitos ---
  useEffect(() => {
    if (!placaId || String(placaId).trim() === '' || String(placaId) === 'undefined') {
        showToast('ID da placa inválido.', 'error');
        navigate('/placas', { replace: true });
        return;
    }
    loadPlacaDetalhes();
    loadAlugueis();
    loadClientes();
  }, [placaId, loadPlacaDetalhes, loadAlugueis, loadClientes, navigate, showToast]);

  // --- Funções do Modal de Aluguel (adaptadas para RHF) ---
  const openAluguelModal = () => {
    if (!placa || !placa.disponivel) { showToast('Esta placa não está disponível...', 'warning'); return; }
    if (clientes.length === 0) { showToast('Nenhum cliente disponível.', 'warning'); return; }

    resetAluguelForm({ // Reseta o formulário RHF
      cliente_id: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: ''
    });
    setIsAluguelModalOpen(true);
  };

  const closeAluguelModal = () => setIsAluguelModalOpen(false);

  // Função de submissão chamada pelo handleAluguelFormSubmit do RHF
  const onAluguelSubmit = async (data) => {
    // 'data' contém { cliente_id, data_inicio, data_fim } validados pelo RHF
    const dataToSend = {
      placa_id: placaId,
      ...data
    };

    try {
      await createAluguel(dataToSend);
      showToast('Placa alugada com sucesso!', 'success');
      closeAluguelModal();
      // Recarrega placa (para status) e alugueis
      await Promise.all([loadPlacaDetalhes(), loadAlugueis()]);
    } catch (error) {
      showToast(error.message || 'Erro ao reservar a placa.', 'error');
      // Define erro específico se for conflito de datas da API
      if(error.message.toLowerCase().includes('reservada')) {
          setAluguelError('data_inicio', { type: 'api', message: "Período indisponível" });
          setAluguelError('data_fim', { type: 'api', message: "Período indisponível" });
      }
       console.error("Erro submit aluguel:", error);
    }
    // isSubmittingAluguel é gerido pelo RHF
  };

  // --- Função de Exclusão de Aluguel (Refatorada com R5) ---
  const handleDeleteAluguelClick = async (aluguel, buttonElement) => {
    try {
        // 1. Mostra confirmação
        await showConfirmation({
            message: `Tem a certeza que deseja cancelar o aluguel para "${aluguel.cliente_nome || 'Cliente Apagado'}" (${formatDate(aluguel.data_inicio)} - ${formatDate(aluguel.data_fim)})?`,
            title: "Confirmar Cancelamento",
            confirmText: "Sim, Cancelar Aluguel",
            confirmButtonType: "red",
        });

        // 2. Se confirmado, executa
        if (buttonElement) { // Feedback visual
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        try {
            await deleteAluguel(aluguel.id); // API usa 'id'
            showToast('Aluguel cancelado com sucesso!', 'success');
            // Recarrega placa e alugueis
            await Promise.all([loadPlacaDetalhes(), loadAlugueis()]);
        } catch (error) {
            showToast(error.message || 'Erro ao cancelar aluguel.', 'error');
             // Restaura botão no erro
             if (buttonElement) {
                buttonElement.innerHTML = '<i class="fas fa-trash"></i>';
                buttonElement.disabled = false;
            }
        }
    } catch (error) {
        // 3. Usuário cancelou
        if (error.message !== "Ação cancelada pelo usuário.") {
           console.error("Erro no processo de confirmação de cancelamento:", error);
        } else {
            console.log("Cancelamento de aluguel abortado.");
        }
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
    return <div className="placa-details-page"><p>Placa não encontrada.</p></div>;
  }

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
          <div className="placa-details-page__info-grid">
             <div className="placa-details-page__info-item"><span className="placa-details-page__info-label">Localização</span><p className="placa-details-page__info-value">{placa.nomeDaRua || 'N/A'}</p></div>
             <div className="placa-details-page__info-item"><span className="placa-details-page__info-label">Região</span><p className="placa-details-page__info-value">{placa.regiao?.nome || 'N/A'}</p></div>
             <div className="placa-details-page__info-item"><span className="placa-details-page__info-label">Tamanho</span><p className="placa-details-page__info-value">{placa.tamanho || 'N/A'}</p></div>
             <div className="placa-details-page__info-item"><span className="placa-details-page__info-label">Coordenadas</span><p className="placa-details-page__info-value">{placa.coordenadas || 'N/A'}</p></div>
              {placa.cliente_nome && (
                  <div className="placa-details-page__info-item">
                      <span className="placa-details-page__info-label">Cliente Atual</span>
                      <p className="placa-details-page__info-value">{placa.cliente_nome} (até {formatDate(placa.aluguel_data_fim)})</p>
                  </div>
              )}
          </div>
          <div className="placa-details-page__actions">
            <button
              id="alugar-placa-btn"
              className="placa-details-page__alugar-button"
              onClick={openAluguelModal}
              disabled={!placa.disponivel || clientes.length === 0}
              title={!placa.disponivel ? 'Placa indisponível' : (clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Alugar esta placa')}
            >
              <i className="fas fa-calendar-plus"></i>
              {placa.disponivel ? 'Alugar esta Placa' : statusText}
            </button>
          </div>
        </div>

        {/* Mapa */}
        <div id="details-map" className="placa-details-page__map-container">
          {mapPosition && mapPosition.length === 2 ? (
            <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
               <InvalidateMapSize />
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
      </div> {/* Fim div .placa-details-page */}

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
                        onClick={(e) => handleDeleteAluguelClick(a, e.currentTarget)} // <<< Refinamento 5
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

      {/* Modal para Alugar (com react-hook-form) */}
      <Modal title="Alugar Placa" isOpen={isAluguelModalOpen} onClose={closeAluguelModal}>
          {/* Refinamento 6: handleSubmit(onAluguelSubmit) */}
          <form id="aluguel-form" className="modal-form" onSubmit={handleAluguelFormSubmit(onAluguelSubmit)} noValidate>
             <div className="modal-form__grid">
                 {/* Cliente */}
                 <div className="modal-form__input-group modal-form__input-group--full">
                     <label htmlFor="cliente_id">Cliente</label>
                     <select id="cliente_id"
                             className={`modal-form__input ${aluguelModalErrors.cliente_id ? 'input-error' : ''}`}
                             {...registerAluguel('cliente_id', { required: 'Cliente é obrigatório.' })}
                             disabled={isSubmittingAluguel}>
                         <option value="">Selecione um cliente...</option>
                         {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                     </select>
                     {aluguelModalErrors.cliente_id && <div className="modal-form__error-message">{aluguelModalErrors.cliente_id.message}</div>}
                 </div>
                 {/* Data Início */}
                 <div className="modal-form__input-group">
                     <label htmlFor="data_inicio">Data de Início</label>
                     <input type="date" id="data_inicio"
                            className={`modal-form__input ${aluguelModalErrors.data_inicio ? 'input-error' : ''}`}
                            {...registerAluguel('data_inicio', { required: 'Data de início é obrigatória.' })}
                            disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_inicio && <div className="modal-form__error-message">{aluguelModalErrors.data_inicio.message}</div>}
                 </div>
                 {/* Data Fim */}
                  <div className="modal-form__input-group">
                     <label htmlFor="data_fim">Data Final</label>
                     <input type="date" id="data_fim"
                            className={`modal-form__input ${aluguelModalErrors.data_fim ? 'input-error' : ''}`}
                            {...registerAluguel('data_fim', {
                                required: 'Data final é obrigatória.',
                                // Valida se a data fim é posterior à data início
                                validate: (value) => value > dataInicioAluguel || 'A data final deve ser posterior à inicial.'
                            })}
                            disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_fim && <div className="modal-form__error-message">{aluguelModalErrors.data_fim.message}</div>}
                 </div>
             </div>
             <div className="modal-form__actions">
                 <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeAluguelModal} disabled={isSubmittingAluguel}>Cancelar</button>
                 <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmittingAluguel}>{isSubmittingAluguel ? 'A reservar...' : 'Reservar Placa'}</button>
             </div>
         </form>
      </Modal>

      {/* O ConfirmationModal é renderizado pelo Provider */}
    </>
  );
}

export default PlacaDetailsPage;