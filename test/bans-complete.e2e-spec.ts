import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🚫 TESTES DE BANIMENTOS E EXCLUSÕES - COMPLETO
 * 
 * Cobertura:
 * - Banimento por admin
 * - Banimento por múltiplas denúncias
 * - Verificação de usuário banido (login, mensagens, grupos)
 * - Desbanimento
 * - Segurança e validações
 */
describe('🚫 Banimentos e Exclusões - Complete E2E Tests', () => {
  let app: INestApplication;

  // Dados de teste
  const adminUser = {
    name: 'Admin Ban Test',
    password: 'AdminBan@123',
  };

  const normalUser = {
    name: 'User Normal',
    password: 'UserNormal@123',
  };

  const problematicUser = {
    name: 'User Problematic',
    password: 'UserProblematic@123',
  };

  const reporter1 = {
    name: 'Reporter One',
    password: 'Reporter1@123',
  };

  const reporter2 = {
    name: 'Reporter Two',
    password: 'Reporter2@123',
  };

  const reporter3 = {
    name: 'Reporter Three',
    password: 'Reporter3@123',
  };

  let adminToken: string;
  let normalUserToken: string;
  let problematicUserToken: string;
  let reporter1Token: string;
  let reporter2Token: string;
  let reporter3Token: string;

  let adminId: string;
  let normalUserId: string;
  let problematicUserId: string;
  let reporter1Id: string;
  let reporter2Id: string;
  let reporter3Id: string;

  let groupId: string;

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
  // 🚀 PREPARAÇÃO - USUÁRIOS E GRUPO
  // ========================================

  describe('🚀 Preparação - Criar usuários e grupo', () => {
    
    it('✅ Deve criar usuários para testes de banimento', async () => {
      // Criar admin
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminUser)
        .expect(200);

      adminToken = adminLogin.body.access_token;
      
      const adminProfile = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      adminId = adminProfile.body.id;

      // Criar usuário normal
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(normalUser)
        .expect(201);

      const normalLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(normalUser)
        .expect(200);

      normalUserToken = normalLogin.body.access_token;
      
      const normalProfile = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      normalUserId = normalProfile.body.id;

      // Criar usuário problemático
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(problematicUser)
        .expect(201);

      const problematicLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send(problematicUser)
        .expect(200);

      problematicUserToken = problematicLogin.body.access_token;
      
      const problematicProfile = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${problematicUserToken}`)
        .expect(200);

      problematicUserId = problematicProfile.body.id;

      // Criar reporters
      for (const [user, token, id] of [
        [reporter1, 'reporter1Token', 'reporter1Id'],
        [reporter2, 'reporter2Token', 'reporter2Id'],
        [reporter3, 'reporter3Token', 'reporter3Id'],
      ]) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(user)
          .expect(201);

        const login = await request(app.getHttpServer())
          .post('/auth/login')
          .send(user)
          .expect(200);

        const profile = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${login.body.access_token}`)
          .expect(200);

        if (token === 'reporter1Token') {
          reporter1Token = login.body.access_token;
          reporter1Id = profile.body.id;
        } else if (token === 'reporter2Token') {
          reporter2Token = login.body.access_token;
          reporter2Id = profile.body.id;
        } else if (token === 'reporter3Token') {
          reporter3Token = login.body.access_token;
          reporter3Id = profile.body.id;
        }
      }

      expect(adminToken).toBeDefined();
      expect(normalUserToken).toBeDefined();
      expect(problematicUserToken).toBeDefined();
      expect(reporter1Token).toBeDefined();
      expect(reporter2Token).toBeDefined();
      expect(reporter3Token).toBeDefined();
    });

    it('✅ Deve criar grupo para testes de banimento', async () => {
      const groupData = {
        name: 'Grupo Teste Banimento',
        members: [normalUserId, problematicUserId],
      };

      const response = await request(app.getHttpServer())
        .post('/group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(groupData)
        .expect(201);

      groupId = response.body.id;
      expect(groupId).toBeDefined();
    });
  });

  // ========================================
  // 🚫 SISTEMA DE BANIMENTOS
  // ========================================

  describe('🚫 Sistema de Banimentos', () => {

    describe('📋 Reports e Denúncias', () => {
      
      it('✅ Deve permitir reportar usuário', async () => {
        const reportData = {
          reportedUserId: problematicUserId,
          reason: 'spam',
        };

        const response = await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${reporter1Token}`)
          .send(reportData)
          .expect(200);

        expect(response.body.message).toContain('reportado com sucesso');
        expect(response.body.message).toContain('1/3');
      });

      it('✅ Segundo report do mesmo usuário', async () => {
        const reportData = {
          reportedUserId: problematicUserId,
          reason: 'harassment',
        };

        const response = await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${reporter2Token}`)
          .send(reportData)
          .expect(200);

        expect(response.body.message).toContain('2/3');
      });

      it('✅ Terceiro report deve resultar em banimento automático', async () => {
        const reportData = {
          reportedUserId: problematicUserId,
          reason: 'inappropriate_content',
        };

        const response = await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${reporter3Token}`)
          .send(reportData)
          .expect(200);

        expect(response.body.message).toContain('banido automaticamente');
        expect(response.body.autoBanned).toBe(true);
      });

      it('❌ Não deve permitir auto-report', async () => {
        const reportData = {
          reportedUserId: normalUserId,
          reason: 'spam',
        };

        await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${normalUserToken}`)
          .send(reportData)
          .expect(400);
      });

      it('❌ Não deve permitir report duplicado', async () => {
        const reportData = {
          reportedUserId: normalUserId,
          reason: 'spam',
        };

        // Primeiro report
        await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${reporter1Token}`)
          .send(reportData)
          .expect(200);

        // Segundo report do mesmo usuário
        await request(app.getHttpServer())
          .post('/bans/report')
          .set('Authorization', `Bearer ${reporter1Token}`)
          .send(reportData)
          .expect(400);
      });
    });

    describe('🔨 Banimento Manual por Admin', () => {
      
      it('✅ Admin deve conseguir banir usuário globalmente', async () => {
        const banData = {
          bannedUserId: normalUserId,
          reason: 'admin_decision',
          type: 'global',
        };

        const response = await request(app.getHttpServer())
          .post('/bans')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(banData)
          .expect(201);

        expect(response.body.message).toBe('Usuário banido com sucesso');
        expect(response.body.data.bannedUserId).toBe(normalUserId);
      });

      it('✅ Admin deve conseguir banir usuário do grupo', async () => {
        // Primeiro desbanir o usuário normal para este teste
        const bansResponse = await request(app.getHttpServer())
          .get(`/bans/user/${normalUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        if (bansResponse.body.data.length > 0) {
          await request(app.getHttpServer())
            .delete(`/bans/${bansResponse.body.data[0].id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        }

        const banData = {
          bannedUserId: normalUserId,
          reason: 'violation_terms',
          type: 'group',
          groupId: groupId,
        };

        const response = await request(app.getHttpServer())
          .post('/bans')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(banData)
          .expect(201);

        expect(response.body.data.groupId).toBe(groupId);
      });

      it('❌ Não deve permitir auto-banimento', async () => {
        const banData = {
          bannedUserId: adminId,
          reason: 'admin_decision',
          type: 'global',
        };

        await request(app.getHttpServer())
          .post('/bans')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(banData)
          .expect(400);
      });

      it('❌ Não deve permitir banimento duplicado', async () => {
        const banData = {
          bannedUserId: problematicUserId,
          reason: 'spam',
          type: 'global',
        };

        await request(app.getHttpServer())
          .post('/bans')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(banData)
          .expect(400); // Usuário já está banido
      });
    });

    describe('🔍 Verificação de Banimentos', () => {
      
      it('✅ Deve verificar status de banimento', async () => {
        const response = await request(app.getHttpServer())
          .get(`/bans/check/${problematicUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.isBanned).toBe(true);
        expect(response.body.data.userId).toBe(problematicUserId);
      });

      it('✅ Deve listar banimentos do usuário', async () => {
        const response = await request(app.getHttpServer())
          .get(`/bans/user/${problematicUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('✅ Deve listar todos os banimentos', async () => {
        const response = await request(app.getHttpServer())
          .get('/bans')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('🔓 Desbanimento', () => {
      
      it('✅ Deve conseguir desbanir usuário', async () => {
        // Obter ID do banimento
        const bansResponse = await request(app.getHttpServer())
          .get(`/bans/user/${problematicUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const banId = bansResponse.body.data[0].id;

        const response = await request(app.getHttpServer())
          .delete(`/bans/${banId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toBe('Usuário desbanido com sucesso');
      });

      it('❌ Não deve conseguir desbanir banimento inexistente', async () => {
        await request(app.getHttpServer())
          .delete('/bans/invalid-ban-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  // ========================================
  // 🛡️ TESTES DE BLOQUEIOS POR BANIMENTO
  // ========================================

  describe('🛡️ Bloqueios por Banimento', () => {

    beforeAll(async () => {
      // Banir o usuário problemático novamente para os testes de bloqueio
      const banData = {
        bannedUserId: problematicUserId,
        reason: 'spam',
        type: 'global',
      };

      await request(app.getHttpServer())
        .post('/bans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(banData);
    });

    it('❌ Usuário banido não deve conseguir enviar mensagens', async () => {
      const messageData = {
        targetId: adminId,
        content: 'Tentativa de mensagem de usuário banido',
        chatType: 'private',
      };

      await request(app.getHttpServer())
        .post('/chat/send')
        .set('Authorization', `Bearer ${problematicUserToken}`)
        .send(messageData)
        .expect(403);
    });

    it('❌ Usuário banido não deve conseguir criar grupos', async () => {
      const groupData = {
        name: 'Grupo Tentativa Banido',
        members: [adminId],
      };

      await request(app.getHttpServer())
        .post('/group')
        .set('Authorization', `Bearer ${problematicUserToken}`)
        .send(groupData)
        .expect(403);
    });

    it('❌ Usuário banido não deve aparecer em listagens', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const bannedUser = response.body.find((user: any) => user.id === problematicUserId);
      expect(bannedUser?.status).toBe('banned');
    });
  });

  // ========================================
  // 🔒 TESTES DE SEGURANÇA
  // ========================================

  describe('🔒 Testes de Segurança', () => {

    it('❌ Não deve permitir banimento sem token', async () => {
      const banData = {
        bannedUserId: normalUserId,
        reason: 'spam',
        type: 'global',
      };

      await request(app.getHttpServer())
        .post('/bans')
        .send(banData)
        .expect(401);
    });

    it('❌ Não deve permitir banimento com token inválido', async () => {
      const banData = {
        bannedUserId: normalUserId,
        reason: 'spam',
        type: 'global',
      };

      await request(app.getHttpServer())
        .post('/bans')
        .set('Authorization', 'Bearer invalid-token')
        .send(banData)
        .expect(401);
    });

    it('❌ Não deve permitir banimento com dados inválidos', async () => {
      const invalidBanData = {
        bannedUserId: '',
        reason: 'invalid-reason',
        type: 'invalid-type',
      };

      await request(app.getHttpServer())
        .post('/bans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBanData)
        .expect(400);
    });

    it('❌ Não deve permitir banimento de usuário inexistente', async () => {
      const banData = {
        bannedUserId: 'non-existent-user-id',
        reason: 'spam',
        type: 'global',
      };

      await request(app.getHttpServer())
        .post('/bans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(banData)
        .expect(404);
    });
  });
});
