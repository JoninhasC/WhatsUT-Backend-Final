/**
 * 🌐 CHAT GATEWAY - COMUNICAÇÃO EM TEMPO REAL NO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Este arquivo implementa comunicação em tempo real usando WebSockets.
 * É a diferença entre uma aplicação "comum" e uma aplicação "moderna".
 * 
 * ANALOGIA SIMPLES:
 * - HTTP tradicional = CORREIO: você envia uma carta, espera a resposta
 * - WebSocket = TELEFONE: conversação em tempo real, bidirecional
 * 
 * 🔄 COMO FUNCIONA A COMUNICAÇÃO EM TEMPO REAL:
 * 1. Cliente se conecta ao servidor via WebSocket
 * 2. Servidor pode enviar dados a qualquer momento
 * 3. Cliente pode enviar dados a qualquer momento
 * 4. Ambos escutam eventos específicos
 * 5. Quando algo acontece, todos são notificados instantaneamente
 * 
 * 🎯 O QUE ESTE GATEWAY FAZ:
 * - Conecta usuários em tempo real
 * - Envia mensagens instantaneamente
 * - Gerencia salas de chat (grupos)
 * - Controla status online/offline
 * - Autentica conexões WebSocket
 * - Notifica quando alguém está digitando
 * 
 * 💡 POR QUE É CRUCIAL PARA UM CHAT:
 * Sem isso, os usuários teriam que "recarregar" a página
 * para ver novas mensagens. Com isso, as mensagens aparecem
 * instantaneamente, como WhatsApp, Telegram, Discord, etc.
 */

// 📦 IMPORTAÇÕES PARA WEBSOCKET
import {
  WebSocketGateway,     // 🌐 Decorator que marca esta classe como um gateway WebSocket
  SubscribeMessage,     // 👂 Decorator para escutar eventos específicos do cliente
  MessageBody,          // 📩 Decorator para extrair o corpo da mensagem
  OnGatewayInit,        // 🚀 Interface para inicialização do gateway
  OnGatewayConnection,  // 🔌 Interface para gerenciar conexões
  OnGatewayDisconnect,  // 🔌 Interface para gerenciar desconexões
  WebSocketServer,      // 🖥️ Decorator para injetar instância do servidor WebSocket
  ConnectedSocket,      // 🔗 Decorator para acessar o socket conectado
} from '@nestjs/websockets';

// 📦 OUTRAS IMPORTAÇÕES NECESSÁRIAS
import { Logger } from '@nestjs/common';                     // 📋 Para logs organizados
import { Server, Socket } from 'socket.io';                 // 🔌 Socket.IO para WebSocket
import { JwtService } from '@nestjs/jwt';                    // 🔐 Para autenticação JWT
import { OnlineUsersService } from '../auth/online-users.service'; // 👥 Controle de usuários online
import { RealtimeMessageDto } from './dto/realtime-message.dto';    // 📋 Estrutura de mensagem
import { ChatRepository } from '../chat/chat.repository';           // 💾 Persistência de mensagens

/**
 * 🏗️ DECORATOR DE CONFIGURAÇÃO DO WEBSOCKET GATEWAY
 * 
 * 📚 CONCEITO - @WebSocketGateway:
 * Configura como o servidor WebSocket vai funcionar.
 * É como definir as "regras da casa" para comunicação em tempo real.
 * 
 * 🔧 CONFIGURAÇÕES IMPORTANTES:
 * - cors: Permite requisições de outros domínios (frontend)
 * - namespace: Cria um "canal" específico para chat
 * - origin: '*' permite qualquer origem (cuidado em produção!)
 */
@WebSocketGateway({
  cors: {
    origin: '*', // ⚠️ Em produção, especificar domínios permitidos
    credentials: true, // 🔐 Permite envio de cookies/autenticação
  },
  namespace: 'chat', // 📡 Namespace específico para funcionalidades de chat
})

