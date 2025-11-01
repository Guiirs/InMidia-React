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

  // --- CORREÇÃO AQUI ---
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
  // --- FIM DA CORREÇÃO ---

  return (
    <div className="empresa-settings-page">
      
      {/* [MELHORIA] Nova barra de navegação interna (Abas) */}
      <div className="empresa-settings-page__nav">
        <NavLink
          to="/empresa-settings/detalhes" // O 'to' estava correto
          className={getDetalhesClass} // Aplicamos a classe helper
        >
          <i className="fas fa-building"></i>
          Detalhes
        </NavLink>
        
        {/* Só mostra a aba de API Key se for Admin */}
        {user?.role === 'admin' && (
          <NavLink
            to="/empresa-settings/api" // O 'to' estava correto
            className={getNavLinkClass} // Aplicamos a classe helper
          >
            <i className="fas fa-key"></i>
            API Key
          </NavLink>
        )}

        {/* --- CORREÇÃO PRINCIPAL AQUI --- */}
        {/* Os links devem ser relativos para carregar no <Outlet /> */}

        <NavLink
          to="/propostas" // Alterado de "/propostas" para "propostas"
          className={getNavLinkClass} // Aplicamos a classe helper
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Gestão (PIs)
        </NavLink> 
        
        <NavLink
          to="/contratos" // Alterado de "/contratos" para "contratos"
          className={getNavLinkClass} // Aplicamos a classe helper
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Gestão (Contratos)
        </NavLink>
        {/* --- FIM DA CORREÇÃO --- */}

      </div>

      {/* [MELHORIA] Conteúdo da Sub-página 
        O React Router irá renderizar as rotas aninhadas (como 'detalhes' e 'api') aqui.
      */}
      <div className="empresa-settings-page__content">
        <Outlet />
      </div>

    </div>
  );
}

export default EmpresaSettingsPage;