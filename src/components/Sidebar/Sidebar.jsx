// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirmation } from '../../context/ConfirmationContext'; // <<< 1. Importar o hook
import './Sidebar.css';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showConfirmation = useConfirmation(); // <<< 2. Inicializar o hook
  const userIsAdmin = user?.role === 'admin';

  // --- Lógica do Tema (Inalterada) ---
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Aplica o tema ao body imediatamente na inicialização
    if (savedTheme) {
        document.body.classList.toggle('light-theme', savedTheme === 'light');
    }
    return savedTheme || 'dark';
  });

  useEffect(() => {
    document.body.classList.remove('light-theme'); // Limpa
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


  // --- Refinamento 5: handleLogout atualizado ---
  const handleLogout = async (e) => {
    e.preventDefault();
    
    try {
      // 3. Chamar o modal de confirmação e aguardar
      await showConfirmation({
        message: 'Tem a certeza de que deseja sair da sua conta?',
        title: 'Confirmar Logout',
        confirmText: 'Sair',
        cancelText: 'Cancelar',
        confirmButtonType: 'red', // Botão vermelho para ação de sair
      });
      
      // 4. Se o utilizador confirmou (a promessa resolveu):
      logout();
      navigate('/login', { replace: true });

    } catch (error) {
      // 5. Se o utilizador cancelou (a promessa foi rejeitada)
      if (error.message === "Ação cancelada pelo usuário.") {
         console.log("Logout cancelado.");
      } else {
         // Lidar com outros erros inesperados do modal, se houver
         console.error("Erro no modal de confirmação:", error);
      }
    }
  };
  
  return (
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
        <NavLink to="/empresa-settings" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`} data-link><i className="fas fa-cog"></i> <span>Empresa</span></NavLink>
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