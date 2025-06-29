import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { GroupRepository } from '../group/group.repository';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, GroupRepository],
})
export class ChatModule {}
