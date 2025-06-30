/*
 * ========================================================================================
 * BANS MODULE - SISTEMA DE MODERAÇÃO E BANIMENTOS
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Bans Module (Módulo de Banimentos)
 * Este módulo é o "departamento de segurança e moderação" do sistema, responsável por:
 * - Banir usuários problemáticos
 * - Gerenciar denúncias/reports
 * - Controlar acesso e permissões
 * - Manter histórico de infrações
 * 
 * 🛡️ IMPORTÂNCIA CRÍTICA:
 * Sem este sistema, a plataforma seria vulnerável a:
 * - Spam e comportamento abusivo
 * - Assédio e cyberbullying
 * - Conteúdo malicioso ou ilegal
 * - Usuários que violam termos de uso
 * 
 * 🏢 ANALOGIA: 
 * Como o departamento de segurança de um shopping que:
 * - Monitora comportamentos suspeitos
 * - Expulsa pessoas problemáticas
 * - Mantém lista de pessoas banidas
 * - Investiga denúncias e reclamações
 * - Coordena com outros departamentos (administração, limpeza, etc.)
 */

// ============================================================================
// IMPORTAÇÕES: CONECTANDO COM SISTEMA DE USUÁRIOS
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 @nestjs/common: Ferramentas básicas do framework
 * 🚫 ./ban.controller: Interface HTTP para operações de banimento
 * 🛡️ ./ban.service: Lógica de negócio para banimentos e moderação
 * 💾 ./ban.repository: Persistência de dados de banimentos
 * 👤 ../users/users.module: Sistema de usuários (para validar quem está sendo banido)
 * 📊 ./report-state.service: Gerenciamento de estado de denúncias/reports
 */
import { Module } from '@nestjs/common';
import { BanController } from './ban.controller';
import { BanService } from './ban.service';
import { BanRepository } from './ban.repository';
import { UsersModule } from '../users/users.module';
import { ReportStateService } from './report-state.service';

// ============================================================================
// DECORADOR: @MODULE - CONFIGURAÇÃO DO SISTEMA DE BANIMENTOS
// ============================================================================

/*
 * 🏛️ @MODULE: ORGANIZADOR DO SISTEMA DE MODERAÇÃO
 * 
 * Esta configuração define como o sistema de banimentos se integra
 * com outros módulos e quais serviços oferece para o sistema geral.
 * 
 * 📋 ASPECTOS IMPORTANTES:
 * - IMPORTS: Que módulos externos precisamos
 * - CONTROLLERS: Que endpoints HTTP oferecemos
 * - PROVIDERS: Que serviços temos internamente
 * - EXPORTS: Que serviços disponibilizamos para outros módulos
 */
