/*
 * ====================================================================
 * ARQUIVO: AuthContext.tsx - VERSÃO EXPLICATIVA PARA INICIANTES
 * LOCALIZAÇÃO: frontend/src/contexts/AuthContext.tsx
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é o "GERENTE DE ESTADO GLOBAL" de autenticação do WhatsUT.
 * Ele controla se o usuário está logado, seus dados e funções relacionadas
 * ao login em TODA a aplicação React.
 * 
 * ANALOGIA SIMPLES:
 * Imagine que sua aplicação é um prédio de escritórios, e este arquivo
 * é como o "sistema de segurança central" que:
 * - Sabe quem está dentro do prédio (usuário logado)
 * - Controla cartões de acesso (tokens)
 * - Permite entrada e saída (login/logout)
 * - Compartilha essas informações com todas as salas (componentes)
 * 
 * CONCEITOS IMPORTANTES USADOS AQUI:
 * 
 * 1. REACT CONTEXT:
 *    - É uma forma de compartilhar dados entre TODOS os componentes
 *    - É como um "estado global" que qualquer componente pode acessar
 *    - Evita ter que passar dados de pai para filho em cada componente
 * 
 * 2. useREDUCER:
 *    - É uma forma mais avançada de gerenciar estado do que useState
 *    - É como um "livro de regras" que define como o estado pode mudar
 *    - Cada mudança é uma "ação" com um tipo específico
 * 
 * 3. LOCALSTORAGE:
 *    - É como a "memória permanente" do navegador
 *    - Salva dados que persistem mesmo depois de fechar a página
 *    - Usamos para lembrar que o usuário está logado
 * 
 * 4. ASYNC/AWAIT:
 *    - Para operações que demoram (chamar API)
 *    - É como "esperar na fila" até a operação terminar
 */

// ===== IMPORTAÇÕES =====

import { 
  createContext,    // Para criar contexto React
  useContext,       // Para usar contexto em componentes
  useReducer,       // Para gerenciar estado complexo
  useEffect,        // Para executar código quando componente monta
  ReactNode         // Tipo para componentes filhos
} from 'react';

// Importa tipos (interfaces) que definem a estrutura dos dados
import type { User, AuthData, AuthContextType, LoadingState } from '../types';

// Importa serviços que fazem chamadas para a API
import { authService, userService } from '../services/api';

/*
 * ====================================================================
 * SEÇÃO 1: DEFINIÇÃO DOS TIPOS E ESTRUTURAS
 * ====================================================================
 */

// ===== INTERFACE DO ESTADO =====
// Define que tipo de dados o contexto vai guardar
interface AuthState {
  user: User | null;              // Dados do usuário (ou null se não logado)
  token: string | null;           // Token JWT (ou null se não logado)
  isAuthenticated: boolean;       // Se está logado ou não (true/false)
  isLoading: boolean;             // Se está fazendo alguma operação (carregando)
  loadingState: LoadingState;     // Estado mais detalhado de carregamento
  error: string | null;           // Mensagem de erro (ou null se não há erro)
}

// ===== TIPOS DE AÇÕES =====
// Define todas as "ações" que podem alterar o estado
// É como um menu de opções: "o que pode acontecer com o estado?"
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }                           // Mostrar/esconder loading
  | { type: 'SET_LOADING_STATE'; payload: LoadingState }               // Definir estado de carregamento
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }  // Login deu certo
  | { type: 'LOGIN_ERROR'; payload: string }                           // Login deu erro
  | { type: 'LOGOUT' }                                                 // Usuário saiu
  | { type: 'UPDATE_USER'; payload: User }                             // Dados do usuário mudaram
  | { type: 'SET_ERROR'; payload: string }                             // Aconteceu um erro
  | { type: 'CLEAR_ERROR' };                                           // Limpar erro

// ===== ESTADO INICIAL =====
// Como o contexto começa quando a aplicação carrega
const initialState: AuthState = {
  user: null,                    // Ninguém logado inicialmente
  token: null,                   // Sem token inicialmente
  isAuthenticated: false,        // Não está autenticado
  isLoading: true,               // Está carregando (verificando sessão existente)
  loadingState: 'idle',          // Estado neutro
  error: null,                   // Sem erros
};

/*
 * ====================================================================
 * SEÇÃO 2: REDUCER (LIVRO DE REGRAS)
 * ====================================================================
 */

