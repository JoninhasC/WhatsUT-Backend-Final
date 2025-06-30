import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BanRepository } from './ban.repository';
import { CreateBanDto, ReportUserDto } from './dto/create-ban.dto';
import { Ban, BanType, BanReason } from './entities/ban.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BanService {
  private readonly MULTIPLE_REPORTS_THRESHOLD = 3; // Número de reports para banimento automático
  private readonly reportStorage = new Map<string, string[]>(); // userId -> reporterIds

  constructor(
    private readonly banRepository: BanRepository,
    private readonly usersService: UsersService,
  ) {}

  async banUser(dto: CreateBanDto, bannedByUserId: string): Promise<Ban> {
    // Verificar se o usuário que está banindo existe
    const banningUser = await this.usersService.findById(bannedByUserId);
    if (!banningUser) {
      throw new NotFoundException('Usuário que está aplicando o banimento não encontrado');
    }

    // Verificar se o usuário a ser banido existe
    const userToBan = await this.usersService.findById(dto.bannedUserId);
    if (!userToBan) {
      throw new NotFoundException('Usuário a ser banido não encontrado');
    }

    // Não permitir auto-banimento
    if (dto.bannedUserId === bannedByUserId) {
      throw new BadRequestException('Usuário não pode banir a si mesmo');
    }

    // Verificar se já existe um banimento ativo
    const isAlreadyBanned = await this.banRepository.isUserBanned(dto.bannedUserId, dto.groupId);
    if (isAlreadyBanned) {
      throw new BadRequestException('Usuário já está banido');
    }

    // Para banimentos de grupo, verificar se o usuário é admin do grupo
    if (dto.type === BanType.GROUP && dto.groupId) {
      // Aqui você verificaria se o usuário é admin do grupo
      // Por simplicidade, assumindo que a verificação é feita no controller
    }

    return await this.banRepository.create(dto, bannedByUserId);
  }

  async reportUser(dto: ReportUserDto, reporterUserId: string): Promise<{ message: string; autoBanned?: boolean }> {
    // Verificar se o usuário reportado existe
    const reportedUser = await this.usersService.findById(dto.reportedUserId);
    if (!reportedUser) {
      throw new NotFoundException('Usuário reportado não encontrado');
    }

    // Não permitir auto-report
    if (dto.reportedUserId === reporterUserId) {
      throw new BadRequestException('Usuário não pode reportar a si mesmo');
    }

    // Adicionar report ao storage
    const reportKey = dto.groupId ? `${dto.reportedUserId}:${dto.groupId}` : dto.reportedUserId;
    const existingReports = this.reportStorage.get(reportKey) || [];
    
    // Verificar se o usuário já reportou
    if (existingReports.includes(reporterUserId)) {
      throw new BadRequestException('Usuário já foi reportado por você');
    }

    existingReports.push(reporterUserId);
    this.reportStorage.set(reportKey, existingReports);

    // Verificar se atingiu o threshold para banimento automático
    if (existingReports.length >= this.MULTIPLE_REPORTS_THRESHOLD) {
      const banDto: CreateBanDto = {
        bannedUserId: dto.reportedUserId,
        reason: BanReason.MULTIPLE_REPORTS,
        type: dto.groupId ? BanType.GROUP : BanType.GLOBAL,
        groupId: dto.groupId,
        reports: existingReports,
      };

      await this.banRepository.create(banDto, 'system');
      
      // Limpar reports após banimento
      this.reportStorage.delete(reportKey);
      
      return { 
        message: 'Usuário reportado com sucesso e banido automaticamente por múltiplas denúncias',
        autoBanned: true 
      };
    }

    return { 
      message: `Usuário reportado com sucesso. Reports: ${existingReports.length}/${this.MULTIPLE_REPORTS_THRESHOLD}` 
    };
  }

  async isUserBanned(userId: string, groupId?: string): Promise<boolean> {
    return await this.banRepository.isUserBanned(userId, groupId);
  }

  async getUserBans(userId: string): Promise<Ban[]> {
    return await this.banRepository.findByUserId(userId);
  }

  async unbanUser(banId: string, unbannedByUserId: string): Promise<{ message: string }> {
    const bans = await this.banRepository.findAll();
    const ban = bans.find(b => b.id === banId && b.isActive);
    
    if (!ban) {
      throw new NotFoundException('Banimento não encontrado ou já inativo');
    }

    await this.banRepository.deactivate(banId);
    
    return { message: 'Usuário desbanido com sucesso' };
  }

  async getAllBans(): Promise<Ban[]> {
    return await this.banRepository.findAll();
  }

  async validateUserAccess(userId: string, groupId?: string): Promise<void> {
    const isBanned = await this.isUserBanned(userId, groupId);
    if (isBanned) {
      throw new ForbiddenException('Usuário está banido e não pode realizar esta ação');
    }
  }
}
