// src/pages/User/UserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form'; // <<< Refinamento 6
import { fetchUserData, updateUserData } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
// O 'validateForm' manual não é mais necessário
import './User.css';

function UserPage() {
  const { user: currentUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // Apenas para o carregamento inicial
  const showToast = useToast();

  // --- Refinamento 6: Inicializa react-hook-form ---
  const {
    register,
    handleSubmit,
    reset, // Para preencher/limpar o formulário
    setError, // Para definir erros da API
    formState: { errors, isSubmitting }, // Erros de validação e estado de submissão
  } = useForm({
    mode: 'onBlur', // Valida ao sair do campo
    defaultValues: {
      nome: '', sobrenome: '', username: '', email: '', password: '',
    }
  });

  // Carrega os dados iniciais do utilizador e preenche o formulário RHF
  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    let userData = currentUser;
    try {
        // Se o contexto ainda não tiver dados (ex: refresh), busca na API
        if (!userData || !userData.nome) { // Verifica se tem dados além do ID/role
            console.log("[UserPage] Buscando dados frescos da API...");
            userData = await fetchUserData();
        }
        
        if (userData) {
            reset({ // Usa reset para preencher o formulário RHF
                nome: userData.nome || '',
                sobrenome: userData.sobrenome || '',
                username: userData.username || '',
                email: userData.email || '',
                password: '', // Senha sempre vazia
            });
        } else {
             throw new Error("Não foi possível carregar os dados do utilizador.");
        }
    } catch (err) {
        showToast(err.message || 'Erro ao carregar dados do perfil.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, reset, showToast]);

  useEffect(() => {
      loadUserData();
  }, [loadUserData]);

  // --- Refinamento 6: Submissão do Formulário ---
  const onSubmit = async (data) => {
    // 'data' já contém os valores validados pelo RHF

    // Prepara dados para enviar (remove a senha se estiver vazia)
    const dataToUpdate = { ...data };
    if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
      delete dataToUpdate.password;
    }

    try {
      const response = await updateUserData(dataToUpdate); // Chama API
      updateUser(response.user); // Atualiza o AuthContext
      showToast('Perfil atualizado com sucesso!', 'success');
      // Limpa o campo de senha no formulário após sucesso
      reset({ ...response.user, password: '' }); // Reseta com os dados atualizados e senha vazia

    } catch (error) {
      showToast(error.message || 'Erro ao atualizar o perfil.', 'error');
      // Define erros específicos para os campos se a API retornar erro de duplicação
      if(error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('e-mail')) {
          setError('email', { type: 'api', message: error.message });
      } else if (error.message.toLowerCase().includes('username') || error.message.toLowerCase().includes('utilizador')) {
           setError('username', { type: 'api', message: error.message });
      }
       console.error("Erro submit user profile:", error);
    }
    // isSubmitting é gerido automaticamente pelo RHF
  };

  // --- Renderização ---
  if (isLoading) {
    return <Spinner message="A carregar perfil..." />;
  }

  return (
    <div className="user-page">
      {/* handleSubmit(onSubmit) envolve a submissão */}
      <form id="user-profile-form" className="user-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="user-page__form-grid">
          {/* Nome */}
          <div className="user-page__input-group">
            <input type="text" id="nome" placeholder=" " disabled={isSubmitting}
                   className={`user-page__input ${errors.nome ? 'input-error' : ''}`}
                   {...register('nome', { maxLength: { value: 100, message: 'Máximo 100 caracteres.'} })} />
            <label htmlFor="nome" className="user-page__label">Nome</label>
            {errors.nome && <div className="modal-form__error-message">{errors.nome.message}</div>}
          </div>

          {/* Sobrenome */}
          <div className="user-page__input-group">
            <input type="text" id="sobrenome" placeholder=" " disabled={isSubmitting}
                   className={`user-page__input ${errors.sobrenome ? 'input-error' : ''}`}
                   {...register('sobrenome', { maxLength: { value: 100, message: 'Máximo 100 caracteres.'} })} />
            <label htmlFor="sobrenome" className="user-page__label">Sobrenome</label>
             {errors.sobrenome && <div className="modal-form__error-message">{errors.sobrenome.message}</div>}
          </div>

          {/* Username */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="text" id="username" placeholder=" " required disabled={isSubmitting}
                   className={`user-page__input ${errors.username ? 'input-error' : ''}`}
                   {...register('username', {
                       required: 'O nome de utilizador é obrigatório.',
                       minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
                       maxLength: { value: 50, message: 'Máximo 50 caracteres.'}
                   })} />
            <label htmlFor="username" className="user-page__label">Nome de Utilizador</label>
             {errors.username && <div className="modal-form__error-message">{errors.username.message}</div>}
          </div>

          {/* Email */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="email" id="email" placeholder=" " required disabled={isSubmitting}
                   className={`user-page__input ${errors.email ? 'input-error' : ''}`}
                   {...register('email', {
                       required: 'O e-mail é obrigatório.',
                       pattern: { value: /^\S+@\S+\.\S+$/, message: 'Formato de e-mail inválido.' },
                       maxLength: { value: 100, message: 'Máximo 100 caracteres.'}
                   })} />
            <label htmlFor="email" className="user-page__label">E-mail</label>
            {errors.email && <div className="modal-form__error-message">{errors.email.message}</div>}
          </div>

          {/* Nova Senha */}
          <div className="user-page__input-group user-page__input-group--full-width">
            <input type="password" id="password" placeholder=" " disabled={isSubmitting}
                   className={`user-page__input ${errors.password ? 'input-error' : ''}`}
                   autoComplete="new-password"
                   {...register('password', {
                       // Validação opcional: só valida minLength se houver valor
                       validate: (value) => !value || value.length >= 6 || 'A nova senha deve ter no mínimo 6 caracteres.'
                   })}
                   />
            <label htmlFor="password" className="user-page__label">Nova Senha (deixe em branco para não alterar)</label>
            {errors.password && <div className="modal-form__error-message">{errors.password.message}</div>}
          </div>

          {/* Ações */}
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