// ===== FUNÇÃO REDUCER =====
// É como um "livro de regras" que define como o estado pode mudar
// Recebe o estado atual + uma ação, e retorna o novo estado
function authReducer(state: AuthState, action: AuthAction): AuthState {
  // Logs para debug (ver o que está acontecendo no console)
  console.log('🔄 AuthReducer - Ação:', action.type, action);
  
  // Switch analisa o TIPO da ação e decide o que fazer
  switch (action.type) {
    
    // ===== AÇÃO: DEFINIR LOADING =====
    case 'SET_LOADING':
      return {
        ...state,                     // Mantém tudo igual
        isLoading: action.payload,    // Só muda o isLoading
      };

    // ===== AÇÃO: DEFINIR ESTADO DE LOADING =====
    case 'SET_LOADING_STATE':
      return {
        ...state,                           // Mantém tudo igual
        loadingState: action.payload,       // Muda o estado de loading
        isLoading: action.payload === 'loading',  // Se está 'loading', então isLoading = true
      };

    // ===== AÇÃO: LOGIN DEU CERTO =====
    case 'LOGIN_SUCCESS':
      const newSuccessState = {
        ...state,                           // Mantém tudo igual
        user: action.payload.user,          // Define o usuário
        token: action.payload.token,        // Define o token
        isAuthenticated: true,              // Marca como autenticado
        isLoading: false,                   // Para de carregar
        loadingState: 'success' as LoadingState,  // Estado de sucesso
        error: null,                        // Limpa qualquer erro
      };
      
      // Logs para debug
      console.log('🔄 LOGIN_SUCCESS - Novo estado:', newSuccessState);
      console.log('🔄 LOGIN_SUCCESS - isAuthenticated agora é:', newSuccessState.isAuthenticated);
      console.log('🔄 LOGIN_SUCCESS - Usuário logado:', newSuccessState.user?.name);
      
      return newSuccessState;

    // ===== AÇÃO: LOGIN DEU ERRO =====
    case 'LOGIN_ERROR':
      return {
        ...state,                           // Mantém tudo igual
        user: null,                         // Remove usuário
        token: null,                        // Remove token
        isAuthenticated: false,             // Marca como NÃO autenticado
        isLoading: false,                   // Para de carregar
        loadingState: 'error' as LoadingState,  // Estado de erro
        error: action.payload,              // Define a mensagem de erro
      };

    // ===== AÇÃO: LOGOUT =====
    case 'LOGOUT':
      return {
        ...state,                           // Mantém tudo igual
        user: null,                         // Remove usuário
        token: null,                        // Remove token
        isAuthenticated: false,             // Marca como NÃO autenticado
        isLoading: false,                   // Para de carregar
        loadingState: 'idle' as LoadingState,   // Estado neutro
        error: null,                        // Limpa erros
      };

    // ===== AÇÃO: ATUALIZAR USUÁRIO =====
    case 'UPDATE_USER':
      return {
        ...state,                           // Mantém tudo igual
        user: action.payload,               // Só atualiza os dados do usuário
        error: null,                        // Limpa erros
      };

    // ===== AÇÃO: DEFINIR ERRO =====
    case 'SET_ERROR':
      return {
        ...state,                           // Mantém tudo igual
        error: action.payload,              // Define o erro
        loadingState: 'error' as LoadingState,  // Estado de erro
      };

    // ===== AÇÃO: LIMPAR ERRO =====
    case 'CLEAR_ERROR':
      return {
        ...state,                           // Mantém tudo igual
        error: null,                        // Remove qualquer erro
      };

    // ===== AÇÃO DESCONHECIDA =====
    default:
      console.log('🔄 Ação desconhecida:', action);
      return state;  // Se não reconhece a ação, mantém estado igual
  }
}

/*
 * ====================================================================
 * SEÇÃO 3: CONTEXTO E PROVIDER
 * ====================================================================
 */

// ===== CRIAÇÃO DO CONTEXTO =====
// Cria o contexto que será compartilhado por toda a aplicação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== INTERFACE PARA PROPS DO PROVIDER =====
interface AuthProviderProps {
  children: ReactNode;  // Componentes filhos que terão acesso ao contexto
}

