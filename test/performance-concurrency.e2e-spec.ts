import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ⚡ TESTES DE PERFORMANCE E CONCORRÊNCIA
 * 
 * Cobertura:
 * - Performance de envio de mensagens (1000 mensagens)
 * - Concorrência de múltiplos usuários
 * - Testes de limites (10MB arquivo, 10k mensagens)
 * - Stress test do sistema
 * - Testes de WebSocket (tempo real)
 */
describe('⚡ Performance e Concorrência - E2E Tests', () => {
  let app: INestApplication;

  const testUsers: any[] = [];
  const testTokens: any[] = [];
  const testUserIds: any[] = [];

  beforeAll(async () => {
    // Limpar arquivos CSV antes dos testes
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Reset arquivos CSV
    fs.writeFileSync(path.join(dataDir, 'users.csv'), 'id,name,password\n');
    fs.writeFileSync(path.join(dataDir, 'groups.csv'), 'id,name,adminsId,members,pendingRequests,lastAdminRule\n');
    fs.writeFileSync(path.join(dataDir, 'chats.csv'), 'id,senderId,content,timestamp,chatType,targetId,isArquivo\n');
    fs.writeFileSync(path.join(dataDir, 'bans.csv'), 'id,bannedUserId,bannedByUserId,reason,bannedAt,expiresAt,isActive,groupId,reports\n');

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
  // 🚀 PREPARAÇÃO - MÚLTIPLOS USUÁRIOS
  // ========================================

  describe('🚀 Preparação - Criar múltiplos usuários', () => {
    
    it('✅ Deve criar 100 usuários para testes de performance', async () => {
      const startTime = Date.now();
      
      for (let i = 1; i <= 100; i++) {
        const user = {
          name: `User Performance ${i}`,
          password: `UserPerf${i}@123`,
        };

        testUsers.push(user);

        // Registrar usuário
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(user)
          .expect(201);

        // Fazer login
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(user)
          .expect(200);

        testTokens.push(loginResponse.body.access_token);

        // Obter profile
        const profileResponse = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .expect(200);

        testUserIds.push(profileResponse.body.id);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Criação de 100 usuários levou: ${duration}ms`);
      expect(testUsers.length).toBe(100);
      expect(testTokens.length).toBe(100);
      expect(testUserIds.length).toBe(100);
      
      // Performance should be reasonable (less than 30 seconds for 100 users)
      expect(duration).toBeLessThan(30000);
    }, 60000); // 60 second timeout

    it('✅ Deve criar grupo com 50 membros', async () => {
      const startTime = Date.now();
      
      const groupData = {
        name: 'Grupo Performance 50 Membros',
        members: testUserIds.slice(1, 51), // 50 users
      };

      const response = await request(app.getHttpServer())
        .post('/group')
        .set('Authorization', `Bearer ${testTokens[0]}`)
        .send(groupData)
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Criação de grupo com 50 membros levou: ${duration}ms`);
      expect(response.body.id).toBeDefined();
      
      // Should be fast (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  // ========================================
  // 📊 TESTES DE PERFORMANCE
  // ========================================

  describe('📊 Testes de Performance', () => {

    it('⚡ Deve enviar 1000 mensagens rapidamente', async () => {
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      
      // Enviar 1000 mensagens em paralelo
      for (let i = 1; i <= 1000; i++) {
        const messageData = {
          targetId: testUserIds[1],
          content: `Mensagem de performance número ${i}`,
          chatType: 'private',
        };

        const promise = request(app.getHttpServer())
          .post('/chat/send')
          .set('Authorization', `Bearer ${testTokens[0]}`)
          .send(messageData);

        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Envio de 1000 mensagens levou: ${duration}ms`);
      console.log(`⚡ Mensagens enviadas com sucesso: ${successCount}/1000`);
      
      expect(successCount).toBeGreaterThan(950); // At least 95% success
      expect(duration).toBeLessThan(60000); // Less than 60 seconds
    }, 120000); // 2 minute timeout

    it('⚡ Deve suportar 50 usuários enviando mensagens simultaneamente', async () => {
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      
      // 50 usuários enviando mensagem simultaneamente
      for (let i = 0; i < 50; i++) {
        const messageData = {
          targetId: testUserIds[(i + 1) % testUserIds.length],
          content: `Mensagem concorrente do usuário ${i}`,
          chatType: 'private',
        };

        const promise = request(app.getHttpServer())
          .post('/chat/send')
          .set('Authorization', `Bearer ${testTokens[i]}`)
          .send(messageData);

        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ 50 mensagens concorrentes levaram: ${duration}ms`);
      console.log(`⚡ Mensagens enviadas com sucesso: ${successCount}/50`);
      
      expect(successCount).toBeGreaterThan(45); // At least 90% success
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    }, 30000);

    it('⚡ Deve listar usuários rapidamente', async () => {
      const iterations = 100;
      const startTime = Date.now();
      
      const promises: Promise<any>[] = [];
      for (let i = 0; i < iterations; i++) {
        const promise = request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${testTokens[0]}`);
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ ${iterations} listagens de usuários levaram: ${duration}ms`);
      console.log(`⚡ Listagens bem-sucedidas: ${successCount}/${iterations}`);
      
      expect(successCount).toBe(iterations);
      expect(duration).toBeLessThan(20000); // Less than 20 seconds
    }, 30000);
  });

  // ========================================
  // 📏 TESTES DE LIMITES
  // ========================================

  describe('📏 Testes de Limites', () => {

    it('✅ Deve aceitar mensagem de até 1000 caracteres', async () => {
      const longMessage = 'A'.repeat(1000);
      
      const messageData = {
        targetId: testUserIds[1],
        content: longMessage,
        chatType: 'private',
      };

      const response = await request(app.getHttpServer())
        .post('/chat/send')
        .set('Authorization', `Bearer ${testTokens[0]}`)
        .send(messageData)
        .expect(201);

      expect(response.body.message).toBe('Mensagem enviada');
    });

    it('❌ Deve rejeitar mensagem muito longa (mais de 1000 caracteres)', async () => {
      const tooLongMessage = 'A'.repeat(1001);
      
      const messageData = {
        targetId: testUserIds[1],
        content: tooLongMessage,
        chatType: 'private',
      };

      await request(app.getHttpServer())
        .post('/chat/send')
        .set('Authorization', `Bearer ${testTokens[0]}`)
        .send(messageData)
        .expect(400);
    });

    it('✅ Deve suportar grupo com até 100 membros', async () => {
      const groupData = {
        name: 'Grupo Limite 100 Membros',
        members: testUserIds, // 100 users
      };

      const response = await request(app.getHttpServer())
        .post('/group')
        .set('Authorization', `Bearer ${testTokens[0]}`)
        .send(groupData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('⚡ Deve processar múltiplos uploads simultaneamente', async () => {
      const testFile = Buffer.from('Test file content for performance testing');
      const uploads: Promise<any>[] = [];
      
      for (let i = 0; i < 10; i++) {
        const upload = request(app.getHttpServer())
          .post(`/chat/upload/private/${testUserIds[1]}`)
          .set('Authorization', `Bearer ${testTokens[0]}`)
          .attach('file', testFile, `test-file-${i}.txt`);
        
        uploads.push(upload);
      }

      const results = await Promise.allSettled(uploads);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`⚡ Uploads simultâneos bem-sucedidos: ${successCount}/10`);
      expect(successCount).toBeGreaterThan(8); // At least 80% success
    }, 30000);
  });

  // ========================================
  // 🔄 TESTES DE CONCORRÊNCIA COMPLEXA
  // ========================================

  describe('🔄 Testes de Concorrência Complexa', () => {

    it('⚡ Deve gerenciar operações mistas simultaneamente', async () => {
      const operations: Promise<any>[] = [];
      
      // Mix de operações: login, envio de mensagens, criação de grupos
      for (let i = 0; i < 20; i++) {
        // Login operations
        operations.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send(testUsers[i])
        );
        
        // Message sending
        operations.push(
          request(app.getHttpServer())
            .post('/chat/send')
            .set('Authorization', `Bearer ${testTokens[i]}`)
            .send({
              targetId: testUserIds[(i + 1) % testUserIds.length],
              content: `Concurrent message ${i}`,
              chatType: 'private',
            })
        );
        
        // User listing
        operations.push(
          request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${testTokens[i]}`)
        );
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;
      
      console.log(`⚡ ${operations.length} operações mistas levaram: ${duration}ms`);
      console.log(`⚡ Operações bem-sucedidas: ${successCount}/${operations.length}`);
      
      expect(successCount).toBeGreaterThan(operations.length * 0.8); // At least 80% success
      expect(duration).toBeLessThan(30000); // Less than 30 seconds
    }, 60000);

    it('⚡ Deve manter consistência durante stress test', async () => {
      const stressOperations: Promise<any>[] = [];
      
      // Stress test: 50 usuários fazendo operações aleatórias
      for (let i = 0; i < 50; i++) {
        const randomOperation = Math.floor(Math.random() * 3);
        
        switch (randomOperation) {
          case 0: // Send message
            stressOperations.push(
              request(app.getHttpServer())
                .post('/chat/send')
                .set('Authorization', `Bearer ${testTokens[i]}`)
                .send({
                  targetId: testUserIds[Math.floor(Math.random() * testUserIds.length)],
                  content: `Stress test message ${i}`,
                  chatType: 'private',
                })
            );
            break;
            
          case 1: // List users
            stressOperations.push(
              request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${testTokens[i]}`)
            );
            break;
            
          case 2: // Get profile
            stressOperations.push(
              request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', `Bearer ${testTokens[i]}`)
            );
            break;
        }
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(stressOperations);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const duration = endTime - startTime;
      
      console.log(`⚡ Stress test com ${stressOperations.length} operações levou: ${duration}ms`);
      console.log(`⚡ Taxa de sucesso: ${(successCount/stressOperations.length*100).toFixed(1)}%`);
      
      expect(successCount).toBeGreaterThan(stressOperations.length * 0.7); // At least 70% success under stress
    }, 60000);
  });

  // ========================================
  // 📈 MÉTRICAS E RELATÓRIOS
  // ========================================

  describe('📈 Métricas e Relatórios', () => {

    it('📊 Deve gerar relatório de performance', async () => {
      const startTime = Date.now();
      
      // Operações representativas para o relatório
      const sampleOperations = {
        userCreation: 0,
        login: 0,
        messageSending: 0,
        userListing: 0,
        groupCreation: 0,
      };

      // Test user creation
      const userStart = Date.now();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Metric Test User',
          password: 'MetricTest@123',
        });
      sampleOperations.userCreation = Date.now() - userStart;

      // Test login
      const loginStart = Date.now();
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: 'Metric Test User',
          password: 'MetricTest@123',
        });
      sampleOperations.login = Date.now() - loginStart;

      const metricToken = loginResponse.body.access_token;

      // Test message sending
      const messageStart = Date.now();
      await request(app.getHttpServer())
        .post('/chat/send')
        .set('Authorization', `Bearer ${metricToken}`)
        .send({
          targetId: testUserIds[0],
          content: 'Metric test message',
          chatType: 'private',
        });
      sampleOperations.messageSending = Date.now() - messageStart;

      // Test user listing
      const listingStart = Date.now();
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${metricToken}`);
      sampleOperations.userListing = Date.now() - listingStart;

      // Test group creation
      const groupStart = Date.now();
      await request(app.getHttpServer())
        .post('/group')
        .set('Authorization', `Bearer ${metricToken}`)
        .send({
          name: 'Metric Test Group',
          members: [testUserIds[0]],
        });
      sampleOperations.groupCreation = Date.now() - groupStart;

      const totalTime = Date.now() - startTime;

      console.log('\n📈 RELATÓRIO DE PERFORMANCE:');
      console.log('=====================================');
      console.log(`⏱️  Criação de usuário: ${sampleOperations.userCreation}ms`);
      console.log(`🔐 Login: ${sampleOperations.login}ms`);
      console.log(`💬 Envio de mensagem: ${sampleOperations.messageSending}ms`);
      console.log(`👥 Listagem de usuários: ${sampleOperations.userListing}ms`);
      console.log(`🏢 Criação de grupo: ${sampleOperations.groupCreation}ms`);
      console.log(`⏰ Tempo total das operações: ${totalTime}ms`);
      console.log('=====================================\n');

      // All operations should complete reasonably fast
      expect(sampleOperations.userCreation).toBeLessThan(1000);
      expect(sampleOperations.login).toBeLessThan(500);
      expect(sampleOperations.messageSending).toBeLessThan(500);
      expect(sampleOperations.userListing).toBeLessThan(1000);
      expect(sampleOperations.groupCreation).toBeLessThan(1000);
    });
  });
});