@Module({
  
  // ========================================================================
  // IMPORTS: DEPENDÊNCIAS EXTERNAS
  // ========================================================================
  
  /*
   * 🤝 IMPORTS: MÓDULOS QUE PRECISAMOS USAR
   * 
   * 👤 UsersModule: Sistema de usuários
   * 
   * 💡 POR QUE PRECISAMOS DO USERSMODULE?
   * 
   * 🔍 VALIDAÇÕES NECESSÁRIAS:
   * - Verificar se usuário a ser banido realmente existe
   * - Buscar informações do usuário (nome, email, histórico)
   * - Validar se quem está banindo tem permissão
   * - Atualizar status do usuário (ativo → banido)
   * 
   * 📊 OPERAÇÕES TÍPICAS:
   * - "Banir usuário ID 123" → UsersModule confirma: usuário 123 existe?
   * - "Listar histórico do usuário" → UsersModule fornece dados
   * - "Notificar usuário sobre banimento" → UsersModule gerencia notificação
   * 
   * 🔗 ANALOGIA: 
   * Departamento de Segurança precisa acessar o sistema de RH para:
   * - Confirmar se funcionário existe
   * - Obter dados do funcionário
   * - Atualizar status no sistema
   */
  imports: [UsersModule],
  
  // ========================================================================
  // CONTROLLERS: INTERFACE HTTP DO SISTEMA DE BANIMENTOS
  // ========================================================================
  
  /*
   * 🌐 CONTROLLERS: ENDPOINTS DA API DE MODERAÇÃO
   * 
   * 🚫 BanController: Gerencia todas as rotas HTTP relacionadas a banimentos
   * 
   * 📱 ENDPOINTS TÍPICOS QUE OFERECE:
   * - POST /bans/user/:id → Banir usuário específico
   * - GET /bans → Listar usuários banidos
   * - GET /bans/user/:id → Verificar se usuário está banido
   * - DELETE /bans/user/:id → Remover banimento (unban)
   * - POST /bans/report → Criar denúncia/report
   * - GET /bans/reports → Listar denúncias pendentes
   * - PATCH /bans/report/:id/review → Analisar denúncia
   * 
   * 🔗 ANALOGIA: 
   * Como um balcão de atendimento do departamento de segurança onde:
   * - Administradores podem solicitar banimentos
   * - Usuários podem fazer denúncias
   * - Moderadores podem revisar casos
   * - Sistema pode consultar status de banimentos
   */
  controllers: [BanController],
  
  // ========================================================================
  // PROVIDERS: EQUIPE INTERNA DO SISTEMA DE BANIMENTOS
  // ========================================================================
  
  /*
   * 🛠️ PROVIDERS: SERVIÇOS INTERNOS DO MÓDULO
   * 
   * 🚫 BanService:
   * - "Cérebro" do sistema de banimentos
   * - Implementa regras de negócio para moderação
   * - Decide quando e como aplicar punições
   * - Gerencia processos de denúncia e investigação
   * - Valida permissões de quem pode banir
   * 
   * 💾 BanRepository:
   * - "Arquivo" de registros de banimentos
   * - Salva/busca dados de usuários banidos
   * - Mantém histórico de infrações
   * - Gerencia persistência em CSV
   * - Organiza dados por data, tipo, severidade
   * 
   * 📊 ReportStateService:
   * - "Gerenciador de denúncias"
   * - Controla estado de reports (pendente, em análise, resolvido)
   * - Coordena fluxo de investigação
   * - Mantém estatísticas de moderação
   * - Gerencia prioridades de análise
   * 
   * 🔗 ANALOGIA: 
   * BanService = Chefe de segurança (toma decisões)
   * BanRepository = Arquivista (organiza registros)
   * ReportStateService = Coordenador de investigações (gerencia casos)
   * 
   * 🔄 FLUXO DE TRABALHO:
   * 1. Denúncia chega → ReportStateService registra
   * 2. BanService analisa gravidade → decide ação
   * 3. Se banimento → BanRepository salva decisão
   * 4. Sistema notifica usuário → integração com UsersModule
   */
  providers: [BanService, BanRepository, ReportStateService],
  
  // ========================================================================
  // EXPORTS: SERVIÇOS DISPONIBILIZADOS PARA OUTROS MÓDULOS
  // ========================================================================
  
  /*
   * 📤 EXPORTS: O QUE OFERECEMOS PARA O RESTO DO SISTEMA
   * 
   * Esta é uma seção CRÍTICA que define quais serviços deste módulo
   * outros módulos podem usar. É como "produtos exportados" de uma empresa.
   * 
   * 🚫 BanService:
   * 📍 USADO POR: GroupModule, ChatModule, AuthModule, etc.
   * 🎯 FUNÇÃO: Verificar se usuário pode realizar ações
   * 
   * 💡 EXEMPLOS DE USO EM OUTROS MÓDULOS:
   * 
   * 💬 ChatModule: 
   * - Antes de enviar mensagem → BanService.validateUserAccess()
   * - "Usuário pode enviar mensagem?" → Se banido, bloquear
   * 
   * 👥 GroupModule:
   * - Antes de criar grupo → BanService.validateUserAccess()
   * - Antes de entrar em grupo → BanService.validateUserAccess()
   * - "Usuário pode participar de grupos?" → Se banido, negar
   * 
   * 🔐 AuthModule:
   * - Durante login → BanService.checkUserStatus()
   * - "Usuário pode fazer login?" → Se banido, rejeitar
   * 
   * 💾 BanRepository:
   * 📍 USADO POR: AdminModule, ReportsModule, etc.
   * 🎯 FUNÇÃO: Consultar dados de banimentos para relatórios e administração
   * 
   * 📊 ReportStateService:
   * 📍 USADO POR: AdminModule, NotificationModule, etc.
   * 🎯 FUNÇÃO: Gerenciar fluxo de denúncias e estatísticas de moderação
   * 
   * 🔗 ANALOGIA: 
   * É como um departamento de segurança que oferece serviços para toda empresa:
   * - "Consulte-nos antes de dar acesso a alguém"
   * - "Usem nosso sistema de verificação de antecedentes"
   * - "Coordenem conosco questões de segurança"
   */
  exports: [BanService, BanRepository, ReportStateService],
})

