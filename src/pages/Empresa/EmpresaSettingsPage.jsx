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
  // (Vamos definir '/empresa-settings/detalhes' como padrão no App.jsx no Passo 4)
  const isRootPath = location.pathname === '/empresa-settings';

  return (
    <div className="empresa-settings-page">
      
      {/* [MELHORIA] Nova barra de navegação interna (Abas) */}
      <div className="empresa-settings-page__nav">
        <NavLink
          to="/empresa-settings/detalhes"
          // O NavLink aplica a classe 'active' automaticamente.
          // Se estivermos na rota raiz /empresa-settings, ativamos "Detalhes" como padrão.
          className={({ isActive }) =>
            `empresa-settings-page__nav-link ${(isActive || isRootPath) ? 'active' : ''}`
          }
        >
          <i className="fas fa-building"></i>
          Detalhes
        </NavLink>
        
        {/* Só mostra a aba de API Key se for Admin */}
        {user?.role === 'admin' && (
          <NavLink
            to="/empresa-settings/api"
            className="empresa-settings-page__nav-link" 
          >
            <i className="fas fa-key"></i>
            API Key
          </NavLink>
        )}

        {/* [MELHORIA] Botão para Gestão de PIs/Contratos (conforme solicitado).
          Vamos usar a rota /propostas que já definimos no backend.
        */}
        <NavLink
          to="/propostas" // Esta rota NÃO é aninhada, ela é uma seção principal
          className="empresa-settings-page__nav-link"
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Gestão (PIs & Contratos)
        </NavLink>

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