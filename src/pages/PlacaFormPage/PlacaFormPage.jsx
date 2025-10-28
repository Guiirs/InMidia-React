// src/pages/PlacaFormPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRegioes } from '../../state/dataCache'; // Cache de regiões
import { fetchPlacaById, addPlaca, updatePlaca } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { validateForm } from '../../utils/validator'; // Validação
import { getImageUrl } from '../../utils/helpers'; // Para preview da imagem existente
import './PlacaFormPage.css'; // CSS da página

function PlacaFormPage() {
  const navigate = useNavigate();
  const { id: placaId } = useParams(); // Obtém o ID da URL se estiver editando
  const isEditMode = Boolean(placaId);

  const [formData, setFormData] = useState({
    numero_placa: '',
    nomeDaRua: '',
    coordenadas: '',
    tamanho: '',
    regiao: '', // Guardará o _id da região selecionada
  });
  const [regioes, setRegioes] = useState([]);
  const [imageFile, setImageFile] = useState(null); // O ficheiro selecionado
  const [imagePreview, setImagePreview] = useState(null); // URL de preview (data URL ou URL existente)
  const [imageRemoved, setImageRemoved] = useState(false); // Flag para marcar remoção
  const [isLoading, setIsLoading] = useState(true); // Loading inicial (regiões e dados da placa)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const showToast = useToast();
  const imageInputRef = useRef(null); // Ref para resetar o input de ficheiro

  // Carrega regiões (do cache/API)
  useEffect(() => {
    const loadRegioes = async () => {
      try {
        const data = await getRegioes();
        setRegioes(data);
      } catch (err) {
        showToast('Erro ao carregar regiões.', 'error');
        setErrors(prev => ({ ...prev, regiao: 'Falha ao carregar regiões' }));
      }
    };
    loadRegioes();
  }, [showToast]);

  // Carrega dados da placa se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && regioes.length > 0) { // Só carrega placa depois das regiões
      setIsLoading(true); // Mostra loading para a placa
      fetchPlacaById(placaId)
        .then(placa => {
          setFormData({
            numero_placa: placa.numero_placa || '',
            nomeDaRua: placa.nomeDaRua || '',
            coordenadas: placa.coordenadas || '',
            tamanho: placa.tamanho || '',
            // A API retorna 'regiao' como o nome, mas precisamos do _id.
            // Buscamos o _id correspondente na lista de regiões carregadas.
            // A API v2 (com Mongoose) retorna o ID populado diretamente. Verifique a resposta da sua API.
            // Assumindo que fetchPlacaById retorna placa.regiao._id ou placa.regiao (se não populado)
            regiao: placa.regiao?._id || placa.regiao || '', // Ajuste conforme a resposta da API
          });
          // Define o preview da imagem existente
          const currentImageUrl = placa.imagem ? getImageUrl(placa.imagem, null) : null;
          setImagePreview(currentImageUrl);
          setImageRemoved(false); // Reseta flag de remoção
        })
        .catch(err => {
          showToast(err.message || 'Erro ao carregar dados da placa.', 'error');
          setError(err.message); // Define erro geral
          navigate('/placas'); // Volta para a lista se não encontrar a placa
        })
        .finally(() => setIsLoading(false));
    } else if (!isEditMode) {
        setIsLoading(false); // Se não for edição, termina o loading inicial
    }
  }, [isEditMode, placaId, navigate, showToast, regioes]); // Depende das regiões carregadas

  // Handle Input Change (campos de texto e select)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle Image File Change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageRemoved(false); // Se selecionou novo, não está removendo
      // Gera preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, imagem: undefined })); // Limpa erro da imagem
    } else {
        // Se cancelou a seleção, reverte para o estado anterior
        setImageFile(null);
        if(isEditMode && formData.imagem) { // Se editando e tinha imagem antes
            setImagePreview(getImageUrl(formData.imagem, null));
        } else {
            setImagePreview(null);
        }
    }
  };

  // Handle Remove Image Click
  const handleRemoveImage = () => {
    setImageFile(null); // Limpa ficheiro selecionado
    setImagePreview(null); // Limpa preview
    setImageRemoved(true); // Marca para remoção no submit (se editando)
    if (imageInputRef.current) imageInputRef.current.value = null; // Limpa o input
    showToast('Imagem marcada para remoção. Guarde para confirmar.', 'info');
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const validationRules = {
        numero_placa: [{ type: 'required' }, { type: 'maxLength', param: 50 }],
        regiao: [{ type: 'required', message: 'Por favor, selecione uma região.' }], // Valida o 'regiao' no formData
        nomeDaRua: [{ type: 'optional' }, { type: 'maxLength', param: 255 }],
        coordenadas: [{ type: 'optional' }, { type: 'coords', message: 'Formato inválido (ex: -3.12, -38.45)' }],
        tamanho: [{ type: 'optional' }, { type: 'maxLength', param: 50 }],
        // Adicionar validação para 'imagem' (tamanho/tipo) aqui se necessário
    };

    // Adaptação da validação
    let formIsValid = true;
    const newErrors = {};
    for (const fieldName in validationRules) {
        const value = formData[fieldName]; // Lê do estado formData
        const fieldRules = validationRules[fieldName];
        let fieldIsValid = true;
        const isOptional = fieldRules.some(rule => rule.type === 'optional');

        if (isOptional && (value === undefined || value === null || String(value).trim() === '')) continue;

        for (const rule of fieldRules) {
            if (!fieldIsValid) break;
             let isValidForRule = true;
             let errorMessage = rule.message || 'Valor inválido.';
             try {
                  switch (rule.type) {
                      case 'required': isValidForRule = value && String(value).trim() !== ''; break;
                      case 'maxLength': isValidForRule = String(value).length <= rule.param; break;
                      case 'coords': isValidForRule = !value || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value).trim()); break; // Permite vazio ou formato correto
                       // Adicione outras regras
                  }
             } catch (validationError) { isValidForRule = false; errorMessage = validationError.message || errorMessage; }

             if (!isValidForRule) {
                 newErrors[fieldName] = errorMessage; formIsValid = false; fieldIsValid = false;
             }
        }
    }
    // Validação extra para imagem (exemplo tamanho)
    /*
    if (imageFile && imageFile.size > 5 * 1024 * 1024) { // Max 5MB
         newErrors.imagem = 'A imagem excede o tamanho máximo de 5MB.';
         formIsValid = false;
    }
    */
    setErrors(newErrors);

    if (!formIsValid) {
      showToast('Corrija os erros no formulário.', 'error');
      setIsSubmitting(false);
       const firstErrorField = Object.keys(newErrors)[0];
       if (firstErrorField) {
           const inputElement = document.getElementById(firstErrorField);
           inputElement?.focus();
       }
      return;
    }

    // Monta o FormData
    const dataToSend = new FormData();
    Object.keys(formData).forEach(key => {
        // Envia o campo apenas se não for nulo ou undefined (backend pode tratar strings vazias)
         if (formData[key] !== null && formData[key] !== undefined) {
             dataToSend.append(key, formData[key]);
         }
    });

    if (imageFile) {
      dataToSend.append('imagem', imageFile);
    } else if (isEditMode && imageRemoved) {
      dataToSend.append('imagem', ''); // Envia vazio para indicar remoção
    }
    // Se editando e não marcou para remover e não selecionou novo ficheiro, não envia 'imagem'

    try {
      if (isEditMode) {
        await updatePlaca(placaId, dataToSend);
        showToast('Placa atualizada com sucesso!', 'success');
      } else {
        await addPlaca(dataToSend);
        showToast('Placa adicionada com sucesso!', 'success');
      }
      navigate('/placas'); // Volta para a lista
    } catch (error) {
      showToast(error.message || 'Erro ao guardar a placa.', 'error');
       // Adiciona erro específico se for duplicação
      if(error.message.toLowerCase().includes('número') && error.message.toLowerCase().includes('região')) {
          setErrors(prev => ({...prev, numero_placa: error.message, regiao: error.message}));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderização ---
  if (isLoading) {
    return <Spinner message={isEditMode ? "A carregar dados da placa..." : "A carregar..."} />;
  }
   if (error && !isEditMode) { // Mostra erro apenas se falhar ao carregar regiões no modo Adicionar
       return <div className="placa-form-page"><p className="error-message">Erro ao carregar dependências: {error}</p></div>;
   }


  return (
    <div className="placa-form-page">
      {/* O título pode vir do MainLayout */}
      <form id="placa-form" onSubmit={handleSubmit} noValidate>
        <div className="placa-form-page__grid">
          {/* Número da Placa */}
          <div className="placa-form-page__input-group placa-form-page__input-group--full">
            <label htmlFor="numero_placa" className="placa-form-page__label">Número da Placa</label>
            <input type="text" id="numero_placa" name="numero_placa"
                   className={`placa-form-page__input ${errors.numero_placa ? 'input-error' : ''}`}
                   value={formData.numero_placa} onChange={handleInputChange}
                   required disabled={isSubmitting} />
            {errors.numero_placa && <div className="modal-form__error-message">{errors.numero_placa}</div>}
          </div>
          {/* Nome da Rua */}
          <div className="placa-form-page__input-group">
            <label htmlFor="nomeDaRua" className="placa-form-page__label">Nome da Rua</label>
            <input type="text" id="nomeDaRua" name="nomeDaRua"
                   className={`placa-form-page__input ${errors.nomeDaRua ? 'input-error' : ''}`}
                   value={formData.nomeDaRua} onChange={handleInputChange}
                   disabled={isSubmitting} />
             {errors.nomeDaRua && <div className="modal-form__error-message">{errors.nomeDaRua}</div>}
          </div>
          {/* Coordenadas */}
          <div className="placa-form-page__input-group">
            <label htmlFor="coordenadas" className="placa-form-page__label">Coordenadas (lat,lng)</label>
            <input type="text" id="coordenadas" name="coordenadas"
                   className={`placa-form-page__input ${errors.coordenadas ? 'input-error' : ''}`}
                   placeholder="-3.123, -38.456"
                   value={formData.coordenadas} onChange={handleInputChange}
                   disabled={isSubmitting} />
             {errors.coordenadas && <div className="modal-form__error-message">{errors.coordenadas}</div>}
          </div>
          {/* Tamanho */}
          <div className="placa-form-page__input-group">
            <label htmlFor="tamanho" className="placa-form-page__label">Tamanho (ex: 9x3)</label>
            <input type="text" id="tamanho" name="tamanho"
                   className={`placa-form-page__input ${errors.tamanho ? 'input-error' : ''}`}
                   value={formData.tamanho} onChange={handleInputChange}
                   disabled={isSubmitting} />
             {errors.tamanho && <div className="modal-form__error-message">{errors.tamanho}</div>}
          </div>
          {/* Região */}
          <div className="placa-form-page__input-group">
            <label htmlFor="regiao" className="placa-form-page__label">Região</label>
            <select id="regiao" name="regiao" // O name agora é 'regiao'
                   className={`placa-form-page__select ${errors.regiao ? 'input-error' : ''}`}
                   value={formData.regiao} onChange={handleInputChange}
                   required disabled={isSubmitting || regioes.length === 0} >
              <option value="">{regioes.length > 0 ? 'Selecione...' : 'A carregar...'}</option>
              {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
            </select>
            {errors.regiao && <div className="modal-form__error-message">{errors.regiao}</div>}
          </div>
          {/* Imagem */}
          <div className="placa-form-page__input-group placa-form-page__input-group--full">
            <label htmlFor="imagem" className="placa-form-page__label">Imagem da Placa (Opcional)</label>
            <input type="file" id="imagem" name="imagem" ref={imageInputRef}
                   className={`placa-form-page__input ${errors.imagem ? 'input-error' : ''}`}
                   accept="image/*" onChange={handleImageChange} disabled={isSubmitting} />
            <div className="placa-form-page__image-preview-container">
              {imagePreview ? (
                <img id="image-preview" src={imagePreview} alt="Pré-visualização" className="placa-form-page__image-preview" />
              ) : (
                <span id="image-preview-text">Nenhuma imagem selecionada</span>
              )}
              {imagePreview && (
                <button type="button" id="remove-image-button"
                        className="placa-form-page__remove-image-button"
                        onClick={handleRemoveImage} disabled={isSubmitting} >
                  <i className="fas fa-trash"></i> Remover Imagem
                </button>
              )}
            </div>
            {errors.imagem && <div className="modal-form__error-message">{errors.imagem}</div>}
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
            {isSubmitting ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlacaFormPage;