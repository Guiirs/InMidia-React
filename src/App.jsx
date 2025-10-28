// src/App.jsx
import React, { Suspense } from 'react'; // <<< Importe o Suspense
import { Routes, Route, Navigate } from 'react-router-dom';

// Componentes de carregamento rápido (Layouts, Proteção, Spinner)
import MainLayout from './layouts/MainLayout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import Spinner from './components/Spinner/Spinner'; // Para o fallback do Suspense
import ToastNotification from './components/ToastNotification/ToastNotification';

// === Carregamento Lento (Lazy Loading) para TODAS as Páginas ===

// Páginas Públicas
const LoginPage = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));

// Páginas Privadas
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
const PlacasPage = React.lazy(() => import('./pages/Placas/PlacasPage'));
const PlacaFormPage = React.lazy(() => import('./pages/PlacaFormPage/PlacaFormPage'));
const PlacaDetailsPage = React.lazy(() => import('./pages/PlacaDetailsPage/PlacaDetailsPage'));
const ClientesPage = React.lazy(() => import('./pages/Clientes/ClientesPage'));
const RegioesPage = React.lazy(() => import('./pages/Regioes/RegioesPage'));
const MapPage = React.lazy(() => import('./pages/Map/MapPage'));
const RelatoriosPage = React.lazy(() => import('./pages/Relatorios/RelatoriosPage'));
const UserPage = React.lazy(() => import('./pages/User/UserPage'));
const EmpresaSettingsPage = React.lazy(() => import('./pages/Empresa/EmpresaSettingsPage'));
const AdminUsersPage = React.lazy(() => import('./pages/Admin/AdminUsersPage'));

// Página 404
const NotFoundPage = React.lazy(() => import('./pages/NotFound/NotFoundPage'));

// Componente de fallback (o que mostrar enquanto a página carrega)
const PageFallback = () => <Spinner message="A carregar página..." />;


function App() {
  return (
    <>
      {/* Suspense envolve as rotas para lidar com o carregamento lento */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* === ROTAS PÚBLICAS === */}
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

              {/* ROTA ADMIN */}
              <Route element={<AdminRoute />}>
                 <Route path="/admin-users" element={<AdminUsersPage />} />
              </Route>

              {/* Redirecionamento da Raiz */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* === ROTA NOT FOUND (404) === */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>

      <ToastNotification />
    </>
  );
}

export default App;