// ============================================================================
// CLASSE: BANSMODULE - IDENTIFICAÇÃO OFICIAL
// ============================================================================

/*
 * 🏛️ CLASSE BANSMODULE
 * 
 * Classe identificadora do módulo. O trabalho real é feito
 * pela configuração do decorador @Module acima.
 * 
 * 🎯 FUNÇÃO: Dar nome oficial ao módulo para o NestJS
 */
export class BansModule {}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - BANS MODULE
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🛡️ SEGURANÇA TRANSVERSAL:
 *    - BansModule protege TODO o sistema, não só uma funcionalidade
 *    - Seus serviços são usados por múltiplos módulos
 *    - É uma "camada de segurança" que permeia toda aplicação
 * 
 * 2. 📤 IMPORTÂNCIA DOS EXPORTS:
 *    - Exports definem quais serviços outros módulos podem usar
 *    - BanService é exportado → outros módulos podem verificar banimentos
 *    - Sem exports, serviços ficam privados ao módulo
 * 
 * 3. 🔗 INTERDEPENDÊNCIAS COMPLEXAS:
 *    - BansModule DEPENDE de UsersModule (imports)
 *    - Outros módulos DEPENDEM de BansModule (usam exports)
 *    - Cria uma rede de validações de segurança
 * 
 * 4. 📊 ARQUITETURA DE MÓDULOS:
 *    - Service: Lógica de negócio interna
 *    - Repository: Persistência de dados
 *    - ReportStateService: Coordenação de processos
 *    - Controller: Interface externa
 * 
 * 💡 EXEMPLO PRÁTICO DE INTEGRAÇÃO:
 * 
 * Usuário tenta enviar mensagem:
 * 1. 💬 ChatController recebe requisição
 * 2. 🛡️ ChatService chama BanService.validateUserAccess()
 * 3. 🚫 BanService consulta BanRepository
 * 4. ✅ Se não banido → mensagem é processada
 * 5. ❌ Se banido → erro "Usuário não autorizado"
 * 
 * Usuário tenta criar grupo:
 * 1. 👥 GroupController recebe requisição
 * 2. 🛡️ GroupService chama BanService.validateUserAccess()
 * 3. 🚫 BanService verifica status do usuário
 * 4. ✅ Se autorizado → grupo é criado
 * 5. ❌ Se banido → erro "Permissão negada"
 * 
 * 📈 BENEFÍCIOS DESTA ARQUITETURA:
 * - Segurança centralizada (uma fonte da verdade)
 * - Fácil manutenção (mudanças em um lugar)
 * - Reutilização de código (um service, muitos usos)
 * - Consistência (todas as verificações iguais)
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora vamos entender os detalhes de cada componente:
 * - Como BanService implementa as regras de moderação
 * - Como BanRepository organiza os dados de banimentos
 * - Como ReportStateService coordena denúncias
 * - Como BanController expõe as funcionalidades via API
 * 
 * ========================================================================================
 */
