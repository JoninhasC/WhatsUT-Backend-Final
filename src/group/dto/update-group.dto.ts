import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',
      '6ee878d0-e36c-4596-a249-46f2cd948146',
    ],
    description: 'Lista de IDs de solicitações pendentes (UUIDs válidos)',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Lista de solicitações pendentes deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID de solicitação pendente deve ser um UUID válido' })
  pendingRequests?: string[];
}
