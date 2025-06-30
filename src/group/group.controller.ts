/**
 * 👥 GROUP CONTROLLER - ENDPOINTS HTTP PARA GERENCIAMENTO DE GRUPOS NO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Este é um Controller NestJS que gerencia todas as operações relacionadas a grupos de chat.
 * É como um "gerente de grupos" que coordena criação, membership, moderação e administração.
 * 
 * ANALOGIA SIMPLES:
 * Se você pensar num clube ou organização, este controller é como o "departamento administrativo" que:
 * - Cria novos grupos (clubes)
 * - Gerencia pedidos de entrada
 * - Aprova/rejeita novos membros
 * - Promove/remove administradores
 * - Aplica punições (banimentos)
 * - Lista grupos disponíveis
 * 
 * 🎯 RESPONSABILIDADES DESTE CONTROLLER:
 * - Criar novos grupos de chat
 * - Listar grupos do usuário e públicos
 * - Gerenciar solicitações de entrada
 * - Controlar permissões de administração
 * - Aplicar moderação (banimentos)
 * - Atualizar informações de grupos
 * - Validar permissões e segurança
 * 
 * 🔧 ROTAS PRINCIPAIS:
 * - GET /groups/my - Meus grupos
 * - GET /groups - Todos os grupos
 * - POST /groups/create - Criar grupo
 * - PATCH /groups/:id/join - Solicitar entrada
 * - PATCH /groups/:id/approve/:userId - Aprovar membro
 * - PATCH /groups/:id/reject/:userId - Rejeitar solicitação
 * - PATCH /groups/:id/ban/:userId - Banir usuário
 * - DELETE /groups/:id/leave - Sair do grupo
 */

// 📦 IMPORTAÇÕES DO NESTJS PARA FUNCIONALIDADES HTTP
import {
  Controller,           // 🌐 Decorator que marca esta classe como controller
  Get,                 // 🔍 Decorator para rotas HTTP GET (buscar dados)
  Post,                // 📤 Decorator para rotas HTTP POST (criar recursos)
  Body,                // 📩 Decorator para extrair dados do corpo da requisição
  Param,               // 🎯 Decorator para extrair parâmetros da URL
  Request,             // 📨 Decorator para acessar objeto de requisição completo
  ForbiddenException,  // 🚫 Exception para acesso negado (403)
  UseGuards,           // 🔐 Decorator para aplicar guards (autenticação)
  Patch,               // ✏️ Decorator para rotas HTTP PATCH (atualizar parcialmente)
  Delete,              // 🗑️ Decorator para rotas HTTP DELETE (remover recursos)
  HttpCode,            // 📊 Decorator para definir código de status HTTP
  HttpStatus,          // 📊 Enum com códigos de status HTTP (200, 201, 400, etc.)
  ParseUUIDPipe,       // 🔍 Pipe para validar e converter UUIDs
  NotFoundException,   // 🔍 Exception para recursos não encontrados (404)
  BadRequestException, // ❌ Exception para requisições malformadas (400)
} from '@nestjs/common';

// 📦 IMPORTAÇÕES INTERNAS DO PROJETO
import { GroupRepository } from './group.repository';        // 💾 Repository para persistência de grupos
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'; // 📚 Documentação Swagger
import { CreateGroupDto } from './dto/create-group.dto';     // 📋 DTO para validação de criação de grupo
import { UpdateGroupDto } from './dto/update-group.dto';     // 📋 DTO para validação de atualização de grupo
import { JwtAuthGuard } from '../auth/jwt-auth.guard';       // 🔐 Guard de autenticação JWT
import { BanService } from '../bans/ban.service';           // 🚫 Service para verificar banimentos

/**
 * 🏗️ DECORATORS DE CONFIGURAÇÃO DO CONTROLLER
 * 
 * 📚 CONCEITO - NestJS Decorators:
 * Estes decorators configuram como o controller de grupos funciona:
 * - @ApiTags: Agrupa rotas na documentação Swagger
 * - @ApiBearerAuth: Indica que precisa de token JWT
 * - @UseGuards: Aplica guard de autenticação em todas as rotas
 * - @Controller: Define múltiplos prefixos de rota para compatibilidade
 */
@ApiTags('Grupos')                          // 📚 Grupo na documentação: "Grupos"
@ApiBearerAuth()                           // 🔐 Documenta que precisa de Bearer Token
@UseGuards(JwtAuthGuard)                   // 🛡️ Todas as rotas protegidas por JWT
@Controller(['groups', 'group'])           // 🌐 Prefixos: /groups e /group (compatibilidade)
export class GroupController {
  
