import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRepository } from '../src/users/csv-user.repository';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🔐 TESTES DE AUTENTICAÇÃO E SEGURANÇA + 👤 USUÁRIOS
 * 
 * Cobertura completa das funcionalidades:
 * - Cadastro com criptografia bcrypt
 * - Login com JWT
 * - Proteção de rotas
 * - Gerenciamento de usuários
 * - Validações de segurança
 */
describe('🔐 Auth & 👤 Users - Complete E2E Tests', () => {
  let app: INestApplication;
  let userRepository: UserRepository;

  // Dados de teste estruturados
  const validUser = {
    name: 'João Silva',
    password: 'MinhaSenh@123',
  };

  const weakPasswordUser = {
    name: 'Pedro Santos',
    password: '123', // Senha fraca para teste
  };

  const invalidUser = {
    name: '', // Nome vazio
    password: 'ValidPassword123!',
  };

  const secondUser = {
    name: 'Maria Oliveira',
    password: 'SeguraPass@789',
  };

  let userToken: string;
  let secondUserToken: string;
  let userId: string;
  let secondUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = app.get<UserRepository>(UserRepository);
    await app.init();

    // Limpar dados antes dos testes
    await resetTestData();
  });

  afterAll(async () => {
    await resetTestData();
    await app.close();
  });

  /**
   * Função para resetar dados de teste
   */
  async function resetTestData() {
    try {
      const usersFile = path.resolve(__dirname, '../data/users.csv');
      fs.writeFileSync(usersFile, 'id,name,password\n');
    } catch (error) {
      console.log('Criando arquivo de usuários...');
    }
  }

  // ========================================
  // 🔐 TESTES DE AUTENTICAÇÃO E SEGURANÇA
  // ========================================

  describe('🔐 1. CADASTRO DE USUÁRIOS', () => {
    
    it('✅ Deve cadastrar usuário com dados válidos e senha criptografada', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toBeDefined();
      
      // Verificar se a senha foi criptografada no banco
      const users = await userRepository.findAll();
      const savedUser = users.find(u => u.name === validUser.name);
      expect(savedUser).toBeDefined();
      expect(savedUser?.password).not.toBe(validUser.password); // Senha deve estar hasheada
      expect(savedUser?.password).toMatch(/^\$2[aby]\$/); // Formato bcrypt
    });

    it('❌ Deve rejeitar cadastro com senha fraca', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400);
    });

    it('❌ Deve rejeitar cadastro com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('❌ Deve rejeitar usuário duplicado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUser) // Mesmo usuário novamente
        .expect(409);
    });

    it('✅ Deve cadastrar segundo usuário válido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(secondUser)
        .expect(201);
    });

    it('❌ Deve rejeitar cadastro com XSS no nome', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '<script>alert("xss")</script>',
          password: 'ValidPass123!',
        })
        .expect(400);
    });
  });

  describe('🔑 2. LOGIN E GERAÇÃO DE JWT', () => {
    
    it('✅ Deve fazer login com credenciais válidas e gerar JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validUser)
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.access_token).toMatch(/^[\w-]*\.[\w-]*\.[\w-]*$/); // Formato JWT
      userToken = response.body.access_token;
    });

    it('✅ Deve fazer login do segundo usuário', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(secondUser)
        .expect(200);

      secondUserToken = response.body.access_token;
    });

    it('❌ Deve rejeitar login com senha incorreta', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: validUser.name,
          password: 'SenhaErrada123!',
        })
        .expect(401);
    });

    it('❌ Deve rejeitar login com usuário inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: 'UsuarioInexistente',
          password: 'QualquerSenha123!',
        })
        .expect(401);
    });

    it('❌ Deve rejeitar login com dados malformados', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: validUser.name,
          // password ausente
        })
        .expect(400);
    });
  });

  describe('🛡️ 3. PROTEÇÃO DE ROTAS COM JWT', () => {
    
    it('❌ Deve bloquear acesso sem token de autenticação', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('❌ Deve bloquear acesso com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('❌ Deve bloquear acesso com token mal formatado', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('✅ Deve permitir acesso com token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Capturar IDs dos usuários para testes posteriores
      const userData = response.body.find(u => u.name === validUser.name);
      const secondUserData = response.body.find(u => u.name === secondUser.name);
      userId = userData.id;
      secondUserId = secondUserData.id;
    });
  });

  describe('👤 4. PERFIL DO USUÁRIO AUTENTICADO', () => {
    
    it('✅ Deve retornar perfil do usuário logado', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.name).toBe(validUser.name);
      expect(response.body.id).toBeDefined();
      expect(response.body.password).toBeUndefined(); // Senha não deve ser retornada
    });

    it('❌ Deve bloquear acesso ao perfil sem token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  describe('🚪 5. LOGOUT (SE IMPLEMENTADO)', () => {
    
    it('✅ Deve fazer logout com token válido', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  // ========================================
  // 👤 TESTES DE GERENCIAMENTO DE USUÁRIOS
  // ========================================

  describe('👥 6. LISTAGEM DE USUÁRIOS', () => {
    
    it('✅ Deve listar usuários cadastrados com metadados corretos', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Dois usuários cadastrados
      
      // Verificar metadados
      response.body.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('isCurrentUser');
        expect(user).toHaveProperty('isOnline');
        expect(user.password).toBeUndefined(); // Senha não deve ser retornada
      });
    });

    it('✅ Deve identificar usuário atual corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const currentUser = response.body.find(u => u.isCurrentUser);
      expect(currentUser).toBeDefined();
      expect(currentUser.name).toBe(validUser.name);
    });

    it('✅ Deve mostrar status online/offline dos usuários', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      response.body.forEach(user => {
        expect(typeof user.isOnline).toBe('boolean');
      });
    });

    it('❌ Deve bloquear listagem sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('👁️ 7. VISUALIZAR PERFIL DE OUTRO USUÁRIO', () => {
    
    it('✅ Deve permitir visualizar perfil de outro usuário', async () => {
      // Implementar quando endpoint existir
      // Exemplo: GET /users/:id
      
      // Por enquanto, testamos através da listagem
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const otherUser = response.body.find(u => !u.isCurrentUser);
      expect(otherUser).toBeDefined();
      expect(otherUser.name).toBe(secondUser.name);
      expect(otherUser.password).toBeUndefined();
    });
  });

  describe('✏️ 8. ATUALIZAÇÃO DE DADOS DO USUÁRIO', () => {
    
    it('🚧 Teste pendente: Atualizar nome do usuário', async () => {
      // Implementar quando endpoint existir
      // Testar atualização de perfil
      const newName = 'João Silva Atualizado';
      
      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: newName })
        .expect(200);
      
      expect(response.body.name).toBe(newName);
      expect(response.body.message).toBe('Perfil atualizado com sucesso');
    });

    it('✅ Deve rejeitar atualização com dados inválidos', async () => {
      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: '<script>alert("xss")</script>' })
        .expect(400);
    });
  });

  describe('🗑️ 9. EXCLUSÃO DO PRÓPRIO USUÁRIO', () => {
    
    it('✅ Deve excluir próprio usuário', async () => {
      // Testar exclusão de perfil
      const response = await request(app.getHttpServer())
        .delete('/users/profile')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);
      
      expect(response.body.message).toBe('Usuário excluído com sucesso');
    });

    it('✅ Deve verificar usuário não existe após exclusão', async () => {
      // Verificar se o usuário foi realmente excluído
      const users = await userRepository.findAll();
      const deletedUser = users.find(u => u.name === secondUser.name);
      expect(deletedUser).toBeUndefined();
    });
  });

  // ========================================
  // 🔒 TESTES DE SEGURANÇA AVANÇADA
  // ========================================

  describe('🔒 10. TESTES DE SEGURANÇA AVANÇADA', () => {
    
    it('❌ Deve bloquear tentativas de SQL Injection no login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: "admin'; DROP TABLE users; --",
          password: 'qualquersenha',
        })
        .expect(400); // Deve falhar na validação antes mesmo da autenticação (mais seguro!)
    });

    it('❌ Deve bloquear XSS em campos de entrada', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '<img src=x onerror=alert("XSS")>',
          password: 'ValidPass123!',
        })
        .expect(400);
    });

    it('✅ Deve validar força da senha adequadamente', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        '12345678',
        'PASSWORD123',
        'password123',
      ];

      for (const password of weakPasswords) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: `TestUser${Math.random()}`,
            password: password,
          })
          .expect(400);
      }
    });

    it('⚡ Deve responder rapidamente a consultas de autenticação', async () => {
      const start = Date.now();
      
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('🔄 Deve suportar múltiplas requisições simultâneas', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });

  describe('📊 11. INTEGRIDADE DE DADOS', () => {
    
    it('✅ Deve manter consistência dos dados de usuários', async () => {
      const users = await userRepository.findAll();
      
      // Após exclusão do secondUser, deve haver apenas 1 usuário (validUser)
      expect(users.length).toBeGreaterThanOrEqual(1);
      
      users.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.password).toBeDefined();
        expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
      });
    });

    it('✅ Deve preservar integridade após operações', async () => {
      // Fazer algumas operações
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      // Verificar se dados continuam íntegros após exclusão do secondUser
      const users = await userRepository.findAll();
      expect(users.length).toBe(1);
      
      // Deve ser apenas o usuário principal (validUser) mas com nome atualizado
      expect(users[0].name).toBe('João Silva Atualizado');
    });
  });
});
