/**
 * 🔌 HOOK PARA CONEXÃO WEBSOCKET DO WHATSUT
 * 
 * Este hook personalizado gerencia a conexão WebSocket para
 * comunicação em tempo real, incluindo eventos de chat,
 * notificações de usuários online/offline e atualizações de grupos.
 * 
 * Funcionalidades implementadas:
 * - Conexão automática com autenticação JWT
 * - Reconexão automática em caso de desconexão
 * - Gerenciamento de salas de chat (rooms)
 * - Eventos de mensagens em tempo real
 * - Status de usuários online/offline
 * - Indicadores de digitação (typing)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  Message, 
  User, 
  Group, 
  CreateMessage, 
  ConnectionStatus,
  SocketEvents 
} from '../types';
import { useAuth } from '../contexts/AuthContext';

/**
 * Interface para configuração do hook WebSocket
 */
interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * Interface para o retorno do hook
 */
interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: CreateMessage) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  emitTyping: (targetId: string, chatType: 'private' | 'group') => void;
  onMessage: (callback: (message: Message) => void) => void;
  onUserOnline: (callback: (user: { userId: string }) => void) => void;
  onUserOffline: (callback: (user: { userId: string }) => void) => void;
  onUserTyping: (callback: (data: { userId: string; userName: string }) => void) => void;
  onGroupUpdate: (callback: (group: Group) => void) => void;
  removeAllListeners: () => void;
}

/**
 * URL base do servidor WebSocket
 */
const SOCKET_URL = 'http://localhost:3000';

/**
 * Hook personalizado para gerenciar conexão WebSocket
 * 
 * @param options - Opções de configuração
 * @returns Objeto com funções e estado da conexão WebSocket
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Função para conectar ao servidor WebSocket
   * Configura autenticação e event listeners
   */
  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.warn('Tentativa de conexão WebSocket sem autenticação');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('WebSocket já está conectado');
      return;
    }

    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);

      // Cria nova instância do socket com autenticação
      const socket = io(SOCKET_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
        autoConnect: false,
        timeout: 10000,
        reconnection: false, // Gerenciamos reconexão manualmente
      });

      /**
       * Event Listeners para gerenciar estado da conexão
       */

      // Conexão estabelecida com sucesso
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado:', socket.id);
        setIsConnected(true);
        setConnectionStatus(ConnectionStatus.CONNECTED);
        reconnectAttemptsRef.current = 0;

        // Limpa timeout de reconexão se existir
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      // Desconexão do servidor
      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
        setIsConnected(false);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);

        // Tenta reconectar automaticamente se não foi desconexão manual
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      });

      // Erro na conexão
      socket.on('connect_error', (error) => {
        console.error('🔥 Erro na conexão WebSocket:', error);
        setIsConnected(false);
        setConnectionStatus(ConnectionStatus.ERROR);

        // Tenta reconectar em caso de erro
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      });

      // Erro de autenticação
      socket.on('unauthorized', (error) => {
        console.error('🚫 Erro de autenticação WebSocket:', error);
        setConnectionStatus(ConnectionStatus.ERROR);
        // Não tenta reconectar em caso de erro de auth
      });

      socketRef.current = socket;
      socket.connect();

    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  }, [isAuthenticated, token, reconnectAttempts]);

  /**
   * Função para agendar tentativa de reconexão
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      console.log('❌ Máximo de tentativas de reconexão atingido');
      setConnectionStatus(ConnectionStatus.ERROR);
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionStatus(ConnectionStatus.RECONNECTING);

    console.log(
      `🔄 Tentando reconectar... (${reconnectAttemptsRef.current}/${reconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay * reconnectAttemptsRef.current); // Delay progressivo

  }, [connect, reconnectAttempts, reconnectDelay]);

  /**
   * Função para desconectar do WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Função para enviar mensagem via WebSocket
   * 
   * @param message - Dados da mensagem a ser enviada
   */
  const sendMessage = useCallback((message: CreateMessage) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket não está conectado. Mensagem não enviada.');
      return;
    }

    socketRef.current.emit('sendMessage', message);
  }, []);

  /**
   * Função para entrar em uma sala de chat
   * 
   * @param roomId - ID da sala (formato: 'private_userId' ou 'group_groupId')
   */
  const joinRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket não está conectado. Não foi possível entrar na sala.');
      return;
    }

    socketRef.current.emit('joinRoom', { roomId });
    console.log(`📥 Entrando na sala: ${roomId}`);
  }, []);

  /**
   * Função para sair de uma sala de chat
   * 
   * @param roomId - ID da sala
   */
  const leaveRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('leaveRoom', { roomId });
    console.log(`📤 Saindo da sala: ${roomId}`);
  }, []);

  /**
   * Função para emitir evento de digitação
   * 
   * @param targetId - ID do alvo (usuário ou grupo)
   * @param chatType - Tipo do chat (private ou group)
   */
  const emitTyping = useCallback((targetId: string, chatType: 'private' | 'group') => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('typing', { targetId, chatType });
  }, []);

  /**
   * Função para registrar callback de nova mensagem
   * 
   * @param callback - Função a ser chamada quando nova mensagem chegar
   */
  const onMessage = useCallback((callback: (message: Message) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('newMessage', callback);
  }, []);

  /**
   * Função para registrar callback de usuário online
   * 
   * @param callback - Função a ser chamada quando usuário ficar online
   */
  const onUserOnline = useCallback((callback: (user: { userId: string }) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('userOnline', callback);
  }, []);

  /**
   * Função para registrar callback de usuário offline
   * 
   * @param callback - Função a ser chamada quando usuário ficar offline
   */
  const onUserOffline = useCallback((callback: (user: { userId: string }) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('userOffline', callback);
  }, []);

  /**
   * Função para registrar callback de usuário digitando
   * 
   * @param callback - Função a ser chamada quando usuário estiver digitando
   */
  const onUserTyping = useCallback((callback: (data: { userId: string; userName: string }) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('userTyping', callback);
  }, []);

  /**
   * Função para registrar callback de atualização de grupo
   * 
   * @param callback - Função a ser chamada quando grupo for atualizado
   */
  const onGroupUpdate = useCallback((callback: (group: Group) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('groupUpdate', callback);
  }, []);

  /**
   * Função para remover todos os listeners
   * Útil para limpeza quando componente é desmontado
   */
  const removeAllListeners = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
    }
  }, []);

  /**
   * Effect para conectar automaticamente quando autenticado
   */
  useEffect(() => {
    if (autoConnect && isAuthenticated && token && !socketRef.current?.connected) {
      connect();
    }

    return () => {
      // Cleanup na desmontagem do componente
      if (!autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, isAuthenticated, token, connect, disconnect]);

  /**
   * Effect para desconectar quando usuário não estiver mais autenticado
   */
  useEffect(() => {
    if (!isAuthenticated && socketRef.current?.connected) {
      disconnect();
    }
  }, [isAuthenticated, disconnect]);

  /**
   * Cleanup na desmontagem do componente
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    emitTyping,
    onMessage,
    onUserOnline,
    onUserOffline,
    onUserTyping,
    onGroupUpdate,
    removeAllListeners,
  };
}
