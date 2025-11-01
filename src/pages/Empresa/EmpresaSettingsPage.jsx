// src/pages/Empresa/EmpresaSettingsPage.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './EmpresaSettings.css';

/**
 * Página de layout para as configurações da Empresa.
 * Contém a navegação em abas e o <Outlet> para renderizar as sub-rotas.
 */
function EmpresaSettingsPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Área da Empresa</h1>
                <p>Gestão de dados cadastrais, API e clientes.</p>
            </div>

            <div className="settings-layout">
                {/* Navegação das Abas */}
                <nav className="settings-layout__nav">
                    <ul>
                        <li>
                            <NavLink to="detalhes" end>
                                <i className="fas fa-info-circle"></i>
                                <span>Detalhes da Empresa</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="api-key">
                                <i className="fas fa-key"></i>
                                <span>API Key (Integração)</span>
                            </NavLink>
                        </li>
                        
                        {/* === ABA DE CLIENTES ADICIONADA AQUI === */}
                        <li>
                            <NavLink to="clientes">
                                <i className="fas fa-users"></i>
                                <span>Meus Clientes</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {/* Conteúdo da Aba Ativa */}
                <main className="settings-layout__content">
                    {/* O <Outlet> renderiza a rota filha correspondente:
                        /empresa/detalhes -> <EmpresaDetalhes />
                        /empresa/api-key  -> <EmpresaApiKey />
                        /empresa/clientes -> <ClientesPage />
                    */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default EmpresaSettingsPage;