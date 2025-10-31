// src/pages/Empresa/subpages/EmpresaDetalhes.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEmpresaData } from '../../../services/api';
import Spinner from '../../../components/Spinner/Spinner';

// Chave da query para os dados da empresa (será compartilhada com a aba de API)
const empresaQueryKey = ['empresaData'];

function EmpresaDetalhes() {
  // 1. Busca os dados da empresa
  const {
    data: empresaData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: empresaQueryKey,
    queryFn: fetchEmpresaData,
    staleTime: 1000 * 60 * 10, // Cache de 10 minutos
  });

  // 2. Renderiza estados de loading/erro
  if (isLoading) {
    // Usamos um Spinner genérico, mas o card em si não aparecerá até carregar
    return <Spinner message="A carregar detalhes da empresa..." />;
  }

  if (isError) {
    return (
      <div className="empresa-settings-card"> {/* Usa o estilo de card do CSS pai */}
        <p className="error-message">Erro ao carregar dados: {error.message}</p>
      </div>
    );
  }

  // 3. Calcula dados de status (lógica movida da página principal)
  const status = empresaData?.status_assinatura;
  const statusText = status === 'active' ? 'Ativa' : 'Inativa';
  const statusClass = status === 'active'
    ? 'empresa-settings-card__status--active'
    : 'empresa-settings-card__status--inactive';

  return (
    // 4. Renderiza os cards usando as classes de estilo reutilizáveis
    //    definidas no CSS da página pai (EmpresaSettings.css)
    <>
      {/* Card 1: Detalhes da Empresa */}
      <div className="empresa-settings-card">
        <div className="empresa-settings-card__header">
          <i className="fas fa-building empresa-settings-card__icon"></i>
          <h3 className="empresa-settings-card__title">Detalhes da Empresa</h3>
        </div>
        <div className="empresa-settings-card__info-group">
          <span className="empresa-settings-card__info-label">Nome da Empresa</span>
          <p className="empresa-settings-card__info-value">{empresaData?.nome || 'N/A'}</p>
        </div>
      </div>

      {/* Card 2: Assinatura */}
      <div className="empresa-settings-card">
        <div className="empresa-settings-card__header">
          <i className="fas fa-credit-card empresa-settings-card__icon" style={{ color: 'var(--accent-pink)' }}></i>
          <h3 className="empresa-settings-card__title">Assinatura</h3>
        </div>
        <div className="empresa-settings-card__info-group">
          <span className="empresa-settings-card__info-label">Status</span>
          <div> {/* Wrapper para o status */}
            <span className={`empresa-settings-card__status ${statusClass}`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmpresaDetalhes;