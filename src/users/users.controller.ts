// 📚 EXPLICAÇÃO DIDÁTICA: USERS CONTROLLER
// =========================================
//
// 🎯 O QUE É UM CONTROLLER NO NESTJS?
// Um controller é como um "balcão de atendimento" de uma empresa:
// - Recebe pedidos dos clientes (requisições HTTP)
// - Processa esses pedidos usando serviços especializados
// - Retorna respostas padronizadas para os clientes
// - Define quais "serviços" estão disponíveis (endpoints/rotas)
//
// 🏪 ANALOGIA: Balcão de Atendimento de um Banco
// - Cliente pede para ver extrato → GET /users (listar usuários)
// - Cliente quer atualizar dados → PATCH /users/profile (atualizar perfil)
// - Cliente quer cancelar conta → DELETE /users/profile (excluir conta)
// - Funcionário verifica se cliente está autorizado antes de cada operação

// 📦 IMPORTAÇÕES: Ferramentas que vamos usar
import { 
  Controller,        // 🏷️ Marca classe como controller
  Get,              // 🔍 Requisições GET (buscar dados)
  Patch,            // ✏️ Requisições PATCH (atualizar dados)
  Delete,           // 🗑️ Requisições DELETE (remover dados)
  Body,             // 📋 Dados enviados no corpo da requisição
  UseGuards,        // 🛡️ Proteção das rotas
  Request,          // 📨 Informações da requisição (usuário logado)
  Param,            // 🔢 Parâmetros da URL (/users/:id)
  ParseUUIDPipe,    // ✅ Validador de UUID
  NotFoundException, // ❌ Erro "não encontrado"
  HttpCode,         // 📊 Código de resposta HTTP
  HttpStatus        // 📋 Lista de códigos HTTP padrão
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRepository } from './csv-user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { OnlineUsersService } from '../auth/online-users.service';
import { BanRepository } from '../bans/ban.repository';
import * as bcrypt from 'bcrypt';

// 📖 DOCUMENTAÇÃO SWAGGER: Metadados para gerar documentação automática
@ApiTags('Usuários')           // 🏷️ Agrupa endpoints na documentação
@ApiBearerAuth()               // 🔐 Indica que precisa de token no cabeçalho
@Controller('users')           // 🛣️ Define que todas as rotas começam com '/users'
export class UsersController {
  
  // 🏗️ CONSTRUTOR: Injeta dependências (serviços que o controller vai usar)
  // É como contratar funcionários especializados para o balcão
  constructor(
    private readonly userRepo: UserRepository,      // 📚 Especialista em dados de usuários
    private readonly onlineUsers: OnlineUsersService, // 📊 Monitor de usuários online
    private readonly banRepository: BanRepository,    // 🚫 Verificador de banimentos
  ) {}

