// src/App.jsx (Corrigido)
import React, { Suspense, lazy } from 'react';
// 1. REMOVA O "BrowserRouter" DESTA LINHA
import { Routes, Route, Navigate } from 'react-router-dom'; 

// 2. REMOVA AS IMPORTAÇÕES DOS PROVIDERS (JÁ ESTÃO EM MAIN.JSX)
// import { AuthProvider } from './context/AuthContext';
// import { ConfirmationProvider } from './context/ConfirmationContext';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Layouts
import MainLayout from './layouts/MainLayout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';

// Componentes
import Spinner from './components/Spinner/Spinner';
import ToastNotification from './components/ToastNotification/ToastNotification';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import ApiStatusPage from './pages/ApiStatus/ApiStatusPage';

// Páginas Públicas
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';

// Páginas Protegidas (Lazy Loaded)
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage'));
const PIsPage = lazy(() => import('./pages/PIs/PIsPage'));
const ContratosPage = lazy(() => import('./pages/Contratos/ContratosPage'));
const PlacasPage = lazy(() => import('./pages/Placas/PlacasPage'));
const PlacaFormPage = lazy(() => import('./pages/PlacaFormPage/PlacaFormPage'));
const PlacaDetailsPage = lazy(() => import('./pages/PlacaDetailsPage/PlacaDetailsPage'));
const MapPage = lazy(() => import('./pages/Map/MapPage'));
const RegioesPage = lazy(() => import('./pages/Regioes/RegioesPage'));
const RelatoriosPage = lazy(() => import('./pages/Relatorios/RelatoriosPage'));
const UserPage = lazy(() => import('./pages/User/UserPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));
const EmpresaSettingsPage = lazy(() => import('./pages/Empresa/EmpresaSettingsPage'));
const EmpresaDetalhes = lazy(() => import('./pages/Empresa/subpages/EmpresaDetalhes'));
const EmpresaApiKey = lazy(() => import('./pages/Empresa/subpages/EmpresaApiKey'));

// 3. REMOVA A CONFIGURAÇÃO DUPLICADA DO queryClient
// const queryClient = new QueryClient({ ... });

function App() {
  return (
    // 4. REMOVA OS WRAPPERS (Providers e BrowserRouter)
    <>
      <Suspense fallback={<div className="page-loading-spinner"><Spinner /></div>}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/api-status" element={<ApiStatusPage />} />

          {/* Rotas Protegidas (Layout Principal) */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            
            {/* ... (Suas rotas) ... */}
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/pis" element={<PIsPage />} />
            <Route path="/contratos" element={<ContratosPage />} />
            <Route path="/placas" element={<PlacasPage />} />
            <Route path="/placas/nova" element={<PlacaFormPage />} />
            <Route path="/placas/editar/:id" element={<PlacaFormPage />} />
            <Route path="/placas/:id" element={<PlacaDetailsPage />} />
            <Route path="/mapa" element={<MapPage />} />
            <Route path="/regioes" element={<RegioesPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/perfil" element={<UserPage />} />

            {/* Área da Empresa (Sem Clientes por agora) */}
            <Route path="/empresa" element={<EmpresaSettingsPage />}>
              <Route index element={<Navigate to="detalhes" replace />} />
              <Route path="detalhes" element={<EmpresaDetalhes />} />
              <Route path="api-key" element={<EmpresaApiKey />} />
            </Route>

            {/* Admin */}
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              } 
            />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      {/* O ToastNotification deve ficar fora das Routes */}
      <ToastNotification />
    </>
    // FIM DAS REMOÇÕES
  );
}

export default App;