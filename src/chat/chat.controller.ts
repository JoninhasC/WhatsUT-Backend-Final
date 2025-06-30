/**
 * 🌐 CHAT CONTROLLER - ENDPOINTS HTTP PARA MENSAGENS NO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Este é um Controller NestJS que define as rotas HTTP para funcionalidades de chat.
 * É a "portinha de entrada" que recebe requisições do frontend e coordena
 * as operações relacionadas a mensagens.
 * 
 * ANALOGIA SIMPLES:
 * Se o Service é o "chef que cozinha", o Controller é o "garçom" que:
 * - Recebe pedidos dos clientes (requisições HTTP)
 * - Valida se o pedido está correto
 * - Passa para o chef (Service) preparar
 * - Entrega a resposta de volta ao cliente
 * 
 * 🎯 RESPONSABILIDADES DESTE CONTROLLER:
 * - Receber requisições HTTP para chat (GET, POST)
 * - Validar autenticação (JWT Guard)
 * - Validar permissões e banimentos
 * - Coordenar envio de mensagens
 * - Gerenciar upload de arquivos
 * - Retornar respostas formatadas
 * 
 * 🔧 ROTAS PRINCIPAIS:
 * - GET /chat/private/:userId - Buscar mensagens de chat privado
 * - POST /chat/private/:userId - Enviar mensagem privada
 * - GET /chat/group/:groupId - Buscar mensagens de grupo
 * - POST /chat/group/:groupId - Enviar mensagem para grupo
 * - POST /chat/private/:userId/file - Enviar arquivo em chat privado
 * - POST /chat/group/:groupId/file - Enviar arquivo em grupo
 */

// 📦 IMPORTAÇÕES DO NESTJS (FRAMEWORK)
import {
  Controller,           // 🌐 Decorator que marca esta classe como um controller
  Get,                 // 🔍 Decorator para rotas HTTP GET
  Post,                // 📤 Decorator para rotas HTTP POST
  Body,                // 📩 Decorator para extrair dados do corpo da requisição
  Param,               // 🎯 Decorator para extrair parâmetros da URL
  UseGuards,           // 🔐 Decorator para aplicar guards (autenticação)
  Request,             // 📨 Decorator para acessar objeto de requisição completo
  UseInterceptors,     // 🎛️ Decorator para aplicar interceptors (upload de arquivo)
  UploadedFile,        // 📁 Decorator para acessar arquivo enviado
  HttpStatus,          // 📊 Códigos de status HTTP (200, 201, 400, etc.)
  HttpCode,            // 📊 Decorator para definir código de status de resposta
  BadRequestException, // ❌ Exception para requisições malformadas (400)
  ParseUUIDPipe,       // 🔍 Pipe para validar e converter UUIDs
  ForbiddenException,  // 🚫 Exception para acesso negado (403)
  NotFoundException,   // 🔍 Exception para recursos não encontrados (404)
} from '@nestjs/common';

// 📦 IMPORTAÇÕES PARA UPLOAD DE ARQUIVOS
import { FileInterceptor } from '@nestjs/platform-express'; // 📁 Interceptor para upload
import { diskStorage } from 'multer';                       // 💾 Armazenamento em disco
import { extname } from 'path';                            // 🔧 Utilitário para extensões de arquivo

// 📦 IMPORTAÇÕES INTERNAS DO PROJETO
import { JwtAuthGuard } from '../auth/jwt-auth.guard';      // 🔐 Guard de autenticação JWT
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger'; // 📚 Documentação automática
import { ChatRepository } from './chat.repository';         // 💾 Repository para persistência de mensagens
import { GroupRepository } from '../group/group.repository'; // 💾 Repository para dados de grupos
import { MessageDto, SendMessageDto } from './dto/create-message'; // 📋 DTOs para validação de dados
import { BanService } from '../bans/ban.service';          // 🚫 Service para verificar banimentos

/**
 * 📁 CONFIGURAÇÃO DE UPLOAD DE ARQUIVOS
 * 
 * 📚 CONCEITO - File Upload Security:
 * Definimos regras rigorosas sobre que tipos de arquivo
 * podem ser enviados para evitar problemas de segurança.
 * 
 * ⚠️ SEGURANÇA É FUNDAMENTAL:
 * Sem essas validações, usuários maliciosos poderiam
 * enviar vírus, scripts maliciosos ou arquivos gigantes
 * que poderiam quebrar o servidor.
 */

