import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate
} from 'class-validator';

@ValidatorConstraint({ name: 'safeFileName', async: false })
export class SafeFileNameConstraint implements ValidatorConstraintInterface {
  validate(fileName: string) {
    if (!fileName) return true; // Opcional

    // Verificar caracteres perigosos no nome do arquivo
    if (/[<>:"|?*\\\/]/.test(fileName)) {
      return false;
    }

    // Verificar extensões perigosas
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', 
      '.jar', '.php', '.asp', '.jsp', '.sh', '.pl', '.py'
    ];
    
    const lowerFileName = fileName.toLowerCase();
    if (dangerousExtensions.some(ext => lowerFileName.endsWith(ext))) {
      return false;
    }

    // Verificar nomes de arquivo perigosos do Windows
    const windowsReserved = [
      'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5',
      'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4',
      'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
    ];
    
    const fileNameWithoutExt = fileName.split('.')[0].toLowerCase();
    if (windowsReserved.includes(fileNameWithoutExt)) {
      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'Nome do arquivo contém caracteres perigosos ou extensão não permitida';
  }
}

export class FileUploadDto {
  @ApiProperty({
    example: 'documento.pdf',
    description: 'Nome do arquivo (sem caracteres especiais ou extensões perigosas)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome do arquivo deve ser uma string' })
  @MaxLength(255, { message: 'Nome do arquivo deve ter no máximo 255 caracteres' })
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'Nome do arquivo deve conter apenas letras, números, pontos, hífens e underscores' })
  @Validate(SafeFileNameConstraint)
  fileName?: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Tipo MIME do arquivo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tipo MIME deve ser uma string' })
  @Matches(/^[a-zA-Z0-9\-\/\.]+$/, { message: 'Tipo MIME deve ter formato válido' })
  mimeType?: string;

  @ApiProperty({
    example: 'Documento importante para o projeto',
    description: 'Descrição opcional do arquivo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  @Matches(/^[^<>'"]*$/, { message: 'Descrição não pode conter caracteres especiais como <, >, \', "' })
  description?: string;
}
