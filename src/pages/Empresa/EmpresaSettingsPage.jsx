// src/pages/EmpresaSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { fetchEmpresaData, regenerateApiKey } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal'; // Modal genérico para confirmação
import ApiKeyModal from '../../components/ApiKeyModal/ApiKeyModal'; // Modal específico para mostrar a chave
import { useAuth } from '../../context/AuthContext'; // Para verificar se é admin
import './EmpresaSettings.css'; // CSS da página

function EmpresaSettingsPage() {
  const [empresaData, setEmpresaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState(''); // Para guardar a chave regenerada
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const showToast = useToast();
  const { user } = useAuth(); // Verifica se o user é admin

  // Carrega dados da empresa
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchEmpresaData()
      .then(data => setEmpresaData(data))
      .catch(err => {
        setError(err.message);
        showToast(err.message || 'Erro ao carregar dados da empresa.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const handleOpenConfirmModal = () => {
    setPasswordConfirm(''); // Limpa senha anterior
    setConfirmError('');    // Limpa erro anterior
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setIsRegenerating(false); // Garante reset
  };

  const handleCloseApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
    setNewApiKey(''); // Limpa a chave
  };

  // Submete a confirmação de senha para regenerar
  const handleRegenerateSubmit = async (e) => {
    e.preventDefault();
    setConfirmError('');
    if (!passwordConfirm) {
      setConfirmError('A senha é obrigatória.');
      return;
    }
    setIsRegenerating(true);

    try {
      const response = await regenerateApiKey(passwordConfirm);
      setNewApiKey(response.fullApiKey); // Guarda a nova chave
      setEmpresaData(prev => ({ ...prev, api_key_prefix: response.newApiKeyPrefix })); // Atualiza prefixo na UI
      setIsConfirmModalOpen(false); // Fecha modal de confirmação
      setIsApiKeyModalOpen(true);   // Abre modal para mostrar a chave
      showToast('API Key regenerada com sucesso!', 'success');
    } catch (err) {
      setConfirmError(err.message || 'Erro ao regenerar a chave.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // --- Renderização ---
  if (isLoading) {
    return <Spinner message="A carregar configurações..." />;
  }

  if (error) {
    return <div className="empresa-settings-page"><p className="error-message">Erro: {error}</p></div>;
  }

  // Verifica se é admin antes de mostrar certas partes
  const isAdmin = user?.role === 'admin';

  // Status da assinatura
  const status = empresaData?.status_assinatura;
  const statusText = status === 'active' ? 'Ativa' : 'Inativa';
  const statusClass = status === 'active'
    ? 'empresa-settings-page__status--active'
    : 'empresa-settings-page__status--inactive';

  return (
    <div className="empresa-settings-page">
      {/* Card Detalhes */}
      <div className="empresa-settings-page__card">
        <div className="empresa-settings-page__card-header">
          <i className="fas fa-building empresa-settings-page__card-icon"></i>
          <h3 className="empresa-settings-page__card-title">Detalhes da Empresa</h3>
        </div>
        <div className="empresa-settings-page__info-group">
          <span className="empresa-settings-page__info-label">Nome da Empresa</span>
          <p className="empresa-settings-page__info-value">{empresaData?.nome || 'N/A'}</p>
        </div>
      </div>

      {/* Card API Key (Só para Admin) */}
      {isAdmin && (
        <div className="empresa-settings-page__card">
          <div className="empresa-settings-page__card-header">
            <i className="fas fa-key empresa-settings-page__card-icon"></i>
            <h3 className="empresa-settings-page__card-title">Chave de API</h3>
          </div>
          <div className="empresa-settings-page__info-group">
            <span className="empresa-settings-page__info-label">Prefixo da Chave de API (Segredo oculto)</span>
            <p className="empresa-settings-page__info-value" title="A chave secreta completa só é exibida no momento do registo ou regeneração.">
              {empresaData?.api_key_prefix
                ? `${empresaData.api_key_prefix}_******************`
                : 'N/A (Chave não gerada)'}
            </p>
          </div>
          <div className="empresa-settings-page__actions">
            <button
              className="empresa-settings-page__button--regenerate"
              onClick={handleOpenConfirmModal}
              disabled={isRegenerating} // Desabilita enquanto regenera
            >
              <i className="fas fa-sync-alt"></i> Regenerar Chave de API
            </button>
          </div>
        </div>
      )}

      {/* Card Assinatura */}
      <div className="empresa-settings-page__card">
        <div className="empresa-settings-page__card-header">
          <i className="fas fa-credit-card empresa-settings-page__card-icon"></i>
          <h3 className="empresa-settings-page__card-title">Assinatura</h3>
        </div>
        <div className="empresa-settings-page__info-group">
          <span className="empresa-settings-page__info-label">Status da sua assinatura</span>
          <div id="empresa-status-wrapper">
            <span className={`empresa-settings-page__status ${statusClass}`}>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Senha (Usa o Modal genérico) */}
      <Modal
        title="Confirmar Regeneração de API Key"
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
      >
        <form onSubmit={handleRegenerateSubmit} className="modal-form" noValidate>
            <p>Por segurança, insira a sua senha atual para confirmar. A chave antiga deixará de funcionar imediatamente.</p>
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="password_confirm">Sua Senha Atual</label>
                <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    className={`modal-form__input ${confirmError ? 'input-error' : ''}`}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isRegenerating}
                />
                {confirmError && <div className="modal-form__error-message">{confirmError}</div>}
            </div>
            <div className="modal-form__actions">
                <button
                    type="button"
                    className="modal-form__button modal-form__button--cancel"
                    onClick={handleCloseConfirmModal}
                    disabled={isRegenerating}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="modal-form__button modal-form__button--confirm"
                    disabled={isRegenerating}
                >
                    {isRegenerating ? 'A regenerar...' : 'Confirmar e Regenerar'}
                </button>
            </div>
        </form>
      </Modal>

      {/* Modal para Mostrar Nova API Key */}
      <ApiKeyModal
        apiKey={newApiKey}
        isOpen={isApiKeyModalOpen}
        onClose={handleCloseApiKeyModal}
      />

    </div>
  );
}

export default EmpresaSettingsPage;