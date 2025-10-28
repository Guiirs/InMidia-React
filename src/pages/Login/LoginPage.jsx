// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api'; // Sua função API refatorada
import { useToast } from '../../components/ToastNotification/ToastNotification'; // Hook do Toast
import { validateForm } from '../../utils/validator'; // Sua função de validação
import './Login.css'; // Importe o CSS (ou .module.css)

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // Obtém função login e status do contexto
  const showToast = useToast(); // Obtém a função showToast

  // Redireciona se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);


  const validationRules = {
    email: [{ type: 'required' }, { type: 'email' }],
    password: [{ type: 'required' }],
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({}); // Limpa erros anteriores

    // Adaptação da validação para React state
    const formData = { email, password };
    let formIsValid = true;
    const newErrors = {};

    for (const fieldName in validationRules) {
        const value = formData[fieldName];
        const fieldRules = validationRules[fieldName];
        let fieldIsValid = true;

        const isOptional = fieldRules.some(rule => rule.type === 'optional');
         if (isOptional && (!value || String(value).trim() === '')) {
            continue;
         }

        for (const rule of fieldRules) {
             if (!fieldIsValid) break;
             let isValidForRule = true;
             let errorMessage = rule.message || 'Valor inválido.';

             switch (rule.type) {
                 case 'required':
                     isValidForRule = value && String(value).trim() !== '';
                     errorMessage = rule.message || 'Este campo é obrigatório.';
                     break;
                 case 'email':
                     isValidForRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
                     errorMessage = rule.message || 'Por favor, insira um email válido.';
                     break;
                 // Adicione outras regras se necessário
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
      showToast('Por favor, corrija os erros.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      if (data && data.user && data.token) {
        login(data.user, data.token); // Chama a função login do AuthContext
        showToast('Login bem-sucedido!', 'success');
        // A navegação será tratada pelo useEffect ou pelo ProtectedRoute
        // navigate('/dashboard'); // Não é estritamente necessário aqui
      } else {
         // Caso a API retorne 200 OK mas sem user/token (pouco provável)
        throw new Error(data?.message || 'Resposta inválida do servidor.');
      }
    } catch (error) {
      showToast(error.message || 'Falha no login.', 'error');
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // JSX baseado no seu HTML original
  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__showcase">
          {/* Use /assets/img/... pois está na pasta public */}
          <img src="/assets/img/logo 244.png" alt="InMidia Logo" className="login-page__logo-img" />
          <h1 className="login-page__showcase-title">Gestão Inteligente de Mídia Exterior</h1>
          <p className="login-page__showcase-text">Controle, analise e otimize suas campanhas de publicidade em outdoors de forma centralizada.</p>
        </div>
        <div className="login-page__form-wrapper">
          <form onSubmit={handleSubmit} className="login-page__form" noValidate>
            <div className="login-page__form-header">
              <h2 className="login-page__form-title">Bem-vindo de volta!</h2>
              <span className="login-page__form-subtitle">Faça login para aceder ao seu painel.</span>
            </div>
            <div className="login-page__input-group">
              <input
                type="email"
                id="email"
                name="email"
                className={`login-page__input ${errors.email ? 'input-error' : ''}`}
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              {/* Usa a classe do CSS base */}
              {errors.email && <div className="modal-form__error-message">{errors.email}</div>}
            </div>
            <div className="login-page__input-group">
              <input
                type="password"
                id="password"
                name="password"
                className={`login-page__input ${errors.password ? 'input-error' : ''}`}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {errors.password && <div className="modal-form__error-message">{errors.password}</div>}
            </div>
            <div className="login-page__form-options">
              <div /> {/* Espaçador */}
              {/* Usa o componente Link do react-router-dom */}
              <Link to="/forgot-password" className="login-page__form-link">Esqueceu a senha?</Link>
            </div>
            <button type="submit" className="login-page__button" disabled={isLoading}>
              {isLoading ? 'A entrar...' : 'Entrar'}
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