// 🎯 TIPOS DE ARQUIVO PERMITIDOS
// Lista de MIME types (identificadores de tipo de arquivo) aceitos
const allowedMimeTypes = [
  'image/jpeg',        // 🖼️ Imagens JPEG (.jpg, .jpeg)
  'image/png',         // 🖼️ Imagens PNG (.png)
  'image/gif',         // 🖼️ Imagens GIF (.gif)
  'image/webp',        // 🖼️ Imagens WebP (.webp)
  'application/pdf',   // 📄 Documentos PDF (.pdf)
  'text/plain',        // 📝 Arquivos de texto (.txt)
  'application/msword', // 📄 Documentos Word antigos (.doc)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // 📄 Documentos Word novos (.docx)
];

// 📏 TAMANHO MÁXIMO DE ARQUIVO
// 5MB = 5 * 1024 * 1024 bytes
const maxFileSize = 5 * 1024 * 1024;

/**
 * 🔍 VALIDADOR DE TIPO DE ARQUIVO
 * 
 * 📚 CONCEITO - Multer File Filter:
 * Função que decide se um arquivo deve ser aceito ou rejeitado
 * baseado no seu tipo MIME.
 * 
 * @param req - Requisição HTTP
 * @param file - Arquivo sendo enviado
 * @param cb - Callback para aceitar/rejeitar o arquivo
 */
const multerErrorHandler = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    // ✅ Tipo de arquivo permitido
    cb(null, true);
  } else {
    // ❌ Tipo de arquivo não permitido
    cb(new BadRequestException('Tipo de arquivo não permitido'), false);
  }
};

/**
 * 📏 CONFIGURAÇÃO DE LIMITES
 * 
 * 📚 CONCEITO:
 * Define restrições sobre o upload para proteger o servidor
 * de ataques ou uso excessivo de recursos.
 */
const multerLimitsHandler = {
  fileSize: maxFileSize,  // 📏 Máximo 5MB por arquivo
  files: 1,              // 📁 Apenas 1 arquivo por vez
};

/**
 * 🚨 HANDLER DE ERRO DE TAMANHO DE ARQUIVO
 * 
 * 📚 CONCEITO:
 * Intercepta erros de arquivo muito grande e converte
 * em uma mensagem de erro amigável para o usuário.
 */
const handleFileSizeError = (err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB');
  }
  next(err);
};

/**
 * 🏗️ DECORATORS DE CONFIGURAÇÃO DO CONTROLLER
 * 
 * 📚 CONCEITO - NestJS Decorators:
 * Estes decorators configuram como o controller funciona:
 * - @ApiTags: Agrupa rotas na documentação Swagger
 * - @Controller: Define o prefixo da rota (/chat)
 * - @ApiBearerAuth: Indica que precisa de token JWT
 * - @UseGuards: Aplica guard de autenticação em todas as rotas
 */
@ApiTags('Chat')                    // 📚 Grupo na documentação: "Chat"
@Controller('chat')                 // 🌐 Prefixo de todas as rotas: /chat
@ApiBearerAuth()                   // 🔐 Documenta que precisa de Bearer Token
@UseGuards(JwtAuthGuard)           // 🛡️ Todas as rotas protegidas por JWT
export class ChatController {
  
  /**
   * 🏗️ CONSTRUTOR COM INJEÇÃO DE DEPENDÊNCIAS
   * 
   * 📚 CONCEITO - Dependency Injection:
   * O NestJS automaticamente fornece as instâncias dos
   * repositórios e services que precisamos.
   * 
   * É como ter "assistentes especialistas" disponíveis:
   * - chatRepo: Especialista em salvar/buscar mensagens
   * - groupRepo: Especialista em dados de grupos
   * - banService: Especialista em verificar banimentos
   */
  constructor(
    private readonly chatRepo: ChatRepository,      // 💾 Repository de mensagens
    private readonly groupRepo: GroupRepository,    // 💾 Repository de grupos
    private readonly banService: BanService,        // 🚫 Service de banimentos
  ) {}

