// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importe o hook useAuth

// Componente para proteger rotas
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth(); // Obtenha o estado de autenticação e o estado de carregamento inicial

  // 1. Se ainda estiver a verificar o estado inicial (ex: a ler do localStorage)
  if (isLoading) {
    // Pode mostrar um spinner global ou apenas um placeholder simples aqui
    // Idealmente, um spinner mais visual seria melhor
    return <div>A verificar autenticação...</div>;
  }

  // 2. Se a verificação terminou e o utilizador NÃO está autenticado
  if (!isAuthenticated) {
    // Redireciona para a página de login
    // 'replace' evita que a página protegida entre no histórico do navegador
    console.log('[ProtectedRoute] Utilizador não autenticado. A redirecionar para /login.');
    return <Navigate to="/login" replace />;
  }

  // 3. Se a verificação terminou e o utilizador ESTÁ autenticado
  // Renderiza o componente filho da rota (usando Outlet)
  // O <Outlet /> é o componente que o react-router-dom usa para renderizar
  // a rota correspondente que está aninhada dentro desta ProtectedRoute
  console.log('[ProtectedRoute] Utilizador autenticado. A renderizar rota protegida.');
  return <Outlet />;
}

export default ProtectedRoute;