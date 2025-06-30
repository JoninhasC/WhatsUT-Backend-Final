/**
 * 🔌 SERVIÇO DE WEBSOCKET - COMUNICAÇÃO EM TEMPO REAL
 * 
 * Este serviço gerencia a conexão WebSocket com o backend para chat em tempo real.
 * Baseado no socket.io para comunicação bidirecional entre frontend e backend.
 */

import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Conecta ao servidor WebSocket
   * @param token - Token JWT para autenticação
   */
  connect(token: string) {
    if (this.socket && this.isConnected) {
      return;
    }

    // Conectar ao backend na porta 3000
    this.socket = io('http://localhost:3000', {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // Event listeners para conexão
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Verifica se está conectado
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Obtém a instância do socket
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Envia uma mensagem
   */
  sendMessage(data: {
    content: string;
    chatType: 'private' | 'group';
    targetId: string;
    tempId?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket não conectado');
    }

    this.socket.emit('sendMessage', data);
  }

  /**
   * Entra em uma sala de grupo
   */
  joinRoom(groupId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket não conectado');
    }

    this.socket.emit('joinRoom', { groupId });
  }

  /**
   * Sai de uma sala de grupo
   */
  leaveRoom(groupId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket não conectado');
    }

    this.socket.emit('leaveRoom', { groupId });
  }

  /**
   * Registra listener para novas mensagens
   */
  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('newMessage', callback);
  }

  /**
   * Registra listener para confirmação de mensagem
   */
  onMessageDelivered(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('messageDelivered', callback);
  }

  /**
   * Registra listener para updates de status do usuário
   */
  onUserStatusUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('userStatusUpdate', callback);
  }

  /**
   * Registra listener para confirmação de entrada em sala
   */
  onRoomJoined(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('roomJoined', callback);
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// Exporta uma instância singleton
export const socketService = new SocketService();
export default socketService;
