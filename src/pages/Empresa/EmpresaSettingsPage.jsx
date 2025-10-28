// src/pages/Empresa/EmpresaSettingsPage.jsx
import React, { useState } from 'react'; // Removido useEffect
import { useForm } from 'react-hook-form'; // Para o modal de confirmação
// 1. Importar hooks do React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchEmpresaData, regenerateApiKey } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import ApiKeyModal from '../../components/ApiKeyModal/ApiKeyModal';
import { useAuth } from '../../context/AuthContext';
import './EmpresaSettings.css';

// Chave da query para os dados da empresa
const empresaQueryKey = ['empresaData'];

function EmpresaSettingsPage() {
  // Estados locais para os modais
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState(''); // Para guardar a chave regenerada

  const showToast = useToast();
  const { user } = useAuth(); // Verifica se o user é admin
  const queryClient = useQueryClient(); // Obter o cliente Query

  // --- RHF para o formulário do Modal de Confirmação ---
  const {
    register: registerConfirm,
    handleSubmit: handleConfirmSubmit,
    reset: resetConfirmForm,
    setError: setConfirmError,
    formState: { errors: confirmErrors }, // Pegamos apenas os erros daqui
  } = useForm({ mode: 'onBlur', defaultValues: { password_confirm: '' } });

  // --- 2. useQuery para buscar dados da empresa ---
  const {
    data: empresaData, // Dados da empresa
    isLoading,         // Estado de loading da query
    isError,           // Estado de erro da query
    error,             // Objeto de erro da query
  } = useQuery({
    queryKey: empresaQueryKey,
    queryFn: fetchEmpresaData,
    staleTime: 1000 * 60 * 10, // Cache de 10 minutos (exemplo)
    // Só busca se for admin? Poderia adicionar enabled: !!user && user.role === 'admin'
    // Mas a API já deve tratar isso, então buscamos sempre que logado.
  });

  // --- 3. useMutation para regenerar a API Key ---
  const regenerateMutation = useMutation({
    mutationFn: (password) => regenerateApiKey(password), // API fn (recebe password)
    onSuccess: (response) => { // response = { fullApiKey, newApiKeyPrefix }
      showToast('API Key regenerada com sucesso!', 'success');
      setNewApiKey(response.fullApiKey); // Guarda a nova chave

      // Atualiza o cache do React Query com os dados parciais (novo prefixo)
      queryClient.setQueryData(empresaQueryKey, (oldData) => {
        if (!oldData) return undefined; // Segurança
        return { ...oldData, api_key_prefix: response.newApiKeyPrefix };
      });

      handleCloseConfirmModal(); // Fecha modal de confirmação
      setIsApiKeyModalOpen(true);   // Abre modal para mostrar a chave
    },
    onError: (error) => {
      // Define erro no campo de senha do modal de confirmação
      setConfirmError('password_confirm', { type: 'api', message: error.message || 'Erro ao regenerar.' });
      showToast(error.message || 'Erro ao regenerar a chave.', 'error');
    }
  });

  // Estado de submissão vem da mutação
  const isRegenerating = regenerateMutation.isPending;

  // --- Handlers dos Modais ---
  const handleOpenConfirmModal = () => {
    resetConfirmForm({ password_confirm: '' }); // Limpa RHF
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);
  const handleCloseApiKeyModal = () => setIsApiKeyModalOpen(false);

  // Submissão do modal de confirmação (chama a mutação)
  const onConfirmSubmit = (data) => {
    // 'data' contém { password_confirm: '...' } validado pelo RHF
    regenerateMutation.mutate(data.password_confirm);
  };

  // --- Renderização ---
  if (isLoading) { // Do useQuery
    return <Spinner message="A carregar configurações..." />;
  }

  if (isError) { // Do useQuery
    return <div className="empresa-settings-page"><p className="error-message">Erro: {error.message}</p></div>;
  }

  // Verifica se é admin (inalterado)
  const isAdmin = user?.role === 'admin';

  // Status da assinatura (usa dados do useQuery)
  const status = empresaData?.status_assinatura;
  const statusText = status === 'active' ? 'Ativa' : 'Inativa';
  const statusClass = status === 'active'
    ? 'empresa-settings-page__status--active'
    : 'empresa-settings-page__status--inactive';

  return (
    <div className="empresa-settings-page">
      {/* Card Detalhes (usa dados do useQuery) */}
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

      {/* Card API Key (Só para Admin, usa dados do useQuery) */}
      {isAdmin && (
        <div className="empresa-settings-page__card">
          <div className="empresa-settings-page__card-header">
            <i className="fas fa-key empresa-settings-page__card-icon"></i>
            <h3 className="empresa-settings-page__card-title">Chave de API</h3>
          </div>
          <div className="empresa-settings-page__info-group">
            <span className="empresa-settings-page__info-label">Prefixo da Chave (Segredo oculto)</span>
            <p className="empresa-settings-page__info-value" title="A chave completa só é exibida ao regenerar.">
              {empresaData?.api_key_prefix
                ? `${empresaData.api_key_prefix}_******************`
                : 'N/A'}
            </p>
          </div>
          <div className="empresa-settings-page__actions">
            <button
              className="empresa-settings-page__button--regenerate"
              onClick={handleOpenConfirmModal}
              disabled={isRegenerating} // Usa estado da mutação
            >
              <i className="fas fa-sync-alt"></i> Regenerar Chave de API
            </button>
          </div>
        </div>
      )}

      {/* Card Assinatura (usa dados do useQuery) */}
      <div className="empresa-settings-page__card">
         {/* ... (JSX inalterado) ... */}
         <div className="empresa-settings-page__card-header">
            <i className="fas fa-credit-card empresa-settings-page__card-icon"></i>
            <h3 className="empresa-settings-page__card-title">Assinatura</h3>
          </div>
          <div className="empresa-settings-page__info-group">
            <span className="empresa-settings-page__info-label">Status</span>
            <div id="empresa-status-wrapper">
              <span className={`empresa-settings-page__status ${statusClass}`}>{statusText}</span>
            </div>
          </div>
      </div>

      {/* Modal de Confirmação de Senha (Usa RHF e estado da mutação) */}
      <Modal
        title="Confirmar Regeneração de API Key"
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
      >
        <form onSubmit={handleConfirmSubmit(onConfirmSubmit)} className="modal-form" noValidate>
            <p>Insira a sua senha atual para confirmar. A chave antiga deixará de funcionar.</p>
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="password_confirm">Sua Senha Atual</label>
                <input
                    type="password"
                    id="password_confirm"
                    className={`modal-form__input ${confirmErrors.password_confirm ? 'input-error' : ''}`}
                    autoComplete="current-password"
                    {...registerConfirm('password_confirm', { required: 'A senha é obrigatória.' })}
                    disabled={isRegenerating} // Usa estado da mutação
                />
                {confirmErrors.password_confirm && <div className="modal-form__error-message">{confirmErrors.password_confirm.message}</div>}
            </div>
            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={handleCloseConfirmModal} disabled={isRegenerating}>
                    Cancelar
                </button>
                <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isRegenerating}>
                    {isRegenerating ? 'A regenerar...' : 'Confirmar e Regenerar'}
                </button>
            </div>
        </form>
      </Modal>

      {/* Modal para Mostrar Nova API Key (inalterado) */}
      <ApiKeyModal
        apiKey={newApiKey}
        isOpen={isApiKeyModalOpen}
        onClose={handleCloseApiKeyModal}
      />
    </div>
  );
}

export default EmpresaSettingsPage;