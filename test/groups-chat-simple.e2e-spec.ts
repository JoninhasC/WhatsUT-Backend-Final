import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * 👥 TESTES BÁSICOS DE GRUPOS E CHAT - E2E Tests
 * 
 * Testes essenciais de funcionalidades de grupos e chat
 */
describe('👥 Groups & Chat - Basic E2E Tests', () => {
  let app: INestApplication;

  // Dados de teste
  const admin = {
    name: 'Admin Test',
    password: 'AdminPass@123',
  };

  const member = {
    name: 'Member Test',
    password: 'MemberPass@456',
  };

  // Tokens e IDs
  let adminToken: string;
  let memberToken: string;
  let adminId: string;
  let memberId: string;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================
  // 🚀 PREPARAÇÃO
  // ========================================

  describe('🚀 Preparação - Criar usuários', () => {
    
    it('✅ Deve criar usuário admin', async () => {
      // Registrar admin
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(admin)
        .expect(201);

      // Login admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(admin)
        .expect(200);

      adminToken = loginResponse.body.access_token;
      expect(adminToken).toBeDefined();

      // Obter ID admin
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      adminId = profileResponse.body.id;
      expect(adminId).toBeDefined();
    }, 15000);

    it('✅ Deve criar usuário membro', async () => {
      // Registrar membro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(member)
        .expect(201);

      // Login membro
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(member)
        .expect(200);

      memberToken = loginResponse.body.access_token;
      expect(memberToken).toBeDefined();

      // Obter ID membro
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      memberId = profileResponse.body.id;
      expect(memberId).toBeDefined();
    }, 15000);
  });

  // ========================================
  // 👥 TESTES DE GRUPOS
  // ========================================

  describe('👥 Grupos - CRUD Básico', () => {
    
    it('✅ Deve criar grupo', async () => {
      const groupData = {
        name: 'Grupo Teste E2E',
        adminsId: [adminId],
        members: [adminId],
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

      groupId = response.body.id;
      expect(groupId).toBeDefined();
    });

    it('✅ Deve listar grupos', async () => {
      const response = await request(app.getHttpServer())
        .get('/group')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      const createdGroup = response.body.find(g => g.id === groupId);
      expect(createdGroup).toBeDefined();
    });

    it('✅ Deve membro solicitar entrada no grupo', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.message).toContain('Solicitação');
    });

    it('✅ Admin deve aprovar entrada do membro', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}/approve/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.members).toContain(memberId);
    });

    it('✅ Deve atualizar nome do grupo', async () => {
      const updateData = {
        name: 'Grupo Atualizado E2E'
      };

      const response = await request(app.getHttpServer())
        .patch(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Grupo atualizado com sucesso');
      expect(response.body.group.name).toBe('Grupo Atualizado E2E');
    });
  });

  // ========================================
  // 💬 TESTES DE CHAT
  // ========================================

  describe('💬 Chat - Mensagens em Grupo', () => {
    
    it('✅ Admin deve enviar mensagem no grupo', async () => {
      const messageData = {
        content: 'Mensagem de teste do admin!',
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

    it('✅ Membro deve enviar mensagem no grupo', async () => {
      const messageData = {
        content: 'Mensagem de teste do membro!',
        type: 'text'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(memberId);
    });

    it('✅ Deve obter mensagens do grupo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const adminMessage = response.body.find(m => m.content === 'Mensagem de teste do admin!');
      const memberMessage = response.body.find(m => m.content === 'Mensagem de teste do membro!');
      
      expect(adminMessage).toBeDefined();
      expect(memberMessage).toBeDefined();
    });

    it('✅ Deve fazer upload de arquivo no grupo', async () => {
      const testFile = Buffer.from('Conteúdo do arquivo de teste');
      
      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}/file`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testFile, 'teste.txt')
        .expect(201);

      expect(response.body.message).toBe('Arquivo enviado com sucesso');
      expect(response.body.data.type).toBe('file');
      expect(response.body.data.fileName).toBe('teste.txt');
      expect(response.body.data.senderId).toBe(adminId);
      expect(response.body.data.groupId).toBe(groupId);
    });
  });

  // ========================================
  // ❌ TESTES DE VALIDAÇÃO
  // ========================================

  describe('❌ Validações de Segurança', () => {
    
    it('❌ Deve rejeitar criação de grupo com dados inválidos', async () => {
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

    it('❌ Não-membro não deve conseguir acessar grupo inexistente', async () => {
      // Criar usuário temporário
      const outsider = {
        name: 'Outsider Test',
        password: 'OutsiderPass@789',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(outsider)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(outsider)
        .expect(200);

      const outsiderToken = loginResponse.body.access_token;

      // Tentar enviar mensagem em grupo que não é membro
      await request(app.getHttpServer())
        .post(`/chat/group/00000000-0000-4000-8000-000000000000`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          content: 'Mensagem não autorizada',
          type: 'text'
        })
        .expect(404); // Grupo não encontrado
    });
  });

  // ========================================
  // 🗑️ TESTES DE LIMPEZA
  // ========================================

  describe('🗑️ Limpeza - Remoção do Grupo', () => {
    
    it('✅ Admin deve excluir o grupo', async () => {
      await request(app.getHttpServer())
        .delete(`/group/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('✅ Grupo deve estar excluído', async () => {
      const response = await request(app.getHttpServer())
        .get('/group')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedGroup = response.body.find(g => g.id === groupId);
      expect(deletedGroup).toBeUndefined();
    });
  });
});
