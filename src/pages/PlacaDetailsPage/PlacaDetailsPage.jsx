// src/pages/PlacaDetailsPage/PlacaDetailsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { fetchPlacaById, fetchClientes, createAluguel } from '../../services/api'; //
import { useToast } from '../../components/ToastNotification/ToastNotification'; //
import Spinner from '../../components/Spinner/Spinner'; //
import Modal from '../../components/Modal/Modal'; //
import { getImageUrl, formatDate } from '../../utils/helpers'; //
// import { useConfirmation } from '../../context/ConfirmationContext'; // Removido
import PlacaDetailsInfo from '../../components/PlacaDetailsInfo/PlacaDetailsInfo';
import PlacaMap from '../../components/PlacaMap/PlacaMap';
import PlacaAluguelHistory from '../../components/PlacaAluguelHistory/PlacaAluguelHistory';
import './PlacaDetailsPage.css'; //

function PlacaDetailsPage() {
  const { id: placaId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  // --- Estados ---
  const [placa, setPlaca] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [isLoadingPlaca, setIsLoadingPlaca] = useState(true);
  const [errorPlaca, setErrorPlaca] = useState(null); // <<< CORREÇÃO: RE-ADICIONADO
  const [isAluguelModalOpen, setIsAluguelModalOpen] = useState(false);

  // --- RHF para o modal ---
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
         data_inicio: new Date().toISOString().split('T')[0], //
         data_fim: ''
       }
     });
  const dataInicioAluguel = watchAluguelForm('data_inicio');

  // --- Funções de Carregamento ---
  const loadPlacaDetalhes = useCallback(async () => { //
        setIsLoadingPlaca(true);
        setErrorPlaca(null); // <<< CORREÇÃO: Resetar erro
        try {
            const data = await fetchPlacaById(placaId); //
            setPlaca(data);
        } catch (err) {
            setErrorPlaca(err.message); // <<< CORREÇÃO: Definir erro
            showToast(err.message || 'Erro ao carregar detalhes da placa.', 'error');
            if (err.message.includes('não encontrada')) { //
                navigate('/placas', { replace: true });
            }
        } finally {
            setIsLoadingPlaca(false);
        }
   }, [placaId, showToast, navigate]);

  const loadClientes = useCallback(async () => { //
        try {
            const data = await fetchClientes(); //
            setClientes(data);
        } catch (err) {
            console.error("Erro ao carregar clientes para modal:", err);
        }
    }, []);

  // --- Efeitos ---
  useEffect(() => { //
    if (!placaId || String(placaId).trim() === '' || String(placaId) === 'undefined') {
        showToast('ID da placa inválido.', 'error');
        navigate('/placas', { replace: true });
        return;
    }
    loadPlacaDetalhes();
    loadClientes();
  }, [placaId, loadPlacaDetalhes, loadClientes, navigate, showToast]);

  // --- Funções do Modal de Aluguel ---
  const openAluguelModal = () => { //
      if (!placa || !placa.disponivel) { showToast('Esta placa não está disponível...', 'warning'); return; }
      if (clientes.length === 0) { showToast('Nenhum cliente disponível.', 'warning'); return; }

      resetAluguelForm({
        cliente_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: ''
      });
      setIsAluguelModalOpen(true);
    };
  const closeAluguelModal = () => setIsAluguelModalOpen(false); //

  const onAluguelSubmit = async (data) => { //
    const dataToSend = { placa_id: placaId, ...data };
    try {
      await createAluguel(dataToSend); //
      showToast('Placa alugada com sucesso!', 'success');
      closeAluguelModal();
      await loadPlacaDetalhes();
    } catch (error) {
      showToast(error.message || 'Erro ao reservar a placa.', 'error');
      if(error.message.toLowerCase().includes('reservada')) { //
          setAluguelError('data_inicio', { type: 'api', message: "Período indisponível" }); //
          setAluguelError('data_fim', { type: 'api', message: "Período indisponível" }); //
      }
       console.error("Erro submit aluguel:", error);
    }
  };

  // --- Renderização ---
  if (isLoadingPlaca) { //
    return <Spinner message="A carregar detalhes da placa..." />;
  }
  
  // <<< CORREÇÃO: Verificação de erro agora funciona >>>
  if (errorPlaca) { //
    return <div className="placa-details-page"><p className="error-message">Erro ao carregar placa: {errorPlaca}</p></div>; //
  }

  if (!placa) { //
    return <div className="placa-details-page"><p>Placa não encontrada.</p></div>;
  }

  // Calcula status e URLs
  const statusText = placa.disponivel ? 'Disponível' : (placa.cliente_nome ? 'Alugada' : 'Em Manutenção'); //
  const statusClass = placa.disponivel ? 'placa-details-page__status--disponivel' : 'placa-details-page__status--indisponivel'; //
  const placeholderUrl = '/assets/img/placeholder.png'; //
  const imageUrl = getImageUrl(placa.imagem, placeholderUrl); //
  const mapPosition = placa.coordenadas?.split(',').map(Number).filter(n => !isNaN(n)); //

  return (
    <>
      <div className="placa-details-page"> {/* */}
        <PlacaDetailsInfo
            placa={placa}
            imageUrl={imageUrl}
            placeholderUrl={placeholderUrl}
            statusText={statusText}
            statusClass={statusClass}
            onOpenAluguelModal={openAluguelModal}
            clientesCount={clientes.length}
        />

        <div id="details-map" className="placa-details-page__map-container"> {/* */}
            <PlacaMap
                mapPosition={mapPosition && mapPosition.length === 2 ? mapPosition : null}
                numeroPlaca={placa.numero_placa}
            />
        </div>
      </div>

      <PlacaAluguelHistory
          placaId={placaId}
          onAluguelChange={loadPlacaDetalhes}
      />

      <Modal title="Alugar Placa" isOpen={isAluguelModalOpen} onClose={closeAluguelModal}> {/* */}
         <form id="aluguel-form" className="modal-form" onSubmit={handleAluguelFormSubmit(onAluguelSubmit)} noValidate> {/* */}
             <div className="modal-form__grid"> {/* */}
                 <div className="modal-form__input-group modal-form__input-group--full"> {/* */}
                     <label htmlFor="cliente_id">Cliente</label> {/* */}
                     <select id="cliente_id"
                             className={`modal-form__input ${aluguelModalErrors.cliente_id ? 'input-error' : ''}`} //
                             {...registerAluguel('cliente_id', { required: 'Cliente é obrigatório.' })}
                             disabled={isSubmittingAluguel}>
                         <option value="">Selecione um cliente...</option>
                         {/* <<< CORREÇÃO: key={c._id} para resolver o aviso da ClientesPage >>> */}
                         {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                     </select>
                     {aluguelModalErrors.cliente_id && <div className="modal-form__error-message">{aluguelModalErrors.cliente_id.message}</div>} {/* */}
                 </div>
                 <div className="modal-form__input-group"> {/* */}
                     <label htmlFor="data_inicio">Data de Início</label> {/* */}
                     <input type="date" id="data_inicio"
                            className={`modal-form__input ${aluguelModalErrors.data_inicio ? 'input-error' : ''}`} //
                            {...registerAluguel('data_inicio', { required: 'Data de início é obrigatória.' })}
                            disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_inicio && <div className="modal-form__error-message">{aluguelModalErrors.data_inicio.message}</div>} {/* */}
                 </div>
                  <div className="modal-form__input-group"> {/* */}
                     <label htmlFor="data_fim">Data Final</label> {/* */}
                     <input type="date" id="data_fim"
                            className={`modal-form__input ${aluguelModalErrors.data_fim ? 'input-error' : ''}`} //
                            {...registerAluguel('data_fim', {
                                required: 'Data final é obrigatória.',
                                validate: (value) => value > dataInicioAluguel || 'A data final deve ser posterior à inicial.' //
                            })}
                            disabled={isSubmittingAluguel} />
                     {aluguelModalErrors.data_fim && <div className="modal-form__error-message">{aluguelModalErrors.data_fim.message}</div>} {/* */}
                 </div>
             </div>
             <div className="modal-form__actions"> {/* */}
                 <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeAluguelModal} disabled={isSubmittingAluguel}>Cancelar</button> {/* */}
                 <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmittingAluguel}>{isSubmittingAluguel ? 'A reservar...' : 'Reservar Placa'}</button> {/* */}
             </div>
          </form>
      </Modal>
    </>
  );
}

export default PlacaDetailsPage;