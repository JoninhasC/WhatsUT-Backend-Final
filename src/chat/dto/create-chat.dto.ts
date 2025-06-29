import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsIn, 
  IsUUID, 
  IsOptional, 
  IsBoolean,
  MaxLength,
  Matches 
} from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do remetente (UUID válido)',
  })
  @IsNotEmpty({ message: 'ID do remetente é obrigatório' })
  @IsString({ message: 'ID do remetente deve ser uma string' })
  @IsUUID(4, { message: 'ID do remetente deve ser um UUID válido' })
  senderId: string;

  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Conteúdo da mensagem (máximo 1000 caracteres, sem XSS)',
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
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do destinatário ou grupo (UUID válido)',
  })
  @IsNotEmpty({ message: 'ID do destinatário é obrigatório' })
  @IsString({ message: 'ID do destinatário deve ser uma string' })
  @IsUUID(4, { message: 'ID do destinatário deve ser um UUID válido' })
  targetId: string;

  @ApiProperty({
    example: false,
    description: 'Indica se a mensagem é um arquivo',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isArquivo deve ser um valor booleano' })
  isArquivo?: boolean; 
}
