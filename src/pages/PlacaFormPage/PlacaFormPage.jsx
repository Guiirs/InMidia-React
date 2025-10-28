// src/pages/PlacaFormPage/PlacaFormPage.jsx (Refatorado com react-hook-form)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // <<< Refinamento 6
import { getRegioes } from '../../state/dataCache'; // Cache de regiões
import { fetchPlacaById, addPlaca, updatePlaca } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
// A validação manual (validateForm) não é mais necessária
import { getImageUrl } from '../../utils/helpers';
import './PlacaFormPage.css';

function PlacaFormPage() {
  const navigate = useNavigate();
  const { id: placaId } = useParams(); // Obtém o ID da URL se estiver editando
  const isEditMode = Boolean(placaId);

  const [regioes, setRegioes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null); // Mantém estado para preview
  const [isLoading, setIsLoading] = useState(true); // Loading inicial (regiões e dados da placa)
  const [initialImageUrl, setInitialImageUrl] = useState(null); // Para reverter preview
  const [errorLoading, setErrorLoading] = useState(null); // Erro no carregamento inicial

  const showToast = useToast();

  // --- Refinamento 6: Inicializa react-hook-form ---
  const {
    register,
    handleSubmit,
    reset, // Para preencher/limpar o formulário
    watch, // Para observar campo imagem
    setValue, // Para limpar imagem
    setError: setFormError, // Para erros da API
    formState: { errors, isSubmitting }, // Erros de validação e estado de submissão
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      numero_placa: '',
      nomeDaRua: '',
      coordenadas: '',
      tamanho: '',
      regiao: '', // Guardará o _id da região selecionada
      imagem: null // 'imagem' será FileList
    }
  });

  // Observa o campo 'imagem' para atualizar a preview
  const imagemField = watch('imagem');
  useEffect(() => {
    if (imagemField && imagemField[0] instanceof File) {
      // Se um ficheiro foi selecionado, gera preview
      const file = imagemField[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (!imagemField && !initialImageUrl) {
      // Se o campo foi limpo (null) E não havia imagem inicial
      setImagePreview(null);
    } else if (!imagemField && initialImageUrl) {
      // Se o campo foi limpo (null) E havia imagem inicial (volta para ela)
      setImagePreview(initialImageUrl);
    }
  }, [imagemField, initialImageUrl]); // Depende do campo 'imagem' e da URL inicial

  // --- Funções de Carregamento ---
  
  // Carrega regiões (do cache/API)
  const loadRegioes = useCallback(async () => {
    try {
      const data = await getRegioes();
      setRegioes(data);
      return data; // Retorna dados para o useEffect da placa
    } catch (err) {
      showToast('Erro ao carregar regiões.', 'error');
      setFormError('regiao', { type: 'api', message: 'Falha ao carregar regiões' });
      throw err; // Relança para parar o loading da placa
    }
  }, [showToast, setFormError]);

  // Carrega dados da placa (se editando) APÓS carregar regiões
  useEffect(() => {
    const loadPlacaData = async () => {
      try {
        // Garante que regiões foram carregadas antes de buscar a placa
        await loadRegioes();
        
        if (isEditMode) {
          setIsLoading(true); // Loading específico da placa
          setErrorLoading(null);
          const placa = await fetchPlacaById(placaId);
          const currentImageUrl = placa.imagem ? getImageUrl(placa.imagem, null) : null;

          reset({ // Preenche o formulário RHF
            numero_placa: placa.numero_placa || '',
            nomeDaRua: placa.nomeDaRua || '',
            coordenadas: placa.coordenadas || '',
            tamanho: placa.tamanho || '',
            // A API (Mongoose) retorna o objeto populado ou só o ID
            regiao: placa.regiao?._id || placa.regiao || '', // Garante que pegamos o ID
            imagem: null, // Input file sempre começa vazio
          });
          setImagePreview(currentImageUrl);
          setInitialImageUrl(currentImageUrl); // Guarda a URL inicial
        }
      } catch (err) {
        showToast(err.message || 'Erro ao carregar dados.', 'error');
        setErrorLoading(err.message);
        if (isEditMode) navigate('/placas'); // Volta se não encontrar a placa
      } finally {
        setIsLoading(false); // Termina o loading (seja 'novo' ou 'edição')
      }
    };

    loadPlacaData();
  }, [isEditMode, placaId, reset, showToast, navigate, loadRegioes]);


  // --- Handlers ---
  const handleRemoveImage = () => {
    setValue('imagem', null, { shouldValidate: false, shouldDirty: true }); // Limpa o valor no RHF
    setImagePreview(null); // Limpa a preview
    // O 'imageRemoved' flag não é mais necessário
    showToast('Imagem removida. Guarde para confirmar.', 'info');
  };

  // --- Submissão do Formulário (RHF) ---
  const onSubmit = async (data) => {
    // 'data' contém { numero_placa, ..., regiao: _id, imagem: FileList }
    const dataToSend = new FormData();

    // Adiciona campos de texto/select
    Object.keys(data).forEach(key => {
      if (key !== 'imagem' && data[key] !== null && data[key] !== undefined) {
          // A API espera 'regiao' com o ID, o RHF já fornece isso
          dataToSend.append(key, data[key]);
      }
    });

    // Lógica da imagem
    const imageFile = data.imagem?.[0]; // Pega o File do FileList
    if (imageFile instanceof File) {
      dataToSend.append('imagem', imageFile); // Envia novo ficheiro
    } else if (isEditMode && !imagePreview && initialImageUrl) {
      // Editando, E preview está vazia, E havia uma imagem inicial
      dataToSend.append('imagem', ''); // Envia string vazia para remover
    }
    // Se não houver ficheiro e a preview não foi limpa, não envia o campo 'imagem'

    try {
      if (isEditMode) {
        await updatePlaca(placaId, dataToSend);
        showToast('Placa atualizada com sucesso!', 'success');
      } else {
        await addPlaca(dataToSend);
        showToast('Placa adicionada com sucesso!', 'success');
      }
      navigate('/placas');
    } catch (error) {
      showToast(error.message || 'Erro ao guardar a placa.', 'error');
      // Adiciona erro específico se for duplicação
      if(error.message.toLowerCase().includes('número') && error.message.toLowerCase().includes('região')) {
          setFormError('numero_placa', { type: 'api', message: "Este número já existe nesta região." });
          setFormError('regiao', { type: 'api', message: "Verifique a região" });
      } else {
           console.error("Erro submit placa:", error);
      }
    }
    // isSubmitting é gerido pelo RHF
  };

  // --- Renderização ---
  if (isLoading) {
    return <Spinner message={isEditMode ? "A carregar dados da placa..." : "A carregar formulário..."} />;
  }
  if (errorLoading) {
       return <div className="placa-form-page"><p className="error-message">Erro ao carregar: {errorLoading}</p></div>;
  }

  return (
    <div className="placa-form-page">
      {/* Título da página (agora vem do MainLayout) */}
      
      {/* handleSubmit(onSubmit) */}
      <form id="placa-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="placa-form-page__grid">
          {/* Número da Placa */}
          <div className="placa-form-page__input-group placa-form-page__input-group--full">
            <label htmlFor="numero_placa" className="placa-form-page__label">Número da Placa</label>
            <input type="text" id="numero_placa"
                   className={`placa-form-page__input ${errors.numero_placa ? 'input-error' : ''}`}
                   {...register('numero_placa', {
                       required: 'O número da placa é obrigatório.',
                       maxLength: { value: 50, message: 'Máximo 50 caracteres.' }
                   })}
                   disabled={isSubmitting} />
            {errors.numero_placa && <div className="modal-form__error-message">{errors.numero_placa.message}</div>}
          </div>
          {/* Nome da Rua */}
          <div className="placa-form-page__input-group">
            <label htmlFor="nomeDaRua" className="placa-form-page__label">Nome da Rua</label>
            <input type="text" id="nomeDaRua"
                   className={`placa-form-page__input ${errors.nomeDaRua ? 'input-error' : ''}`}
                   {...register('nomeDaRua', { maxLength: { value: 255, message: 'Máximo 255 caracteres.'} })}
                   disabled={isSubmitting} />
             {errors.nomeDaRua && <div className="modal-form__error-message">{errors.nomeDaRua.message}</div>}
          </div>
          {/* Coordenadas */}
          <div className="placa-form-page__input-group">
            <label htmlFor="coordenadas" className="placa-form-page__label">Coordenadas (lat,lng)</label>
            <input type="text" id="coordenadas" placeholder="-3.123, -38.456"
                   className={`placa-form-page__input ${errors.coordenadas ? 'input-error' : ''}`}
                   {...register('coordenadas', {
                       // Permite vazio OU o formato correto
                       validate: (value) => !value || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value).trim()) || 'Formato inválido (ex: -3.12, -38.45)'
                   })}
                   disabled={isSubmitting} />
             {errors.coordenadas && <div className="modal-form__error-message">{errors.coordenadas.message}</div>}
          </div>
          {/* Tamanho */}
          <div className="placa-form-page__input-group">
            <label htmlFor="tamanho" className="placa-form-page__label">Tamanho (ex: 9x3)</label>
            <input type="text" id="tamanho"
                   className={`placa-form-page__input ${errors.tamanho ? 'input-error' : ''}`}
                   {...register('tamanho', { maxLength: { value: 50, message: 'Máximo 50 caracteres.'} })}
                   disabled={isSubmitting} />
             {errors.tamanho && <div className="modal-form__error-message">{errors.tamanho.message}</div>}
          </div>
          {/* Região */}
          <div className="placa-form-page__input-group">
            <label htmlFor="regiao" className="placa-form-page__label">Região</label>
            <select id="regiao"
                   className={`placa-form-page__select ${errors.regiao ? 'input-error' : ''}`}
                   {...register('regiao', { required: 'Por favor, selecione uma região.' })}
                   disabled={isSubmitting || regioes.length === 0} >
              <option value="">{regioes.length > 0 ? 'Selecione...' : (isLoading ? 'A carregar...' : 'Erro ao carregar')}</option>
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
                   {...register('imagem')} // Regista o input
                   disabled={isSubmitting} />
            <div className="placa-form-page__image-preview-container">
              {imagePreview ? (
                <img id="image-preview" src={imagePreview} alt="Pré-visualização" className="placa-form-page__image-preview" />
              ) : (
                <span id="image-preview-text">Nenhuma imagem selecionada</span>
              )}
              {imagePreview && (
                <button type
="button" id="remove-image-button"
                        className="placa-form-page__remove-image-button"
                        onClick={handleRemoveImage} disabled={isSubmitting} >
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
                  onClick={() => navigate('/placas')} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="placa-form-page__button placa-form-page__button--confirm"
                  disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'A guardar...' : (isEditMode ? 'Atualizar' : 'Criar Placa')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlacaFormPage;