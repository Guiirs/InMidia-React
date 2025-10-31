// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes de Rota/Globais
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute.jsx';
import ToastNotification from './components/ToastNotification/ToastNotification';
import Spinner from './components/Spinner/Spinner';

// Componente de Fallback
const FullPageSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
    <Spinner message="A carregar página..." />
  </div>
);

// Lazy-load (Carregamento dinâmico) de todas as Páginas e o Layout
const MainLayout = lazy(() => import('./layouts/MainLayout/MainLayout'));
const ApiStatusPage = lazy(() => import('./pages/ApiStatus/ApiStatusPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));
const PlacasPage = lazy(() => import('./pages/Placas/PlacasPage'));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage'));
const RegioesPage = lazy(() => import('./pages/Regioes/RegioesPage'));
const MapPage = lazy(() => import('./pages/Map/MapPage'));
const RelatoriosPage = lazy(() => import('./pages/Relatorios/RelatoriosPage'));
const UserPage = lazy(() => import('./pages/User/UserPage'));
const PlacaFormPage = lazy(() => import('./pages/PlacaFormPage/PlacaFormPage'));
const PlacaDetailsPage = lazy(() => import('./pages/PlacaDetailsPage/PlacaDetailsPage'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));
const PIsPage = lazy(() => import('./pages/PIs/PIsPage'));

// [MELHORIA] Importa o layout da página Empresa e as novas sub-páginas
const EmpresaSettingsPage = lazy(() => import('./pages/Empresa/EmpresaSettingsPage'));
const EmpresaDetalhes = lazy(() => import('./pages/Empresa/subpages/EmpresaDetalhes'));
const EmpresaApiKey = lazy(() => import('./pages/Empresa/subpages/EmpresaApiKey'));


function App() {
  return (
    <> 
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* ... (Rotas públicas: /status, /login, etc.) ... */}
          <Route path="/" element={<Navigate to="/status" replace />} /> 
          <Route path="/status" element={<ApiStatusPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/empresa-register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />


          {/* === ROTAS PRIVADAS === */}
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
              
              {/* [MELHORIA] Rotas Aninhadas de Empresa */}
              <Route path="/empresa-settings" element={<EmpresaSettingsPage />}>
                {/* Rota padrão (aba Detalhes) */}
                <Route index element={<Navigate to="detalhes" replace />} />
                <Route path="detalhes" element={<EmpresaDetalhes />} />
                
                {/* Rota da API (só renderiza se for Admin) */}
                <Route element={<AdminRoute />}>
                  <Route path="api" element={<EmpresaApiKey />} />
                </Route>
              </Route>
              
              {/* Rota de Gestão (PIs) - (Mantém-se separada, como definido no hub) */}
              <Route path="/propostas" element={<PIsPage />} />
              
              {/* Rotas de Admin */}
              <Route element={<AdminRoute />}>
                 <Route path="/admin-users" element={<AdminUsersPage />} />
              </Route>
              
            </Route> {/* Fim do MainLayout */}
          </Route> {/* Fim do ProtectedRoute */}

          {/* === ROTA NOT FOUND (404) === */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <ToastNotification />
    </>
  );
}

export default App;