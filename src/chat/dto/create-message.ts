import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  MaxLength, 
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate
} from 'class-validator';

@ValidatorConstraint({ name: 'safeMessage', async: false })
export class SafeMessageConstraint implements ValidatorConstraintInterface {
  validate(message: string) {
    if (!message || message.trim().length === 0) return false;
    
    // Bloquear qualquer tag HTML
    if (/<[^>]*>/i.test(message)) {
      return false;
    }
    
    // Bloquear JavaScript
    if (/javascript:|data:text\/html|vbscript:|on\w+\s*=/i.test(message)) {
      return false;
    }
    
    // Bloquear tentativas de SQL injection
    if (/(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set)/i.test(message)) {
      return false;
    }
    
    return true;
  }

  defaultMessage() {
    return 'Mensagem contém conteúdo potencialmente perigoso';
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
