// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes de Rota/Globais
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute.jsx';
import ToastNotification from './components/ToastNotification/ToastNotification';
import Spinner from './components/Spinner/Spinner';

// --- ALTERAÇÃO AQUI ---
// Importe os layouts e rotas públicas estaticamente
import MainLayout from './layouts/MainLayout/MainLayout';
import ApiStatusPage from './pages/ApiStatus/ApiStatusPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
// --- FIM DA ALTERAÇÃO ---

// Componente de Fallback
const FullPageSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
    <Spinner message="A carregar página..." />
  </div>
);

// Lazy-load (Carregamento dinâmico) APENAS das páginas internas
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
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));
const PIsPage = lazy(() => import('./pages/PIs/PIsPage'));
const EmpresaSettingsPage = lazy(() => import('./pages/Empresa/EmpresaSettingsPage'));
const EmpresaDetalhes = lazy(() => import('./pages/Empresa/subpages/EmpresaDetalhes'));
const EmpresaApiKey = lazy(() => import('./pages/Empresa/subpages/EmpresaApiKey'));
const ContratosPage = lazy(() => import('./pages/Contratos/ContratosPage'));
const DocsPage = lazy(() => import('./pages/Docs/DocsPage')); // Assumindo que a DocsPage existe

function App() {
  return (
    <> 
      {/* Suspense agora envolve apenas as rotas que podem ser lazy-loaded */}
      <Routes>
        {/* --- ALTERAÇÃO AQUI: Rotas públicas agora usam componentes estáticos --- */}
        <Route path="/" element={<Navigate to="/status" replace />} /> 
        <Route path="/status" element={<ApiStatusPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/empresa-register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* === ROTAS PRIVADAS (Ainda usam Suspense) === */}
        <Route element={<ProtectedRoute />}>
          <Route 
            element={
              <Suspense fallback={<FullPageSpinner />}>
                <MainLayout />
              </Suspense>
            }
          >
            {/* O Suspense é necessário aqui dentro para as rotas lazy */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/placas" element={<PlacasPage />} />
            <Route path="/placas/novo" element={<PlacaFormPage />} />
            <Route path="/placas/editar/:id" element={<PlacaFormPage />} /> 
            <Route path="/placas/:id" element={<PlacaDetailsPage />} />
            
            <Route path="/regioes" element={<RegioesPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/user" element={<UserPage />} />
            
            <Route path="/empresa-settings" element={<EmpresaSettingsPage />}>
              <Route index element={<Navigate to="detalhes" replace />} />
              <Route path="detalhes" element={<EmpresaDetalhes />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="propostas" element={<PIsPage />} />
              <Route path="contratos" element={<ContratosPage />} />
              <Route element={<AdminRoute />}>
                <Route path="api" element={<EmpresaApiKey />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
               <Route path="/admin-users" element={<AdminUsersPage />} />
               <Route path="/documentacao" element={<DocsPage />} />
            </Route>
            
          </Route> {/* Fim do MainLayout */}
        </Route> {/* Fim do ProtectedRoute */}

        {/* === ROTA NOT FOUND (Ainda pode ser lazy) === */}
        <Route 
          path="*" 
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <NotFoundPage />
            </Suspense>
          } 
        />
      </Routes>

      <ToastNotification />
    </>
  );
}

export default App;