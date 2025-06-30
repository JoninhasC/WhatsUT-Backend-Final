import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString 
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'Rafael Lechensque',
    description: 'Nome do usuário',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @ApiProperty({
    example: 'minhasenha123',
    description: 'Senha do usuário',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;
}
