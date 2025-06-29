import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OnlineUsersService } from './online-users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @Post('login')
  async signIn(@Body() signInDto: CreateUserDto) {
    return this.authService.signIn(signInDto.name, signInDto.password);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout realizado com sucesso',
    example: { message: 'Logout realizado com sucesso' }
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async singOut(@Request() req) {
    return this.authService.singOut(req.user.id);
  }

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário criado com sucesso',
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
