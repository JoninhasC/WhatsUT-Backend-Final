// Importações para WebSocket e validação
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnlineUsersService } from '../auth/online-users.service';
import { RealtimeMessageDto } from './dto/realtime-message.dto';
import { ChatRepository } from '../chat/chat.repository';

/**
 * ChatGateway - Gateway WebSocket para Chat em Tempo Real
 * 
 * Este gateway implementa comunicação bidirecional em tempo real
 * para o sistema de chat WhatsUT usando Socket.IO.
 * 
 * Funcionalidades principais:
 * - Mensagens instantâneas para chats privados e grupos
 * - Status online/offline em tempo real
 * - Notificações de digitação (typing indicators)
 * - Salas de chat automáticas por grupo
 * - Autenticação via JWT para conexões WebSocket
 * 
 * Eventos suportados:
 * - 'sendMessage': Enviar mensagem em tempo real
 * - 'joinRoom': Entrar em sala de grupo
 * - 'leaveRoom': Sair de sala de grupo
 * - 'typing': Notificar que está digitando
 * - 'stopTyping': Parar de digitar
 * 
 * Eventos emitidos:
 * - 'newMessage': Nova mensagem recebida
 * - 'userStatusUpdate': Atualização de status online
 * - 'userTyping': Usuário digitando
 * - 'userStoppedTyping': Usuário parou de digitar
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, configurar domínios específicos
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly onlineUsersService: OnlineUsersService,
    private readonly chatRepository: ChatRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Inicialização do Gateway WebSocket
   * 
   * Configurações adicionais após inicialização do servidor.
   * Configura middleware de autenticação e logs.
   */
  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway inicializado com sucesso');
    
    // Middleware de autenticação para Socket.IO
    server.use(async (socket, next) => {
      try {
        // Token deve vir no handshake: ?token=jwt_token ou auth.token
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          throw new Error('Token de autenticação não fornecido');
        }

        // Verificar token JWT usando JwtService
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'senhasemenv',
        });

        // Armazenar dados do usuário no socket
        socket.data.userId = payload.sub;
        socket.data.userName = payload.name;
        next();
      } catch (error) {
        this.logger.error(`Erro de autenticação WebSocket: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Gerencia conexão de novo cliente WebSocket
   * 
   * Quando um usuário se conecta:
   * 1. Adiciona à lista de usuários online
   * 2. Notifica outros usuários sobre status online
   * 3. Junta automaticamente às salas dos grupos do usuário
   * 
   * @param client - Socket do cliente conectado
   */
  async handleConnection(client: Socket) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        client.disconnect();
        return;
      }

      this.logger.log(`👤 Usuário ${userId} conectado via WebSocket`);

      // Adicionar à lista de usuários online
      this.onlineUsersService.addUser(userId);

      // Notificar todos sobre usuário online
      this.server.emit('userStatusUpdate', {
        userId,
        status: 'online',
        timestamp: new Date(),
      });

      // Juntar automaticamente às salas dos grupos do usuário
      await this.joinUserGroups(client, userId);

      // Enviar mensagens não entregues (se houver sistema de queue)
      await this.sendPendingMessages(client, userId);

    } catch (error) {
      this.logger.error(`Erro na conexão: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Gerencia desconexão de cliente WebSocket
   * 
   * Quando um usuário se desconecta:
   * 1. Remove da lista de usuários online
   * 2. Notifica outros usuários sobre status offline
   * 3. Limpa dados da sessão
   * 
   * @param client - Socket do cliente desconectado
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId;
      
      if (userId) {
        this.logger.log(`👤 Usuário ${userId} desconectado do WebSocket`);

        // Remover da lista de usuários online
        this.onlineUsersService.removeUser(userId);

        // Notificar todos sobre usuário offline
        this.server.emit('userStatusUpdate', {
          userId,
          status: 'offline',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Erro na desconexão: ${error.message}`);
    }
  }

  /**
   * Enviar mensagem em tempo real
   * 
   * Recebe mensagem do cliente e:
   * 1. Persiste no sistema (CSV/banco)
   * 2. Envia em tempo real para destinatários
   * 3. Notifica sobre nova mensagem
   * 
   * Para chat privado: envia para o usuário específico
   * Para chat grupo: envia para todos os membros do grupo
   * 
   * @param client - Socket do remetente
   * @param data - Dados da mensagem
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RealtimeMessageDto,
  ) {
    try {
      const senderId = client.data.userId;
      
      if (!senderId) {
        throw new Error('Usuário não autenticado');
      }

      this.logger.log(`💬 Mensagem em tempo real de ${senderId} para ${data.targetId}`);

      // Persistir mensagem no sistema
      const savedMessage = await this.chatRepository.send({
        senderId,
        targetId: data.targetId,
        content: data.content,
        chatType: data.chatType,
      });

      // Preparar dados da mensagem em tempo real
      const messageData = {
        messageId: savedMessage.id,
        senderId,
        targetId: data.targetId,
        content: data.content,
        chatType: data.chatType,
        timestamp: new Date(),
        tempId: data.tempId, // ID temporário para matching no frontend
      };

      // Enviar para destinatários dependendo do tipo de chat
      if (data.chatType === 'private') {
        // Chat privado: enviar para o destinatário
        this.sendToUser(data.targetId, 'newMessage', messageData);
      } else if (data.chatType === 'group') {
        // Chat grupo: enviar para todos na sala do grupo
        this.server.to(`group_${data.targetId}`).emit('newMessage', messageData);
      }

      // Confirmar entrega para o remetente
      client.emit('messageDelivered', {
        messageId: savedMessage.id,
        tempId: data.tempId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      
      // Notificar erro para o cliente
      client.emit('messageError', {
        error: error.message,
        tempId: data.tempId,
      });
    }
  }

  /**
   * Entrar em sala de grupo
   * 
   * Permite ao usuário entrar numa sala específica de grupo
   * para receber mensagens em tempo real desse grupo.
   * 
   * @param client - Socket do cliente
   * @param data - Dados com ID do grupo
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se usuário é membro do grupo
      const isMember = await this.verifyGroupMembership(userId, data.groupId);
      
      if (!isMember) {
        throw new Error('Usuário não é membro do grupo');
      }

      // Entrar na sala do grupo
      await client.join(`group_${data.groupId}`);
      
      this.logger.log(`👤 Usuário ${userId} entrou na sala do grupo ${data.groupId}`);

      // Confirmar entrada na sala
      client.emit('roomJoined', {
        groupId: data.groupId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Erro ao entrar na sala: ${error.message}`);
      
      client.emit('roomError', {
        error: error.message,
        groupId: data.groupId,
      });
    }
  }

  /**
   * Sair de sala de grupo
   * 
   * Remove o usuário da sala do grupo, parando de receber
   * mensagens em tempo real desse grupo.
   * 
   * @param client - Socket do cliente
   * @param data - Dados com ID do grupo
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Sair da sala do grupo
      await client.leave(`group_${data.groupId}`);
      
      this.logger.log(`👤 Usuário ${userId} saiu da sala do grupo ${data.groupId}`);

      // Confirmar saída da sala
      client.emit('roomLeft', {
        groupId: data.groupId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Erro ao sair da sala: ${error.message}`);
      
      client.emit('roomError', {
        error: error.message,
        groupId: data.groupId,
      });
    }
  }

  /**
   * Notificar que está digitando
   * 
   * Informa outros usuários que o usuário atual está digitando.
   * Para chats privados, notifica apenas o destinatário.
   * Para chats grupo, notifica todos os membros da sala.
   * 
   * @param client - Socket do cliente
   * @param data - Dados de digitação
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; chatType: 'private' | 'group' },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const typingData = {
        userId,
        targetId: data.targetId,
        chatType: data.chatType,
        timestamp: new Date(),
      };

      // Enviar notificação dependendo do tipo de chat
      if (data.chatType === 'private') {
        // Chat privado: notificar apenas o destinatário
        this.sendToUser(data.targetId, 'userTyping', typingData);
      } else if (data.chatType === 'group') {
        // Chat grupo: notificar todos na sala (exceto o remetente)
        client.to(`group_${data.targetId}`).emit('userTyping', typingData);
      }

    } catch (error) {
      this.logger.error(`Erro na notificação de digitação: ${error.message}`);
    }
  }

  /**
   * Parar de digitar
   * 
   * Informa outros usuários que o usuário parou de digitar.
   * 
   * @param client - Socket do cliente
   * @param data - Dados de parada de digitação
   */
  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; chatType: 'private' | 'group' },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const stoppedTypingData = {
        userId,
        targetId: data.targetId,
        chatType: data.chatType,
        timestamp: new Date(),
      };

      // Enviar notificação dependendo do tipo de chat
      if (data.chatType === 'private') {
        // Chat privado: notificar apenas o destinatário
        this.sendToUser(data.targetId, 'userStoppedTyping', stoppedTypingData);
      } else if (data.chatType === 'group') {
        // Chat grupo: notificar todos na sala (exceto o remetente)
        client.to(`group_${data.targetId}`).emit('userStoppedTyping', stoppedTypingData);
      }

    } catch (error) {
      this.logger.error(`Erro ao parar notificação de digitação: ${error.message}`);
    }
  }

  /**
   * Método utilitário: Enviar evento para usuário específico
   * 
   * Procura por todas as conexões do usuário e envia mensagem.
   * 
   * @param userId - ID do usuário destinatário
   * @param event - Nome do evento
   * @param data - Dados a enviar
   */
  private sendToUser(userId: string, event: string, data: any) {
    try {
      // Encontrar sockets do usuário
      const userSockets = this.getUserSockets(userId);
      
      if (userSockets && userSockets.length > 0) {
        userSockets.forEach(socket => {
          socket.emit(event, data);
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar evento ${event} para usuário ${userId}: ${error.message}`);
    }
  }

  /**
   * Método utilitário: Obter todos os sockets de um usuário
   * 
   * @param userId - ID do usuário
   * @returns Array de sockets do usuário
   */
  private getUserSockets(userId: string): Socket[] {
    const sockets: Socket[] = [];
    
    try {
      this.server.sockets.sockets.forEach(socket => {
        if (socket.data.userId === userId) {
          sockets.push(socket);
        }
      });
    } catch (error) {
      this.logger.error(`Erro ao obter sockets do usuário ${userId}: ${error.message}`);
    }
    
    return sockets;
  }

  /**
   * Método utilitário: Verificar se usuário é membro do grupo
   * 
   * @param userId - ID do usuário
   * @param groupId - ID do grupo
   * @returns True se for membro
   */
  private async verifyGroupMembership(userId: string, groupId: string): Promise<boolean> {
    // Implementar verificação de membership
    // Por enquanto, retorna true (implementar integração com GroupRepository)
    return true;
  }

  /**
   * Método utilitário: Juntar usuário às salas dos seus grupos
   * 
   * @param client - Socket do cliente
   * @param userId - ID do usuário
   */
  private async joinUserGroups(client: Socket, userId: string) {
    try {
      // Implementar: buscar grupos do usuário e juntar às salas
      // const userGroups = await this.groupRepository.findUserGroups(userId);
      // userGroups.forEach(group => {
      //   client.join(`group_${group.id}`);
      // });
    } catch (error) {
      this.logger.error(`Erro ao juntar usuário aos grupos: ${error.message}`);
    }
  }

  /**
   * Método utilitário: Enviar mensagens pendentes para usuário
   * 
   * @param client - Socket do cliente
   * @param userId - ID do usuário
   */
  private async sendPendingMessages(client: Socket, userId: string) {
    try {
      // Implementar: buscar mensagens não entregues e enviar
      // const pendingMessages = await this.messageQueueService.getPendingMessages(userId);
      // pendingMessages.forEach(message => {
      //   client.emit('newMessage', message);
      // });
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagens pendentes: ${error.message}`);
    }
  }
}
