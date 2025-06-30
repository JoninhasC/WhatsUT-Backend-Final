/*
 * ========================================================================================
 * GROUP MODULE - ORGANIZADOR DE TUDO RELACIONADO A GRUPOS
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Module (Módulo)
 * Um módulo é como um "departamento" da empresa que organiza tudo relacionado
 * a um assunto específico. No caso, tudo sobre grupos: criação, edição,
 * listagem, entrada/saída de membros, etc.
 * 
 * 🏢 ANALOGIA: 
 * Imagine uma empresa com departamentos:
 * - RH cuida de funcionários
 * - Financeiro cuida de dinheiro  
 * - TI cuida de computadores
 * 
 * No nosso sistema:
 * - AuthModule cuida de login/logout
 * - UserModule cuida de usuários
 * - GroupModule cuida de grupos ← ESTE ARQUIVO
 * 
 * 🔧 FUNÇÃO: Conectar e organizar todas as peças do sistema de grupos
 */

// ============================================================================
// IMPORTAÇÕES: TRAZENDO AS PEÇAS DO QUEBRA-CABEÇA
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 @nestjs/common: Ferramentas básicas do NestJS
 * 🎯 ./group.service: Lógica de negócio de grupos
 * 🌐 ./group.controller: Endpoints da API de grupos
 * 💾 ./group.repository: Persistência de dados de grupos
 * 🚫 ../bans/bans.module: Sistema de banimentos (grupos podem banir usuários)
 */
import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupRepository } from './group.repository';
import { BansModule } from '../bans/bans.module';

// ============================================================================
// DECORADOR: @MODULE - CONFIGURAÇÃO DO DEPARTAMENTO
// ============================================================================

/*
 * 🏛️ @MODULE: ORGANIZADOR PRINCIPAL
 * 
 * Este decorador transforma a classe em um "módulo do NestJS".
 * É como criar um departamento oficial na empresa com:
 * - Funcionários (providers)
 * - Chefes (controllers)  
 * - Parcerias com outros departamentos (imports)
 * 
 * 📋 CONFIGURAÇÃO EXPLICADA:
 */
@Module({
  
  // ========================================================================
  // IMPORTS: DEPARTAMENTOS PARCEIROS
  // ========================================================================
  
  /*
   * 🤝 IMPORTS: MÓDULOS QUE USAMOS
   * 
   * 🎯 BansModule: Sistema de banimentos
   * 
   * 💡 POR QUE PRECISAMOS DELE?
   * Grupos podem ter moderação:
   * - Banir usuários problemáticos
   * - Verificar se alguém está banido antes de entrar
   * - Aplicar regras de segurança
   * 
   * 🔗 ANALOGIA: 
   * É como o departamento de Grupos fazer parceria com
   * o departamento de Segurança para controlar acesso.
   * 
   * 📊 O QUE IMPORTAMOS:
   * - BanService (para verificar/aplicar banimentos)
   * - Qualquer outro provider que BansModule exporta
   */
  imports: [BansModule],
  
  // ========================================================================
  // CONTROLLERS: OS "RECEPCIONISTAS" DO MÓDULO
  // ========================================================================
  
  /*
   * 🌐 CONTROLLERS: ENDPOINTS DA API
   * 
   * 🎯 GroupController: Gerencia todas as rotas HTTP relacionadas a grupos
   * 
   * 📱 ROTAS QUE ELE OFERECE:
   * - POST /groups → Criar grupo
   * - GET /groups → Listar grupos
   * - GET /groups/:id → Buscar grupo específico
   * - PUT /groups/:id → Atualizar grupo
   * - POST /groups/:id/join → Entrar no grupo
   * - DELETE /groups/:id/leave → Sair do grupo
   * - E muitas outras...
   * 
   * 🔗 ANALOGIA: 
   * É como um atendente na recepção que:
   * - Recebe pedidos dos clientes
   * - Entende o que eles querem
   * - Encaminha para o setor correto
   * - Devolve a resposta
   */
  controllers: [GroupController],
  
  // ========================================================================
  // PROVIDERS: OS "FUNCIONÁRIOS" DO MÓDULO
  // ========================================================================
  
  /*
   * 🛠️ PROVIDERS: CLASSES QUE FAZEM O TRABALHO
   * 
   * Aqui listamos todas as classes que este módulo "emprega":
   * 
   * 🎯 GroupService: 
   * - O "cérebro" do sistema de grupos
   * - Contém toda a lógica de negócio
   * - Decide se um usuário pode entrar, sair, ser promovido, etc.
   * - Valida regras complexas
   * 
   * 💾 GroupRepository:
   * - O "arquivista" do sistema de grupos
   * - Sabe como salvar/buscar grupos no arquivo CSV
   * - Gerencia persistência de dados
   * - Cuida das operações de CRUD (Create, Read, Update, Delete)
   * 
   * 🔗 ANALOGIA: 
   * Service = Gerente que toma decisões
   * Repository = Secretário que organiza os arquivos
   * 
   * 🔄 FLUXO DE TRABALHO:
   * Controller recebe pedido → Service decide o que fazer → Repository salva/busca dados
   */
  providers: [GroupService, GroupRepository],
})

