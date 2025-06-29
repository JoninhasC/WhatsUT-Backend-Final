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
import { MessageDto } from './dto/create-message';

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

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly groupRepo: GroupRepository,
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
}