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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ChatPageNew from './pages/ChatPageNew';
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
 * Componente principal com roteamento
 * Define todas as rotas da aplicação
 */
function AppRoutes() {
  return (
    <Router>
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

        {/* Rota protegida - Chat principal */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPageNew />
            </ProtectedRoute>
          }
        />

        {/* Rota raiz - Redireciona baseado na autenticação */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Rota 404 - Página não encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
                <a
                  href="/chat"
                  className="btn-primary inline-block"
                >
                  Voltar ao Chat
                </a>
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
