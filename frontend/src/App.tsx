/**
 * 🎯 COMPONENTE PRINCIPAL DA APLICAÇÃO WHATSUT
 * 
 * Este é o componente raiz que gerencia o roteamento da aplicação
 * e fornece os contextos globais para todos os componentes filhos.
 * 
 * Funcionalidades implementadas:
 * - Roteamento entre páginas de login e chat
 * - Proteção de rotas (redirect automático se não autenticado)
 * - Contexto global de autenticação
 * - Loading state durante verificação de autenticação
 * - Toasts para notificações globais
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import IntegratedChatPageSimple from './pages/IntegratedChatPageSimple';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateGroupPage from './pages/CreateGroupPage';
import LoadingSpinner from './components/LoadingSpinner';

/**
 * Componente para proteger rotas que precisam de autenticação
 * Redireciona para login se usuário não estiver autenticado
 * 
 * @param children - Componentes filhos que precisam de autenticação
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Verificando autenticação..." />
      </div>
    );
  }

  // Redireciona para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Componente para redirecionar usuários já autenticados
 * Evita que usuários logados vejam a página de login
 * 
 * @param children - Componentes filhos (normalmente página de login)
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando..." />
      </div>
    );
  }

  // Redireciona para chat se já autenticado
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}

/**
 * Componente para o menu de navegação visível apenas para usuários autenticados
 */
function AuthenticatedMenu() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white shadow flex items-center px-4 py-2 gap-4 border-b border-gray-100">
      <Link to="/chat" className="font-semibold text-blue-700 hover:underline">Chat</Link>
      <Link to="/users" className="font-semibold text-blue-700 hover:underline">Usuários</Link>
      <Link to="/groups" className="font-semibold text-blue-700 hover:underline">Grupos</Link>
      <Link to="/create-group" className="font-semibold text-blue-700 hover:underline">Criar Grupo</Link>
      <Link to="/profile" className="font-semibold text-blue-700 hover:underline">Perfil</Link>
      <Link to="/settings" className="font-semibold text-blue-700 hover:underline">Configurações</Link>
      <Link to="/admin" className="font-semibold text-blue-700 hover:underline">Admin</Link>
      <span className="ml-auto text-gray-500 text-sm">{user?.name}</span>
      <button onClick={logout} className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Sair</button>
    </nav>
  );
}

/**
 * Componente principal com roteamento
 * Define todas as rotas da aplicação
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Router>
      {isAuthenticated && <AuthenticatedMenu />}
      <Routes>
        {/* Rota pública - Login/Registro */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Rotas protegidas */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <IntegratedChatPageSimple />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <IntegratedChatPageSimple />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-group"
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />

        {/* Rota raiz - Redireciona baseado na autenticação */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          }
        />

        {/* Rota 404 - Página não encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
                <Link
                  to="/chat"
                  className="btn-primary inline-block"
                >
                  Voltar ao Chat
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

/**
 * Componente principal da aplicação
 * Fornece contextos globais e configurações iniciais
 */
function App() {
  return (
    <div className="App">
      {/* Provider de autenticação global */}
      <AuthProvider>
        {/* Sistema de roteamento */}
        <AppRoutes />
        
        {/* Sistema de notificações toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            // Configurações visuais dos toasts
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
      </AuthProvider>
    </div>
  );
}

export default App;
