// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Usar NavLink para links ativos
import { useAuth } from '../../context/AuthContext'; // Hook de autenticação
// Importar a função showConfirmationModal adaptada ou um componente Modal React
// Por agora, vamos usar window.confirm como placeholder simples
// import { showConfirmationModal } from '../../utils/ui'; // Substituir por versão React
import './Sidebar.css'; // Importar o CSS

function Sidebar() {
  const { user, logout } = useAuth(); // Obtém user e função logout
  const navigate = useNavigate();
  const userIsAdmin = user?.role === 'admin';

  // Estado para o tema (inicializa lendo do localStorage)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Efeito para aplicar a classe do tema ao body
  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme'); // Limpa classes antigas
    document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    localStorage.setItem('theme', theme); // Salva a preferência
  }, [theme]);

  const handleLogout = (e) => {
    e.preventDefault();
    // Substituir window.confirm por um modal React mais tarde
    if (window.confirm('Tem a certeza de que deseja sair?')) {
      logout();
      navigate('/login', { replace: true }); // Redireciona para login após logout
    }
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.checked ? 'light' : 'dark');
  };

  const themeIconClass = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';

  // Não precisamos mais da lógica de sidebar-collapsed aqui, pode ser gerenciada
  // em um estado superior (App.js ou MainLayout) se necessário.

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        {/* Usar Link ou NavLink para navegação interna */}
        <NavLink to="/dashboard" className="sidebar__logo-container">
          <img src="/assets/img/logo 244.png" alt="Logo InMidia" className="sidebar__logo-img" />
          <span className="sidebar__logo-text">InMidia</span>
        </NavLink>
      </div>

      <nav className="sidebar__nav-container">
        <ul className="sidebar__nav">
          {/* Usar NavLink para obter a classe 'active' automaticamente */}
          <li><NavLink to="/dashboard" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-home"></i> <span>Dashboard</span></NavLink></li>
          {/* A NavLink para /placas também corresponderá a /placas/* por defeito */}
          <li><NavLink to="/placas" end={false} /* Adicionar end={false} se quiser que corresponda a sub-rotas */ className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-th-large"></i> <span>Placas</span></NavLink></li>
          <li><NavLink to="/clientes" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-users"></i> <span>Clientes</span></NavLink></li>
          <li><NavLink to="/regioes" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-map-marked-alt"></i> <span>Regiões</span></NavLink></li>
          <li><NavLink to="/map" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-map"></i> <span>Mapa</span></NavLink></li>
          <li><NavLink to="/relatorios" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-chart-pie"></i> <span>Relatórios</span></NavLink></li>
          {userIsAdmin && (
            <li><NavLink to="/admin-users" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-shield-alt"></i> <span>Admin</span></NavLink></li>
          )}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/user" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-user"></i> <span>Meu Perfil</span></NavLink>
        <NavLink to="/empresa-settings" className={({ isActive }) => `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}><i className="fas fa-cog"></i> <span>Empresa</span></NavLink>
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
        {/* Link de Logout agora é um botão/link normal */}
        <a href="#" className="sidebar__nav-link" id="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> <span>Sair</span>
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;