  /**
   * 🏗️ CONSTRUTOR COM INJEÇÃO DE DEPENDÊNCIAS
   * 
   * 📚 CONCEITO - Dependency Injection:
   * O NestJS automaticamente fornece as instâncias dos
   * repositórios e services que precisamos para gerenciar grupos.
   * 
   * É como ter "assistentes especialistas" disponíveis:
   * - groupRepo: Especialista em salvar/buscar dados de grupos
   * - banService: Especialista em verificar banimentos
   */
  constructor(
    private readonly groupRepo: GroupRepository,  // 💾 Repository de grupos
    private readonly banService: BanService,      // 🚫 Service de banimentos
  ) {}

  /**
   * 📋 ENDPOINT: BUSCAR GRUPOS DO USUÁRIO AUTENTICADO
   * 
   * 📚 CONCEITO - Personalized Data:
   * Retorna apenas os grupos dos quais o usuário logado faz parte.
   * É como ver a "lista dos seus clubes" na carteira.
   * 
   * 🌐 ROTA: GET /groups/my
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * EXEMPLO DE USO:
   * GET /groups/my
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * @param req - Objeto de requisição (contém dados do usuário logado)
   * @returns Lista de grupos dos quais o usuário é membro
   */
  @Get('my')
  @ApiOperation({ summary: 'Obter grupos do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de grupos do usuário' })
  async myGroups(@Request() req) {
    // 🔍 Busca apenas grupos onde o usuário logado é membro
    return await this.groupRepo.findMyGroups(req.user.id);
  }

  /**
   * 🌐 ENDPOINT: LISTAR TODOS OS GRUPOS PÚBLICOS
   * 
   * 📚 CONCEITO - Public Directory:
   * Retorna lista de todos os grupos disponíveis para descoberta.
   * É como um "catálogo de clubes" que qualquer pessoa pode ver.
   * 
   * 🌐 ROTA: GET /groups
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * @returns Lista de todos os grupos (com informações públicas)
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos os grupos' })
  @ApiResponse({ status: 200, description: 'Lista de todos os grupos' })
  async findAll() {
    // 🔍 Busca todos os grupos disponíveis
    return await this.groupRepo.findAll();
  }

  /**
   * 🆕 ENDPOINT: CRIAR NOVO GRUPO
   * 
   * 📚 CONCEITO - Resource Creation:
   * Permite ao usuário criar um novo grupo de chat.
   * O criador automaticamente se torna administrador e membro.
   * 
   * 🌐 ROTA: POST /groups/create
   * 📊 STATUS: 201 Created
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * EXEMPLO DE USO:
   * POST /groups/create
   * Content-Type: application/json
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Body:
   * {
   *   "name": "Desenvolvedores React",
   *   "description": "Grupo para discussões sobre React",
   *   "isPrivate": false,
   *   "members": [],
   *   "adminsId": []
   * }
   * 
   * @param req - Objeto de requisição (usuário criador)
   * @param createGroupDto - Dados do grupo a ser criado (validados pelo DTO)
   * @returns Dados do grupo criado
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)                // 📊 Retorna status 201 (Created)
  @ApiOperation({ summary: 'Criar novo grupo' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso' })
  async create(
    @Request() req,                          // 📨 Requisição (usuário criador em req.user)
    @Body() createGroupDto: CreateGroupDto,  // 📩 Dados do grupo (validados pelo DTO)
  ) {
    const { id }: { id: string } = req.user; // 👤 ID do usuário criador
    
    /**
     * 🚫 VERIFICAÇÃO DE BANIMENTO
     * 
     * 📚 CONCEITO - Security First:
     * Antes de permitir criação de grupo, verificamos
     * se o usuário não está banido do sistema.
     * 
     * É como verificar se a pessoa tem "direitos"
     * para criar novos clubes.
     */
    await this.banService.validateUserAccess(id);
    
    /**
     * 📋 INICIALIZAÇÃO SEGURA DE ARRAYS
     * 
     * 📚 CONCEITO - Defensive Programming:
     * Garantimos que os arrays de membros e admins existem,
     * mesmo que não tenham sido fornecidos na requisição.
     * 
     * Criamos cópias dos arrays para evitar mutação de dados
     * externos (princípio de imutabilidade).
     */
    const members = createGroupDto.members ? [...createGroupDto.members] : [];
    const adminsId = createGroupDto.adminsId ? [...createGroupDto.adminsId] : [];

    /**
     * 👑 GARANTIR PRIVILÉGIOS DO CRIADOR
     * 
     * 📚 CONCEITO - Creator Privileges:
     * O criador do grupo automaticamente se torna:
     * 1. Membro do grupo (para poder participar)
     * 2. Administrador do grupo (para poder gerenciar)
     * 
     * Verificamos se já está nas listas para evitar duplicatas.
     */
    if (!members.includes(id)) {
      members.push(id);  // 👥 Adiciona como membro
    }

