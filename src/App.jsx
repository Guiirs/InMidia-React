// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout e Proteção
// Assumindo que MainLayout e ProtectedRoute estão em suas próprias pastas
import MainLayout from './layouts/MainLayout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; // Se a pasta for ProtectedRoute

// Páginas Reais (com caminhos atualizados para subpastas)
import AdminRoute from './components/AdminRoute/AdminRoute';

// Páginas Reais (com caminhos atualizados para subpastas)
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import NotFoundPage from './pages/NotFound/NotFoundPage'; // Assumindo uma pasta NotFound
import PlacasPage from './pages/Placas/PlacasPage';
import ClientesPage from './pages/Clientes/ClientesPage';
import RegioesPage from './pages/Regioes/RegioesPage';
import MapPage from './pages/Map/MapPage';
import RelatoriosPage from './pages/Relatorios/RelatoriosPage';
import UserPage from './pages/User/UserPage';
import EmpresaSettingsPage from './pages/Empresa/EmpresaSettingsPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import PlacaFormPage from './pages/PlacaFormPage/PlacaFormPage';
import PlacaDetailsPage from './pages/PlacaDetailsPage/PlacaDetailsPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';

// Componente de Notificação
import ToastNotification from './components/ToastNotification/ToastNotification'; 

function App() {
  return (
    <> 
      <Routes>
        {/* === ROTAS PÚBLICAS === */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/empresa-register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />


        {/* === ROTAS PRIVADAS (Requer Autenticação) === */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/placas" element={<PlacasPage />} />
            <Route path="/placas/novo" element={<PlacaFormPage />} />
            <Route path="/placas/editar/:id" element={<PlacaFormPage />} /> 
            <Route path="/placas/:id" element={<PlacaDetailsPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/regioes" element={<RegioesPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/empresa-settings" element={<EmpresaSettingsPage />} />
            
            {/* ROTA ADMIN (Requer AdminRole e Autenticação) */}
            <Route element={<AdminRoute />}> {/* Protegida pelo AdminRoute */}
               <Route path="/admin-users" element={<AdminUsersPage />} />
            </Route>

            {/* Redirecionamento da Raiz para Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

          </Route> {/* Fim do MainLayout */}
        </Route> {/* Fim do ProtectedRoute */}


        {/* === ROTA NOT FOUND (404) === */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>

      <ToastNotification />
    </>
  );
}

export default App;