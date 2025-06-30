import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { GroupRepository } from '../group/group.repository';
import { UsersModule } from '../users/users.module';
import { BansModule } from '../bans/bans.module';

@Module({
  imports: [UsersModule, BansModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, GroupRepository],
})
export class ChatModule {}
