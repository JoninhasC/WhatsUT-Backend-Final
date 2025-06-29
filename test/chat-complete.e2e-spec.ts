import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 💬 TESTES COMPLETOS DE CHAT - E2E Tests
 * 
 * Testes abrangentes de funcionalidades de chat:
 * - Chat privado entre usuários
 * - Chat em grupos
 * - Upload de arquivos
 * - Validações de segurança
 */
describe('💬 Chat - Complete E2E Tests', () => {
  let app: INestApplication;

  // Dados de teste
  const user1 = {
    name: 'Alice Chat',
    password: 'AliceChat@123',
  };

  const user2 = {
    name: 'Bob Chat',
    password: 'BobChat@456',
  };

  const user3 = {
    name: 'Charlie Chat',
    password: 'CharlieChat@789',
  };

  // Tokens e IDs
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let groupId: string;

  beforeAll(async () => {
    // Limpar arquivos CSV antes dos testes
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Reset users.csv
    const usersFile = path.join(dataDir, 'users.csv');
    fs.writeFileSync(usersFile, 'id,name,password\n');

    // Reset groups.csv
    const groupsFile = path.join(dataDir, 'groups.csv');
    fs.writeFileSync(groupsFile, 'id,name,adminsId,members,pendingRequests,lastAdminRule\n');

    // Reset chats.csv
    const chatsFile = path.join(dataDir, 'chats.csv');
    fs.writeFileSync(chatsFile, 'id,senderId,content,timestamp,chatType,targetId,isArquivo\n');

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
  // 🚀 PREPARAÇÃO - USUÁRIOS E GRUPO
  // ========================================

  describe('🚀 Preparação - Criar usuários e grupo', () => {
    
    it('✅ Deve criar três usuários para teste', async () => {
      // Registrar User 1
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(201);

      // Login User 1
      const login1Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user1)
        .expect(200);

      user1Token = login1Response.body.access_token;
      expect(user1Token).toBeDefined();

      // Obter ID User 1
      const profile1Response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      user1Id = profile1Response.body.id;
      expect(user1Id).toBeDefined();

      // Registrar User 2
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(201);

      // Login User 2
      const login2Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user2)
        .expect(200);

      user2Token = login2Response.body.access_token;
      expect(user2Token).toBeDefined();

      // Obter ID User 2
      const profile2Response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      user2Id = profile2Response.body.id;
      expect(user2Id).toBeDefined();

      // Registrar User 3
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user3)
        .expect(201);

      // Login User 3
      const login3Response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user3)
        .expect(200);

      user3Token = login3Response.body.access_token;
      expect(user3Token).toBeDefined();

      // Obter ID User 3
      const profile3Response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      user3Id = profile3Response.body.id;
      expect(user3Id).toBeDefined();
    }, 20000);

    it('✅ Deve criar grupo para testes de chat em grupo', async () => {
      const groupData = {
        name: 'Grupo Chat Teste',
        adminsId: [user1Id],
        members: [user1Id, user2Id],
        lastAdminRule: 'promote'
      };

      const response = await request(app.getHttpServer())
        .post('/group/create')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(groupData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.name).toBe(groupData.name);
      expect(response.body.adminsId).toContain(user1Id);
      expect(response.body.members).toContain(user1Id);
      expect(response.body.members).toContain(user2Id);

      groupId = response.body.id;
      expect(groupId).toBeDefined();
    });
  });

  // ========================================
  // 💬 TESTES DE CHAT PRIVADO
  // ========================================

  describe('💬 Chat Privado - Mensagens entre usuários', () => {
    
    it('✅ User1 deve enviar mensagem privada para User2', async () => {
      const messageData = {
        content: 'Olá Bob, como vai?'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(user1Id);
      expect(response.body.data.targetId).toBe(user2Id);
      expect(response.body.data.chatType).toBe('private');
    });

    it('✅ User2 deve responder mensagem privada para User1', async () => {
      const messageData = {
        content: 'Oi Alice! Tudo bem, e você?'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/private/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(user2Id);
      expect(response.body.data.targetId).toBe(user1Id);
      expect(response.body.data.chatType).toBe('private');
    });

    it('✅ Deve obter conversas privadas entre User1 e User2', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const message1 = response.body.find(m => m.content === 'Olá Bob, como vai?');
      const message2 = response.body.find(m => m.content === 'Oi Alice! Tudo bem, e você?');
      
      expect(message1).toBeDefined();
      expect(message2).toBeDefined();
      expect(message1.chatType).toBe('private');
      expect(message2.chatType).toBe('private');
    });

    it('✅ User2 deve ver as mesmas conversas privadas com User1', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/private/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const message1 = response.body.find(m => m.content === 'Olá Bob, como vai?');
      const message2 = response.body.find(m => m.content === 'Oi Alice! Tudo bem, e você?');
      
      expect(message1).toBeDefined();
      expect(message2).toBeDefined();
    });

    it('✅ Deve fazer upload de arquivo em chat privado', async () => {
      const testFile = Buffer.from('Conteúdo do arquivo privado de teste');
      
      const response = await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}/file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', testFile, 'documento-privado.txt')
        .expect(201);

      expect(response.body.message).toBe('Arquivo enviado com sucesso');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.senderId).toBe(user1Id);
      expect(response.body.data.targetId).toBe(user2Id);
      expect(response.body.data.chatType).toBe('private');
      expect(response.body.data.isArquivo).toBe(true);
      expect(response.body.data.type).toBe('file');
      expect(response.body.data.fileName).toBe('documento-privado.txt');
    });
  });

  // ========================================
  // 👥 TESTES DE CHAT EM GRUPO
  // ========================================

  describe('👥 Chat em Grupo - Mensagens coletivas', () => {
    
    it('✅ User1 (admin) deve enviar mensagem no grupo', async () => {
      const messageData = {
        content: 'Bem-vindos ao grupo pessoal!'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(user1Id);
      expect(response.body.data.groupId).toBe(groupId);
    });

    it('✅ User2 (membro) deve enviar mensagem no grupo', async () => {
      const messageData = {
        content: 'Obrigado pela recepção Alice!'
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.senderId).toBe(user2Id);
    });

    it('✅ Deve obter todas as mensagens do grupo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const adminMessage = response.body.find(m => m.content === 'Bem-vindos ao grupo pessoal!');
      const memberMessage = response.body.find(m => m.content === 'Obrigado pela recepção Alice!');
      
      expect(adminMessage).toBeDefined();
      expect(memberMessage).toBeDefined();
      expect(adminMessage.chatType).toBe('group');
      expect(memberMessage.chatType).toBe('group');
    });

    it('✅ Deve fazer upload de arquivo no grupo', async () => {
      const testFile = Buffer.from('Conteúdo do arquivo do grupo');
      
      const response = await request(app.getHttpServer())
        .post(`/chat/group/${groupId}/file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', testFile, 'documento-grupo.txt')
        .expect(201);

      expect(response.body.message).toBe('Arquivo enviado com sucesso');
      expect(response.body.data.type).toBe('file');
      expect(response.body.data.fileName).toBe('documento-grupo.txt');
      expect(response.body.data.senderId).toBe(user1Id);
      expect(response.body.data.groupId).toBe(groupId);
    });
  });

  // ========================================
  // ❌ TESTES DE VALIDAÇÕES E SEGURANÇA
  // ========================================

  describe('❌ Validações e Segurança', () => {
    
    it('❌ User3 não deve conseguir enviar mensagem no grupo (não é membro)', async () => {
      const messageData = {
        content: 'Tentativa de invasão'
      };

      await request(app.getHttpServer())
        .post(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .send(messageData)
        .expect(403); // Forbidden - não é membro
    });

    it('❌ Não deve enviar mensagem com conteúdo inválido', async () => {
      await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: '<script>alert("xss")</script>' // Conteúdo perigoso
        })
        .expect(400); // Bad Request - validação falhou
    });

    it('❌ Não deve enviar mensagem vazia', async () => {
      await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: '' // Conteúdo vazio
        })
        .expect(400); // Bad Request - validação falhou
    });

    it('❌ Não deve conseguir acessar chat privado com UUID inválido', async () => {
      await request(app.getHttpServer())
        .get('/chat/private/invalid-uuid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400); // Bad Request - UUID inválido
    });

    it('❌ Não deve conseguir enviar arquivo com tipo não permitido', async () => {
      const testFile = Buffer.from('Conteúdo malicioso');
      
      await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}/file`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', testFile, 'malware.exe')
        .expect(400); // Bad Request - tipo de arquivo não permitido
    });

    it('❌ Não deve conseguir enviar mensagem sem autenticação', async () => {
      await request(app.getHttpServer())
        .post(`/chat/private/${user2Id}`)
        .send({
          content: 'Mensagem sem auth'
        })
        .expect(401); // Unauthorized
    });
  });

  // ========================================
  // 📊 TESTES DE INTEGRIDADE
  // ========================================

  describe('📊 Integridade dos Dados', () => {
    
    it('✅ Mensagens privadas devem estar isoladas por conversa', async () => {
      // User1 envia mensagem para User3 (nova conversa)
      await request(app.getHttpServer())
        .post(`/chat/private/${user3Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Olá Charlie!'
        })
        .expect(201);

      // Verificar conversa User1-User2 (não deve ter mensagem para User3)
      const user1User2Chat = await request(app.getHttpServer())
        .get(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const messageToCharlie = user1User2Chat.body.find(m => m.content === 'Olá Charlie!');
      expect(messageToCharlie).toBeUndefined(); // Não deve existir na conversa User1-User2

      // Verificar conversa User1-User3 (deve ter a mensagem)
      const user1User3Chat = await request(app.getHttpServer())
        .get(`/chat/private/${user3Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const messageToCharlie2 = user1User3Chat.body.find(m => m.content === 'Olá Charlie!');
      expect(messageToCharlie2).toBeDefined(); // Deve existir na conversa User1-User3
    });

    it('✅ Mensagens de grupo devem estar separadas de chats privados', async () => {
      // Obter mensagens privadas User1-User2
      const privateChat = await request(app.getHttpServer())
        .get(`/chat/private/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Obter mensagens do grupo
      const groupChat = await request(app.getHttpServer())
        .get(`/chat/group/${groupId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verificar que mensagens do grupo não aparecem no chat privado
      const groupMessage = privateChat.body.find(m => m.content === 'Bem-vindos ao grupo pessoal!');
      expect(groupMessage).toBeUndefined();

      // Verificar que mensagens privadas não aparecem no grupo
      const privateMessage = groupChat.body.find(m => m.content === 'Olá Bob, como vai?');
      expect(privateMessage).toBeUndefined();
    });
  });
});
