import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  MaxLength, 
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsOptional
} from 'class-validator';

@ValidatorConstraint({ name: 'safeMessage', async: false })
export class SafeMessageConstraint implements ValidatorConstraintInterface {
  validate(message: string) {
    // Verificar se a mensagem existe e não é vazia após trim
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return false;
    }
    
    // Bloquear qualquer tag HTML
    if (/<[^>]*>/i.test(message)) {
      return false;
    }
    
    // Bloquear JavaScript e scripts maliciosos
    if (/javascript:|data:text\/html|vbscript:|on\w+\s*=|<script|<\/script/i.test(message)) {
      return false;
    }
    
    // Bloquear tentativas de SQL injection
    if (/(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set)/i.test(message)) {
      return false;
    }
    
    return true;
  }

  defaultMessage() {
    return 'Mensagem contém conteúdo potencialmente perigoso ou está vazia';
  }
}

export class MessageDto {
  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Mensagem segura (máximo 1000 caracteres, sem HTML/scripts/SQL)',
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Validate(SafeMessageConstraint)
  content: string; // Padronizado para 'content'
}

export class SendMessageDto {
  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Mensagem segura (máximo 1000 caracteres, sem HTML/scripts/SQL)',
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Validate(SafeMessageConstraint)
  content: string;

  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do destinatário ou grupo',
    required: false
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do grupo',
    required: false
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do receptor (alias para targetId)',
    required: false
  })
  @IsOptional()
  @IsString()
  receiverId?: string;

  @ApiProperty({
    example: 'private',
    description: 'Tipo de chat: private ou group',
    required: false
  })
  @IsOptional()
  @IsString()
  chatType?: string;
}