    if (!adminsId.includes(id)) {
      adminsId.push(id); // 👑 Adiciona como administrador
    }

    /**
     * 💾 PERSISTIR O GRUPO
     * 
     * 📚 CONCEITO:
     * Salvamos o grupo no repository com os dados fornecidos
     * mais as garantias de segurança aplicadas.
     * 
     * Usamos spread operator (...) para manter todos os
     * dados originais e sobrescrever apenas os arrays
     * de membros e admins.
     */
    return await this.groupRepo.create({
      ...createGroupDto,  // 📋 Todos os dados originais
      members,            // 👥 Array de membros atualizado
      adminsId,           // 👑 Array de admins atualizado
    });
  }

  /**
   * 🔄 ENDPOINT: CRIAR GRUPO (ROTA DE COMPATIBILIDADE)
   * 
   * 📚 CONCEITO - API Versioning/Compatibility:
   * Esta é uma rota alternativa que oferece compatibilidade
   * com versões anteriores da API ou diferentes clientes.
   * 
   * 🌐 ROTA: POST /groups (sem /create)
   * 📊 STATUS: 201 Created
   * 
   * A diferença desta rota é que ela:
   * - Faz validação adicional (nome obrigatório)
   * - Retorna formato de resposta ligeiramente diferente
   * - Delega para o método create() principal
   * 
   * @param req - Objeto de requisição
   * @param createGroupDto - Dados do grupo
   * @returns Resposta formatada com mensagem de sucesso
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo grupo (compatibilidade)' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso' })
  async createCompat(
    @Request() req,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    /**
     * ✅ VALIDAÇÃO EXPLÍCITA
     * 
     * 📚 CONCEITO - Input Validation:
     * Verificamos explicitamente se o nome foi fornecido,
     * mesmo que o DTO já tenha validações.
     * 
     * Isso oferece uma camada extra de segurança e
     * mensagens de erro mais específicas.
     */
    if (!createGroupDto.name) {
      throw new BadRequestException('Nome do grupo é obrigatório');
    }
    
    /**
     * 🔄 DELEGAÇÃO PARA MÉTODO PRINCIPAL
     * 
     * 📚 CONCEITO - DRY (Don't Repeat Yourself):
     * Ao invés de duplicar a lógica de criação,
     * delegamos para o método create() principal
     * e apenas formatamos a resposta diferente.
     */
    const group = await this.create(req, createGroupDto);
    
    /**
     * 📦 RESPOSTA FORMATADA
     * 
     * 📚 CONCEITO:
     * Retornamos uma resposta com formato específico
     * que inclui uma mensagem de confirmação amigável.
     */
    return {
      message: 'Grupo criado com sucesso',
      ...group  // 📋 Todos os dados do grupo criado
    };
  }

  /**
   * 🚪 ENDPOINT: SOLICITAR ENTRADA EM GRUPO
   * 
   * 📚 CONCEITO - Membership Request:
   * Permite que um usuário solicite entrada em um grupo.
   * É como "bater na porta" e pedir para entrar no clube.
   * A solicitação fica pendente até um admin aprovar/rejeitar.
   * 
   * 🌐 ROTA: PATCH /groups/:id/join
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * FLUXO DO PROCESSO:
   * 1. 👤 Usuário solicita entrada
   * 2. 📋 Sistema verifica se grupo existe
   * 3. 🔍 Verifica se já é membro ou já tem solicitação
   * 4. ➕ Adiciona à lista de solicitações pendentes
   * 5. 👑 Admin poderá aprovar/rejeitar depois
   * 
   * EXEMPLO DE USO:
   * PATCH /groups/bb145801-dd77-4e34-bdea-bee5dd790f3e/join
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * @param req - Requisição (usuário solicitante em req.user)
   * @param groupId - ID do grupo (validado como UUID)
   * @returns Confirmação da solicitação e dados do grupo
   */
  @Patch(':id/join')
  @ApiOperation({ summary: 'Solicitar entrada em um grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Solicitação de entrada enviada' })
  async join(@Request() req, @Param('id', ParseUUIDPipe) groupId: string) {
    const { id: userId }: { id: string } = req.user; // 👤 ID do usuário solicitante
    
    // 🔍 Buscar dados do grupo pelo ID
    const group = await this.groupRepo.findById(groupId);

    /**
     * ✅ VALIDAÇÕES DE NEGÓCIO
     * 
     * 📚 CONCEITO - Business Rules Validation:
     * Verificamos múltiplas condições antes de permitir a solicitação:
     * 1. Grupo deve existir
     * 2. Usuário não pode já ser membro
     * 3. Usuário não pode ter solicitação pendente
     */
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    if (group.pendingRequests?.includes(userId) || group.members?.includes(userId)) {
      throw new BadRequestException(
        'Usuário já é membro ou tem uma solicitação pendente.',
      );
    }

    /**
     * 📝 REGISTRAR SOLICITAÇÃO
     * 
     * 📚 CONCEITO - Request Queue:
     * Adicionamos o ID do usuário à lista de solicitações pendentes.
     * Esta lista será consultada pelos admins para aprovar/rejeitar.
     * 
     * É como adicionar seu nome numa "lista de espera".
     */
    group.pendingRequests.push(userId);
    const updatedGroup = await this.groupRepo.update(group);
    
    /**
     * 📦 RESPOSTA DE CONFIRMAÇÃO
     * 
     * Retornamos confirmação mais os dados atualizados do grupo
     * para que o frontend possa atualizar a interface.
     */
    return {
      message: 'Solicitação de entrada enviada',
      ...updatedGroup
    };
  }

  /**
   * ✅ ENDPOINT: APROVAR ENTRADA DE USUÁRIO NO GRUPO
   * 
   * 📚 CONCEITO - Administrative Approval:
   * Permite que administradores aprovem solicitações de entrada.
   * É como o "porteiro do clube" que decide quem pode entrar.
   * 
   * 🌐 ROTA: PATCH /groups/:id/approve/:userId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT + Admin do grupo)
   * 
   * FLUXO DO PROCESSO:
   * 1. 👑 Admin inicia aprovação
   * 2. 🔍 Sistema verifica permissões (é admin?)
   * 3. 📋 Verifica se há solicitação pendente
   * 4. ✅ Move usuário para lista de membros
   * 5. 🗑️ Remove da lista de pendentes
   * 6. 💾 Atualiza grupo no banco
   * 
   * EXEMPLO DE USO:
   * PATCH /groups/bb145801-dd77-4e34-bdea-bee5dd790f3e/approve/cc245801-dd77-4e34-bdea-bee5dd790f3e
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * @param req - Requisição (admin aprovador em req.user)
   * @param groupId - ID do grupo (validado como UUID)
   * @param userIdToApprove - ID do usuário a ser aprovado (validado como UUID)
   * @returns Confirmação da aprovação e dados do grupo
   */
  @Patch(':id/approve/:userId')
  @ApiOperation({ summary: 'Aprovar entrada de usuário no grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser aprovado (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Usuário aprovado no grupo' })
  async approve(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userIdToApprove: string,
  ) {
    const { id: adminId }: { id: string } = req.user; // 👑 ID do admin aprovador
    
    // 🔍 Buscar dados do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * 🛡️ VALIDAÇÕES DE SEGURANÇA E AUTORIZAÇÃO
     * 
     * 📚 CONCEITO - Authorization Checks:
     * Verificamos múltiplas condições de segurança:
     * 1. Grupo deve existir
     * 2. Usuário deve ser admin do grupo
     * 3. Deve existir solicitação pendente para o usuário
     */
    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem aprovar membros');
    }
    
    if (!group.pendingRequests.includes(userIdToApprove)) {
      throw new ForbiddenException(
        'Este usuário não possui uma solicitação pendente.',
      );
    }

    /**
     * 🔄 PROCESSAMENTO DA APROVAÇÃO
     * 
     * 📚 CONCEITO - State Transition:
     * Movemos o usuário de "pendente" para "membro":
     * 1. Adiciona à lista de membros
     * 2. Remove da lista de pendentes
     * 
     * É como "abrir a porta" e dar as boas-vindas ao novo membro.
     */
    group.members.push(userIdToApprove);
    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToApprove);
    
    // 💾 Salvar alterações
    const updatedGroup = await this.groupRepo.update(group);
    
    return { 
      message: 'Usuário aprovado no grupo', 
      ...updatedGroup 
    };
  }

  /**
   * ❌ ENDPOINT: REJEITAR ENTRADA DE USUÁRIO NO GRUPO
   * 
   * 📚 CONCEITO - Administrative Rejection:
   * Permite que administradores rejeitem solicitações de entrada.
   * É como o "porteiro do clube" que decide não aceitar alguém.
   * 
   * 🌐 ROTA: PATCH /groups/:id/reject/:userId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT + Admin do grupo)
   * 
   * FLUXO DO PROCESSO:
   * 1. 👑 Admin inicia rejeição
   * 2. 🔍 Sistema verifica permissões
   * 3. 🗑️ Remove usuário da lista de pendentes
   * 4. 💾 Atualiza grupo (usuário não vira membro)
   * 
   * DIFERENÇA DA APROVAÇÃO:
   * - Aprovação: pendente → membro
   * - Rejeição: pendente → removido (sem virar membro)
   * 
   * @param req - Requisição (admin rejeitador em req.user)
   * @param groupId - ID do grupo (validado como UUID)
   * @param userIdToReject - ID do usuário a ser rejeitado (validado como UUID)
   * @returns Confirmação da rejeição e dados do grupo
   */
  @Patch(':id/reject/:userId')
  @ApiOperation({ summary: 'Rejeitar entrada de usuário no grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser rejeitado (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Usuário rejeitado' })
  async reject(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userIdToReject: string,
  ) {
    const { id: adminId }: { id: string } = req.user; // 👑 ID do admin rejeitador
    
    // 🔍 Buscar dados do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * 🛡️ VALIDAÇÕES DE AUTORIZAÇÃO
     * 
     * 📚 CONCEITO:
     * Mesmas verificações da aprovação, mas sem
     * verificar se há solicitação pendente (pode
     * ser útil limpar listas inconsistentes).
     */
    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem rejeitar membros');
    }

    /**
     * 🗑️ PROCESSAMENTO DA REJEIÇÃO
     * 
     * 📚 CONCEITO - Simple Removal:
     * Simplesmente removemos o usuário da lista de pendentes.
     * Não há validação se o usuário estava realmente na lista
     * (filtro é seguro mesmo se não estiver).
     * 
     * É como "riscar o nome da lista de espera".
     */
    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToReject);
    
    // 💾 Salvar alterações
    const updatedGroup = await this.groupRepo.update(group);
    
    return { 
      message: 'Solicitação rejeitada', 
      ...updatedGroup 
    };
  }

  /**
   * 🚫 ENDPOINT: BANIR USUÁRIO DO GRUPO
   * 
   * 📚 CONCEITO - Group Moderation:
   * Permite que administradores expulsem/baniram membros do grupo.
   * É como "expulsar alguém do clube" por mau comportamento.
   * 
   * 🌐 ROTA: PATCH /groups/:id/ban/:userId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT + Admin do grupo)
   * 
   * FLUXO DO PROCESSO:
   * 1. 👑 Admin inicia banimento
   * 2. 🔍 Validações de segurança
   * 3. 🚫 Remove de membros E admins
   * 4. 💾 Atualiza grupo
   * 
   * REGRAS DE NEGÓCIO:
   * - Só admins podem banir
   * - Usuário deve ser membro atual
   * - Admin não pode se banir
   * - Banido perde todos os privilégios
   * 
   * @param req - Requisição (admin que está banindo)
   * @param groupId - ID do grupo (validado como UUID)
   * @param userIdToBan - ID do usuário a ser banido (validado como UUID)
   * @returns Confirmação do banimento e dados do grupo
   */
  @Patch(':id/ban/:userId')
  @ApiOperation({ summary: 'Banir usuário do grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser banido (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Usuário banido do grupo' })
  async ban(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userIdToBan: string,
  ) {
    const { id: adminId }: { id: string } = req.user; // 👑 ID do admin que está banindo
    
    // 🔍 Buscar dados do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * 🛡️ VALIDAÇÕES RIGOROSAS DE SEGURANÇA
     * 
     * 📚 CONCEITO - Comprehensive Security Checks:
     * Para banimentos, precisamos de validações extras:
     * 1. Grupo deve existir
     * 2. Usuário deve ser admin
     * 3. Alvo deve ser membro atual
     * 4. Admin não pode se banir (proteção contra auto-sabotagem)
     */
    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem banir membros.');
    }
    
    if (!group.members.includes(userIdToBan)) {
      throw new ForbiddenException('Usuário não é membro deste grupo.');
    }
    
    if (adminId === userIdToBan) {
      throw new ForbiddenException('Um administrador não pode se banir.');
    }

    /**
     * 🔄 PROCESSAMENTO COMPLETO DO BANIMENTO
     * 
     * 📚 CONCEITO - Complete Removal:
     * Remove o usuário de TODAS as listas do grupo:
     * 1. Lista de membros (perde acesso)
     * 2. Lista de admins (perde privilégios)
     * 
     * É uma "expulsão completa" - perde todos os direitos.
     */
    group.members = group.members.filter((id) => id !== userIdToBan);
    group.adminsId = group.adminsId.filter((id) => id !== userIdToBan);
    
    // 💾 Salvar alterações
    const updatedGroup = await this.groupRepo.update(group);
    
    return { 
      message: 'Usuário banido do grupo', 
      ...updatedGroup 
    };
  }
  
  /**
   * 🚪 ENDPOINT: SAIR DE UM GRUPO
   * 
   * 📚 CONCEITO - Voluntary Exit:
   * Permite que um membro saia voluntariamente do grupo.
   * É como "cancelar sua associação ao clube".
   * 
   * 🌐 ROTA: DELETE /groups/:id/leave
   * 📊 STATUS: 200 OK (não 204, pois retorna dados)
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * LÓGICA ESPECIAL - ÚLTIMO ADMIN:
   * Se o último admin sair, há duas possibilidades:
   * 1. lastAdminRule = 'delete' → Grupo é excluído
   * 2. lastAdminRule = 'promote' → Promove primeiro membro
   * 
   * É como "passar a chave do clube" antes de sair.
   * 
   * @param req - Requisição (usuário que está saindo)
   * @param groupId - ID do grupo (validado como UUID)
   * @returns Confirmação da saída ou exclusão do grupo
   */
  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sair de um grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Saiu do grupo com sucesso' })
  async leaveGroup(@Request() req, @Param('id', ParseUUIDPipe) groupId: string) {
    const { id: userId }: { id: string } = req.user; // 👤 ID do usuário que está saindo
    
    // 🔍 Buscar dados do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * ✅ VALIDAÇÕES BÁSICAS
     * 
     * 📚 CONCEITO:
     * Verificamos se o grupo existe e se o usuário
     * realmente é membro (não pode sair de algo
     * que não faz parte).
     */
    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    
    if (!group.members.includes(userId)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }

    /**
     * 🗑️ REMOÇÃO DO USUÁRIO DAS LISTAS
     * 
     * 📚 CONCEITO - Membership Removal:
     * Removemos o usuário da lista de membros.
     * Isso fará com que ele perca acesso ao grupo.
     */
    group.members = group.members.filter((id) => id !== userId);

    /**
     * 👑 LÓGICA ESPECIAL PARA ADMINS
     * 
     * 📚 CONCEITO - Administrative Succession:
     * Se o usuário que está saindo é admin, precisamos
     * lidar com a questão da administração do grupo.
     */
    if (group.adminsId.includes(userId)) {
      // Remove das permissões de admin
      group.adminsId = group.adminsId.filter((id) => id !== userId);
      
      /**
       * 🏛️ CENÁRIO: ÚLTIMO ADMIN SAINDO
       * 
       * 📚 CONCEITO - Succession Planning:
       * Quando o último admin sai, aplicamos as regras
       * de sucessão configuradas no grupo.
       */
      if (group.adminsId.length === 0) {
        
        /**
         * 🗑️ REGRA: DELETE - Excluir grupo
         * 
         * Se a regra é delete OU não há mais membros,
         * excluímos o grupo completamente.
         */
        if (group.lastAdminRule === 'delete' || group.members.length === 0) {
          await this.groupRepo.delete(groupId);
          return { message: 'Grupo excluído após saída do último admin' };
        } 
        /**
         * 🎖️ REGRA: PROMOTE - Promover próximo membro
         * 
         * Se há membros restantes, promovemos o primeiro
         * da lista para admin (sucessão automática).
         */
        else if (group.lastAdminRule === 'promote' && group.members.length > 0) {
          group.adminsId.push(group.members[0]);
        }
      }
    }

    /**
     * 💾 SALVAR ALTERAÇÕES
     * 
     * Se chegamos até aqui, o grupo não foi excluído,
     * então salvamos as mudanças no repository.
     */
    await this.groupRepo.update(group);
    
    return { message: 'Saiu do grupo com sucesso' };
  }

  /**
   * 🚨 ENDPOINT: SOLICITAR BANIMENTO DE USUÁRIO DA APLICAÇÃO
   * 
   * 📚 CONCEITO - Application-Wide Reporting:
   * Permite que usuários reportem outros para banimento do sistema inteiro.
   * É como "denunciar para a administração geral" vs. apenas expulsar do grupo.
   * 
   * 🌐 ROTA: PATCH /groups/ban-user/:userId
   * 🔐 AUTENTICAÇÃO: Requerida (JWT)
   * 
   * DIFERENÇAS IMPORTANTES:
   * - ban (anterior): Expulsa do grupo específico
   * - ban-user (este): Reporta para banimento global
   * 
   * FUNCIONALIDADE ATUAL:
   * Por enquanto, apenas registra o log da solicitação.
   * Em sistema completo, seria integrado com:
   * - Sistema de reports/denúncias
   * - Review de moderadores globais
   * - Processo de banimento do sistema
   * 
   * @param req - Requisição (usuário que está reportando)
   * @param userIdToBan - ID do usuário a ser reportado (validado como UUID)
   * @returns Confirmação do registro da solicitação
   */
  @Patch('ban-user/:userId')
  @ApiOperation({ summary: 'Requisitar banimento de usuário da aplicação' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser banido (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Requisição de banimento registrada' })
  async banUserFromApp(@Request() req, @Param('userId', ParseUUIDPipe) userIdToBan: string) {
    /**
     * 📝 REGISTRO DE AUDITORIA
     * 
     * 📚 CONCEITO - Audit Trail:
     * Registramos no console (em produção seria um logger profissional)
     * quem está solicitando o banimento de quem.
     * 
     * Isso é crucial para:
     * - Rastreamento de reports
     * - Investigação de abusos
     * - Responsabilização de denúncias falsas
     */
    console.log(
      `O usuário ${req.user.name} (${req.user.id}) requisitou o banimento do usuário ${userIdToBan}`,
    );
    
    /**
     * 📦 RESPOSTA DE CONFIRMAÇÃO
     * 
     * 📚 CONCEITO - User Feedback:
     * Informamos ao usuário que a solicitação foi registrada.
     * Em sistema completo, poderia incluir:
     * - Número do ticket/case
     * - Tempo estimado de análise
     * - Como acompanhar o status
     */
    return {
      message: `Requisição para banir o usuário ${userIdToBan} foi registrada.`,
    };
  }

  /**
   * ✏️ ENDPOINT: ATUALIZAR DADOS DO GRUPO
   * 
   * 📚 CONCEITO - Resource Update:
   * Permite que administradores modifiquem informações do grupo.
   * É como "reformar o clube" - mudar nome, descrição, regras, etc.
   * 
   * 🌐 ROTA: PATCH /groups/:id
   * 🔐 AUTENTICAÇÃO: Requerida (JWT + Admin do grupo)
   * 
   * CAMPOS ATUALIZÁVEIS (via UpdateGroupDto):
   * - name: Nome do grupo
   * - description: Descrição do grupo
   * - isPrivate: Se é privado ou público
   * - lastAdminRule: Regra quando último admin sai
   * - Outros campos definidos no DTO
   * 
   * EXEMPLO DE USO:
   * PATCH /groups/bb145801-dd77-4e34-bdea-bee5dd790f3e
   * Content-Type: application/json
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Body:
   * {
   *   "name": "Novo Nome do Grupo",
   *   "description": "Nova descrição mais detalhada",
   *   "isPrivate": true
   * }
   * 
   * @param req - Requisição (admin que está atualizando)
   * @param groupId - ID do grupo (validado como UUID)
   * @param updateGroupDto - Dados de atualização (validados pelo DTO)
   * @returns Confirmação da atualização e dados do grupo
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar grupo (apenas administradores)' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado com sucesso' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const { id: userId }: { id: string } = req.user; // 👑 ID do admin atualizador
    
    // 🔍 Buscar dados atuais do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * ✅ VALIDAÇÕES DE EXISTÊNCIA E AUTORIZAÇÃO
     * 
     * 📚 CONCEITO - Authorization Checks:
     * Verificamos se o grupo existe e se o usuário
     * tem permissão para fazer alterações.
     * 
     * Apenas admins podem modificar grupos.
     */
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(userId)) {
      throw new ForbiddenException('Apenas administradores podem atualizar o grupo');
    }

    /**
     * 🔄 APLICAÇÃO DAS ATUALIZAÇÕES
     * 
     * 📚 CONCEITO - Object Merging:
     * Usamos spread operator para mesclar:
     * 1. Dados atuais do grupo (...group)
     * 2. Novos dados fornecidos (...updateGroupDto)
     * 
     * Novos dados sobrescrevem os antigos.
     * Campos não fornecidos permanecem inalterados.
     */
    const updatedGroup = { ...group, ...updateGroupDto };
    
    // 💾 Salvar alterações no repository
    const result = await this.groupRepo.update(updatedGroup);
    
    /**
     * 📦 RESPOSTA FORMATADA
     * 
     * Retornamos confirmação mais os dados completos
     * atualizados para o frontend poder atualizar a UI.
     */
    return {
      message: 'Grupo atualizado com sucesso',
      group: result
    };
  }

  /**
   * 🗑️ ENDPOINT: EXCLUIR GRUPO PERMANENTEMENTE
   * 
   * 📚 CONCEITO - Resource Deletion:
   * Permite que administradores excluam o grupo completamente.
   * É como "fechar o clube permanentemente" - ação irreversível.
   * 
   * 🌐 ROTA: DELETE /groups/:id
   * 📊 STATUS: 204 No Content (sucesso sem conteúdo na resposta)
   * 🔐 AUTENTICAÇÃO: Requerida (JWT + Admin do grupo)
   * 
   * ⚠️ AÇÃO IRREVERSÍVEL:
   * - Grupo é removido permanentemente
   * - Todos os dados são perdidos
   * - Histórico de chats pode ser perdido
   * - Membros perdem acesso imediatamente
   * 
   * DIFERENÇA DE leaveGroup():
   * - leaveGroup: Saída individual, pode promover novo admin
   * - delete: Exclusão total por decisão administrativa
   * 
   * EXEMPLO DE USO:
   * DELETE /groups/bb145801-dd77-4e34-bdea-bee5dd790f3e
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * @param req - Requisição (admin que está excluindo)
   * @param groupId - ID do grupo (validado como UUID)
   * @returns Vazio (status 204 No Content)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir grupo (apenas administradores)' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 204, description: 'Grupo excluído com sucesso' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
  ) {
    const { id: userId }: { id: string } = req.user; // 👑 ID do admin que está excluindo
    
    // 🔍 Buscar dados do grupo
    const group = await this.groupRepo.findById(groupId);

    /**
     * ✅ VALIDAÇÕES CRÍTICAS DE SEGURANÇA
     * 
     * 📚 CONCEITO - Destructive Operation Security:
     * Para operações destrutivas como exclusão,
     * precisamos de validações rigorosas:
     * 1. Grupo deve existir
     * 2. Usuário deve ser admin (autorização)
     * 
     * Sem essas verificações, seria possível
     * excluir grupos de outros usuários.
     */
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(userId)) {
      throw new ForbiddenException('Apenas administradores podem excluir o grupo');
    }

    /**
     * 🗑️ EXECUÇÃO DA EXCLUSÃO
     * 
     * 📚 CONCEITO - Data Deletion:
     * Chamamos o repository para remover o grupo
     * permanentemente do sistema de persistência.
     * 
     * ⚠️ IMPORTANTE:
     * Em sistemas de produção, considerar:
     * - Soft delete (marcar como excluído)
     * - Backup antes da exclusão
     * - Notificar membros
     * - Limpar dados relacionados (chats, etc.)
     */
    await this.groupRepo.delete(groupId);
    
    /**
     * 📊 RESPOSTA VAZIA
     * 
     * 📚 CONCEITO - HTTP 204 No Content:
     * Para exclusões bem-sucedidas, retornamos
     * status 204 sem corpo na resposta.
     * 
     * Isso indica: "Operação bem-sucedida, nada mais a mostrar".
     */
    // Implicitamente retorna vazio com status 204
  }
}

