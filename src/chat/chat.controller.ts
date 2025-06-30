import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  BadRequestException,
  ParseUUIDPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ChatRepository } from './chat.repository';
import { GroupRepository } from '../group/group.repository';
import { MessageDto, SendMessageDto } from './dto/create-message';
import { BanService } from '../bans/ban.service';

// Validação de tipos de arquivo permitidos
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const maxFileSize = 5 * 1024 * 1024; // 5MB

const multerErrorHandler = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Tipo de arquivo não permitido'), false);
  }
};

const multerLimitsHandler = {
  fileSize: maxFileSize,
  files: 1,
};

const handleFileSizeError = (err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB');
  }
  next(err);
};

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly groupRepo: GroupRepository,
    private readonly banService: BanService,
  ) {}

  @Get('private/:userId')
  @ApiOperation({ summary: 'Obter mensagens de chat privado' })
  @ApiParam({ name: 'userId', description: 'ID do usuário (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Mensagens do chat privado' })
  async getPrivateMessages(@Request() req, @Param('userId', ParseUUIDPipe) otherId: string) {
    return this.chatRepo.findPrivateChat(req.user.id, otherId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Obter mensagens de chat em grupo' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Mensagens do chat em grupo' })
  async getGroupMessages(@Request() req, @Param('groupId', ParseUUIDPipe) otherId: string) {
    return this.chatRepo.findGroupChat(otherId);
  }

  @Post('private/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar mensagem privada' })
  @ApiParam({ name: 'userId', description: 'ID do usuário destinatário (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendoPrivate(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { content }: MessageDto,
  ) {
    const id: string = req.user.id;
    
    // Verificar se o usuário está banido
    await this.banService.validateUserAccess(id);
    
    const chat = await this.chatRepo.send({
      chatType: 'private',
      content: content,
      senderId: id,
      targetId: userId,
    });
    
    return {
      message: 'Mensagem enviada',
      data: chat
    };
  }

  @Post('group/:groupId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar mensagem para grupo' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendoGroup(
    @Request() req,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() { content }: MessageDto,
  ) {
    const id: string = req.user.id;
    
    // Verificar se o usuário está banido globalmente ou no grupo
    await this.banService.validateUserAccess(id, groupId);
    
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
      content: content,
      senderId: id,
      targetId: groupId,
    });
    
    return {
      message: 'Mensagem enviada',
      data: {
        ...chat,
        groupId: groupId
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