  // 🔍 ENDPOINT: Listar todos os usuários
  // URL: GET /users
  // É como pedir uma lista de todos os clientes do banco
  @UseGuards(JwtAuthGuard)      // 🛡️ Só usuários autenticados podem acessar
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários com status online e de banimento',
    example: [
      {
        id: '32ae172a-4b7b-44a5-a0c9-082f760af1cf',
        name: 'Rafael Lechensque',
        isCurrentUser: true,
        isOnline: true,
        status: 'active',
      },
    ],
  })
  @Get()  // 🔍 Método HTTP GET
  async findAll(@Request() req) {
    // 1️⃣ Busca todos os usuários no "arquivo de clientes" (CSV)
    const allUsers = await this.userRepo.findAll();

    // 2️⃣ Para cada usuário, adiciona informações extras (status online, banimento)
    // É como adicionar etiquetas coloridas na lista: verde=online, vermelha=banido
    const usersWithStatus = await Promise.all(
      allUsers.map(async (user) => {
        // 🚫 Verifica se o usuário está banido
        const isBanned = await this.banRepository.isUserBanned(user.id);
        
        return {
          id: user.id,
          name: user.name,
          // 👤 Marca se é o próprio usuário que está fazendo a consulta
          isCurrentUser: user.id === req.user.id,
          // 🟢 Verifica se está online neste momento
          isOnline: this.onlineUsers.isOnline(user.id),
          // 🚦 Status: 'banned' se banido, 'active' se normal
          status: isBanned ? 'banned' : 'active',
        };
      })
    );

    // 3️⃣ Retorna a lista enriquecida com todas as informações
    return usersWithStatus;
  }

  // 🔍 ENDPOINT: Buscar usuário específico por ID
  // URL: GET /users/:id (exemplo: GET /users/123e4567-e89b-12d3-a456-426614174000)
  // É como pedir informações de um cliente específico
  @UseGuards(JwtAuthGuard)      // 🛡️ Proteção: só usuários logados
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
  @Get(':id')  // 🔍 :id é um parâmetro variável na URL
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    // 1️⃣ Busca o usuário pelo ID (ParseUUIDPipe valida se é um UUID válido)
    const user = await this.userRepo.findById(id);
    
    // 2️⃣ Se não encontrou, retorna erro 404
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3️⃣ Retorna dados do usuário com informações extras
    return {
      id: user.id,
      name: user.name,
      isCurrentUser: user.id === req.user.id,  // É o próprio usuário?
      isOnline: this.onlineUsers.isOnline(user.id),  // Está online?
    };
  }

  // ✏️ ENDPOINT: Atualizar perfil do usuário autenticado
  // URL: PATCH /users/profile
  // É como um cliente atualizando seus próprios dados no banco
  @UseGuards(JwtAuthGuard)      // 🛡️ Só o próprio usuário pode alterar seus dados
  @Patch('profile')             // ✏️ PATCH = atualização parcial
  @HttpCode(HttpStatus.OK)      // 📊 Retorna código 200 (OK) em vez do padrão 201
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
    // 1️⃣ Pega o ID do usuário logado (do token JWT)
    const userId = req.user.id;
    
    // 2️⃣ Se está mudando a senha, precisa criptografar antes de salvar
    // É como trocar uma senha: nunca guardamos a senha real, só o "hash"
    if (updateUserDto.password) {
      const saltRounds = 10;  // Nível de segurança da criptografia
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }
    
    // 3️⃣ Atualiza os dados no "arquivo de clientes"
    const updatedUser = await this.userRepo.update(userId, updateUserDto);
    
    // 4️⃣ Se não conseguiu atualizar, usuário não existe
    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 5️⃣ Retorna confirmação da atualização (sem mostrar dados sensíveis)
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      message: 'Perfil atualizado com sucesso',
    };
  }

  // 🗑️ ENDPOINT: Excluir perfil do usuário autenticado
  // URL: DELETE /users/profile
  // É como um cliente cancelando sua conta no banco
  @UseGuards(JwtAuthGuard)      // 🛡️ Só o próprio usuário pode excluir sua conta
  @Delete('profile')            // 🗑️ DELETE = remoção
  @HttpCode(HttpStatus.OK)      // 📊 Retorna 200 em vez do padrão 204
  @ApiOperation({ summary: 'Excluir perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil excluído com sucesso',
    example: {
      message: 'Usuário excluído com sucesso',
    },
  })
  async deleteProfile(@Request() req) {
    // 1️⃣ Pega o ID do usuário logado
    const userId = req.user.id;
    
    // 2️⃣ Tenta excluir o usuário do "arquivo de clientes"
    const deleted = await this.userRepo.delete(userId);
    
    // 3️⃣ Se não conseguiu excluir, usuário não existe
    if (!deleted) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 4️⃣ Retorna confirmação da exclusão
    return {
      message: 'Usuário excluído com sucesso',
    };
  }
}

// 📝 RESUMO EDUCATIVO: O QUE APRENDEMOS
// =====================================
//
// 🎯 PADRÃO MVC (Model-View-Controller):
// - Controller: Esta classe (recebe requests, retorna responses)
// - Model: UserRepository (gerencia dados)
// - View: Frontend React (não está neste arquivo)
//
// 🛡️ SEGURANÇA:
// - Todas as rotas protegidas com JwtAuthGuard
// - Senhas criptografadas com bcrypt
// - Validação de UUIDs
// - Verificação de usuário existente
//
// 📊 HTTP METHODS:
// - GET: Buscar dados (não modifica nada)
// - PATCH: Atualizar dados parcialmente
// - DELETE: Remover dados
//
// 🔧 BOAS PRÁTICAS:
// - Documentação automática com Swagger
// - Códigos de erro apropriados (404 para não encontrado)
// - Respostas padronizadas
// - Separação de responsabilidades (controller não acessa banco diretamente)
//
// 💡 CONCEITOS IMPORTANTES:
// - Dependency Injection (constructor recebe dependências)
// - Async/Await (operações assíncronas)
// - Decorators (@Get, @Post, etc.)
// - Pipes (ParseUUIDPipe para validação)
// - DTOs (Data Transfer Objects) para estruturar dados