  /**
   * 🔍 ENDPOINT: BUSCAR MENSAGENS DE CHAT PRIVADO
   * 
   * 📚 CONCEITO - GET Endpoint:
   * Permite buscar o histórico de mensagens entre dois usuários.
   * É como "abrir um livro de conversas" entre duas pessoas.
   * 
   * 🌐 ROTA: GET /chat/private/:userId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * EXEMPLO DE USO:
   * GET /chat/private/bb145801-dd77-4e34-bdea-bee5dd790f3e
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * @param req - Objeto de requisição (contém dados do usuário logado)
   * @param otherId - ID do outro usuário na conversa
   * @returns Lista de mensagens entre os dois usuários
   */
  @Get('private/:userId')
  @ApiOperation({ summary: 'Obter mensagens de chat privado' })
  @ApiParam({ 
    name: 'userId', 
    description: 'ID do usuário (UUID)', 
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' 
  })
  @ApiResponse({ status: 200, description: 'Mensagens do chat privado' })
  async getPrivateMessages(
    @Request() req,                             // 📨 Acesso ao objeto de requisição completo
    @Param('userId', ParseUUIDPipe) otherId: string // 🎯 ID do outro usuário (validado como UUID)
  ) {
    // 🔍 Busca conversa entre o usuário logado (req.user.id) e o outro usuário
    return this.chatRepo.findPrivateChat(req.user.id, otherId);
  }

  /**
   * 👥 ENDPOINT: BUSCAR MENSAGENS DE GRUPO
   * 
   * 📚 CONCEITO:
   * Permite buscar todas as mensagens de um grupo específico.
   * É como "entrar numa sala de conversa" e ver o histórico.
   * 
   * 🌐 ROTA: GET /chat/group/:groupId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * @param req - Objeto de requisição
   * @param groupId - ID do grupo
   * @returns Lista de mensagens do grupo
   */
  @Get('group/:groupId')
  @ApiOperation({ summary: 'Obter mensagens de chat em grupo' })
  @ApiParam({ 
    name: 'groupId', 
    description: 'ID do grupo (UUID)', 
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' 
  })
  @ApiResponse({ status: 200, description: 'Mensagens do chat em grupo' })
  async getGroupMessages(
    @Request() req, 
    @Param('groupId', ParseUUIDPipe) groupId: string
  ) {
    // 🔍 Busca todas as mensagens do grupo
    return this.chatRepo.findGroupChat(groupId);
  }

  /**
   * 📤 ENDPOINT: ENVIAR MENSAGEM PRIVADA
   * 
   * 📚 CONCEITO - POST Endpoint:
   * Permite enviar uma nova mensagem para outro usuário.
   * É como "escrever uma carta" e entregá-la diretamente.
   * 
   * 🌐 ROTA: POST /chat/private/:userId
   * 📊 STATUS: 201 Created (recurso criado com sucesso)
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * EXEMPLO DE USO:
   * POST /chat/private/bb145801-dd77-4e34-bdea-bee5dd790f3e
   * Content-Type: application/json
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Body:
   * {
   *   "content": "Olá! Como você está?"
   * }
   * 
   * @param req - Objeto de requisição (contém usuário logado)
   * @param userId - ID do destinatário da mensagem
   * @param content - Conteúdo da mensagem (extraído do DTO)
   * @returns Confirmação de envio e dados da mensagem
   */
  @Post('private/:userId')
  @HttpCode(HttpStatus.CREATED)                // 📊 Retorna status 201 (Created)
  @ApiOperation({ summary: 'Enviar mensagem privada' })
  @ApiParam({ 
    name: 'userId', 
    description: 'ID do usuário destinatário (UUID)', 
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' 
  })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendoPrivate(
    @Request() req,                             // 📨 Requisição (usuário logado em req.user)
    @Param('userId', ParseUUIDPipe) userId: string, // 🎯 ID do destinatário
    @Body() { content }: MessageDto,            // 📩 Conteúdo da mensagem do body
  ) {
    const id: string = req.user.id;            // 👤 ID do remetente (usuário logado)
    
    /**
     * 🚫 VERIFICAÇÃO DE BANIMENTO
     * 
     * 📚 CONCEITO - Security Check:
     * Antes de permitir envio de mensagem, verificamos
     * se o usuário não está banido do sistema.
     * 
     * É como verificar se a pessoa não está na "lista negra"
     * antes de deixá-la enviar mensagens.
     */
    await this.banService.validateUserAccess(id);
    
    /**
     * 💾 PERSISTIR A MENSAGEM
     * 
     * 📚 CONCEITO:
     * Usamos o Repository para salvar a mensagem no sistema.
     * O Repository cuida de todos os detalhes de persistência
     * (salvar em CSV, gerar ID, etc.).
     */
    const chat = await this.chatRepo.send({
      chatType: 'private',  // 🏷️ Tipo: conversa privada (1-para-1)
      content: content,     // 📝 Conteúdo da mensagem
      senderId: id,         // 👤 Quem está enviando
      targetId: userId,     // 🎯 Para quem está enviando
    });
    
    /**
     * ✅ RESPOSTA DE SUCESSO
     * 
     * 📚 CONCEITO - API Response Format:
     * Retornamos uma resposta estruturada com:
     * - message: Confirmação amigável para o usuário
     * - data: Dados da mensagem criada
     */
    return {
      message: 'Mensagem enviada',
      data: chat
    };
  }

