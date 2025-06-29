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
    if (!message) return false;
    
    // Bloquear apenas tags HTML mais óbvias
    if (/<script|<iframe|<object|<embed/i.test(message)) {
      return false;
    }
    
    // Bloquear JavaScript mais óbvio
    if (/javascript:|data:text\/html|vbscript:/i.test(message)) {
      return false;
    }
    
    // Bloquear tentativas óbvias de SQL injection
    if (/(union\s+select|drop\s+table|delete\s+from)/i.test(message)) {
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
  @Matches(/^[^<>'"]*$/, { message: 'Mensagem não pode conter caracteres especiais como <, >, \', "' })
  @Validate(SafeMessageConstraint)
  content: string; // Padronizado para 'content'
}