/**
 * 📚 RESUMO EDUCACIONAL - GROUP CONTROLLER
 * 
 * 🎯 O QUE APRENDEMOS NESTE ARQUIVO:
 * 
 * 1. 🏗️ ARQUITETURA DE CONTROLLER:
 *    - Decorators do NestJS (@Controller, @Get, @Post, etc.)
 *    - Injeção de dependências no construtor
 *    - Documentação automática com Swagger
 * 
 * 2. 🔐 SEGURANÇA E AUTORIZAÇÃO:
 *    - Guards JWT para autenticação
 *    - Validações de permissão por role (admin)
 *    - Proteção contra auto-sabotagem
 *    - Validação de UUIDs com pipes
 * 
 * 3. 🎭 PADRÕES DE ENDPOINT:
 *    - GET: Buscar dados (meus grupos, todos os grupos)
 *    - POST: Criar recursos (novos grupos)
 *    - PATCH: Atualizações parciais (join, approve, ban, update)
 *    - DELETE: Remoção de recursos (leave, delete)
 * 
 * 4. 🧠 LÓGICA DE NEGÓCIO COMPLEXA:
 *    - Sucessão administrativa (quando último admin sai)
 *    - Diferentes tipos de banimento (grupo vs. aplicação)
 *    - Validações em cascata para operações críticas
 *    - Gerenciamento de estado de membership
 * 
 * 5. 📊 CÓDIGOS DE STATUS HTTP:
 *    - 200 OK: Operações de consulta e atualização
 *    - 201 Created: Criação de novos recursos
 *    - 204 No Content: Exclusões bem-sucedidas
 *    - 400 Bad Request: Dados inválidos
 *    - 403 Forbidden: Sem permissão
 *    - 404 Not Found: Recurso não encontrado
 * 
 * 6. 🎨 BOAS PRÁTICAS OBSERVADAS:
 *    - Validação de entrada com DTOs
 *    - Mensagens de erro descritivas
 *    - Logs de auditoria para ações críticas
 *    - Defensive programming (verificar arrays antes de usar)
 *    - Separação de concerns (controller → service → repository)
 * 
 * 🚀 PRÓXIMOS PASSOS PARA ESTUDAR:
 * - DTOs de validação (CreateGroupDto, UpdateGroupDto)
 * - Repository pattern (GroupRepository)
 * - Entity design (como os grupos são modelados)
 * - Testes unitários para lógica de negócio
 * - Integração com WebSocket para notificações em tempo real
 * 
 * 💡 CONCEITOS AVANÇADOS DEMONSTRADOS:
 * - State machines (pending → member)
 * - Administrative hierarchies (member → admin)
 * - Succession planning (automated admin promotion)
 * - Audit trails (logging administrative actions)
 * - Resource lifecycle management (create → manage → delete)
 */