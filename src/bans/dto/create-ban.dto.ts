import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { BanReason, BanType } from '../entities/ban.entity';

export class CreateBanDto {
  @ApiProperty({
    example: 'user-id-123',
    description: 'ID do usuário a ser banido',
  })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  @IsString({ message: 'ID do usuário deve ser uma string' })
  bannedUserId: string;

  @ApiProperty({
    example: 'spam',
    description: 'Motivo do banimento',
    enum: BanReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(BanReason, { message: 'Motivo inválido' })
  reason?: BanReason;

  @ApiProperty({
    example: 'group',
    description: 'Tipo de banimento',
    enum: BanType,
    required: false,
  })
  @IsOptional()
  @IsEnum(BanType, { message: 'Tipo de banimento inválido' })
  type?: BanType;

  @ApiProperty({
    example: 'group-id-123',
    description: 'ID do grupo (obrigatório para banimento de grupo)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ID do grupo deve ser uma string' })
  groupId?: string;

  @ApiProperty({
    example: '2025-07-01T00:00:00Z',
    description: 'Data de expiração do banimento (opcional)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  expiresAt?: string;

  @ApiProperty({
    example: ['user1', 'user2'],
    description: 'IDs dos usuários que reportaram (para banimentos por múltiplas denúncias)',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Reports deve ser um array' })
  @IsString({ each: true, message: 'Cada report deve ser uma string' })
  reports?: string[];
}

export class ReportUserDto {
  @ApiProperty({
    example: 'user-id-123',
    description: 'ID do usuário a ser reportado',
  })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  @IsString({ message: 'ID do usuário deve ser uma string' })
  reportedUserId: string;

  @ApiProperty({
    example: 'spam',
    description: 'Motivo do report',
    enum: BanReason,
  })
  @IsNotEmpty({ message: 'Motivo do report é obrigatório' })
  @IsEnum(BanReason, { message: 'Motivo inválido' })
  reason: BanReason;

  @ApiProperty({
    example: 'group-id-123',
    description: 'ID do grupo (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ID do grupo deve ser uma string' })
  groupId?: string;
}
