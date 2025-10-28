// src/pages/Login/LoginPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // <<< Refinamento 6
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import './Login.css'; // Importa o CSS da pasta

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const showToast = useToast();

  // --- Refinamento 6: Inicializa react-hook-form ---
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }, // Obtém erros e estado de submissão
  } = useForm({
    mode: 'onBlur', // Valida ao sair do campo
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redireciona se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // --- Refinamento 6: Função de submissão ---
  // Esta função só é chamada pelo 'handleSubmit' se a validação passar
  const onSubmit = async (data) => {
    // 'data' contém { email: '...', password: '...' }
    try {
      const responseData = await loginUser(data.email, data.password);

      if (responseData && responseData.user && responseData.token) {
        login(responseData.user, responseData.token); // Atualiza o AuthContext
        showToast('Login bem-sucedido!', 'success');
        // A navegação para /dashboard será tratada pelo ProtectedRoute/MainLayout
        // ou pelo useEffect acima na próxima renderização
      } else {
        // Fallback (pouco provável com o interceptor axios)
        throw new Error(responseData?.message || 'Resposta inesperada do servidor.');
      }
    } catch (error) {
      // Erros (ex: 401 Credenciais inválidas) são tratados pelo interceptor do axios
      // e relançados, caindo aqui.
      showToast(error.message || 'Falha no login.', 'error');
      console.error("Login failed:", error);
    }
    // O 'isSubmitting' é gerido automaticamente pelo react-hook-form
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__showcase">
          {/* Caminho relativo à pasta /public */}
          <img src="/assets/img/logo 244.png" alt="InMidia Logo" className="login-page__logo-img" />
          <h1 className="login-page__showcase-title">Gestão Inteligente de Mídia Exterior</h1>
          <p className="login-page__showcase-text">Controle, analise e otimize suas campanhas de publicidade em outdoors de forma centralizada.</p>
        </div>
        <div className="login-page__form-wrapper">
          {/* handleSubmit(onSubmit) trata a validação antes de chamar onSubmit */}
          <form id="login-form" className="login-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="login-page__form-header">
              <h2 className="login-page__form-title">Bem-vindo de volta!</h2>
              <span className="login-page__form-subtitle">Faça login para aceder ao seu painel.</span>
            </div>
            {/* Campo Email */}
            <div className="login-page__input-group">
              <input
                type="email"
                id="email"
                className={`login-page__input ${errors.email ? 'input-error' : ''}`}
                placeholder="Seu e-mail"
                required
                disabled={isSubmitting} // Desabilita durante a submissão
                {...register('email', { // Regista o campo
                  required: 'O e-mail é obrigatório.',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/, // Validação de email
                    message: 'Formato de e-mail inválido.'
                  }
                })}
              />
              {/* Exibe o erro correspondente a 'email' */}
              {errors.email && <div className="modal-form__error-message">{errors.email.message}</div>}
            </div>
            {/* Campo Senha */}
            <div className="login-page__input-group">
              <input
                type="password"
                id="password"
                className={`login-page__input ${errors.password ? 'input-error' : ''}`}
                placeholder="Sua senha"
                required
                disabled={isSubmitting}
                {...register('password', { // Regista o campo
                  required: 'A senha é obrigatória.'
                })}
              />
              {errors.password && <div className="modal-form__error-message">{errors.password.message}</div>}
            </div>
            <div className="login-page__form-options">
              <div /> {/* Espaçador */}
              <Link to="/forgot-password" className="login-page__form-link">Esqueceu a senha?</Link>
            </div>
            <button type="submit" className="login-page__button" disabled={isSubmitting}>
              {isSubmitting ? 'A entrar...' : 'Entrar'}
            </button>
            <div className="login-page__register-link">
              Não tem uma conta? <Link to="/empresa-register" className="login-page__form-link">Registe-se aqui</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;