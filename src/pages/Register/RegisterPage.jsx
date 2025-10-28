// src/pages/RegisterPage.jsx
import { useForm } from 'react-hook-form'; // Importa o hook principal
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerEmpresa } from '../../services/api'; 
import { useToast } from '../../components/ToastNotification/ToastNotification';
import ApiKeyModal from '../../components/ApiKeyModal/ApiKeyModal'; // Modal para mostrar a chave
import { validateForm, validateCNPJ } from '../../utils/validator'; // Funções de validação
import './Register.css'; // CSS da página
// src/pages/Register/RegisterPage.jsx (Refatorado com react-hook-form)

function RegisterPage() {
  // Inicializa o react-hook-form
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    mode: 'onBlur', // Valida ao sair do campo
    defaultValues: {
      nome_empresa: '', cnpj: '', nome: '', sobrenome: '',
      username: '', email: '', password: '', confirmPassword: '',
    }
  });

  const navigate = useNavigate();
  const showToast = useToast();
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '' });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');

  // Assiste ao campo 'password' para o medidor de força
  const password = watch('password', '');

  // --- Funções Auxiliares (Força da Senha) ---
  useEffect(() => {
    let score = 0;
    let text = 'Muito Fraca';
    if (!password) password = '';
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1: text = 'Fraca'; break;
      case 2: text = 'Média'; break;
      case 3: text = 'Forte'; break;
      case 4: text = 'Muito Forte'; break;
      default: text = password.length === 0 ? '' : 'Muito Fraca';
    }
    setPasswordStrength({ score, text });
  }, [password]);

  const getPasswordStrengthClass = () => {
    switch (passwordStrength.score) {
      case 1: return 'register-page__password-strength-bar--weak';
      case 2: return 'register-page__password-strength-bar--medium';
      case 3: return 'register-page__password-strength-bar--strong';
      case 4: return 'register-page__password-strength-bar--very-strong';
      default: return password.length > 0 ? 'register-page__password-strength-bar--weak' : '';
    }
  };

  // --- Submissão do Formulário ---
  const onSubmit = async (data) => {
    // A validação de campos e senhas iguais já foi feita pelo RHF.
    // Prepara dados para enviar (remove confirmPassword)
    const dataToSend = { ...data };
    delete dataToSend.confirmPassword;

    try {
      const response = await registerEmpresa(dataToSend);
      if (response && response.fullApiKey) {
        setGeneratedApiKey(response.fullApiKey);
        setIsApiKeyModalOpen(true); // Abre o modal para mostrar a chave
      } else {
        showToast('Empresa registada! Faça login.', 'success');
        navigate('/login');
      }
    } catch (error) {
      showToast(error.message || 'Erro ao registar.', 'error');
      // O RHF não lida automaticamente com erros de API que afetam campos (ex: duplicação)
      // O erro de duplicação deve ser tratado aqui no controller ou no serviço
      console.error("Erro no registo (API):", error);
    }
  };

  const handleCloseApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
    navigate('/login');
  };

  // --- JSX do Formulário ---
  return (
    <>
      <div className="register-page">
        <div className="register-page__container">
          <div className="register-page__form-wrapper">
            {/* O handleSubmit do RHF envolve nossa função de submissão */}
            <form id="register-form" className="register-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="register-page__form-header">
                <h2 className="register-page__form-title">Crie a sua Conta</h2>
              </div>

              <div className="register-page__form-grid">
                {/* 1. Nome da Empresa */}
                <div className="register-page__input-group register-page__input-group--full-width">
                  <input type="text" id="empresa-nome" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.nome_empresa ? 'input-error' : ''}`}
                         {...register('nome_empresa', { required: 'O nome da empresa é obrigatório.' })} />
                  <label htmlFor="empresa-nome" className="register-page__label">Nome da Empresa</label>
                  {errors.nome_empresa && <div className="modal-form__error-message">{errors.nome_empresa.message}</div>}
                </div>
                
                {/* 2. CNPJ */}
                <div className="register-page__input-group register-page__input-group--full-width">
                  <input type="text" id="empresa-cnpj" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.cnpj ? 'input-error' : ''}`}
                         {...register('cnpj', {
                             required: 'O CNPJ é obrigatório.',
                             validate: (value) => validateCNPJ(value) || 'O CNPJ fornecido é inválido.'
                         })} />
                  <label htmlFor="empresa-cnpj" className="register-page__label">CNPJ da Empresa</label>
                  {errors.cnpj && <div className="modal-form__error-message">{errors.cnpj.message}</div>}
                </div>

                {/* 3. Nome e Sobrenome do Admin */}
                <div className="register-page__input-group">
                  <input type="text" id="admin-nome" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.nome ? 'input-error' : ''}`}
                         {...register('nome', { required: 'O nome é obrigatório.' })} />
                  <label htmlFor="admin-nome" className="register-page__label">Nome do Admin</label>
                  {errors.nome && <div className="modal-form__error-message">{errors.nome.message}</div>}
                </div>
                <div className="register-page__input-group">
                  <input type="text" id="admin-sobrenome" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.sobrenome ? 'input-error' : ''}`}
                         {...register('sobrenome', { required: 'O sobrenome é obrigatório.' })} />
                  <label htmlFor="admin-sobrenome" className="register-page__label">Sobrenome do Admin</label>
                  {errors.sobrenome && <div className="modal-form__error-message">{errors.sobrenome.message}</div>}
                </div>

                {/* 4. Username e Email */}
                <div className="register-page__input-group register-page__input-group--full-width">
                  <input type="text" id="admin-username" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.username ? 'input-error' : ''}`}
                         {...register('username', { required: 'O nome de utilizador é obrigatório.', minLength: { value: 3, message: 'Mínimo 3 caracteres.' } })} />
                  <label htmlFor="admin-username" className="register-page__label">Nome de Utilizador</label>
                  {errors.username && <div className="modal-form__error-message">{errors.username.message}</div>}
                </div>
                <div className="register-page__input-group register-page__input-group--full-width">
                  <input type="email" id="admin-email" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.email ? 'input-error' : ''}`}
                         {...register('email', { required: 'O e-mail é obrigatório.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Formato de e-mail inválido.' } })} />
                  <label htmlFor="admin-email" className="register-page__label">E-mail do Admin</label>
                  {errors.email && <div className="modal-form__error-message">{errors.email.message}</div>}
                </div>
                
                {/* 5. Senha */}
                <div className="register-page__input-group">
                  <input type="password" id="admin-password" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.password ? 'input-error' : ''}`}
                         {...register('password', { required: 'A senha é obrigatória.', minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres.' } })} />
                  <label htmlFor="admin-password" className="register-page__label">Senha</label>
                  <div className="register-page__password-strength">
                    <div id="password-strength-bar" className={`register-page__password-strength-bar ${getPasswordStrengthClass()}`}></div>
                  </div>
                  <div id="password-strength-text" className="register-page__password-strength-text">{passwordStrength.text}</div>
                  {errors.password && <div className="modal-form__error-message">{errors.password.message}</div>}
                </div>
                
                {/* 6. Confirmar Senha */}
                <div className="register-page__input-group">
                  <input type="password" id="admin-confirm-password" placeholder=" " disabled={isSubmitting}
                         className={`register-page__input ${errors.confirmPassword ? 'input-error' : ''}`}
                         {...register('confirmPassword', {
                             required: 'A confirmação de senha é obrigatória.',
                             validate: (value) => value === password || 'As senhas não coincidem.'
                         })} />
                  <label htmlFor="admin-confirm-password" className="register-page__label">Confirmar Senha</label>
                  {errors.confirmPassword && <div className="modal-form__error-message">{errors.confirmPassword.message}</div>}
                </div>
              </div> {/* Fim grid */}

              <button type="submit" className="register-page__button" disabled={isSubmitting}>
                {isSubmitting ? 'A registar...' : 'Registar'}
              </button>

              <div className="register-page__login-link">
                Já tem uma conta? <Link to="/login" className="register-page__form-link">Faça login</Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para mostrar API Key */}
      <ApiKeyModal
          apiKey={generatedApiKey}
          isOpen={isApiKeyModalOpen}
          onClose={handleCloseApiKeyModal}
      />
    </>
  );
}

export default RegisterPage;