// ============================================================================
// CLASSE: GROUPMODULE - DECLARAÇÃO OFICIAL DO MÓDULO
// ============================================================================

/*
 * 🏛️ CLASSE GROUPMODULE
 * 
 * Esta classe vazia é apenas uma "placa" que identifica o módulo.
 * O verdadeiro trabalho é feito pelo decorador @Module acima.
 * 
 * 🎯 FUNÇÃO: Dar um nome oficial ao módulo para o NestJS reconhecer
 * 
 * 💡 ANALOGIA: 
 * É como a placa na porta do departamento: "DEPARTAMENTO DE GRUPOS"
 * A placa não faz nada, mas identifica o que há lá dentro.
 */
export class GroupModule {}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - GROUP MODULE
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🏢 ARQUITETURA MODULAR:
 *    - Cada funcionalidade fica no seu "departamento"
 *    - Módulos se comunicam através de imports/exports
 *    - Organização clara separa responsabilidades
 * 
 * 2. 🔗 DEPENDÊNCIAS:
 *    - GroupModule precisa do BansModule para moderação
 *    - Imports definem quais outros módulos usamos
 *    - NestJS conecta tudo automaticamente
 * 
 * 3. 📊 ESTRUTURA INTERNA:
 *    - Controllers: Interface HTTP (recepção)
 *    - Services: Lógica de negócio (gerência)  
 *    - Repositories: Persistência (arquivo)
 * 
 * 4. 🛠️ INJEÇÃO DE DEPENDÊNCIA:
 *    - NestJS cria e conecta as classes automaticamente
 *    - Service recebe Repository injetado
 *    - Controller recebe Service injetado
 * 
 * 5. 🔄 FLUXO COMPLETO:
 *    Cliente → Controller → Service → Repository → CSV
 *    CSV → Repository → Service → Controller → Cliente
 * 
 * 💡 EXEMPLO PRÁTICO:
 * 
 * Quando alguém faz: POST /groups { "name": "Meu Grupo" }
 * 
 * 1. 🌐 GroupController recebe a requisição
 * 2. 🎯 Valida o DTO (CreateGroupDto)
 * 3. 🛠️ Chama GroupService.create()
 * 4. 🚫 Service verifica no BanService se usuário pode criar grupos
 * 5. 💾 Service chama GroupRepository.save()
 * 6. 📁 Repository salva no arquivo CSV
 * 7. 📤 Resposta volta pela cadeia até o cliente
 * 
 * 📈 VANTAGENS DA ARQUITETURA:
 * - Fácil manutenção (cada coisa no seu lugar)
 * - Testabilidade (pode testar cada peça separadamente)
 * - Reutilização (outros módulos podem usar GroupService)
 * - Extensibilidade (fácil adicionar novas funcionalidades)
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora que entendemos como o módulo organiza tudo,
 * vamos ver os detalhes de cada peça:
 * - Como o Repository salva dados no CSV
 * - Como o Service implementa regras de negócio
 * - Como o Controller expõe a API
 * 
 * ========================================================================================
 */
