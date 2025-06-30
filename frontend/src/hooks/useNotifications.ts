/**
 * 🔔 SISTEMA DE NOTIFICAÇÕES EM TEMPO REAL
 * 
 * Hook para gerenciar conexões WebSocket e notificações
 * em tempo real para o WhatsUT
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useNotifications() {
  const { user, token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!isAuthenticated || !token || socketRef.current?.connected) {
      return;
    }

    const socket = io('http://localhost:3000/chat', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('🔗 Conectado ao WebSocket');
      toast.success('Conectado ao chat em tempo real');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado do WebSocket:', reason);
      if (reason === 'io server disconnect') {
        // Reconectar manualmente se o servidor desconectou
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      
      // Tentar reconectar após 5 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        socket.connect();
      }, 5000);
    });

    // Event listeners para notificações
    socket.on('newMessage', (data) => {
      // Não mostrar notificação se for mensagem própria
      if (data.senderId !== user?.id) {
        toast.success(
          `Nova mensagem de ${data.senderName}`,
          {
            duration: 4000,
            icon: '💬'
          }
        );
      }
    });

    socket.on('userStatusUpdate', (data) => {
      if (data.status === 'online' && data.userId !== user?.id) {
        toast.success(`${data.userName} ficou online`, {
          duration: 2000,
          icon: '🟢'
        });
      }
    });

    socket.on('groupUpdate', (data) => {
      toast.success(`Grupo atualizado: ${data.message}`, {
        duration: 3000,
        icon: '👥'
      });
    });

    socket.on('banned', (data) => {
      toast.error(`Você foi banido: ${data.reason}`, {
        duration: 8000,
        icon: '🚫'
      });
      
      // Redirecionar para login após banimento
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    });

    socketRef.current = socket;
  }, [isAuthenticated, token, user?.id]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket não conectado, não foi possível enviar:', event);
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    emit('joinRoom', { groupId: roomId });
  }, [emit]);

  const leaveRoom = useCallback((roomId: string) => {
    emit('leaveRoom', { groupId: roomId });
  }, [emit]);

  const sendTyping = useCallback((targetId: string, chatType: 'private' | 'group') => {
    emit('typing', { targetId, chatType });
  }, [emit]);

  const stopTyping = useCallback((targetId: string, chatType: 'private' | 'group') => {
    emit('stopTyping', { targetId, chatType });
  }, [emit]);

  // Conectar quando autenticado
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected: socketRef.current?.connected || false,
    connect,
    disconnect,
    emit,
    joinRoom,
    leaveRoom,
    sendTyping,
    stopTyping
  };
}
