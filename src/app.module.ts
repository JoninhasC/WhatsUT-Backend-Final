/*
 * ====================================================================
 * ARQUIVO: app.module.ts
 * LOCALIZAÇÃO: src/app.module.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este é o "MÓDULO RAIZ" do WhatsUT. É como a "planta baixa" de um prédio
 * que mostra como todos os departamentos (módulos) estão organizados e
 * conectados entre si. É o primeiro módulo que o NestJS carrega.
 * 
 * ANALOGIA SIMPLES:
 * Imagine uma empresa com vários departamentos:
 * - Departamento de RH (UsersModule)
 * - Departamento de Segurança (AuthModule)  
 * - Departamento de Comunicação (ChatModule)
 * - Departamento de Grupos (GroupModule)
 * - Departamento de Moderação (BansModule)
 * 
 * Este arquivo seria como o "organograma da empresa" que mostra:
 * - Quais departamentos existem
 * - Como eles se relacionam
 * - Quem são os responsáveis gerais (controllers/services)
 * 
 * CONCEITO IMPORTANTE - MÓDULOS NO NESTJS:
 * Um módulo é um agrupamento lógico de funcionalidades relacionadas.
 * É uma forma de organizar o código de maneira limpa e modular.
 * Cada módulo pode ter: controllers, services, providers e imports.
 */

// ===== IMPORTAÇÕES =====

// @Module: decorador que marca uma classe como módulo do NestJS
import { Module } from '@nestjs/common';

// Controller e Service principais da aplicação (geralmente básicos)
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importa todos os módulos funcionais da aplicação
import { AuthModule } from './auth/auth.module';          // Módulo de autenticação
import { UsersModule } from './users/users.module';      // Módulo de usuários
import { GroupModule } from './group/group.module';      // Módulo de grupos
import { ChatModule } from './chat/chat.module';         // Módulo de chat
import { BansModule } from './bans/bans.module';         // Módulo de banimentos

// ConfigModule: para gerenciar variáveis de ambiente (.env)
import { ConfigModule } from '@nestjs/config';

// ===== DECORADOR @Module =====
// Define a configuração do módulo principal
@Module({
  /*
   * IMPORTS: 
   * Lista todos os módulos que este módulo vai usar.
   * É como dizer "minha empresa precisa destes departamentos funcionando"
   */
  imports: [
    AuthModule,           // Módulo de autenticação (login, logout, JWT)
    UsersModule,          // Módulo de usuários (criar, buscar, atualizar)
    GroupModule,          // Módulo de grupos (criar grupos, adicionar membros)
    ChatModule,           // Módulo de chat (mensagens privadas, arquivos)
    BansModule,           // Módulo de banimentos (moderar usuários)
    
    // ConfigModule.forRoot(): carrega variáveis de ambiente do arquivo .env
    ConfigModule.forRoot(),
    /*
     * CONFIGMODULE.FORROOT():
     * 
     * Este módulo permite usar variáveis de ambiente em toda aplicação.
     * Variáveis de ambiente são configurações que ficam fora do código,
     * como senhas, URLs de banco de dados, chaves secretas, etc.
     * 
     * EXEMPLO DE USO:
     * - JWT_SECRET=minha_chave_secreta (no arquivo .env)
     * - process.env.JWT_SECRET (no código)
     * 
     * VANTAGENS:
     * - Segurança: senhas não ficam no código
     * - Flexibilidade: diferentes configurações para dev/produção
     */
  ],
  
  /*
   * CONTROLLERS:
   * Lista os controllers que pertencem DIRETAMENTE a este módulo.
   * Geralmente o AppController é básico, só para testar se a API está funcionando.
   */
  controllers: [AppController],
  
  /*
   * PROVIDERS:
   * Lista os services que pertencem DIRETAMENTE a este módulo.
   * O AppService geralmente contém funções básicas como "Hello World".
   */
  providers: [AppService],
})
export class AppModule {
  /*
   * CLASSE VAZIA:
   * 
   * A classe AppModule geralmente fica vazia porque toda configuração
   * é feita no decorador @Module acima. O NestJS usa reflexão para
   * ler as configurações do decorador e montar a aplicação automaticamente.
   * 
   * É como uma "planta baixa" - você só precisa desenhar, não construir manualmente.
   */
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O AppModule é o "COORDENADOR GERAL" do WhatsUT. Ele:
 * 
 * 1. 🏗️ ORGANIZA: Define estrutura modular da aplicação
 * 2. 🔗 CONECTA: Liga todos os módulos entre si
 * 3. ⚙️ CONFIGURA: Carrega configurações de ambiente
 * 4. 🎛️ CENTRALIZA: Ponto único de configuração principal
 * 5. 🚀 INICIALIZA: Primeiro módulo carregado pelo NestJS
 * 
 * FLUXO DE INICIALIZAÇÃO:
 * 
 * main.ts chama NestFactory.create(AppModule)
 *     ↓
 * NestJS carrega AppModule
 *     ↓
 * AppModule importa AuthModule, UsersModule, etc.
 *     ↓
 * Cada módulo importado carrega seus controllers/services
 *     ↓
 * Sistema de injeção de dependência conecta tudo
 *     ↓
 * Aplicação fica pronta para receber requisições
 * 
 * ARQUITETURA MODULAR:
 * 
 * AppModule (raiz)
 *     ├── AuthModule
 *     │   ├── AuthController
 *     │   ├── AuthService
 *     │   └── JwtStrategy
 *     ├── UsersModule
 *     │   ├── UsersController
 *     │   ├── UsersService
 *     │   └── UserRepository
 *     ├── ChatModule
 *     │   ├── ChatController
 *     │   ├── ChatService
 *     │   └── ChatGateway
 *     └── ... outros módulos
 * 
 * VANTAGENS DESTA ORGANIZAÇÃO:
 * - Separação clara de responsabilidades
 * - Fácil manutenção e extensão
 * - Reutilização de módulos
 * - Testabilidade individual
 * - Carregamento sob demanda
 * 
 * SEM ESTE ARQUIVO:
 * O NestJS não saberia como montar a aplicação!
 * Seria como tentar construir um prédio sem planta baixa.
 */
