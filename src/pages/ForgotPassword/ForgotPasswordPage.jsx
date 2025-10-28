// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import './ForgotPassword.css'; // CSS da página

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Erro específico do campo email
  const navigate = useNavigate();
  const showToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erro

    // Validação simples
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email);
      showToast(response.message || 'Instruções enviadas com sucesso!', 'success');
      // Opcional: redirecionar para login ou mostrar mensagem na página
      // navigate('/login');
    } catch (error) {
      showToast(error.message || 'Erro ao enviar o pedido.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__container">
        <i className="fas fa-key forgot-password-page__icon"></i>
        <h2 className="forgot-password-page__title">Esqueceu a sua senha?</h2>
        <p className="forgot-password-page__subtitle">Sem problemas. Insira o seu e-mail e enviaremos as instruções para a redefinir.</p>
        <form id="forgot-password-form" className="forgot-password-page__form" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            id="email"
            name="email"
            className={`forgot-password-page__input ${error ? 'input-error' : ''}`}
            placeholder="Digite o seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          {/* Usa classe CSS base para erro */}
          {error && <div className="modal-form__error-message" style={{ textAlign: 'left' }}>{error}</div>}
          <button type="submit" className="forgot-password-page__button" disabled={isLoading}>
            {isLoading ? 'A enviar...' : 'Enviar Instruções'}
          </button>
        </form>
        <Link to="/login" className="forgot-password-page__back-link">Voltar para o Login</Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;