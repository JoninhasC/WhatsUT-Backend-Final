/*
 * ====================================================================
 * ARQUIVO: App.tsx - VERSÃO EXPLICATIVA PARA INICIANTES
 * LOCALIZAÇÃO: frontend/src/App.tsx
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este é o "MAESTRO" da aplicação frontend do WhatsUT. É o componente
 * principal que coordena tudo: roteamento, autenticação, navegação
 * e fornece contextos globais para toda a aplicação React.
 * 
 * ANALOGIA SIMPLES:
 * Imagine que sua aplicação é um prédio de escritórios:
 * - Este arquivo seria o "sistema de elevadores e segurança"
 * - Decide quem pode ir onde (rotas protegidas)
 * - Controla a navegação entre andares (páginas)
 * - Fornece serviços globais (contextos)
 * - Gerencia entrada e saída do prédio (login/logout)
 * 
 * CONCEITOS IMPORTANTES:
 * 
 * 1. ROTEAMENTO (React Router):
 *    - Como um "mapa do prédio" que define onde cada sala fica
 *    - Cada URL da aplicação corresponde a uma página diferente
 *    - /login → página de login, /chat → página de chat, etc.
 * 
 * 2. ROTAS PROTEGIDAS:
 *    - Como "áreas restritas" que só funcionários podem acessar
 *    - Verificam se usuário está logado antes de mostrar conteúdo
 *    - Redirecionam para login se não autenticado
 * 
 * 3. CONTEXTOS GLOBAIS:
 *    - Como "sistemas centrais" do prédio (ar condicionado, eletricidade)
 *    - Informações compartilhadas por todos os componentes
 *    - AuthContext: quem está logado, funções de login/logout
 * 
 * 4. NAVEGAÇÃO CONDICIONAL:
 *    - Menu aparece só para usuários logados
 *    - Diferentes opções baseadas no estado do usuário
 */

// ===== IMPORTAÇÕES =====

import React from 'react';

// React Router: biblioteca para roteamento (navegação entre páginas)
import { 
  BrowserRouter as Router,    // Componente que habilita roteamento
  Routes,                     // Container para definir rotas
  Route,                      // Define uma rota específica
  Navigate,                   // Para redirecionamentos
  Link                        // Para criar links de navegação
} from 'react-router-dom';

// Toaster: biblioteca para notificações (toast messages)
import { Toaster } from 'react-hot-toast';

// Contexto de autenticação que criamos
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Importação de todas as páginas da aplicação
import LoginPage from './pages/LoginPage';
import NewChatPage from './pages/NewChatPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateGroupPage from './pages/CreateGroupPage';

// Componente de loading
import LoadingSpinner from './components/LoadingSpinner';

/*
 * ====================================================================
 * SEÇÃO 1: COMPONENTES DE PROTEÇÃO DE ROTAS
 * ====================================================================
 */

// ===== COMPONENTE: ROTA PROTEGIDA =====
// Este componente "protege" páginas que só usuários logados podem ver
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  /*
   * PROPÓSITO:
   * - Verifica se usuário está autenticado
   * - Se SIM: mostra o conteúdo (children)
   * - Se NÃO: redireciona para /login
   * - Enquanto verifica: mostra loading
   * 
   * É como um "segurança na porta" que só deixa entrar quem tem crachá
   */
  
  // Pega informações do contexto de autenticação
  const { isAuthenticated, isLoading } = useAuth();

  // ===== ESTADO 1: AINDA VERIFICANDO =====
  if (isLoading) {
    /*
     * Enquanto está verificando se o usuário está logado
     * (consultando localStorage, validando token, etc.)
     * mostra uma tela de loading
     */
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Verificando autenticação..." />
      </div>
    );
  }

  // ===== ESTADO 2: NÃO ESTÁ LOGADO =====
  if (!isAuthenticated) {
    /*
     * Se não está autenticado, redireciona para página de login
     * 
     * <Navigate to="/login" replace />:
     * - to="/login": vai para a página de login
     * - replace: substitui entrada atual no histórico
     *   (usuário não consegue voltar com botão "voltar")
     */
    return <Navigate to="/login" replace />;
  }

  // ===== ESTADO 3: ESTÁ LOGADO =====
  // Se passou pelas verificações, mostra o conteúdo
  return <>{children}</>;
  /*
   * <>{children}</>: React Fragment
   * Renderiza os componentes filhos sem criar elementos HTML extras
   */
}

