/*
 * ====================================================================
 * ARQUIVO: auth.controller.ts
 * LOCALIZAÇÃO: src/auth/auth.controller.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é a "RECEPÇÃO" do sistema de autenticação do WhatsUT.
 * É aqui que chegam todas as requisições HTTP relacionadas a login, logout,
 * registro e consulta de perfil. Pense nele como a "mesa da recepcionista"
 * que recebe visitantes e os direciona para o departamento correto.
 * 
 * ANALOGIA SIMPLES:
 * Imagine um hospital. Este arquivo seria a recepção que:
 * - Recebe pacientes que querem se cadastrar (registro)
 * - Recebe pacientes que querem ser atendidos (login)
 * - Direciona cada pessoa para o médico certo (AuthService)
 * - Controla quem pode acessar certas áreas (autenticação)
 * 
 * DIFERENÇA ENTRE CONTROLLER E SERVICE:
 * - CONTROLLER (este arquivo): recebe requisições HTTP, valida dados, chama o Service
 * - SERVICE (auth.service.ts): contém a lógica de negócio (verificar senha, gerar token)
 * 
 * É como a diferença entre a recepcionista (controller) e o médico (service):
 * - Recepcionista: recebe pacientes, organiza fichas, agenda consultas
 * - Médico: faz diagnósticos, prescreve remédios, trata pacientes
 */

// ===== IMPORTAÇÕES (FERRAMENTAS VINDAS DE OUTROS LUGARES) =====

// Importações do NestJS - framework que estamos usando
import {
  Body,        // Para pegar dados do corpo da requisição HTTP (JSON)
  Controller,  // Decorador que marca esta classe como um "controlador"
  Get,         // Decorador para requisições GET (buscar dados)
  HttpCode,    // Para definir qual código HTTP retornar (200, 201, 404, etc.)
  HttpStatus,  // Constantes com códigos HTTP (OK = 200, CREATED = 201, etc.)
  Post,        // Decorador para requisições POST (enviar dados)
  Request,     // Para acessar dados da requisição HTTP
  UseGuards,   // Para usar "guardas" (verificações de segurança)
} from '@nestjs/common';

// Importa o serviço de autenticação (onde está a lógica de negócio)
import { AuthService } from './auth.service';

// Importa os "moldes" (DTOs) que definem como os dados devem chegar
import { CreateUserDto } from '../users/dto/create-user.dto';  // Para criar usuário
import { LoginDto } from './dto/login.dto';                    // Para fazer login

// Importações do Swagger (documentação automática da API)
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Importa o "guarda" JWT que verifica se o usuário está logado
import { JwtAuthGuard } from './jwt-auth.guard';

// Importa o serviço que controla usuários online
import { OnlineUsersService } from './online-users.service';

// ===== DECORADOR @Controller =====
// Este "rótulo" diz para o NestJS: "Esta classe gerencia rotas HTTP que começam com /auth"
// Todas as rotas deste arquivo terão o prefixo /auth (ex: /auth/login, /auth/register)
@Controller('auth')
export class AuthController {
  
  // ===== CONSTRUTOR =====
  // Aqui "injetamos" o AuthService, ou seja, pedimos para o NestJS nos dar
  // uma instância do serviço de autenticação para podermos usar
  constructor(private authService: AuthService) {}
  // É como pedir para a administração do hospital nos dar acesso ao médico especialista

  // ===== ROTA: POST /auth/login (FAZER LOGIN) =====
  
  // @HttpCode: Define que esta rota retorna código 200 (OK) quando der certo
  @HttpCode(HttpStatus.OK)
  
  // @ApiOperation: Documentação para o Swagger (ferramenta que gera documentação automática)
  @ApiOperation({ summary: 'Login do usuário' })
  
  // @ApiResponse: Exemplo de resposta para documentação
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  
  // @Post: Esta função responde a requisições POST para /auth/login
  @Post('login')
  async signIn(@Body() signInDto: LoginDto) {
    // @Body(): pega os dados que vieram no corpo da requisição (nome e senha)
    // signInDto: os dados recebidos, organizados conforme o "molde" LoginDto
    // LoginDto define que deve ter: { name: string, password: string }
    
    // Chama o método signIn do AuthService, passando nome e senha
    // É como a recepcionista ligar para o médico e passar os dados do paciente
    return this.authService.signIn(signInDto.name, signInDto.password);
    
    // Esta função vai retornar: { access_token: "...", user: { id, name, isOnline } }
    // O frontend recebe esse objeto e já tem tudo que precisa para funcionar
  }

