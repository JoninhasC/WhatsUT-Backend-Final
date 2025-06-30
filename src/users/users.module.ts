import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './csv-user.repository';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { BanRepository } from '../bans/ban.repository';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [UsersService, UserRepository, BanRepository],
  exports: [UsersService, UserRepository],
  controllers: [UsersController],
})
export class UsersModule {}
