import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsBoolean,
  IsIn,
  MaxLength,
  Matches 
} from 'class-validator';

export class RealtimeMessageDto {
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do remetente (UUID válido)',
  })
  @IsNotEmpty({ message: 'ID do remetente é obrigatório' })
  @IsString({ message: 'ID do remetente deve ser uma string' })
  @IsUUID(4, { message: 'ID do remetente deve ser um UUID válido' })
  senderId: string;

  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do destinatário (UUID válido)',
  })
  @IsNotEmpty({ message: 'ID do destinatário é obrigatório' })
  @IsString({ message: 'ID do destinatário deve ser uma string' })
  @IsUUID(4, { message: 'ID do destinatário deve ser um UUID válido' })
  receiverId: string;

  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do alvo (usuário ou grupo) (UUID válido)',
  })
  @IsNotEmpty({ message: 'ID do alvo é obrigatório' })
  @IsString({ message: 'ID do alvo deve ser uma string' })
  @IsUUID(4, { message: 'ID do alvo deve ser um UUID válido' })
  targetId: string;

  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Conteúdo da mensagem (máximo 1000 caracteres, sem XSS)',
  })
  @IsNotEmpty({ message: 'Conteúdo da mensagem é obrigatório' })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Matches(/^[^<>'"]*$/, { message: 'Mensagem não pode conter caracteres especiais como <, >, \', "' })
  message: string;

  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Conteúdo da mensagem (alternativo)',
  })
  @IsNotEmpty({ message: 'Conteúdo da mensagem é obrigatório' })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Matches(/^[^<>'"]*$/, { message: 'Mensagem não pode conter caracteres especiais como <, >, \', "' })
  content: string;

  @ApiProperty({
    example: 'private',
    description: 'Tipo do chat: private ou group',
    enum: ['private', 'group'],
  })
  @IsNotEmpty({ message: 'Tipo do chat é obrigatório' })
  @IsString({ message: 'Tipo do chat deve ser uma string' })
  @IsIn(['private', 'group'], { message: 'Tipo do chat deve ser "private" ou "group"' })
  chatType: 'private' | 'group';

  @ApiProperty({
    example: 'temp_123456789',
    description: 'ID temporário para matching no frontend',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ID temporário deve ser uma string' })
  @MaxLength(100, { message: 'ID temporário deve ter no máximo 100 caracteres' })
  tempId?: string;

  @ApiProperty({
    example: false,
    description: 'Indica se a mensagem é um arquivo',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isFile deve ser um valor booleano' })
  isFile?: boolean;

  @ApiProperty({
    example: 'text/plain',
    description: 'Tipo MIME do arquivo (quando aplicável)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tipo MIME deve ser uma string' })
  @Matches(/^[a-zA-Z0-9\-\/\.]+$/, { message: 'Tipo MIME deve ter formato válido' })
  mimeType?: string;
}