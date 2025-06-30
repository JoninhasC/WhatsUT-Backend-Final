import { Injectable, ForbiddenException } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { BanService } from '../bans/ban.service';

@Injectable()
export class ChatService {
  constructor(private readonly banService: BanService) {}

  async create(createChatDto: CreateChatDto) {
    // Verificar se o usuário está banido
    await this.banService.validateUserAccess(
      createChatDto.senderId, 
      createChatDto.targetId // Para chats de grupo
    );
    
    return 'This action adds a new chat';
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
