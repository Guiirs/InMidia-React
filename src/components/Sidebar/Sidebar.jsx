// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
// [MELHORIA] Importamos useLocation para verificar a rota
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import './Sidebar.css';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showConfirmation = useConfirmation();
  const userIsAdmin = user?.role === 'admin';
  
  // [MELHORIA] Pega a localização atual
  const location = useLocation();

  // [MELHORIA] Função para checar se o link "Empresa" ou seus filhos estão ativos
  // (Verifica /empresa-settings, /propostas, ou /contratos)
  const isEmpresaActive = () => {
      return location.pathname.startsWith('/empresa-settings') ||
             location.pathname.startsWith('/propostas') ||
             location.pathname.startsWith('/contratos');
  };

  // --- Lógica do Tema (Inalterada do seu arquivo original) ---
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.toggle('light-theme', savedTheme === 'light');
    }
    return savedTheme || 'dark';
  });

  useEffect(() => {
    document.body.classList.remove('light-theme');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.checked ? 'light' : 'dark');
  };
  const themeIconClass = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  // --- Fim da Lógica do Tema ---

  // --- Lógica do Logout (Inalterada do seu arquivo original) ---
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await showConfirmation({
        message: 'Tem a certeza de que deseja sair da sua conta?',
        title: 'Confirmar Logout',
        confirmText: 'Sair',
        cancelText: 'Cancelar',
        confirmButtonType: 'red',
      });
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      if (error.message === "Ação cancelada pelo usuário.") {
         console.log("Logout cancelado.");
      } else {
         console.error("Erro no modal de confirmação:", error);
      }
    }
  };
  
  return (
    // [ESTRUTURA ORIGINAL MANTIDA]
    <aside className="sidebar">
      <div className="sidebar__header">
        <NavLink to="/dashboard" className="sidebar__logo-container" data-link>
          <img src="/assets/img/logo 244.png" alt="Logo InMidia" className="sidebar__logo-img" />
          <span className="sidebar__logo-text">InMidia</span>
        </NavLink>
      </div>

      <nav className="sidebar__nav-container">
        <ul className="sidebar__nav">
          <li><NavLink to="/dashboard" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-home"></i> <span>Dashboard</span></NavLink></li>
          <li><NavLink to="/placas" end={false} className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-th-large"></i> <span>Placas</span></NavLink></li>
          <li><NavLink to="/clientes" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-users"></i> <span>Clientes</span></NavLink></li>
          <li><NavLink to="/regioes" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-map-marked-alt"></i> <span>Regiões</span></NavLink></li>
          <li><NavLink to="/map" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-map"></i> <span>Mapa</span></NavLink></li>
          <li><NavLink to="/relatorios" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-chart-pie"></i> <span>Relatórios</span></NavLink></li>
          {userIsAdmin && (
            <li><NavLink to="/admin-users" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-shield-alt"></i> <span>Admin</span></NavLink></li>
          )}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/user" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-user"></i> <span>Meu Perfil</span></NavLink>
        
        {/* [MELHORIA APLICADA AQUI] */}
        <NavLink 
          to="/empresa-settings" 
          // Usa a função 'isEmpresaActive' para determinar se o link (ou seus filhos) estão ativos
          className={`sidebar__nav-link ${isEmpresaActive() ? 'sidebar__nav-link--active' : ''}`} 
          data-link
        >
          <i className="fas fa-cog"></i> <span>Empresa</span>
        </NavLink>
        
        <div className="sidebar__theme-switcher">
          <i className={themeIconClass}></i>
          <span>Modo Claro</span>
          <label className="switch">
            <input
              type="checkbox"
              id="theme-toggle"
              checked={theme === 'light'}
              onChange={handleThemeChange}
            />
            <span className="slider"></span>
          </label>
        </div>
        <a href="#" className="sidebar__nav-link" id="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> <span>Sair</span>
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;