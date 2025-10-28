// src/App.jsx
import React, { Suspense, lazy } from 'react'; // 1. Importar Suspense e lazy
import { Routes, Route, Navigate } from 'react-router-dom';

// 2. Componentes de Rota/Globais (Não devem ser lazy-loaded)
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute.jsx';
import ToastNotification from './components/ToastNotification/ToastNotification';
import Spinner from './components/Spinner/Spinner'; // Para o fallback

// 3. Componente de Fallback (Spinner em tela cheia)
// Mostrado enquanto o próximo "chunk" (página) está a ser baixado
const FullPageSpinner = () => (
  <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: 'var(--bg-color)' // Usa a cor de fundo do tema
    }}>
    <Spinner message="A carregar página..." />
  </div>
);

// 4. Lazy-load (Carregamento dinâmico) de todas as Páginas e o Layout Principal
const MainLayout = lazy(() => import('./layouts/MainLayout/MainLayout'));
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
      {/* 5. Envolve <Routes> com <Suspense> */}
      <Suspense fallback={<FullPageSpinner />}>
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
              
              <Route element={<AdminRoute />}>
                 <Route path="/admin-users" element={<AdminUsersPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route> {/* Fim do MainLayout */}
          </Route> {/* Fim do ProtectedRoute */}

          {/* === ROTA NOT FOUND (404) === */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* ToastNotification fica fora do Suspense */}
      <ToastNotification />
    </>
  );
}

export default App;