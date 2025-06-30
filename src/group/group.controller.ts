import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  ForbiddenException,
  UseGuards,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupRepository } from './group.repository';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BanService } from '../bans/ban.service';

@ApiTags('Grupos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(['groups', 'group'])
export class GroupController {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly banService: BanService,
  ) {}

  @Get('my')
  @ApiOperation({ summary: 'Obter grupos do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de grupos do usuário' })
  async myGroups(@Request() req) {
    return await this.groupRepo.findMyGroups(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os grupos' })
  @ApiResponse({ status: 200, description: 'Lista de todos os grupos' })
  async findAll() {
    return await this.groupRepo.findAll();
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo grupo' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso' })
  async create(
    @Request() req,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    const { id }: { id: string } = req.user;
    
    // Verificar se o usuário está banido
    await this.banService.validateUserAccess(id);
    
    // Inicializar arrays vazios se não fornecidos
    const members = createGroupDto.members ? [...createGroupDto.members] : [];
    const adminsId = createGroupDto.adminsId ? [...createGroupDto.adminsId] : [];

    // Garantir que o criador seja membro e admin
    if (!members.includes(id)) {
      members.push(id);
    }

    if (!adminsId.includes(id)) {
      adminsId.push(id);
    }

    return await this.groupRepo.create({
      ...createGroupDto,
      members,
      adminsId,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo grupo (compatibilidade)' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso' })
  async createCompat(
    @Request() req,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    // Validação mínima - apenas nome é obrigatório
    if (!createGroupDto.name) {
      throw new BadRequestException('Nome do grupo é obrigatório');
    }
    
    const group = await this.create(req, createGroupDto);
    return {
      message: 'Grupo criado com sucesso',
      ...group
    };
  }

  @Patch(':id/join')
  @ApiOperation({ summary: 'Solicitar entrada em um grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Solicitação de entrada enviada' })
  async join(@Request() req, @Param('id', ParseUUIDPipe) groupId: string) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    if (group.pendingRequests?.includes(userId) || group.members?.includes(userId)) {
      throw new BadRequestException(
        'Usuário já é membro ou tem uma solicitação pendente.',
      );
    }

    group.pendingRequests.push(userId);
    const updatedGroup = await this.groupRepo.update(group);
    
    return {
      message: 'Solicitação de entrada enviada',
      ...updatedGroup
    };
  }

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
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

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

    group.members.push(userIdToApprove);
    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToApprove);
    const updatedGroup = await this.groupRepo.update(group);
    return { message: 'Usuário aprovado no grupo', ...updatedGroup };
  }

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
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.adminsId.includes(adminId)) {
      throw new ForbiddenException('Apenas administradores podem rejeitar membros');
    }

    group.pendingRequests = group.pendingRequests.filter((id) => id !== userIdToReject);
    const updatedGroup = await this.groupRepo.update(group);
    return { message: 'Solicitação rejeitada', ...updatedGroup };
  }

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
    const { id: adminId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

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

    group.members = group.members.filter((id) => id !== userIdToBan);
    group.adminsId = group.adminsId.filter((id) => id !== userIdToBan);
    const updatedGroup = await this.groupRepo.update(group);
    return { message: 'Usuário banido do grupo', ...updatedGroup };
  }
  
  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sair de um grupo' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Saiu do grupo com sucesso' })
  async leaveGroup(@Request() req, @Param('id', ParseUUIDPipe) groupId: string) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new ForbiddenException('Grupo não encontrado');
    }
    if (!group.members.includes(userId)) {
      throw new ForbiddenException('Usuário não é membro deste grupo');
    }

    group.members = group.members.filter((id) => id !== userId);

    if (group.adminsId.includes(userId)) {
      group.adminsId = group.adminsId.filter((id) => id !== userId);
      
      if (group.adminsId.length === 0) {
        if (group.lastAdminRule === 'delete' || group.members.length === 0) {
          await this.groupRepo.delete(groupId);
          return { message: 'Grupo excluído após saída do último admin' };
        } 
        else if (group.lastAdminRule === 'promote' && group.members.length > 0) {
          group.adminsId.push(group.members[0]);
        }
      }
    }

    await this.groupRepo.update(group);
    return { message: 'Saiu do grupo com sucesso' };
  }

  @Patch('ban-user/:userId')
  @ApiOperation({ summary: 'Requisitar banimento de usuário da aplicação' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser banido (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Requisição de banimento registrada' })
  async banUserFromApp(@Request() req, @Param('userId', ParseUUIDPipe) userIdToBan: string) {
    console.log(
      `O usuário ${req.user.name} (${req.user.id}) requisitou o banimento do usuário ${userIdToBan}`,
    );
    return {
      message: `Requisição para banir o usuário ${userIdToBan} foi registrada.`,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar grupo (apenas administradores)' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado com sucesso' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(userId)) {
      throw new ForbiddenException('Apenas administradores podem atualizar o grupo');
    }

    const updatedGroup = { ...group, ...updateGroupDto };
    const result = await this.groupRepo.update(updatedGroup);
    
    return {
      message: 'Grupo atualizado com sucesso',
      group: result
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir grupo (apenas administradores)' })
  @ApiParam({ name: 'id', description: 'ID do grupo (UUID)', example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e' })
  @ApiResponse({ status: 204, description: 'Grupo excluído com sucesso' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) groupId: string,
  ) {
    const { id: userId }: { id: string } = req.user;
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }
    
    if (!group.adminsId.includes(userId)) {
      throw new ForbiddenException('Apenas administradores podem excluir o grupo');
    }

    await this.groupRepo.delete(groupId);
  }
}