// ===== COMPONENTE: ROTA PÚBLICA =====
// Este componente é o oposto do ProtectedRoute
function PublicRoute({ children }: { children: React.ReactNode }) {
  /*
   * PROPÓSITO:
   * - Para páginas que só usuários NÃO logados devem ver (login)
   * - Se usuário JÁ está logado: redireciona para /chat
   * - Se NÃO está logado: mostra o conteúdo
   * 
   * É como uma "porta giratória" que não deixa quem já está dentro
   * tentar entrar novamente
   */
  
  const { isAuthenticated, isLoading } = useAuth();

  // Enquanto verifica, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando..." />
      </div>
    );
  }

  // Se JÁ está logado, vai direto para o chat
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  // Se NÃO está logado, mostra página de login
  return <>{children}</>;
}

/*
 * ====================================================================
 * SEÇÃO 2: COMPONENTE DE NAVEGAÇÃO
 * ====================================================================
 */

// ===== MENU DE NAVEGAÇÃO =====
// Menu que aparece no topo para usuários logados
function AuthenticatedMenu() {
  /*
   * PROPÓSITO:
   * - Mostra links para todas as páginas da aplicação
   * - Exibe nome do usuário logado
   * - Fornece botão de logout
   * 
   * É como uma "barra de ferramentas" sempre visível
   */
  
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow flex items-center px-4 py-2 gap-4 border-b border-gray-100">
      {/* 
        Links de navegação usando React Router Link
        Link cria navegação SPA (Single Page Application) sem recarregar página
      */}
      <Link to="/chat" className="font-semibold text-blue-700 hover:underline">
        Chat
      </Link>
      <Link to="/users" className="font-semibold text-blue-700 hover:underline">
        Usuários
      </Link>
      <Link to="/groups" className="font-semibold text-blue-700 hover:underline">
        Grupos
      </Link>
      <Link to="/create-group" className="font-semibold text-blue-700 hover:underline">
        Criar Grupo
      </Link>
      <Link to="/profile" className="font-semibold text-blue-700 hover:underline">
        Perfil
      </Link>
      <Link to="/settings" className="font-semibold text-blue-700 hover:underline">
        Configurações
      </Link>
      <Link to="/admin" className="font-semibold text-blue-700 hover:underline">
        Admin
      </Link>
      
      {/* Nome do usuário (alinhado à direita) */}
      <span className="ml-auto text-gray-500 text-sm">{user?.name}</span>
      
      {/* Botão de logout */}
      <button 
        onClick={logout} 
        className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Sair
      </button>
    </nav>
  );
}

/*
 * ====================================================================
 * SEÇÃO 3: DEFINIÇÃO DE ROTAS
 * ====================================================================
 */

// ===== COMPONENTE DE ROTAS =====
// Define todas as páginas da aplicação e suas URLs
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Router>
      {/* 
        Menu só aparece se usuário estiver logado
        && = operador lógico: só executa o lado direito se o esquerdo for true
      */}
      {isAuthenticated && <AuthenticatedMenu />}
      
      <Routes>
        {/* ===== ROTA PÚBLICA: LOGIN ===== */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        /*
         * EXPLICAÇÃO DA ROTA:
         * - path="/login": quando URL for /login
         * - element: qual componente renderizar
         * - PublicRoute: wrapper que redireciona se já logado
         * - LoginPage: página de login propriamente dita
         */

        {/* ===== ROTAS PROTEGIDAS ===== */}
        
        {/* Página principal de chat */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <NewChatPage />
            </ProtectedRoute>
          }
        />
        
        {/* Chat específico com ID */}
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <NewChatPage />
            </ProtectedRoute>
          }
        />
        /*
         * :chatId = PARÂMETRO DINÂMICO
         * /chat/123 → chatId = "123"
         * /chat/456 → chatId = "456"
         * 
         * Componente pode acessar via useParams() do React Router
         */
        
        {/* Página de perfil */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Página de usuários */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        
        {/* Página de grupos */}
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Página para criar grupos */}
        <Route
          path="/create-group"
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />
        
        {/* Página de configurações */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Página de administração */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        
        {/* ===== ROTA PADRÃO (FALLBACK) ===== */}
        {/* Qualquer URL não definida acima redireciona para /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        /*
         * path="*": captura qualquer rota não definida
         * É como um "caso padrão" em um switch
         */
      </Routes>
    </Router>
  );
}

