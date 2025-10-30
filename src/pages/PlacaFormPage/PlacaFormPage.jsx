// src/pages/PlacaFormPage/PlacaFormPage.jsx (Refatorado com RHF e React Query)
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchPlacaById, addPlaca, updatePlaca, fetchRegioes } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { getImageUrl } from '../../utils/helpers';
import './PlacaFormPage.css';

function PlacaFormPage() {
  const navigate = useNavigate();
  const { id: placaId } = useParams();
  const isEditMode = Boolean(placaId);

  const [imagePreview, setImagePreview] = useState(null);
  const [initialImageUrl, setInitialImageUrl] = useState(null);

  const showToast = useToast();
  const queryClient = useQueryClient();

  // --- RHF Config ---
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError: setFormError,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      numero_placa: '', nomeDaRua: '', coordenadas: '',
      tamanho: '', regiao: '', imagem: null
    }
  });

  // --- useQuery para Regiões ---
  const { data: regioes = [], isLoading: isLoadingRegioes, isError: isErrorRegioes } = useQuery({
      queryKey: ['regioes'],
      queryFn: fetchRegioes,
      staleTime: 1000 * 60 * 60,
      placeholderData: [],
  });

  // --- useQuery para Placa (Modo Edição) ---
  const { data: placaData, isLoading: isLoadingPlaca } = useQuery({
      queryKey: ['placa', placaId],
      queryFn: () => fetchPlacaById(placaId),
      enabled: isEditMode, // Só busca se for modo de edição
      staleTime: 1000 * 60 * 5,
      onError: (err) => {
          showToast(err.message || 'Erro ao carregar dados da placa.', 'error');
          navigate('/placas');
      }
  });

  // useEffect para preencher o formulário
  useEffect(() => {
    if (isEditMode && placaData) {
      
      // *** 🐞 CORREÇÃO APLICADA AQUI ***
      // Define um placeholder válido
      const placeholderImg = '/assets/img/placeholder.png'; 
      
      // Se a placa tiver imagem, chama getImageUrl (passando o placeholder válido).
      // Se não tiver imagem, define currentImageUrl como null.
      const currentImageUrl = placaData.imagem 
          ? getImageUrl(placaData.imagem, placeholderImg) 
          : null;

      reset({
        numero_placa: placaData.numero_placa || '',
        nomeDaRua: placaData.nomeDaRua || '',
        coordenadas: placaData.coordenadas || '',
        tamanho: placaData.tamanho || '',
        regiao: placaData.regiao?._id || placaData.regiao || '',
        imagem: null,
      });
      setImagePreview(currentImageUrl);
      setInitialImageUrl(currentImageUrl);
    }
    // Se não for modo de edição, garante que o formulário esteja limpo
    if (!isEditMode) {
        reset({
            numero_placa: '', nomeDaRua: '', coordenadas: '',
            tamanho: '', regiao: '', imagem: null
        });
        setImagePreview(null);
        setInitialImageUrl(null);
    }
  }, [isEditMode, placaData, reset]); // Depende dos dados da query e do modo

  
  // Observa o campo 'imagem' 
  const imagemField = watch('imagem');
  useEffect(() => {
    if (imagemField && imagemField[0] instanceof File) {
      const file = imagemField[0];
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    } else if (!imagemField && !initialImageUrl) {
      setImagePreview(null);
    } else if (!imagemField && initialImageUrl) {
      setImagePreview(initialImageUrl);
    }
  }, [imagemField, initialImageUrl]);

  // --- Mutações (Criar/Atualizar) ---
  const createPlacaMutation = useMutation({
    mutationFn: addPlaca,
    onSuccess: () => {
      showToast('Placa adicionada com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['placas'] });
      navigate('/placas');
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao guardar a placa.', 'error');
      if(error.message.toLowerCase().includes('número') && error.message.toLowerCase().includes('região')) {
          setFormError('numero_placa', { type: 'api', message: "Este número já existe nesta região." });
          setFormError('regiao', { type: 'api', message: "Verifique a região" });
      }
    }
  });

  const updatePlacaMutation = useMutation({
    mutationFn: (variables) => updatePlaca(variables.id, variables.formData),
    onSuccess: () => {
      showToast('Placa atualizada com sucesso!', 'success');
      queryClient.invalidateQueries({ queryKey: ['placas'] }); 
      queryClient.invalidateQueries({ queryKey: ['placa', placaId] }); 
      navigate('/placas');
    },
    onError: (error) => {
      showToast(error.message || 'Erro ao guardar a placa.', 'error');
      if(error.message.toLowerCase().includes('número') && error.message.toLowerCase().includes('região')) {
          setFormError('numero_placa', { type: 'api', message: "Este número já existe nesta região." });
      }
    }
  });

  const isFormSubmitting = createPlacaMutation.isPending || updatePlacaMutation.isPending;


  // --- Handlers ---
  const handleRemoveImage = () => {
    setValue('imagem', null, { shouldValidate: false, shouldDirty: true });
    setImagePreview(null); 
    showToast('Imagem removida. Guarde para confirmar.', 'info');
  };

  const onSubmit = (data) => {
    const dataToSend = new FormData();
    Object.keys(data).forEach(key => {
      if (key !== 'imagem' && data[key] !== null && data[key] !== undefined) {
          dataToSend.append(key, data[key]);
      }
    });

    const imageFile = data.imagem?.[0];
    if (imageFile instanceof File) {
      dataToSend.append('imagem', imageFile);
    } else if (isEditMode && !imagePreview && initialImageUrl) {
      dataToSend.append('imagem', ''); 
    }

    if (isEditMode) {
      updatePlacaMutation.mutate({ id: placaId, formData: dataToSend });
    } else {
      createPlacaMutation.mutate(dataToSend);
    }
  };

  // --- Renderização ---
  if ((isEditMode && isLoadingPlaca) || isLoadingRegioes) {
    return <Spinner message={isEditMode ? "A carregar dados da placa..." : "A carregar formulário..."} />;
  }
  if (isErrorRegioes) {
       return <div className="placa-form-page"><p className="error-message">Erro ao carregar regiões. Não é possível continuar.</p></div>;
  }

  return (
    <div className="placa-form-page">
      <form id="placa-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="placa-form-page__grid">
          {/* Número da Placa */}
          <div className="placa-form-page__input-group placa-form-page__input-group--full">
            <label htmlFor="numero_placa" className="placa-form-page__label">Número da Placa</label>
            <input type="text" id="numero_placa"
                   className={`placa-form-page__input ${errors.numero_placa ? 'input-error' : ''}`}
                   {...register('numero_placa', { required: 'O número é obrigatório.' })}
                   disabled={isFormSubmitting} />
            {errors.numero_placa && <div className="modal-form__error-message">{errors.numero_placa.message}</div>}
          </div>
          {/* Nome da Rua */}
          <div className="placa-form-page__input-group">
            <label htmlFor="nomeDaRua" className="placa-form-page__label">Nome da Rua</label>
            <input type="text" id="nomeDaRua"
                   className={`placa-form-page__input ${errors.nomeDaRua ? 'input-error' : ''}`}
                   {...register('nomeDaRua', { maxLength: { value: 255, message: 'Máx 255'} })}
                   disabled={isFormSubmitting} />
             {errors.nomeDaRua && <div className="modal-form__error-message">{errors.nomeDaRua.message}</div>}
          </div>
          {/* Coordenadas */}
          <div className="placa-form-page__input-group">
            <label htmlFor="coordenadas" className="placa-form-page__label">Coordenadas (lat,lng)</label>
            <input type="text" id="coordenadas" placeholder="-3.123, -38.456"
                   className={`placa-form-page__input ${errors.coordenadas ? 'input-error' : ''}`}
                   {...register('coordenadas', {
                       validate: (value) => !value || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value).trim()) || 'Formato inválido (ex: -3.12, -38.45)'
                   })}
                   disabled={isFormSubmitting} />
             {errors.coordenadas && <div className="modal-form__error-message">{errors.coordenadas.message}</div>}
          </div>
          {/* Tamanho */}
          <div className="placa-form-page__input-group">
            <label htmlFor="tamanho" className="placa-form-page__label">Tamanho (ex: 9x3)</label>
            <input type="text" id="tamanho"
                   className={`placa-form-page__input ${errors.tamanho ? 'input-error' : ''}`}
                   {...register('tamanho', { maxLength: { value: 50, message: 'Máx 50'} })}
                   disabled={isFormSubmitting} />
             {errors.tamanho && <div className="modal-form__error-message">{errors.tamanho.message}</div>}
          </div>
          {/* Região */}
          <div className="placa-form-page__input-group">
            <label htmlFor="regiao" className="placa-form-page__label">Região</label>
            <select id="regiao"
                   className={`placa-form-page__select ${errors.regiao ? 'input-error' : ''}`}
                   {...register('regiao', { required: 'Selecione uma região.' })}
                   disabled={isFormSubmitting || isLoadingRegioes} >
              <option value="">{isLoadingRegioes ? 'A carregar...' : 'Selecione...'}</option>
              {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
            </select>
            {errors.regiao && <div className="modal-form__error-message">{errors.regiao.message}</div>}
          </div>
          {/* Imagem */}
          <div className="placa-form-page__input-group placa-form-page__input-group--full">
            <label htmlFor="imagem" className="placa-form-page__label">Imagem da Placa (Opcional)</label>
            <input type="file" id="imagem"
                   className={`placa-form-page__input ${errors.imagem ? 'input-error' : ''}`}
                   accept="image/*"
                   {...register('imagem')}
                   disabled={isFormSubmitting} />
            <div className="placa-form-page__image-preview-container">
              {imagePreview ? (
                <img id="image-preview" src={imagePreview} alt="Pré-visualização" className="placa-form-page__image-preview" />
              ) : (
                <span id="image-preview-text">Nenhuma imagem selecionada</span>
              )}
              {imagePreview && (
                <button type="button" id="remove-image-button"
                        className="placa-form-page__remove-image-button"
                        onClick={handleRemoveImage} disabled={isFormSubmitting} >
                  <i className="fas fa-trash"></i> Remover Imagem
                </button>
              )}
            </div>
            {errors.imagem && <div className="modal-form__error-message">{errors.imagem.message}</div>}
          </div>
        </div>
        {/* Ações */}
        <div className="placa-form-page__actions">
          <button type="button" className="placa-form-page__button placa-form-page__button--cancel"
                  onClick={() => navigate('/placas')} disabled={isFormSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="placa-form-page__button placa-form-page__button--confirm"
                  disabled={isFormSubmitting || isLoadingRegioes}>
            {isFormSubmitting ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlacaFormPage;