// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';
import logo from '/assets/img/logo 244.png'; 

function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar__logo">
                <img src={logo} alt="InMidia" />
            </div>
            <nav className="sidebar__nav">
                <ul>
                    {/* Item de Dashboard */}
                    <li>
                        <NavLink to="/" end>
                            <i className="fas fa-tachometer-alt"></i>
                            <span>Dashboard</span>
                        </NavLink>
                    </li>

                    {/* === ITEM DE CLIENTES REMOVIDO DESTA LISTA === */}
                    
                    {/* Item de Propostas Internas (PIs) */}
                    <li>
                        <NavLink to="/pis">
                            <i className="fas fa-file-alt"></i>
                            <span>Propostas (PIs)</span>
                        </NavLink>
                    </li>
                    
                    {/* Item de Contratos */}
                    <li>
                        <NavLink to="/contratos">
                            <i className="fas fa-file-signature"></i>
                            <span>Contratos</span>
                        </NavLink>
                    </li>
                    
                    {/* Item de Placas */}
                    <li>
                        <NavLink to="/placas">
                            <i className="fas fa-map-pin"></i>
                            <span>Placas</span>
                        </NavLink>
                    </li>
                    
                    {/* Item de Mapa */}
                    <li>
                        <NavLink to="/mapa">
                            <i className="fas fa-map-marked-alt"></i>
                            <span>Mapa</span>
                        </NavLink>
                    </li>

                    {/* Item de Regiões */}
                    <li>
                        <NavLink to="/regioes">
                            <i className="fas fa-globe-americas"></i>
                            <span>Regiões</span>
                        </NavLink>
                    </li>
                    
                    {/* Item de Relatórios */}
                    <li>
                        <NavLink to="/relatorios">
                            <i className="fas fa-chart-line"></i>
                            <span>Relatórios</span>
                        </NavLink>
                    </li>

                    {/* Divisor */}
                    <li className="sidebar__divider"></li>

                    {/* Item de Configurações da Empresa */}
                    <li>
                        <NavLink to="/empresa">
                            <i className="fas fa-building"></i>
                            <span>Área da Empresa</span>
                        </NavLink>
                    </li>
                    
                    {/* Item de Perfil do Usuário */}
                    <li>
                        <NavLink to="/perfil">
                            <i className="fas fa-user"></i>
                            <span>Meu Perfil</span>
                        </NavLink>
                    </li>

                    {/* Links de Admin (se aplicável) */}
                    {user && user.role === 'admin' && (
                        <>
                            <li className="sidebar__divider"></li>
                            <li>
                                <NavLink to="/admin/users">
                                    <i className="fas fa-users-cog"></i>
                                    <span>Admin Usuários</span>
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
            <div className="sidebar__footer">
                <button onClick={handleLogout} className="sidebar__logout">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;