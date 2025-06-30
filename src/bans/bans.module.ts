import { Module } from '@nestjs/common';
import { BanController } from './ban.controller';
import { BanService } from './ban.service';
import { BanRepository } from './ban.repository';
import { UsersModule } from '../users/users.module';
import { ReportStateService } from './report-state.service';

@Module({
  imports: [UsersModule],
  controllers: [BanController],
  providers: [BanService, BanRepository, ReportStateService],
  exports: [BanService, BanRepository, ReportStateService],
})
export class BansModule {}
