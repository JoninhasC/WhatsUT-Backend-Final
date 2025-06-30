/**
 * 🔐 CONTEXTO DE AUTENTICAÇÃO DO WHATSUT
 * 
 * Este arquivo implementa o gerenciamento global de estado
 * de autenticação usando React Context API.
 * 
 * Funcionalidades implementadas:
 * - Login e logout de usuários
 * - Registro de novos usuários
 * - Persistência de sessão via localStorage
 * - Gerenciamento de estado de carregamento
 * - Atualização de perfil do usuário
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { User, AuthData, AuthContextType, LoadingState } from '../types';
import { authService, userService } from '../services/api';

/**
 * Interface para o estado do contexto de autenticação
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
}

/**
 * Tipos de ações para o reducer de autenticação
 */
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_STATE'; payload: LoadingState }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

/**
 * Estado inicial do contexto de autenticação
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  loadingState: 'idle',
  error: null,
};

/**
 * Reducer para gerenciar o estado de autenticação
 * @param state - Estado atual
 * @param action - Ação a ser executada
 * @returns Novo estado
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  console.log('🔄 AuthReducer - Ação:', action.type, action);
  
  switch (action.type) {
    case 'SET_LOADING':
      const newLoadingState = {
        ...state,
        isLoading: action.payload,
      };
      console.log('🔄 SET_LOADING - Novo estado:', newLoadingState);
      return newLoadingState;

    case 'SET_LOADING_STATE':
      const newLoadingStateState = {
        ...state,
        loadingState: action.payload,
        isLoading: action.payload === 'loading',
      };
      console.log('🔄 SET_LOADING_STATE - Novo estado:', newLoadingStateState);
      return newLoadingStateState;

    case 'LOGIN_SUCCESS':
      const newSuccessState = {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        loadingState: 'success' as LoadingState,
        error: null,
      };
      console.log('🔄 LOGIN_SUCCESS - Novo estado:', newSuccessState);
      console.log('🔄 LOGIN_SUCCESS - isAuthenticated agora é:', newSuccessState.isAuthenticated);
      console.log('🔄 LOGIN_SUCCESS - Usuário logado:', newSuccessState.user?.name);
      return newSuccessState;

    case 'LOGIN_ERROR':
      const newErrorState = {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        loadingState: 'error' as LoadingState,
        error: action.payload,
      };
      console.log('🔄 LOGIN_ERROR - Novo estado:', newErrorState);
      return newErrorState;

    case 'LOGOUT':
      const newLogoutState = {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        loadingState: 'idle' as LoadingState,
        error: null,
      };
      console.log('🔄 LOGOUT - Novo estado:', newLogoutState);
      return newLogoutState;

    case 'UPDATE_USER':
      const newUpdateState = {
        ...state,
        user: action.payload,
        error: null,
      };
      console.log('🔄 UPDATE_USER - Novo estado:', newUpdateState);
      return newUpdateState;

    case 'SET_ERROR':
      const newSetErrorState = {
        ...state,
        error: action.payload,
        loadingState: 'error' as LoadingState,
      };
      console.log('🔄 SET_ERROR - Novo estado:', newSetErrorState);
      return newSetErrorState;

    case 'CLEAR_ERROR':
      const newClearErrorState = {
        ...state,
        error: null,
      };
      console.log('🔄 CLEAR_ERROR - Novo estado:', newClearErrorState);
      return newClearErrorState;

    default:
      console.log('🔄 Ação desconhecida:', action);
      return state;
  }
}

/**
 * Criação do contexto de autenticação
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Interface para as props do provider de autenticação
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider do contexto de autenticação
 * Gerencia o estado global de autenticação da aplicação
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Função para realizar login do usuário
   * 
   * @param authData - Dados de autenticação (nome e senha)
   * @throws Error caso o login falhe
   */
  const login = async (authData: AuthData): Promise<void> => {
    console.log('🔐 Iniciando login para:', authData.name);
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: 'loading' });
      dispatch({ type: 'CLEAR_ERROR' });

      // Realiza login via API
      console.log('🔐 Enviando requisição de login...', authData);
      const response = await authService.login(authData.name, authData.password);
      console.log('🔐 Resposta da API de login:', response);
      
      if (!response.access_token) {
        throw new Error('Token de acesso não recebido');
      }

      console.log('🔐 Login bem-sucedido!');
      
      // Usar dados do usuário que vêm do login (se disponíveis)
      let user = response.user;
      
      // Se não vierem dados do usuário no login, tentar buscar o perfil
      if (!user) {
        console.log('🔐 Buscando perfil do usuário...');
        user = await authService.getProfile();
        console.log('🔐 Perfil do usuário:', user);
      }

      // Armazena dados no localStorage para persistência
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(user));

      console.log('✅ Login completo, usuário:', user);
      // Atualiza estado do contexto
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          token: response.access_token,
        },
      });

    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      if (error?.response) {
        console.error('❌ Erro resposta da API:', error.response);
      }
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao fazer login. Verifique suas credenciais.';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  /**
   * Função para registrar novo usuário
   * 
   * @param authData - Dados do novo usuário (nome e senha)
   * @throws Error caso o registro falhe
   */
  const register = async (authData: AuthData): Promise<void> => {
    console.log('📝 Iniciando registro para:', authData.name);
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: 'loading' });
      dispatch({ type: 'CLEAR_ERROR' });

      // Registra usuário via API
      console.log('📝 Enviando requisição de registro...');
      await authService.register(authData);

      console.log('✅ Registro bem-sucedido! Usuário pode fazer login agora.');
      
      // Apenas marca como não carregando, não faz login automático
      dispatch({ type: 'SET_LOADING_STATE', payload: 'success' });

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao criar conta. Tente novamente.';
      
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  /**
   * Função para realizar logout do usuário
   * Remove dados do localStorage e atualiza estado
   */
  const logout = async (): Promise<void> => {
    try {
      // Notifica o servidor sobre o logout
      await authService.logout();
    } catch (error) {
      // Mesmo se falhar no servidor, continua com logout local
      console.warn('Erro ao notificar logout no servidor:', error);
    } finally {
      // Remove dados locais
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      
      // Atualiza estado
      dispatch({ type: 'LOGOUT' });
    }
  };

  /**
   * Função para atualizar perfil do usuário
   * 
   * @param userData - Dados a serem atualizados
   * @throws Error caso a atualização falhe
   */
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

  /**
   * Função para verificar se há sessão ativa no localStorage
   * Executada na inicialização da aplicação
   */
  const checkExistingSession = async (): Promise<void> => {
    console.log('🔍 Verificando sessão existente...');
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');

      console.log('🔍 Token encontrado:', !!token);
      console.log('🔍 Dados do usuário encontrados:', !!userData);

      if (token && userData) {
        console.log('🔍 Verificando validade do token...');
        // Verifica se o token ainda é válido obtendo o perfil
        const user = await authService.getProfile();
        
        console.log('✅ Token válido, usuário logado:', user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            token,
          },
        });
      } else {
        // Não há sessão ativa
        console.log('❌ Nenhuma sessão ativa encontrada');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      // Token inválido ou expirado, remove dados locais
      console.error('❌ Erro ao verificar sessão:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Effect para verificar sessão existente na inicialização
   */
  useEffect(() => {
    checkExistingSession();
  }, []);

  /**
   * Valor do contexto que será fornecido aos componentes filhos
   */
  const contextValue: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação
 * 
 * @returns Contexto de autenticação
 * @throws Error se usado fora do AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

/**
 * Exporta o contexto para uso direto se necessário
 */
export { AuthContext };