  /**
   * 👥 ENDPOINT: ENVIAR MENSAGEM PARA GRUPO
   * 
   * 📚 CONCEITO:
   * Permite enviar mensagem para um grupo de usuários.
   * É como "falar no microfone" numa sala onde várias
   * pessoas estão ouvindo.
   * 
   * 🌐 ROTA: POST /chat/group/:groupId
   * 📊 STATUS: 201 Created
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * ⚠️ VALIDAÇÕES EXTRAS:
   * - Usuário não pode estar banido
   * - Grupo deve existir
   * - Usuário deve ser membro do grupo
   * 
   * @param req - Objeto de requisição
   * @param groupId - ID do grupo destinatário
   * @param content - Conteúdo da mensagem
   * @returns Confirmação de envio e dados da mensagem
   */
  @Post('group/:groupId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar mensagem para grupo' })
  @ApiParam({ 
    name: 'groupId', 
    description: 'ID do grupo (UUID)', 
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' 
  })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendoGroup(
    @Request() req,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() { content }: MessageDto,
  ) {
    const id: string = req.user.id;
    
    /**
     * 🚫 VERIFICAÇÃO DE BANIMENTO (DUPLA)
     * 
     * 📚 CONCEITO - Multi-level Security:
     * Verificamos banimento em dois níveis:
     * 1. Banimento global (de todo o sistema)
     * 2. Banimento específico do grupo
     * 
     * É como verificar se a pessoa pode entrar no
     * shopping E na loja específica.
     */
    await this.banService.validateUserAccess(id, groupId);
    
    /**
     * 🔍 VERIFICAR SE O GRUPO EXISTE
     * 
     * 📚 CONCEITO - Resource Validation:
     * Antes de enviar mensagem, confirmamos que
     * o grupo realmente existe no sistema.
     */
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    /**
     * 👥 VERIFICAR MEMBERSHIP DO GRUPO
     * 
     * 📚 CONCEITO - Authorization:
     * Verificamos se o usuário é realmente membro
     * do grupo antes de permitir envio de mensagem.
     * 
     * É como verificar se você tem "carteirinha"
     * do clube antes de usar as instalações.
     */
    if (!group.members?.includes(id)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }
    
    /**
     * 💾 SALVAR MENSAGEM DO GRUPO
     * 
     * 📚 CONCEITO:
     * Após todas as validações, salvamos a mensagem
     * com tipo 'group' para diferenciá-la de chats privados.
     */
    const chat = await this.chatRepo.send({
      chatType: 'group',    // 🏷️ Tipo: mensagem de grupo
      content: content,     // 📝 Conteúdo
      senderId: id,         // 👤 Remetente
      targetId: groupId,    // 👥 Grupo destinatário
    });
    
    /**
     * ✅ RESPOSTA COM INFORMAÇÃO EXTRA
     * 
     * 📚 CONCEITO:
     * Para mensagens de grupo, incluímos o groupId
     * na resposta para facilitar o frontend.
     */
    return {
      message: 'Mensagem enviada',
      data: {
        ...chat,              // 📧 Todos os dados da mensagem
        groupId: groupId      // 👥 ID do grupo (informação extra)
      }
    };
  }
  @Post('private/:userId/file')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar arquivo em chat privado' })
  @ApiParam({ name: 'userId', description: 'ID do usuário destinatário (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado (max 5MB, tipos permitidos: imagens, PDF, documentos)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validar tipo de arquivo
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedMimeTypes.join(', ')}`), false);
        }
        
        // Validar nome do arquivo
        if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
          return cb(new BadRequestException('Nome do arquivo contém caracteres não permitidos'), false);
        }
        
        cb(null, true);
      },
      limits: {
        fileSize: maxFileSize,
      },
    }),
  )
  async sendPrivateFile(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }
    
    const id: string = req.user.id;
    const chat = await this.chatRepo.send({
      chatType: 'private',
      content: file.path, // Salva o caminho do arquivo como conteúdo da mensagem
      senderId: id,
      targetId: userId,
      isArquivo: true,
    });
    
    return {
      message: 'Arquivo enviado com sucesso',
      data: {
        ...chat,
        type: 'file',
        fileName: file.originalname
      }
    };
  }

  @Post('group/:groupId/file')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar arquivo em chat de grupo' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado (max 5MB, tipos permitidos: imagens, PDF, documentos)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validar tipo de arquivo
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedMimeTypes.join(', ')}`), false);
        }
        
        // Validar nome do arquivo
        if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
          return cb(new BadRequestException('Nome do arquivo contém caracteres não permitidos'), false);
        }
        
        cb(null, true);
      },
      limits: {
        fileSize: maxFileSize,
      },
    }),
  )
  async sendGroupFile(
    @Request() req,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }
    
    const id: string = req.user.id;
    
    // Verificar se o grupo existe
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    // Verificar se o usuário é membro do grupo
    if (!group.members?.includes(id)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }
    
    const chat = await this.chatRepo.send({
      chatType: 'group',
      content: file.path, // Salva o caminho do arquivo como conteúdo da mensagem
      senderId: id,
      targetId: groupId,
      isArquivo: true,
    });
    
    return {
      message: 'Arquivo enviado com sucesso',
      data: {
        ...chat,
        type: 'file',
        fileName: file.originalname,
        groupId: groupId
      }
    };
  }

  // Rota compatível para /chat/send
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar mensagem genérica' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendGeneric(
    @Request() req,
    @Body() messageData: SendMessageDto,
  ) {
    const id: string = req.user.id;
    
    // Determinar groupId baseado nos dados
    const groupId = messageData.groupId || (messageData.chatType === 'group' ? messageData.targetId : undefined);
    
    // Verificar se o usuário está banido
    await this.banService.validateUserAccess(id, groupId);
    
    // Determinar tipo de mensagem baseado nos dados
    if (groupId || messageData.chatType === 'group') {
      // Mensagem para grupo
      const targetGroupId = groupId || messageData.targetId;
      if (!targetGroupId) {
        throw new BadRequestException('ID do grupo é obrigatório');
      }
      
      const group = await this.groupRepo.findById(targetGroupId);
      if (!group) {
        throw new NotFoundException('Grupo não encontrado');
      }
      
      if (!group.members?.includes(id)) {
        throw new ForbiddenException('Usuário não é membro deste grupo');
      }
      
      const chat = await this.chatRepo.send({
        chatType: 'group',
        content: messageData.content,
        senderId: id,
        targetId: targetGroupId,
      });
      
      return {
        message: 'Mensagem enviada',
        data: chat
      };
    } else if (messageData.targetId || messageData.receiverId) {
      // Mensagem privada
      const targetId = messageData.targetId || messageData.receiverId;
      if (!targetId) {
        throw new BadRequestException('ID do destinatário é obrigatório');
      }
      
      const chat = await this.chatRepo.send({
        chatType: 'private',
        content: messageData.content,
        senderId: id,
        targetId: targetId,
      });
      
      return {
        message: 'Mensagem enviada',
        data: chat
      };
    } else {
      throw new BadRequestException('Dados de mensagem inválidos');
    }
  }

  // Rotas compatíveis para upload
  @Post('upload/private/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload de arquivo para chat privado (compatibilidade)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo para upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: maxFileSize },
      fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não permitido'), false);
        }
      },
    }),
  )
  async uploadPrivateFile(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const senderId: string = req.user.id;

    const chat = await this.chatRepo.send({
      chatType: 'private',
      content: file.filename,
      senderId,
      targetId: userId,
      isArquivo: true,
    });

    return {
      message: 'Arquivo enviado com sucesso',
      data: chat,
      filename: file.filename,
    };
  }

  @Post('upload/group/:groupId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload de arquivo para grupo (compatibilidade)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo para upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: maxFileSize },
      fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não permitido'), false);
        }
      },
    }),
  )
  async uploadGroupFile(
    @Request() req,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const senderId: string = req.user.id;
    
    // Verificar se o grupo existe
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    // Verificar se o usuário é membro do grupo
    if (!group.members?.includes(senderId)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }

    const chat = await this.chatRepo.send({
      chatType: 'group',
      content: file.filename,
      senderId,
      targetId: groupId,
      isArquivo: true,
    });

    return {
      message: 'Arquivo enviado com sucesso',
      data: chat,
      filename: file.filename,
    };
  }
}

