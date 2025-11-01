// src/pages/Empresa/EmpresaSettingsPage.jsx
import React from 'react';
// [MELHORIA] Importamos Outlet e NavLink para a navegação interna
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './EmpresaSettings.css';

function EmpresaSettingsPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Se a rota for exatamente /empresa-settings, define qual aba é a padrão
  const isRootPath = location.pathname === '/empresa-settings';

  // Criamos uma função helper para o className, 
  // para que 'active' seja aplicado a todos os NavLinks.
  const getNavLinkClass = ({ isActive }) => {
    return `empresa-settings-page__nav-link ${isActive ? 'active' : ''}`;
  };

  // Esta classe especial é SÓ para o 'Detalhes', para que ele
  // fique ativo quando estiver na raiz /empresa-settings
  const getDetalhesClass = ({ isActive }) => {
     return `empresa-settings-page__nav-link ${(isActive || isRootPath) ? 'active' : ''}`;
  };

  return (
    <div className="empresa-settings-page">
      
      {/* [MELHORIA] Nova barra de navegação interna (Abas) */}
      <div className="empresa-settings-page__nav">
        <NavLink
          to="detalhes" // CORRIGIDO: Caminho relativo (para /empresa-settings/detalhes)
          className={getDetalhesClass} 
        >
          <i className="fas fa-building"></i>
          Detalhes
        </NavLink>

        {/* --- NOVO LINK DE CLIENTES ADICIONADO AQUI --- */}
        <NavLink
          to="clientes" // Caminho relativo (para /empresa-settings/clientes)
          className={getNavLinkClass} 
        >
          <i className="fas fa-users"></i>
          Clientes
        </NavLink>
        {/* --- FIM DA ADIÇÃO --- */}
        
        {/* Só mostra a aba de API Key se for Admin */}
        {user?.role === 'admin' && (
          <NavLink
            to="api" // CORRIGIDO: Caminho relativo (para /empresa-settings/api)
            className={getNavLinkClass} 
          >
            <i className="fas fa-key"></i>
            API Key
          </NavLink>
        )}

        {/* --- CORREÇÃO PRINCIPAL AQUI --- */}
        {/* Os links devem ser relativos (sem a barra inicial) 
            para carregar dentro do <Outlet /> */}

        <NavLink
          to="propostas" // CORRIGIDO: Removida a barra (era /propostas)
          className={getNavLinkClass} 
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Gestão (PIs)
        </NavLink> 
        
        <NavLink
          to="contratos" // CORRIGIDO: Removida a barra (era /contratos)
          className={getNavLinkClass} 
        >
          <i className="fas fa-file-invoice"></i> {/* (Ícone mudado para diferenciar) */}
          Gestão (Contratos)
        </NavLink>
        {/* --- FIM DA CORREÇÃO --- */}

      </div>

      {/* [MELHORIA] Conteúdo da Sub-página 
        O React Router irá renderizar as rotas aninhadas (detalhes, api, clientes, etc.) aqui.
      */}
      <div className="empresa-settings-page__content">
        <Outlet />
      </div>

    </div>
  );
}

export default EmpresaSettingsPage;