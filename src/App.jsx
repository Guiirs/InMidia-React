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
const EmpresaSettingsPage = lazy(() => import('./pages/Empresa/EmpresaSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));
const PlacaFormPage = lazy(() => import('./pages/PlacaFormPage/PlacaFormPage'));
const PlacaDetailsPage = lazy(() => import('./pages/PlacaDetailsPage/PlacaDetailsPage'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));

function App() {
  return (
    <> 
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* === ROTA PÚBLICA NA RAIZ (AGORA REDIRECIONA) === */}
          {/* Redireciona a raiz / para a página de status */}
          <Route path="/" element={<Navigate to="/status" replace />} /> 

          {/* === ROTA PÚBLICA DE STATUS (NOVO CAMINHO) === */}
          <Route path="/status" element={<ApiStatusPage />} />

          {/* === OUTRAS ROTAS PÚBLICAS === */}
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
              <Route path="/empresa-settings" element={<EmpresaSettingsPage />} />
              
              <Route element={<AdminRoute />}>
                 <Route path="/admin-users" element={<AdminUsersPage />} />
              </Route>
              
              {/* O redirect da raiz (/) foi removido daqui */}

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