/**
 * 🏭 CLASSE PRINCIPAL DO GATEWAY
 * 
 * 📚 CONCEITO - Gateway Pattern:
 * Esta classe é a "porteira" entre o mundo exterior (clientes)
 * e nosso sistema interno. Ela traduz eventos WebSocket em
 * ações do nosso sistema e vice-versa.
 * 
 * 🔧 INTERFACES IMPLEMENTADAS:
 * - OnGatewayInit: Para configurar o gateway após inicialização
 * - OnGatewayConnection: Para gerenciar novas conexões
 * - OnGatewayDisconnect: Para gerenciar desconexões
 */
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  /**
   * 🖥️ SERVIDOR WEBSOCKET
   * 
   * 📚 CONCEITO - @WebSocketServer:
   * Injeta automaticamente a instância do servidor Socket.IO.
   * É como ter acesso ao "microfone principal" para falar
   * com todos os clientes conectados.
   * 
   * 🎯 PERMITE:
   * - Enviar mensagens para todos os clientes
   * - Enviar mensagens para clientes específicos
   * - Gerenciar salas (rooms) de chat
   * - Emitir eventos personalizados
   */
  @WebSocketServer()
  server: Server;

  /**
   * 📋 LOGGER PARA DEBUGGING E MONITORAMENTO
   * 
   * 📚 CONCEITO:
   * Sistema de logs organizado que ajuda a debuggar
   * problemas e monitorar a aplicação em produção.
   * 
   * É como ter um "diário" da aplicação.
   */
  private readonly logger = new Logger(ChatGateway.name);

  /**
   * 🏗️ CONSTRUTOR COM INJEÇÃO DE DEPENDÊNCIAS
   * 
   * 📚 CONCEITO - Dependency Injection:
   * O NestJS automaticamente fornece as instâncias dos
   * serviços que precisamos. É como pedir ajuda para
   * especialistas em diferentes áreas.
   * 
   * 🎯 SERVIÇOS INJETADOS:
   * - onlineUsersService: Controla quem está online
   * - chatRepository: Salva mensagens no sistema
   * - jwtService: Verifica autenticação dos usuários
   */
  constructor(
    private readonly onlineUsersService: OnlineUsersService, // 👥 Gerencia usuários online
    private readonly chatRepository: ChatRepository,         // 💾 Persiste mensagens
    private readonly jwtService: JwtService,                // 🔐 Autenticação JWT
  ) {}

  /**
   * 🚀 INICIALIZAÇÃO DO GATEWAY WEBSOCKET
   * 
   * 📚 CONCEITO - Lifecycle Hook:
   * Este método é chamado automaticamente após o servidor
   * WebSocket ser inicializado. É como o "momento de setup"
   * antes de começar a aceitar conexões.
   * 
   * 🔧 O QUE FAZEMOS AQUI:
   * 1. Configuramos middleware de autenticação
   * 2. Preparamos logs para monitoramento
   * 3. Definimos regras de segurança
   * 
   * @param server - Instância do servidor Socket.IO inicializado
   */
  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway inicializado com sucesso');
    
    /**
     * 🔐 MIDDLEWARE DE AUTENTICAÇÃO
     * 
     * 📚 CONCEITO - Middleware Pattern:
     * Código que executa ANTES de processar cada conexão.
     * É como um "segurança" que verifica documentos
     * antes de deixar alguém entrar no clube.
     * 
     * 🔧 PROCESSO DE AUTENTICAÇÃO:
     * 1. Cliente tenta se conectar
     * 2. Middleware intercepta a conexão
     * 3. Verifica se há token JWT válido
     * 4. Se válido: permite conexão e armazena dados do usuário
     * 5. Se inválido: rejeita conexão
     */
    server.use(async (socket, next) => {
      try {
        /**
         * 🎫 EXTRAÇÃO DO TOKEN JWT
         * 
         * 📚 CONCEITO:
         * O token pode vir de duas formas:
         * - socket.handshake.auth.token (recomendado)
         * - socket.handshake.query.token (alternativa)
         * 
         * ANALOGIA: É como mostrar seu "bilhete de entrada"
         * na porta do evento.
         */
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          throw new Error('Token de autenticação não fornecido');
        }

        /**
         * 🔍 VERIFICAÇÃO DO TOKEN JWT
         * 
         * 📚 CONCEITO:
         * Decodifica e valida o token JWT para extrair
         * informações do usuário (ID, nome, etc.).
         * 
         * É como verificar se o documento de identidade
         * é verdadeiro e não foi falsificado.
         */
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'senhasemenv',
        });

        /**
         * 💾 ARMAZENAMENTO DOS DADOS DO USUÁRIO
         * 
         * 📚 CONCEITO - Socket Data Storage:
         * Armazenamos informações do usuário no próprio socket.
         * Assim, em qualquer evento futuro, sabemos quem
         * é o usuário sem precisar verificar o token novamente.
         * 
         * É como colocar uma "etiqueta de identificação"
         * no socket.
         */
        socket.data.userId = payload.sub;   // 🆔 ID único do usuário
        socket.data.userName = payload.name; // 👤 Nome do usuário
        
        // ✅ Autoriza a conexão
        next();
      } catch (error) {
        this.logger.error(`Erro de autenticação WebSocket: ${error.message}`);
        // ❌ Rejeita a conexão
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * 🔌 GERENCIA NOVA CONEXÃO WEBSOCKET
   * 
   * 📚 CONCEITO - Connection Handler:
   * Este método é chamado automaticamente sempre que
   * um novo cliente se conecta ao servidor WebSocket.
   * 
   * ANALOGIA: É como um "recepcionista" que cumprimenta
   * cada pessoa que entra no hotel e faz o check-in.
   * 
   * 🔧 PROCESSO DE CONEXÃO:
   * 1. Usuário abre a aplicação/página de chat
   * 2. Frontend estabelece conexão WebSocket
   * 3. Este método é executado automaticamente
   * 4. Registramos o usuário como "online"
   * 5. Notificamos outros usuários
   * 6. Colocamos o usuário nas salas adequadas
   * 
   * @param client - Socket do cliente que acabou de se conectar
   */
  async handleConnection(client: Socket) {
    try {
      /**
       * 🆔 IDENTIFICAÇÃO DO USUÁRIO
       * 
       * 📚 CONCEITO:
       * Pegamos o ID do usuário que foi armazenado
       * durante a autenticação no middleware.
       */
      const userId = client.data.userId;
      
      // ⚠️ Segurança: Desconectar se não há usuário autenticado
      if (!userId) {
        client.disconnect();
        return;
      }

      this.logger.log(`👤 Usuário ${userId} conectado via WebSocket`);

      /**
       * 👥 REGISTRAR COMO USUÁRIO ONLINE
       * 
       * 📚 CONCEITO:
       * Adicionamos o usuário à lista de usuários online.
       * Isso permite que outros vejam que ele está ativo.
       * 
       * É como "acender uma luz verde" ao lado do seu nome
       * para mostrar que você está disponível.
       */
      this.onlineUsersService.addUser(userId);

      /**
       * 📢 NOTIFICAR STATUS ONLINE PARA TODOS
       * 
       * 📚 CONCEITO - Broadcasting:
       * Enviamos uma notificação para TODOS os clientes
       * conectados informando que este usuário ficou online.
       * 
       * É como fazer um "anúncio" no alto-falante:
       * "Fulano acabou de entrar online!"
       */
      this.server.emit('userStatusUpdate', {
        userId,
        status: 'online',
        timestamp: new Date(),
      });

      /**
       * 🏠 JUNTAR ÀS SALAS DOS GRUPOS
       * 
       * 📚 CONCEITO - Rooms (Salas):
       * Automaticamente colocamos o usuário nas "salas"
       * dos grupos que ele faz parte. Assim ele receberá
       * mensagens desses grupos em tempo real.
       * 
       * ANALOGIA: É como se inscrever automaticamente
       * nos canais de TV que você tem acesso.
       */
      await this.joinUserGroups(client, userId);

      /**
       * 📨 ENVIAR MENSAGENS PENDENTES
       * 
       * 📚 CONCEITO:
       * Se houver mensagens que foram enviadas enquanto
       * o usuário estava offline, enviamos elas agora.
       * 
       * É como entregar a correspondência que chegou
       * enquanto você estava viajando.
       */
      await this.sendPendingMessages(client, userId);

    } catch (error) {
      this.logger.error(`Erro na conexão: ${error.message}`);
      // 🚫 Se deu erro, desconecta para evitar problemas
      client.disconnect();
    }
  }

  /**
   * 🔌 GERENCIA DESCONEXÃO DE CLIENTE
   * 
   * 📚 CONCEITO - Disconnection Handler:
   * Este método é executado automaticamente quando
   * um cliente se desconecta (fecha navegador, sai da página, etc.).
   * 
   * ANALOGIA: É como o "check-out" do hotel, quando
   * a pessoa avisa que está saindo.
   * 
   * 🔧 PROCESSO DE DESCONEXÃO:
   * 1. Usuário fecha aplicação/página
   * 2. Conexão WebSocket é encerrada
   * 3. Este método é executado automaticamente
   * 4. Removemos usuário da lista de online
   * 5. Notificamos outros usuários
   * 6. Limpamos recursos
   * 
   * @param client - Socket do cliente que se desconectou
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId;
      
      if (userId) {
        this.logger.log(`👤 Usuário ${userId} desconectado do WebSocket`);

        /**
         * 👥 REMOVER DA LISTA DE USUÁRIOS ONLINE
         * 
         * 📚 CONCEITO:
         * Tiramos o usuário da lista de pessoas online.
         * É como "apagar a luz verde" ao lado do nome.
         */
        this.onlineUsersService.removeUser(userId);

        /**
         * 📢 NOTIFICAR STATUS OFFLINE PARA TODOS
         * 
         * 📚 CONCEITO:
         * Avisamos todos os outros usuários que esta
         * pessoa ficou offline.
         * 
         * É como anunciar: "Fulano saiu do chat."
         */
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
   * 💬 ENVIAR MENSAGEM EM TEMPO REAL
   * 
   * 📚 CONCEITO - Event Handler:
   * Este método é executado quando o cliente envia
   * o evento 'sendMessage'. É o coração do sistema de chat.
   * 
   * ANALOGIA: É como um "operador de telefone" que
   * recebe sua ligação e conecta com a pessoa certa.
   * 
   * 🔧 PROCESSO DE ENVIO DE MENSAGEM:
   * 1. Usuário digita mensagem e clica "enviar"
   * 2. Frontend emite evento 'sendMessage'
   * 3. Este método recebe e processa a mensagem
   * 4. Salva a mensagem no sistema (persistência)
   * 5. Envia em tempo real para os destinatários
   * 6. Confirma entrega para o remetente
   * 
   * @param client - Socket de quem está enviando a mensagem
   * @param data - Dados da mensagem (conteúdo, destinatário, etc.)
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,      // 🔗 Quem está enviando
    @MessageBody() data: RealtimeMessageDto, // 📩 Dados da mensagem
  ) {
    try {
      /**
       * 👤 IDENTIFICAR O REMETENTE
       * 
       * 📚 CONCEITO:
       * Pegamos o ID do usuário do socket autenticado.
       * NUNCA confiamos no que o cliente nos diz sobre
       * quem ele é - sempre validamos.
       */
      const senderId = client.data.userId;
      
      if (!senderId) {
        throw new Error('Usuário não autenticado');
      }

      this.logger.log(`💬 Mensagem em tempo real de ${senderId} para ${data.targetId}`);

      /**
       * 💾 PERSISTIR MENSAGEM NO SISTEMA
       * 
       * 📚 CONCEITO - Data Persistence:
       * Antes de enviar em tempo real, salvamos a mensagem
       * no sistema de persistência (CSV neste caso).
       * 
       * É como "protocolar" a mensagem para ter registro
       * permanente, mesmo se alguém ficar offline.
       */
      const savedMessage = await this.chatRepository.send({
        senderId,
        targetId: data.targetId,
        content: data.content,
        chatType: data.chatType,
      });

      /**
       * 📦 PREPARAR DADOS PARA TEMPO REAL
       * 
       * 📚 CONCEITO:
       * Organizamos os dados da mensagem no formato
       * que será enviado via WebSocket para os clientes.
       * 
       * Incluímos informações extras como timestamp
       * e tempId para sincronização no frontend.
       */
      const messageData = {
        messageId: savedMessage.id,       // 🆔 ID único da mensagem salva
        senderId,                         // 👤 Quem enviou
        targetId: data.targetId,          // 🎯 Para quem/qual grupo
        content: data.content,            // 📝 Conteúdo da mensagem
        chatType: data.chatType,          // 🏷️ Tipo: 'private' ou 'group'
        timestamp: new Date(),            // ⏰ Momento do envio
        tempId: data.tempId,              // 🔄 ID temporário para sincronização
      };

      /**
       * 🎯 ROTEAMENTO INTELIGENTE DA MENSAGEM
       * 
       * 📚 CONCEITO - Message Routing:
       * Dependendo do tipo de chat, enviamos a mensagem
       * para destinatários diferentes:
       * 
       * CHAT PRIVADO: apenas para o usuário específico
       * CHAT GRUPO: para todos os membros do grupo
       */
      if (data.chatType === 'private') {
        /**
         * 👥 CHAT PRIVADO (1-para-1)
         * 
         * 📚 CONCEITO:
         * Enviamos a mensagem apenas para o usuário
         * específico mencionado em targetId.
         * 
         * É como entregar uma carta diretamente
         * na caixa de correio de uma pessoa.
         */
        this.sendToUser(data.targetId, 'newMessage', messageData);
      } else if (data.chatType === 'group') {
        /**
         * 👥 CHAT EM GRUPO (1-para-muitos)
         * 
         * 📚 CONCEITO - Room Broadcasting:
         * Enviamos a mensagem para todos que estão
         * na "sala" (room) do grupo específico.
         * 
         * É como falar no microfone de uma sala
         * onde todos os presentes escutam.
         */
        this.server.to(`group_${data.targetId}`).emit('newMessage', messageData);
      }

      /**
       * ✅ CONFIRMAR ENTREGA PARA O REMETENTE
       * 
       * 📚 CONCEITO - Delivery Confirmation:
       * Enviamos uma confirmação para quem enviou a mensagem,
       * informando que ela foi processada e entregue.
       * 
       * É como o "visto" ou "tick duplo" do WhatsApp.
       * Permite ao frontend atualizar o status da mensagem.
       */
      client.emit('messageDelivered', {
        messageId: savedMessage.id,  // 🆔 ID da mensagem salva
        tempId: data.tempId,         // 🔄 ID temporário para matching
        timestamp: new Date(),       // ⏰ Momento da confirmação
      });

    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      
      /**
       * ❌ NOTIFICAR ERRO PARA O CLIENTE
       * 
       * 📚 CONCEITO - Error Handling:
       * Se algo der errado, informamos o cliente
       * sobre o erro para que ele possa tomar ação
       * (tentar novamente, mostrar erro, etc.).
       */
      client.emit('messageError', {
        error: error.message,
        tempId: data.tempId,  // Para o frontend saber qual mensagem falhou
      });
    }
  }

  /**
   * 🏠 ENTRAR EM SALA DE GRUPO
   * 
   * 📚 CONCEITO - Room Management:
   * Permite que um usuário entre numa "sala" específica
   * para receber mensagens de um grupo em tempo real.
   * 
   * ANALOGIA: É como entrar numa sala de reunião.
   * Só quem está na sala escuta o que é falado lá.
   * 
   * 🔧 PROCESSO:
   * 1. Cliente solicita entrar em um grupo
   * 2. Verificamos se ele é membro do grupo
   * 3. Se sim, adicionamos à sala
   * 4. A partir daí, ele recebe mensagens do grupo
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

      /**
       * 🔐 VERIFICAÇÃO DE PERMISSÃO
       * 
       * 📚 CONCEITO - Authorization:
       * Verificamos se o usuário realmente é membro
       * do grupo antes de permitir entrada na sala.
       * 
       * É como verificar se você tem convite
       * antes de entrar numa festa privada.
       */
      const isMember = await this.verifyGroupMembership(userId, data.groupId);
      
      if (!isMember) {
        throw new Error('Usuário não é membro do grupo');
      }

      /**
       * 🏠 ENTRAR NA SALA DO GRUPO
       * 
       * 📚 CONCEITO - Socket.IO Rooms:
       * Adicionamos o socket à sala específica do grupo.
       * A partir de agora, mensagens enviadas para esta
       * sala chegam automaticamente neste cliente.
       */
      await client.join(`group_${data.groupId}`);
      
      this.logger.log(`👤 Usuário ${userId} entrou na sala do grupo ${data.groupId}`);

      /**
       * ✅ CONFIRMAR ENTRADA NA SALA
       * 
       * 📚 CONCEITO:
       * Enviamos confirmação para o cliente de que
       * ele entrou com sucesso na sala do grupo.
       */
      client.emit('roomJoined', {
        groupId: data.groupId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Erro ao entrar na sala: ${error.message}`);
      
      /**
       * ❌ NOTIFICAR ERRO
       * 
       * Se não conseguiu entrar na sala (sem permissão,
       * grupo não existe, etc.), informa o erro.
       */
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