// ===== PROVIDER DO CONTEXTO =====
// Esta é a função principal que "envolve" toda a aplicação
// e fornece as funcionalidades de autenticação para todos os componentes
export function AuthProvider({ children }: AuthProviderProps) {
  
  // ===== ESTADO E DISPATCH =====
  // useReducer nos dá o estado atual e uma função para mudá-lo
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  /*
   * COMO FUNCIONA:
   * - state: é o estado atual (user, token, isAuthenticated, etc.)
   * - dispatch: é a função para mudar o estado (enviando uma ação)
   * 
   * EXEMPLO:
   * dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
   * → Isso vai chamar o authReducer
   * → O reducer vai ver que é 'LOGIN_SUCCESS'
   * → Vai criar um novo estado com user e token definidos
   * → Vai retornar esse novo estado
   * → O state vai ser atualizado automaticamente
   */

  /*
   * ====================================================================
   * SEÇÃO 4: FUNÇÕES DO CONTEXTO
   * ====================================================================
   */

  // ===== FUNÇÃO DE LOGIN =====
  // Esta função é chamada quando o usuário quer fazer login
  const login = async (authData: AuthData): Promise<void> => {
    console.log('🔐 Iniciando login para:', authData.name);
    
    try {
      // PASSO 1: Indicar que está carregando
      dispatch({ type: 'SET_LOADING_STATE', payload: 'loading' });
      dispatch({ type: 'CLEAR_ERROR' });

      // PASSO 2: Chamar a API para fazer login
      console.log('🔐 Enviando requisição de login...', authData);
      const response = await authService.login(authData.name, authData.password);
      console.log('🔐 Resposta da API de login:', response);
      
      // PASSO 3: Verificar se recebeu o token
      if (!response.access_token) {
        throw new Error('Token de acesso não recebido');
      }

      console.log('🔐 Login bem-sucedido!');
      
      // PASSO 4: Obter dados do usuário
      // A API de login já retorna os dados do usuário, mas mantemos
      // compatibilidade caso não venha
      let user = response.user;
      
      if (!user) {
        console.log('🔐 Buscando perfil do usuário...');
        user = await authService.getProfile();
        console.log('🔐 Perfil do usuário:', user);
      }

      // PASSO 5: Salvar no localStorage (memória do navegador)
      // Isso permite que o usuário continue logado mesmo se fechar a página
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(user));

      // PASSO 6: Atualizar o estado do contexto
      console.log('✅ Login completo, usuário:', user);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          token: response.access_token,
        },
      });

    } catch (error: any) {
      // Se alguma coisa deu errado, trata o erro
      console.error('❌ Erro no login:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao fazer login. Verifique suas credenciais.';
      
      // Atualiza estado para mostrar o erro
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      
      // "Joga" o erro para cima (quem chamou esta função vai receber o erro)
      throw new Error(errorMessage);
    }
  };

  // ===== FUNÇÃO DE REGISTRO =====
  // Esta função é chamada quando alguém quer criar uma conta nova
  const register = async (authData: AuthData): Promise<void> => {
    console.log('📝 Iniciando registro para:', authData.name);
    
    try {
      // PASSO 1: Indicar que está carregando
      dispatch({ type: 'SET_LOADING_STATE', payload: 'loading' });
      dispatch({ type: 'CLEAR_ERROR' });

      // PASSO 2: Chamar a API para registrar
      console.log('📝 Enviando requisição de registro...');
      await authService.register(authData);

      console.log('✅ Registro bem-sucedido! Usuário pode fazer login agora.');
      
      // PASSO 3: Apenas marcar como sucesso (NÃO faz login automático)
      // O usuário precisará fazer login manualmente após o registro
      dispatch({ type: 'SET_LOADING_STATE', payload: 'success' });

    } catch (error) {
      // Se deu erro, trata
      console.error('❌ Erro no registro:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao criar conta. Tente novamente.';
      
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // ===== FUNÇÃO DE LOGOUT =====
  // Esta função é chamada quando o usuário quer sair
  const logout = async (): Promise<void> => {
    try {
      // PASSO 1: Notificar o servidor que o usuário está saindo
      await authService.logout();
    } catch (error) {
      // Mesmo se der erro no servidor, continua com logout local
      console.warn('Erro ao notificar logout no servidor:', error);
    } finally {
      // PASSO 2: Limpar dados locais (sempre executa, mesmo se der erro acima)
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      
      // PASSO 3: Atualizar estado do contexto
      dispatch({ type: 'LOGOUT' });
    }
  };

  // ===== FUNÇÃO DE ATUALIZAR PERFIL =====
  // Esta função permite mudar dados do usuário (nome, etc.)
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: 'loading' });
      dispatch({ type: 'CLEAR_ERROR' });

      // Atualiza dados via API
      await userService.updateProfile(userData);
      const updatedUser = await authService.getProfile();

      // Atualiza dados no localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));

      // Atualiza estado do contexto
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      dispatch({ type: 'SET_LOADING_STATE', payload: 'success' });

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao atualizar perfil.';
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // ===== FUNÇÃO DE VERIFICAR SESSÃO EXISTENTE =====
  // Esta função verifica se o usuário já estava logado quando abriu a página
  const checkExistingSession = async (): Promise<void> => {
    console.log('🔍 Verificando sessão existente...');
    
    try {
      // PASSO 1: Verificar se há token e dados salvos no localStorage
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');

      console.log('🔍 Token encontrado:', !!token);
      console.log('🔍 Dados do usuário encontrados:', !!userData);

      if (token && userData) {
        // PASSO 2: Verificar se o token ainda é válido
        console.log('🔍 Verificando validade do token...');
        const user = await authService.getProfile();
        
        // Se chegou até aqui, o token é válido
        console.log('✅ Token válido, usuário logado:', user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            token,
          },
        });
      } else {
        // PASSO 3: Não há sessão ativa
        console.log('❌ Nenhuma sessão ativa encontrada');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      // PASSO 4: Token inválido ou expirado, limpa dados locais
      console.error('❌ Erro ao verificar sessão:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ===== EFFECT PARA VERIFICAR SESSÃO NA INICIALIZAÇÃO =====
  // useEffect executa código quando o componente é montado (aplicação carrega)
  useEffect(() => {
    checkExistingSession();
  }, []);  // Array vazio [] significa "executar apenas uma vez"

  /*
   * ====================================================================
   * SEÇÃO 5: FORNECIMENTO DO CONTEXTO
   * ====================================================================
   */

  // ===== VALOR DO CONTEXTO =====
  // Este objeto contém tudo que os componentes filhos vão poder acessar
  const contextValue: AuthContextType = {
    // Dados do estado
    user: state.user,                        // Dados do usuário logado
    token: state.token,                      // Token JWT
    isAuthenticated: state.isAuthenticated,  // Se está logado
    isLoading: state.isLoading,              // Se está carregando
    
    // Funções disponíveis
    login,          // Para fazer login
    register,       // Para criar conta
    logout,         // Para sair
    updateProfile,  // Para atualizar dados
  };

  // ===== RETORNO DO PROVIDER =====
  // O Provider "envolve" os componentes filhos e fornece o contexto
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
  
  /*
   * COMO FUNCIONA NA PRÁTICA:
   * 
   * 1. Este Provider envolve toda a aplicação (no App.tsx)
   * 2. Qualquer componente dentro pode usar useAuth() para acessar:
   *    - Os dados: user, token, isAuthenticated, isLoading
   *    - As funções: login(), register(), logout(), updateProfile()
   * 
   * EXEMPLO DE USO EM UM COMPONENTE:
   * 
   * function MeuComponente() {
   *   const { user, isAuthenticated, login, logout } = useAuth();
   *   
   *   if (isAuthenticated) {
   *     return <div>Olá, {user.name}! <button onClick={logout}>Sair</button></div>;
   *   } else {
   *     return <div>Você não está logado</div>;
   *   }
   * }
   */
}

/*
 * ====================================================================
 * SEÇÃO 6: HOOK PERSONALIZADO
 * ====================================================================
 */

// ===== HOOK useAuth =====
// Esta função facilita o uso do contexto em outros componentes
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  // Verifica se o hook está sendo usado dentro de um AuthProvider
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

/*
 * COMO USAR ESTE HOOK:
 * 
 * Em qualquer componente da aplicação, você pode fazer:
 * 
 * import { useAuth } from '../contexts/AuthContext';
 * 
 * function MeuComponente() {
 *   const { user, isAuthenticated, login } = useAuth();
 *   // Agora você tem acesso a todos os dados e funções de autenticação!
 * }
 */

// ===== EXPORTAÇÕES =====
export { AuthContext };

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O AuthContext é o "CÉREBRO DE AUTENTICAÇÃO" do frontend. Ele:
 * 
 * 1. 🌐 ESTADO GLOBAL: Compartilha dados de autenticação com toda app
 * 2. 🔐 GERENCIA LOGIN: Coordena processo de login com API
 * 3. 📝 GERENCIA REGISTRO: Coordena criação de contas
 * 4. 🚪 GERENCIA LOGOUT: Coordena saída do sistema
 * 5. 💾 PERSISTE SESSÃO: Lembra que usuário está logado via localStorage
 * 6. 🔄 VERIFICA SESSÃO: Checa se usuário já estava logado ao abrir app
 * 7. 🛡️ PROTEGE ACESSO: Fornece info para proteger rotas/componentes
 * 
 * FLUXO TÍPICO:
 * 
 * App carrega → useEffect executa → checkExistingSession()
 *     ↓
 * Se há token: verifica validade → LOGIN_SUCCESS
 * Se não há: mantém como não logado
 *     ↓
 * Usuário usa login() → chama API → salva token → LOGIN_SUCCESS
 *     ↓
 * Todos os componentes recebem isAuthenticated = true
 *     ↓
 * Usuário usa logout() → limpa dados → LOGOUT
 *     ↓
 * Todos os componentes recebem isAuthenticated = false
 * 
 * SEM ESTE ARQUIVO:
 * Cada componente teria que gerenciar seu próprio estado de login,
 * seria impossível saber se o usuário está logado de forma consistente!
 */
