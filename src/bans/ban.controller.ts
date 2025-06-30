import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BanService } from './ban.service';
import { CreateBanDto, ReportUserDto } from './dto/create-ban.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportStateService } from './report-state.service';
import { BanReason, BanType } from './entities/ban.entity';

@ApiTags('Banimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bans')
export class BanController {
  constructor(
    private readonly banService: BanService,
    private readonly reportStateService: ReportStateService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Banir usuário' })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário banido com sucesso',
    example: {
      message: 'Usuário banido com sucesso',
      data: {
        id: 'ban-id-123',
        bannedUserId: 'user-id-123',
        reason: 'spam',
        bannedAt: '2025-06-29T12:00:00Z'
      }
    }
  })
  async banUser(@Body() createBanDto: CreateBanDto, @Request() req) {
    // Verificar se não é auto-banimento
    if (createBanDto.bannedUserId === req.user.id) {
      throw new BadRequestException('Usuário não pode banir a si mesmo');
    }

    // Usar valores padrão para campos opcionais
    const reason = createBanDto.reason || BanReason.ADMIN_DECISION;
    const type = createBanDto.type || BanType.GLOBAL;

    // Usar o serviço real de banimento
    const ban = await this.banService.banUser({
      ...createBanDto,
      reason,
      type
    }, req.user.id);

    return {
      message: 'Usuário banido com sucesso',
      data: ban
    };
  }

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reportar usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário reportado com sucesso',
    example: {
      message: 'Usuário reportado com sucesso. Reports: 1/3',
      autoBanned: false
    }
  })
  async reportUser(@Body() reportUserDto: ReportUserDto, @Request() req) {
    const result = await this.banService.reportUser(reportUserDto, req.user.id);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os banimentos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de banimentos',
    example: {
      message: 'Banimentos listados com sucesso',
      data: []
    }
  })
  async getAllBans(): Promise<any> {
    const bans = await this.banService.getAllBans();
    return {
      message: 'Banimentos listados com sucesso',
      data: bans,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obter banimentos de um usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Banimentos do usuário',
    example: {
      message: 'Banimentos do usuário obtidos com sucesso',
      data: []
    }
  })
  async getUserBans(@Param('userId') userId: string): Promise<any> {
    const bans = await this.banService.getUserBans(userId);
    return {
      message: 'Banimentos do usuário obtidos com sucesso',
      data: bans,
    };
  }

  @Delete(':banId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desbanir usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuário desbanido com sucesso',
    example: {
      message: 'Usuário desbanido com sucesso'
    }
  })
  async unbanUser(@Param('banId') banId: string, @Request() req) {
    const result = await this.banService.unbanUser(banId, req.user.id);
    return result;
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Verificar se usuário está banido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status de banimento do usuário',
    example: {
      message: 'Status verificado com sucesso',
      data: {
        isBanned: false,
        userId: 'user-id-123'
      }
    }
  })
  async checkUserBan(@Param('userId') userId: string) {
    const isBanned = await this.banService.isUserBanned(userId);
    return {
      message: 'Status verificado com sucesso',
      data: {
        isBanned,
        userId,
      },
    };
  }
}
