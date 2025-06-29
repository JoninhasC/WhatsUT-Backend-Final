import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional,
  IsString, 
  MinLength, 
  MaxLength, 
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate
} from 'class-validator';

@ValidatorConstraint({ name: 'strongPassword', async: false })
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password) return true; // Opcional na atualização
    
    // Verificar sequências comuns apenas se forem muito óbvias
    const veryCommonSequences = ['123456789', 'qwertyuiop', 'password123', 'admin123'];
    const lowerValue = password.toLowerCase();
    if (veryCommonSequences.some(seq => lowerValue.includes(seq))) {
      return false;
    }
    
    // Verificar apenas caracteres repetidos muito óbvios (4 ou mais)
    if (/(.)\1{3,}/.test(password)) {
      return false;
    }
    
    return true;
  }

  defaultMessage() {
    return 'Senha muito fraca. Evite sequências muito óbvias ou muitos caracteres repetidos';
  }
}

export class UpdateUserDto {
  @ApiProperty({
    example: 'João Silva Atualizado',
    description: 'Nome do usuário (2-50 caracteres, apenas letras, números e espaços)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(50, { message: 'Nome deve ter no máximo 50 caracteres' })
  @Matches(/^[a-zA-Z0-9\sÀ-ÿ]+$/, { 
    message: 'Nome deve conter apenas letras, números, espaços e caracteres acentuados. Caracteres especiais como <, >, ", \' não são permitidos' 
  })
  name?: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha forte (8+ chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { 
    message: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial (@$!%*?&)' 
  })
  @Validate(StrongPasswordConstraint)
  password?: string;
}
