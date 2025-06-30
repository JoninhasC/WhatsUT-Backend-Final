import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsArray, 
  ArrayNotEmpty, 
  IsUUID, 
  IsOptional, 
  IsIn,
  MinLength,
  MaxLength,
  Matches 
} from 'class-validator';
import { LastAdminRule } from '../entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Jogo do bicho',
    description: 'Nome do grupo (3-50 caracteres, sem XSS)',
  })
  @IsNotEmpty({ message: 'Nome do grupo é obrigatório' })
  @IsString({ message: 'Nome do grupo deve ser uma string' })
  @MinLength(3, { message: 'Nome do grupo deve ter pelo menos 3 caracteres' })
  @MaxLength(50, { message: 'Nome do grupo deve ter no máximo 50 caracteres' })
  @Matches(/^[a-zA-Z0-9\sÀ-ÿ]+$/, { 
    message: 'Nome do grupo deve conter apenas letras, números, espaços e caracteres acentuados. Caracteres especiais como <, >, ", \' não são permitidos' 
  })
  name: string;

  @ApiProperty({
    example: ['bb145801-dd77-4e34-bdea-bee5dd790f3e'],
    description: 'Lista de IDs dos administradores (UUIDs válidos) - opcional, usuário criador será adicionado automaticamente',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Lista de administradores deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID de administrador deve ser um UUID válido' })
  adminsId?: string[];

  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',
      '6ee878d0-e36c-4596-a249-46f2cd948146',
    ],
    description: 'Lista de IDs dos membros (UUIDs válidos) - opcional, usuário criador será adicionado automaticamente',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Lista de membros deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID de membro deve ser um UUID válido' })
  members?: string[];

  @ApiProperty({
    description: "Regra para quando o último admin sair: 'promote' ou 'delete'",
    example: 'promote',
    required: false,
    enum: ['promote', 'delete'],
  })
  @IsOptional()
  @IsString({ message: 'Regra do último admin deve ser uma string' })
  @IsIn(['promote', 'delete'], { message: 'Regra do último admin deve ser "promote" ou "delete"' })
  lastAdminRule?: LastAdminRule;
}