  // ===== ROTA: POST /auth/logout (FAZER LOGOUT) =====
  
  // @ApiBearerAuth: Diz que esta rota precisa do token JWT no cabeçalho Authorization
  @ApiBearerAuth()
  
  @HttpCode(HttpStatus.OK)
  
  @ApiOperation({ summary: 'Logout do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout realizado com sucesso',
    example: { message: 'Logout realizado com sucesso' }
  })
  
  // @UseGuards(JwtAuthGuard): Só permite acesso se o usuário estiver logado
  // É como ter um segurança que verifica a pulseirinha antes de deixar entrar
  @UseGuards(JwtAuthGuard)
  
  @Post('logout')
  async singOut(@Request() req) {
    // @Request(): acessa dados da requisição HTTP
    // req.user: dados do usuário que foram colocados pelo JwtAuthGuard
    // O guard já verificou o token e colocou os dados do usuário em req.user
    
    // Chama o logout passando o ID do usuário
    return this.authService.singOut(req.user.id);
  }

  // ===== ROTA: POST /auth/register (CRIAR NOVA CONTA) =====
  
  // @HttpCode: Esta rota retorna 201 (CREATED) quando criar um usuário com sucesso
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
    // @Body(): pega os dados do novo usuário (nome, senha, etc.)
    // CreateUserDto: o "molde" que define como os dados devem ser enviados
    // Deve conter: { name: string, password: string } no mínimo
    
    // Repassa os dados para o AuthService criar o usuário
    return this.authService.register(body);
    
    // O AuthService vai chamar o UsersService que vai:
    // 1. Criptografar a senha
    // 2. Gerar um ID único
    // 3. Salvar no arquivo CSV
    // 4. Retornar os dados do usuário criado
  }

  // ===== ROTA: GET /auth/profile (VER PERFIL) =====
  // NOTA: Esta rota existe mas não é mais necessária no fluxo atual!
  // O login já retorna os dados do usuário, então o frontend não precisa
  // fazer uma segunda chamada para pegar o perfil.
  
  @ApiBearerAuth()  // Precisa estar logado (ter token)
  
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
    example: {
      id: '98c24db0-532e-4b47-88c1-7572be9d7f05',
      name: 'Rafael Lechensque',
    },
  })
  
  @UseGuards(JwtAuthGuard)  // Só funciona se estiver logado
  @Get('profile')
  getProfile(@Request() req) {
    // Esta função simplesmente retorna os dados do usuário que já estão
    // disponíveis em req.user (colocados lá pelo JwtAuthGuard)
    
    // O JwtAuthGuard já verificou o token e extraiu os dados do usuário
    // Então só precisamos retornar esses dados
    return req.user;
    
    // OBSERVAÇÃO IMPORTANTE:
    // Esta rota ainda existe para compatibilidade, mas no fluxo atual
    // o frontend recebe os dados do usuário direto no login, então
    // esta chamada adicional não é mais necessária
  }
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O AuthController é a "PORTA DE ENTRADA" para autenticação no WhatsUT. Ele:
 * 
 * 1. 🌐 RECEBE REQUISIÇÕES HTTP: Do frontend, mobile, etc.
 * 2. ✅ VALIDA DADOS: Verifica se os dados chegaram no formato correto
 * 3. 🔄 DELEGA PARA O SERVICE: Repassa o trabalho pesado para AuthService
 * 4. 📤 RETORNA RESPOSTAS: Envia de volta os resultados para quem pediu
 * 5. 🛡️ APLICA SEGURANÇA: Usa guards para proteger rotas que precisam de login
 * 
 * FLUXO TÍPICO DE UMA REQUISIÇÃO:
 * 
 * Frontend faz POST /auth/login com { name: "João", password: "123" }
 *     ↓
 * AuthController.signIn() recebe os dados
 *     ↓
 * Chama AuthService.signIn("João", "123")
 *     ↓
 * AuthService verifica senha e gera token
 *     ↓
 * AuthController retorna { access_token: "...", user: {...} }
 *     ↓
 * Frontend recebe a resposta e salva o token
 * 
 * ROTAS DISPONÍVEIS:
 * - POST /auth/login    → Fazer login (público)
 * - POST /auth/logout   → Fazer logout (protegido)
 * - POST /auth/register → Criar conta (público)
 * - GET /auth/profile   → Ver perfil (protegido, opcional)
 * 
 * SEM ESTE ARQUIVO: Não haveria como o frontend se comunicar com o backend!
 */