/**
 * 🎓 RESUMO EDUCACIONAL COMPLETO - CHAT CONTROLLER
 * =================================================
 * 
 * 📚 O QUE APRENDEMOS NESTE ARQUIVO:
 * 
 * 🏗️ ARQUITETURA DE CONTROLLER:
 * 1. **MVC Pattern**: Controller como camada de interface HTTP
 * 2. **Separation of Concerns**: Controller coordena, Repository persiste, Service valida
 * 3. **RESTful API**: Uso correto de verbos HTTP (GET, POST) e códigos de status
 * 4. **Route Parameters**: Como extrair dados da URL (/chat/private/:userId)
 * 5. **Request Body**: Como receber dados JSON do cliente
 * 
 * 🔐 SEGURANÇA E VALIDAÇÃO:
 * 1. **JWT Authentication**: Proteção de todas as rotas com @UseGuards(JwtAuthGuard)
 * 2. **Input Validation**: Uso de DTOs e Pipes para validar dados
 * 3. **UUID Validation**: ParseUUIDPipe garante IDs válidos
 * 4. **Authorization**: Verificação de permissões (membership, banimentos)
 * 5. **File Upload Security**: Validação rigorosa de tipos e tamanhos de arquivo
 * 
 * 📁 UPLOAD DE ARQUIVOS:
 * 1. **Multer Integration**: Como configurar upload de arquivos com NestJS
 * 2. **File Validation**: Verificação de tipo MIME e tamanho
 * 3. **Secure Storage**: Armazenamento seguro com nomes aleatórios
 * 4. **Error Handling**: Tratamento de erros específicos de upload
 * 5. **MIME Type Filtering**: Prevenção de upload de arquivos perigosos
 * 
 * 🌐 DOCUMENTAÇÃO API:
 * 1. **Swagger Integration**: Documentação automática com decorators
 * 2. **API Tags**: Organização de endpoints por funcionalidade
 * 3. **Parameter Documentation**: Descrição clara de parâmetros
 * 4. **Response Documentation**: Especificação de respostas esperadas
 * 5. **Authentication Documentation**: Documentação de requisitos de auth
 * 
 * 🚨 TRATAMENTO DE ERROS:
 * 1. **HTTP Exceptions**: Uso correto de BadRequestException, NotFoundException, etc.
 * 2. **Meaningful Messages**: Mensagens de erro claras para o usuário
 * 3. **Status Codes**: Códigos HTTP apropriados para cada situação
 * 4. **Validation Errors**: Tratamento específico para dados inválidos
 * 5. **Security Errors**: Tratamento de problemas de autorização
 * 
 * 📊 PADRÕES DE RESPOSTA:
 * 1. **Consistent Format**: Formato padronizado { message, data }
 * 2. **Success Responses**: Confirmações claras de operações
 * 3. **Error Responses**: Mensagens de erro estruturadas
 * 4. **Status Codes**: 200 para busca, 201 para criação, 4xx para erros
 * 5. **Data Enrichment**: Adição de informações úteis nas respostas
 * 
 * 🔄 FLUXO DE OPERAÇÕES:
 * 
 * **ENVIO DE MENSAGEM PRIVADA:**
 * 1. Cliente faz POST /chat/private/:userId com { content }
 * 2. JWT Guard valida autenticação
 * 3. ParseUUIDPipe valida formato do userId
 * 4. DTO valida estrutura do body
 * 5. BanService verifica se usuário não está banido
 * 6. ChatRepository persiste a mensagem
 * 7. Retorna confirmação com dados da mensagem
 * 
 * **ENVIO DE MENSAGEM DE GRUPO:**
 * 1. Cliente faz POST /chat/group/:groupId com { content }
 * 2. Autenticação e validação básica
 * 3. Verificação de banimento (global + grupo)
 * 4. Verificação de existência do grupo
 * 5. Verificação de membership no grupo
 * 6. Persistência da mensagem
 * 7. Resposta com dados enriquecidos
 * 
 * **UPLOAD DE ARQUIVO:**
 * 1. Cliente faz POST multipart/form-data
 * 2. Multer intercepta e valida o arquivo
 * 3. Verificações de segurança (tipo, tamanho, nome)
 * 4. Armazenamento seguro no disco
 * 5. Persistência dos metadados
 * 6. Resposta com informações do arquivo
 * 
 * 💡 CONCEITOS IMPORTANTES:
 * 
 * **Controller vs Service vs Repository:**
 * - Controller: Interface HTTP, validação, coordenação
 * - Service: Lógica de negócio, regras específicas
 * - Repository: Persistência de dados, acesso ao storage
 * 
 * **Dependency Injection:**
 * - NestJS automaticamente fornece instâncias necessárias
 * - Facilita testes (mock dos dependencies)
 * - Promove baixo acoplamento entre componentes
 * 
 * **Decorators Pattern:**
 * - Configuração declarativa de rotas e validações
 * - Composição de funcionalidades (guards, interceptors, pipes)
 * - Metadados para documentação automática
 * 
 * 🔗 INTEGRAÇÃO COM OUTROS COMPONENTES:
 * 
 * **Frontend Integration:**
 * - APIs RESTful consumidas pelo React
 * - Autenticação via Bearer Token
 * - Upload de arquivos via FormData
 * - Tratamento de erros HTTP
 * 
 * **Backend Integration:**
 * - ChatRepository para persistência
 * - BanService para validações de segurança
 * - GroupRepository para dados de grupos
 * - JWT Strategy para autenticação
 * 
 * **Real-time Integration:**
 * - WebSocket Gateway complementa este controller
 * - HTTP para operações síncronas
 * - WebSocket para notificações em tempo real
 * 
 * 🚀 MELHORIAS POSSÍVEIS:
 * 
 * 1. **Rate Limiting**: Limitar número de mensagens por tempo
 * 2. **Message Encryption**: Criptografia end-to-end
 * 3. **File Compression**: Compressão automática de imagens
 * 4. **Virus Scanning**: Verificação de malware em uploads
 * 5. **Message Reactions**: Sistema de reações/emojis
 * 6. **Message Editing**: Permitir edição de mensagens
 * 7. **Message Threading**: Sistema de threads/respostas
 * 8. **Advanced Search**: Busca por conteúdo de mensagens
 * 9. **Message Analytics**: Estatísticas de uso
 * 10. **Auto-moderation**: Filtros automáticos de conteúdo
 * 
 * 📈 ESCALABILIDADE:
 * 
 * **Para aplicações maiores:**
 * - Implementar cache (Redis) para mensagens frequentes
 * - Usar message queues para processamento assíncrono
 * - Implementar sharding de dados por grupo/usuário
 * - Adicionar CDN para arquivos estáticos
 * - Implementar load balancing entre instâncias
 * 
 * **Monitoramento:**
 * - Logs estruturados para debugging
 * - Métricas de performance de endpoints
 * - Alertas para erros frequentes
 * - Dashboard de uso da API
 * 
 * Este controller representa um excelente exemplo de como implementar
 * APIs RESTful seguras e bem estruturadas em NestJS, seguindo as
 * melhores práticas da indústria.
 */