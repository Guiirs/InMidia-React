
// src/components/AdminRoute/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../Spinner/Spinner';
import { useToast } from '../ToastNotification/ToastNotification'; // Para feedback ao usuário

// Componente para proteger rotas apenas para administradores
function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const showToast = useToast();

  // 1. Loading: Espera a verificação inicial do AuthContext
  if (isLoading) {
    return <Spinner message="A verificar permissões..." />;
  }

  // 2. Não Autenticado: Redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Não Admin: Se autenticado, mas o role não é 'admin'
  if (user?.role !== 'admin') {
    console.warn(`[AdminRoute] Acesso negado para utilizador: ${user?.username} (Role: ${user?.role}).`);

    // Mostra um toast de acesso negado
    showToast('Acesso negado. Apenas administradores podem aceder a esta página.', 'error');

    // Redireciona para o Dashboard (rota padrão para utilizadores logados)
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Admin: Permite acesso, renderizando o Outlet
  return <Outlet />;
}

export default AdminRoute;