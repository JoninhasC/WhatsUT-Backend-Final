import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  UseGuards, 
  Request, 
  Param, 
  ParseUUIDPipe, 
  NotFoundException,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRepository } from './csv-user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { OnlineUsersService } from '../auth/online-users.service';
import * as bcrypt from 'bcrypt';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly onlineUsers: OnlineUsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários com status online',
    example: [
      {
        id: '32ae172a-4b7b-44a5-a0c9-082f760af1cf',
        name: 'Rafael Lechensque',
        isCurrentUser: true,
        isOnline: true,
      },
    ],
  })
  @Get()
  async findAll(@Request() req) {
    const allUsers = await this.userRepo.findAll();

    return allUsers.map((user) => ({
      id: user.id,
      name: user.name,
      isCurrentUser: user.id === req.user.id,
      isOnline: this.onlineUsers.isOnline(user.id),
    }));
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)', example: '32ae172a-4b7b-44a5-a0c9-082f760af1cf' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    example: {
      id: '32ae172a-4b7b-44a5-a0c9-082f760af1cf',
      name: 'Rafael Lechensque',
      isCurrentUser: false,
      isOnline: true,
    },
  })
  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userRepo.findById(id);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      isCurrentUser: user.id === req.user.id,
      isOnline: this.onlineUsers.isOnline(user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    example: {
      id: '32ae172a-4b7b-44a5-a0c9-082f760af1cf',
      name: 'João Silva Atualizado',
      message: 'Perfil atualizado com sucesso',
    },
  })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id;
    
    // Se está atualizando a senha, criptografar
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }
    
    const updatedUser = await this.userRepo.update(userId, updateUserDto);
    
    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      message: 'Perfil atualizado com sucesso',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil excluído com sucesso',
    example: {
      message: 'Usuário excluído com sucesso',
    },
  })
  async deleteProfile(@Request() req) {
    const userId = req.user.id;
    
    const deleted = await this.userRepo.delete(userId);
    
    if (!deleted) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      message: 'Usuário excluído com sucesso',
    };
  }
}
