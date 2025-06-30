import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRepository } from '../src/users/csv-user.repository';
import { GroupRepository } from '../src/group/group.repository';
import { ChatRepository } from '../src/chat/chat.repository';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 👥 TESTES DE GRUPOS E 💬 CHAT - E2E Tests
 * 
 * Cobertura completa das funcionalidades:
 * - Criação e gerenciamento de grupos
 * - Entrada, aprovação e rejeição de membros
 * - Banimento e saída de grupos
 * - Chat em grupos
 * - Upload de arquivos em grupos
 * - Validações de segurança
 */
describe('👥 Groups & 💬 Chat - Complete E2E Tests', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let groupRepository: GroupRepository;
  let chatRepository: ChatRepository;

  // Usuários de teste
  const admin = {
    name: 'Admin Silva',
    password: 'AdminPass@123',
  };

  const member1 = {
    name: 'Membro Um',
    password: 'MembroPass@456',
  };

  const member2 = {
    name: 'Membro Dois', 
    password: 'MembroPass@789',
  };

  const outsider = {
    name: 'Usuário Externo',
    password: 'ExternoPass@000',
  };

  // Tokens de autenticação
  let adminToken: string;
  let member1Token: string;
  let member2Token: string;
  let outsiderToken: string;

  // IDs dos usuários
  let adminId: string;
  let member1Id: string;
  let member2Id: string;
  let outsiderId: string;

  // IDs dos grupos
  let groupId: string;
  let secondGroupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    groupRepository = moduleFixture.get<GroupRepository>(GroupRepository);
    chatRepository = moduleFixture.get<ChatRepository>(ChatRepository);

    await app.init();

    // Garantir que os diretórios e arquivos CSV existam
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================
  // 🚀 PREPARAÇÃO: CRIAR USUÁRIOS DE TESTE
  // ========================================

  describe('🚀 1. PREPARAÇÃO - CRIAÇÃO DE USUÁRIOS', () => {
    
    it('✅ Deve cadastrar usuário admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(admin)
        .expect(201);

      expect(response.body).toBeDefined();
      
      // Fazer login para obter token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(admin)
        .expect(200);

      adminToken = loginResponse.body.access_token;
      expect(adminToken).toBeDefined();

      // Obter ID do usuário
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      adminId = profileResponse.body.id;
      expect(adminId).toBeDefined();
    }, 10000);

    it('✅ Deve cadastrar membro 1', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(member1)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(member1)
        .expect(200);

      member1Token = loginResponse.body.access_token;

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      member1Id = profileResponse.body.id;
    }, 10000);

    it('✅ Deve cadastrar membro 2', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(member2)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(member2)
        .expect(200);

      member2Token = loginResponse.body.access_token;

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${member2Token}`)
        .expect(200);

      member2Id = profileResponse.body.id;
    });

    it('✅ Deve cadastrar usuário externo', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(outsider)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(outsider)
        .expect(200);

      outsiderToken = loginResponse.body.access_token;

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);

      outsiderId = profileResponse.body.id;
    });
  });

  // ========================================
  // 👥 TESTES DE CRIAÇÃO DE GRUPOS
  // ========================================

  describe('👥 2. CRIAÇÃO DE GRUPOS', () => {
    
    it('✅ Deve criar grupo com admin e membros', async () => {
      const groupData = {
        name: 'Grupo de Teste',
        adminsId: [adminId],
        members: [adminId, member1Id],
        lastAdminRule: 'promote'
      };

      const response = await request(app.getHttpServer())
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.name).toBe(groupData.name);
      expect(response.body.adminsId).toContain(adminId);
      expect(response.body.members).toContain(adminId);
      expect(response.body.members).toContain(member1Id);

      groupId = response.body.id;
      expect(groupId).toBeDefined();
    });

    it('❌ Deve rejeitar criação com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // Nome vazio
          adminsId: [adminId],
          members: [adminId],
          lastAdminRule: 'promote'
        })
        .expect(400);
    });

    it('❌ Deve rejeitar criação com nome contendo XSS', async () => {
      await request(app.getHttpServer())
        .post('/group/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<script>alert("xss")</script>',
          adminsId: [adminId],
          members: [adminId],
          lastAdminRule: 'promote'
        })
        .expect(400);
    });

    it('✅ Deve criar segundo grupo para testes', async () => {
      const groupData = {
        name: 'Segundo Grupo',
        adminsId: [member1Id],
        members: [member1Id],
        lastAdminRule: 'delete'
      };

      const response = await request(app.getHttpServer())
        .post('/group/create')
        .set('Authorization', `Bearer ${member1Token}`)
        .send(groupData)
        .expect(201);

      secondGroupId = response.body.id;
    });
  });

  // ========================================
  // 📋 TESTES DE LISTAGEM DE GRUPOS
  // ========================================

  describe('📋 3. LISTAGEM DE GRUPOS', () => {
    
    it('✅ Deve listar todos os grupos', async () => {
      const response = await request(app.getHttpServer())
        .get('/group')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const createdGroup = response.body.find(g => g.id === groupId);
      expect(createdGroup).toBeDefined();
      expect(createdGroup.name).toBe('Grupo de Teste');
    });

    it('✅ Deve listar grupos do usuário (my)', async () => {
      const response = await request(app.getHttpServer())
        .get('/group/my')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const userGroup = response.body.find(g => g.id === groupId);
      expect(userGroup).toBeDefined();
    });
  });

  // ========================================
  // 🔄 TESTES DE SOLICITAÇÃO DE ENTRADA
  // ========================================

  describe('🔄 4. SOLICITAÇÃO DE ENTRADA EM GRUPOS', () => {
    
    it('✅ Usuário externo deve solicitar entrada no grupo', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/join`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);

      expect(response.body.message).toContain('solicitação de entrada');
      
      // Verificar se a solicitação foi registrada
      const groups = await groupRepository.findAll();
      const group = groups.find(g => g.id === groupId);
      expect(group).toBeDefined();
      expect(group!.pendingRequests).toContain(outsiderId);
    });

    it('❌ Deve rejeitar solicitação se usuário já é membro', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/join`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(400);
    });

    it('❌ Deve rejeitar solicitação com ID de grupo inválido', async () => {
      await request(app.getHttpServer())
        .patch('/group/invalid-id/join')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(400);
    });
  });

  // ========================================
  // ✅ TESTES DE APROVAÇÃO DE MEMBROS
  // ========================================

  describe('✅ 5. APROVAÇÃO DE MEMBROS', () => {
    
    it('✅ Admin deve aprovar entrada do usuário externo', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/approve/${outsiderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.members).toContain(outsiderId);
      expect(response.body.pendingRequests).not.toContain(outsiderId);
    });

    it('❌ Não-admin não deve conseguir aprovar membros', async () => {
      // Primeiro, membro2 solicita entrada
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/join`)
        .set('Authorization', `Bearer ${member2Token}`)
        .expect(200);

      // Tentar aprovar com usuário não-admin
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/approve/${member2Id}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(403);
    });

    it('✅ Admin deve aprovar segundo membro', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/approve/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ========================================
  // ❌ TESTES DE REJEIÇÃO DE MEMBROS
  // ========================================

  describe('❌ 6. REJEIÇÃO DE MEMBROS', () => {
    
    it('✅ Deve criar solicitação para testar rejeição', async () => {
      // Primeiro remove outsider para testar rejeição
      await request(app.getHttpServer())
        .delete(`/group/${groupId}/leave`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);

      // Solicita entrada novamente
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/join`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);
    });

    it('✅ Admin deve rejeitar entrada do usuário', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/reject/${outsiderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('rejeitada');
      
      // Verificar se foi removido das solicitações pendentes
      const groups = await groupRepository.findAll();
      const group = groups.find(g => g.id === groupId);
      expect(group).toBeDefined();
      expect(group!.pendingRequests).not.toContain(outsiderId);
    });

    it('❌ Não-admin não deve conseguir rejeitar membros', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/reject/${outsiderId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(403);
    });
  });

  // ========================================
  // 💬 TESTES DE CHAT EM GRUPOS
  // ========================================

  describe('💬 7. CHAT EM GRUPOS', () => {
    
    it('✅ Membro deve enviar mensagem no grupo', async () => {
      const messageData = {
        content: 'Primeira mensagem no grupo!',
        type: 'text'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(adminId);
      expect(response.body.data.groupId).toBe(groupId);
    });

    it('✅ Outro membro deve enviar mensagem', async () => {
      const messageData = {
        content: 'Segunda mensagem do grupo!',
        type: 'text'
      };

      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send(messageData)
        .expect(201);
    });

    it('✅ Deve obter mensagens do grupo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const firstMessage = response.body.find(m => m.content === 'Primeira mensagem no grupo!');
      expect(firstMessage).toBeDefined();
      expect(firstMessage.senderId).toBe(adminId);
    });

    it('❌ Não-membro não deve conseguir enviar mensagem', async () => {
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          content: 'Mensagem não autorizada',
          type: 'text'
        })
        .expect(403);
    });

    it('❌ Deve rejeitar mensagem com XSS', async () => {
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: '<script>alert("xss")</script>',
          type: 'text'
        })
        .expect(400);
    });
  });

  // ========================================
  // 📁 TESTES DE UPLOAD EM GRUPOS
  // ========================================

  describe('📁 8. UPLOAD DE ARQUIVOS EM GRUPOS', () => {
    
    it('✅ Deve fazer upload de arquivo no grupo', async () => {
      // Criar arquivo de teste
      const testFile = Buffer.from('Conteúdo do arquivo de teste');
      
      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}/file`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testFile, 'test-file.txt')
        .expect(201);

      expect(response.body.message).toBe('Arquivo enviado com sucesso');
      expect(response.body.data.type).toBe('file');
      expect(response.body.data.fileName).toBe('test-file.txt');
      expect(response.body.data.senderId).toBe(adminId);
      expect(response.body.data.groupId).toBe(groupId);
    });

    it('❌ Não-membro não deve conseguir fazer upload', async () => {
      const testFile = Buffer.from('Arquivo não autorizado');
      
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}/file`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .attach('file', testFile, 'unauthorized.txt')
        .expect(403);
    });

    it('❌ Deve rejeitar arquivo muito grande', async () => {
      // Criar arquivo > 5MB
      const largeFile = Buffer.alloc(6 * 1024 * 1024, 'a');
      
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}/file`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', largeFile, 'large-file.txt')
        .expect(400);
    });
  });

  // ========================================
  // 🚫 TESTES DE BANIMENTO
  // ========================================

  describe('🚫 9. BANIMENTO DE MEMBROS', () => {
    
    it('✅ Admin deve banir membro do grupo', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/ban/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('banido');
      
      // Verificar se foi removido dos membros
      const groups = await groupRepository.findAll();
      const group = groups.find(g => g.id === groupId);
      expect(group).toBeDefined();
      expect(group!.members).not.toContain(member2Id);
    });

    it('❌ Usuário banido não deve conseguir enviar mensagens', async () => {
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          content: 'Mensagem após banimento',
          type: 'text'
        })
        .expect(403);
    });

    it('❌ Não-admin não deve conseguir banir membros', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}/ban/${member1Id}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(403);
    });
  });

  // ========================================
  // 🚪 TESTES DE SAÍDA DE GRUPOS
  // ========================================

  describe('🚪 10. SAÍDA DE GRUPOS', () => {
    
    it('✅ Membro deve sair do grupo', async () => {
      await request(app.getHttpServer())
        .delete(`/group/${groupId}/leave`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      // Verificar se foi removido
      const groups = await groupRepository.findAll();
      const group = groups.find(g => g.id === groupId);
      expect(group).toBeDefined();
      expect(group!.members).not.toContain(member1Id);
    });

    it('❌ Usuário que saiu não deve conseguir enviar mensagens', async () => {
      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          content: 'Mensagem após sair',
          type: 'text'
        })
        .expect(403);
    });
  });

  // ========================================
  // ✏️ TESTES DE ATUALIZAÇÃO DE GRUPOS
  // ========================================

  describe('✏️ 11. ATUALIZAÇÃO DE GRUPOS', () => {
    
    it('✅ Admin deve atualizar nome do grupo', async () => {
      const updateData = {
        name: 'Grupo Atualizado'
      };

      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Grupo atualizado com sucesso');
      expect(response.body.group.name).toBe('Grupo Atualizado');
    });

    it('❌ Não-admin não deve conseguir atualizar grupo', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ name: 'Tentativa de atualização' })
        .expect(403);
    });

    it('❌ Deve rejeitar atualização com dados inválidos', async () => {
      await request(app.getHttpServer())
        .patch(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '<script>alert("xss")</script>' })
        .expect(400);
    });
  });

  // ========================================
  // 🗑️ TESTES DE EXCLUSÃO DE GRUPOS
  // ========================================

  describe('🗑️ 12. EXCLUSÃO DE GRUPOS', () => {
    
    it('✅ Admin deve excluir grupo', async () => {
      await request(app.getHttpServer())
        .delete(`/group/${secondGroupId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(204);

      // Verificar se foi excluído
      const groups = await groupRepository.findAll();
      const deletedGroup = groups.find(g => g.id === secondGroupId);
      expect(deletedGroup).toBeUndefined();
    });

    it('❌ Não-admin não deve conseguir excluir grupo', async () => {
      await request(app.getHttpServer())
        .delete(`/group/${groupId}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(403);
    });

    it('❌ Deve retornar 404 para grupo inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/group/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ========================================
  // 📊 TESTES DE INTEGRIDADE DE DADOS
  // ========================================

  describe('📊 13. INTEGRIDADE DE DADOS', () => {
    
    it('✅ Deve manter consistência dos dados de grupos', async () => {
      const groups = await groupRepository.findAll();
      
      expect(groups.length).toBeGreaterThanOrEqual(1);
      
      groups.forEach(group => {
        expect(group.id).toBeDefined();
        expect(group.name).toBeDefined();
        expect(Array.isArray(group.members)).toBe(true);
        expect(Array.isArray(group.adminsId)).toBe(true);
        expect(group.adminsId.length).toBeGreaterThan(0);
      });
    });

    it('✅ Deve manter consistência dos dados de chat', async () => {
      // Obter chats do grupo para verificar consistência
      const groupChats = await chatRepository.findGroupChat(groupId);
      
      groupChats.forEach(chat => {
        expect(chat.id).toBeDefined();
        expect(chat.senderId).toBeDefined();
        expect(chat.content).toBeDefined();
        expect(['text', 'file'].includes(chat.chatType)).toBe(true);
      });
    });

    it('✅ Deve preservar relações entre usuários e grupos', async () => {
      const groups = await groupRepository.findAll();
      const users = await userRepository.findAll();
      
      const remainingGroup = groups.find(g => g.id === groupId);
      if (remainingGroup) {
        // Verificar se todos os membros existem
        remainingGroup.members.forEach(memberId => {
          const memberExists = users.some(u => u.id === memberId);
          expect(memberExists).toBe(true);
        });

        // Verificar se todos os admins existem
        remainingGroup.adminsId.forEach(adminId => {
          const adminExists = users.some(u => u.id === adminId);
          expect(adminExists).toBe(true);
        });
      }
    });
  });
});
