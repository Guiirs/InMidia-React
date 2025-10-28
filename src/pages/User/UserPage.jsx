// src/pages/UserPage.jsx
import React, { useState, useEffect } from 'react';
import { fetchUserData, updateUserData } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // Para obter dados iniciais e função updateUser
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { validateForm } from '../../utils/validator'; // Sua função de validação
import './User.css'; // CSS da página

function UserPage() {
  const { user: currentUser, updateUser } = useAuth(); // Obtém user atual e função para atualizar o contexto
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    username: '',
    email: '',
    password: '', // Campo para nova senha
    // avatar_url: '' // Adicionar se tiver este campo
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const showToast = useToast();

  // Carrega os dados iniciais do utilizador (do contexto ou API)
  useEffect(() => {
    setIsLoading(true);
    // Tenta preencher com dados do contexto primeiro
    if (currentUser) {
        setFormData({
            nome: currentUser.nome || '',
            sobrenome: currentUser.sobrenome || '',
            username: currentUser.username || '',
            email: currentUser.email || '',
            password: '', // Campo de senha sempre vazio inicialmente
            // avatar_url: currentUser.avatar_url || ''
        });
        setIsLoading(false);
    } else {
         // Fallback: busca da API se o contexto ainda não tiver os dados (menos provável)
        fetchUserData()
            .then(data => {
                setFormData({
                    nome: data.nome || '',
                    sobrenome: data.sobrenome || '',
                    username: data.username || '',
                    email: data.email || '',
                    password: '',
                    // avatar_url: data.avatar_url || ''
                });
            })
            .catch(err => {
                showToast(err.message || 'Erro ao carregar dados do perfil.', 'error');
                setErrors({ form: 'Não foi possível carregar os dados.' }); // Erro geral
            })
            .finally(() => setIsLoading(false));
    }
  }, [currentUser, showToast]); // Depende do currentUser do contexto

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const validationRules = {
        nome: [{ type: 'optional' }, { type: 'maxLength', param: 100 }],
        sobrenome: [{ type: 'optional' }, { type: 'maxLength', param: 100 }],
        username: [{ type: 'required' }, { type: 'minLength', param: 3 }, { type: 'maxLength', param: 50 }],
        email: [{ type: 'required' }, { type: 'email' }, { type: 'maxLength', param: 100 }],
        password: [
            { type: 'optional' },
            { type: 'minLength', param: 6, message: 'A nova senha deve ter no mínimo 6 caracteres.' }
        ],
        // avatar_url: [{ type: 'optional', checkFalsy: true }, { type: 'url' }] // Se tiver avatar
    };

    // Adaptação da validação para React state
    let formIsValid = true;
    const newErrors = {};
    for (const fieldName in validationRules) {
        // Usa o valor do estado formData
        const value = formData[fieldName];
        const fieldRules = validationRules[fieldName];
        let fieldIsValid = true;

        const isOptional = fieldRules.some(rule => rule.type === 'optional');
        // Trata optional: Pula validação se for opcional E estiver vazio/nulo
         if (isOptional && (value === undefined || value === null || String(value).trim() === '')) {
            continue;
         }

        for (const rule of fieldRules) {
             if (!fieldIsValid) break;
             let isValidForRule = true;
             let errorMessage = rule.message || 'Valor inválido.';

             try {
                  switch (rule.type) {
                      case 'required': isValidForRule = value && String(value).trim() !== ''; break;
                      case 'email': isValidForRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)); break;
                      case 'minLength': isValidForRule = String(value).length >= rule.param; break;
                      case 'maxLength': isValidForRule = String(value).length <= rule.param; break;
                      case 'url':
                            try { new URL(value); isValidForRule = true; } catch { isValidForRule = false; }
                            break;
                      // Adicione outras regras se necessário
                  }
             } catch (validationError) {
                  isValidForRule = false;
                  errorMessage = validationError.message || errorMessage;
             }

             if (!isValidForRule) {
                newErrors[fieldName] = errorMessage;
                formIsValid = false;
                fieldIsValid = false;
             }
        }
    }
    setErrors(newErrors);

    if (!formIsValid) {
      showToast('Corrija os erros no formulário.', 'error');
      setIsSubmitting(false);
      // Foca no primeiro campo com erro
       const firstErrorField = Object.keys(newErrors)[0];
       if (firstErrorField) {
           const inputElement = document.getElementById(firstErrorField);
           inputElement?.focus();
       }
      return;
    }

    // Prepara dados para enviar (remove a senha se estiver vazia)
    const dataToUpdate = { ...formData };
    if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
      delete dataToUpdate.password;
    }

    try {
      const response = await updateUserData(dataToUpdate); // Chama API
      updateUser(response.user); // Atualiza o AuthContext com os dados retornados
      showToast('Perfil atualizado com sucesso!', 'success');
      // Limpa o campo de senha no formulário após sucesso
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      showToast(error.message || 'Erro ao atualizar o perfil.', 'error');
      // Pode adicionar lógica para destacar campos com erros vindos da API (ex: email duplicado)
      if(error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('e-mail')) {
          setErrors(prev => ({...prev, email: error.message}));
      } else if (error.message.toLowerCase().includes('username') || error.message.toLowerCase().includes('utilizador')) {
           setErrors(prev => ({...prev, username: error.message}));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderização ---
  if (isLoading) {
    return <Spinner message="A carregar perfil..." />;
  }

  if (errors.form) {
      return <div className="user-page"><p className="error-message">{errors.form}</p></div>;
  }

  return (
    <div className="user-page">
      <form id="user-profile-form" className="user-page__form" onSubmit={handleSubmit} noValidate>
        <div className="user-page__form-grid">
          {/* Nome */}
          <div className="user-page__input-group">
            <input type="text" id="nome" name="nome"
                   className={`user-page__input ${errors.nome ? 'input-error' : ''}`}
                   placeholder=" " /* Necessário para :placeholder-shown */
                   value={formData.nome} onChange={handleInputChange}
                   disabled={isSubmitting} />
            <label htmlFor="nome" className="user-page__label">Nome</label>
            {errors.nome && <div className="modal-form__error-message">{errors.nome}</div>}
          </div>

          {/* Sobrenome */}
          <div className="user-page__input-group">
            <input type="text" id="sobrenome" name="sobrenome"
                   className={`user-page__input ${errors.sobrenome ? 'input-error' : ''}`}
                   placeholder=" "
                   value={formData.sobrenome} onChange={handleInputChange}
                   disabled={isSubmitting} />
            <label htmlFor="sobrenome" className="user-page__label">Sobrenome</label>
             {errors.sobrenome && <div className="modal-form__error-message">{errors.sobrenome}</div>}
          </div>

          {/* Username */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="text" id="username" name="username"
                   className={`user-page__input ${errors.username ? 'input-error' : ''}`}
                   placeholder=" " required
                   value={formData.username} onChange={handleInputChange}
                   disabled={isSubmitting} />
            <label htmlFor="username" className="user-page__label">Nome de Utilizador</label>
             {errors.username && <div className="modal-form__error-message">{errors.username}</div>}
          </div>

          {/* Email */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="email" id="email" name="email"
                   className={`user-page__input ${errors.email ? 'input-error' : ''}`}
                   placeholder=" " required
                   value={formData.email} onChange={handleInputChange}
                   disabled={isSubmitting} />
            <label htmlFor="email" className="user-page__label">E-mail</label>
            {errors.email && <div className="modal-form__error-message">{errors.email}</div>}
          </div>

          {/* Nova Senha */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="password" id="password" name="password"
                   className={`user-page__input ${errors.password ? 'input-error' : ''}`}
                   placeholder=" "
                   value={formData.password} onChange={handleInputChange}
                   disabled={isSubmitting}
                   autoComplete="new-password" /* Ajuda navegadores */
                   />
            <label htmlFor="password" className="user-page__label">Nova Senha (deixe em branco para não alterar)</label>
            {errors.password && <div className="modal-form__error-message">{errors.password}</div>}
          </div>

          {/* Adicionar campo Avatar URL aqui se necessário */}

          <div className="user-page__actions">
            <button type="submit" className="user-page__save-button" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UserPage;