/*
 * ====================================================================
 * SEÇÃO 4: COMPONENTE PRINCIPAL
 * ====================================================================
 */

// ===== COMPONENTE APP PRINCIPAL =====
// Este é o componente raiz de toda a aplicação
function App() {
  /*
   * RESPONSABILIDADES:
   * 1. Fornecer contexto de autenticação para toda aplicação
   * 2. Configurar sistema de notificações (toasts)
   * 3. Renderizar sistema de roteamento
   * 
   * ESTRUTURA:
   * AuthProvider (contexto global)
   *   └── AppRoutes (roteamento)
   *   └── Toaster (notificações)
   */
  
  return (
    <AuthProvider>
      {/* 
        AuthProvider envolve toda aplicação
        Isso significa que QUALQUER componente pode usar useAuth()
        É como instalar Wi-Fi em todo o prédio
      */}
      
      <div className="App">
        {/* Sistema de roteamento */}
        <AppRoutes />
        
        {/* Sistema de notificações */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
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
          }}
        />
        /*
         * TOASTER:
         * - position: onde aparecem as notificações
         * - duration: quanto tempo ficam na tela
         * - style: aparência das notificações
         * 
         * EXEMPLO DE USO EM OUTROS COMPONENTES:
         * import toast from 'react-hot-toast';
         * toast.success('Login realizado com sucesso!');
         * toast.error('Erro ao fazer login');
         */
      </div>
    </AuthProvider>
  );
}

// Exporta o componente principal
export default App;

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O App.tsx é o "NÚCLEO DE CONTROLE" do frontend WhatsUT. Ele:
 * 
 * 1. 🏠 ORGANIZA ESTRUTURA: Define como páginas se conectam
 * 2. 🛡️ PROTEGE ACESSO: Controla quem pode ver o quê
 * 3. 🧭 GERENCIA NAVEGAÇÃO: Permite movimento entre páginas
 * 4. 🌐 FORNECE CONTEXTOS: Compartilha estado global
 * 5. 📱 COORDENA INTERFACE: Une todos os componentes
 * 6. 🔔 HABILITA NOTIFICAÇÕES: Sistema de feedback para usuário
 * 
 * FLUXO DE NAVEGAÇÃO TÍPICO:
 * 
 * 1. Usuário acessa aplicação → App.tsx carrega
 * 2. AuthProvider verifica se há sessão salva
 * 3. Se não logado: PublicRoute → LoginPage
 * 4. Usuário faz login → AuthContext atualiza estado
 * 5. ProtectedRoute libera acesso → Menu aparece
 * 6. Usuário navega entre páginas → Router troca componentes
 * 7. Usuário faz logout → volta para LoginPage
 * 
 * CONCEITOS REACT IMPORTANTES:
 * - Componentes funcionais com hooks
 * - Context API para estado global
 * - React Router para SPA navigation
 * - Renderização condicional (&&, ternário)
 * - Props e children
 * - Event handlers (onClick)
 * 
 * ARQUITETURA FRONTEND:
 * 
 * App.tsx (raiz)
 * ├── AuthProvider (contexto global)
 * ├── Router (navegação)
 * │   ├── AuthenticatedMenu (para logados)
 * │   └── Routes
 * │       ├── PublicRoute
 * │       │   └── LoginPage
 * │       └── ProtectedRoute
 * │           ├── NewChatPage
 * │           ├── ProfilePage
 * │           ├── UsersPage
 * │           └── ... outras páginas
 * └── Toaster (notificações)
 * 
 * SEM ESTE ARQUIVO:
 * Não haveria como navegar entre páginas ou controlar acesso!
 * Seria como um prédio sem elevadores ou sistema de segurança.
 */
