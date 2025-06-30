/**
 * 🚫 BAN SERVICE - SISTEMA DE MODERAÇÃO E BANIMENTOS DO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Este é um Service NestJS responsável por toda a lógica de moderação e banimentos.
 * É como um "sistema de justiça digital" que mantém a ordem na aplicação.
 * 
 * ANALOGIA SIMPLES:
 * Imagine um shopping center com seguranças e um sistema de controle:
 * - Banimentos: Como "proibir entrada" por mau comportamento
 * - Reports: Como "queixas/denúncias" de outros visitantes
 * - Auto-ban: Quando muitas pessoas reclamam da mesma pessoa
 * - Validação: Como "verificar na portaria" se pode entrar
 * 
 * 🎯 RESPONSABILIDADES DESTE SERVICE:
 * - Aplicar banimentos manuais (admin bane usuário)
 * - Processar reports/denúncias de usuários
 * - Executar banimentos automáticos (múltiplas denúncias)
 * - Verificar se usuário está banido
 * - Gerenciar histórico de banimentos
 * - Desbanir usuários (segunda chance)
 * - Validar acesso para operações críticas
 * 
 * 🔧 TIPOS DE BANIMENTO:
 * - GLOBAL: Banido de toda a aplicação
 * - GROUP: Banido apenas de um grupo específico
 * 
 * 📊 SISTEMA DE REPORTS:
 * - Usuários podem reportar comportamentos inadequados
 * - Sistema conta reports únicos (não pode reportar 2x)
 * - Após X reports: banimento automático
 * - Reports são limpos após ação tomada
 */

// 📦 IMPORTAÇÕES DO NESTJS PARA FUNCIONALIDADES AVANÇADAS
import { 
  Injectable,            // 🏭 Decorator que marca classe como service injetável
  ForbiddenException,    // 🚫 Exception para acesso negado (403)
  NotFoundException,     // 🔍 Exception para recursos não encontrados (404)
  BadRequestException    // ❌ Exception para requisições inválidas (400)
} from '@nestjs/common';

// 📦 IMPORTAÇÕES INTERNAS DO PROJETO
import { BanRepository } from './ban.repository';           // 💾 Repository para persistência de banimentos
import { CreateBanDto, ReportUserDto } from './dto/create-ban.dto'; // 📋 DTOs para validação de dados
import { Ban, BanType, BanReason } from './entities/ban.entity';     // 🏗️ Entidades e enums do domínio
import { UsersService } from '../users/users.service';              // 👥 Service de usuários

/**
 * 🏭 DECORATOR DE SERVICE
 * 
 * 📚 CONCEITO - Injectable Service:
 * @Injectable() marca esta classe como um service que pode
 * ser injetado em outros componentes (controllers, outros services).
 * 
 * É parte do sistema de Dependency Injection do NestJS.
 */
@Injectable()
export class BanService {
  
  /**
   * ⚙️ CONFIGURAÇÕES DO SISTEMA DE MODERAÇÃO
   * 
   * 📚 CONCEITO - Business Rules Configuration:
   * Definimos constantes que controlam o comportamento
   * do sistema de moderação. Facilita ajustes futuros.
   */
  private readonly MULTIPLE_REPORTS_THRESHOLD = 3; // 📊 Quantos reports = auto-ban
  
  /**
   * 💾 STORAGE TEMPORÁRIO DE REPORTS
   * 
   * 📚 CONCEITO - In-Memory Storage:
   * Map para armazenar reports temporários até serem processados.
   * 
   * ESTRUTURA:
   * - Key: "userId" ou "userId:groupId" (para reports específicos de grupo)
   * - Value: Array de IDs dos usuários que reportaram
   * 
   * ⚠️ LIMITAÇÃO: Em produção, isso deveria ser persistido
   * (Redis, banco de dados) para sobreviver a reinicializações.
   */
  private readonly reportStorage = new Map<string, string[]>();

  /**
   * 🏗️ CONSTRUTOR COM INJEÇÃO DE DEPENDÊNCIAS
   * 
   * 📚 CONCEITO - Dependency Injection:
   * O NestJS automaticamente fornece as instâncias dos
   * services e repositories que precisamos.
   * 
   * Dependências:
   * - banRepository: Para salvar/buscar dados de banimentos
   * - usersService: Para validar se usuários existem
   */
  constructor(
    private readonly banRepository: BanRepository,  // 💾 Repository de banimentos
    private readonly usersService: UsersService,    // 👥 Service de usuários
  ) {}

  /**
   * 🚫 MÉTODO: BANIR USUÁRIO MANUALMENTE
   * 
   * 📚 CONCEITO - Administrative Action:
   * Permite que administradores baniram usuários específicos.
   * É como "aplicar uma punição administrativa".
   * 
   * FLUXO DO PROCESSO:
   * 1. ✅ Validar existência dos usuários envolvidos
   * 2. 🚫 Impedir auto-banimento
   * 3. 🔍 Verificar se já está banido
   * 4. 👑 Validar permissões administrativas
   * 5. 💾 Registrar banimento
   * 
   * @param dto - Dados do banimento (quem, onde, porquê)
   * @param bannedByUserId - ID do admin que está aplicando o ban
   * @returns Dados do banimento criado
   */
  async banUser(dto: CreateBanDto, bannedByUserId: string): Promise<Ban> {
    
    /**
     * ✅ VALIDAÇÃO 1: USUÁRIO APLICADOR EXISTE
     * 
     * 📚 CONCEITO - Authority Validation:
     * Verificamos se quem está aplicando o banimento
     * é um usuário válido do sistema.
     */
    const banningUser = await this.usersService.findById(bannedByUserId);
    if (!banningUser) {
      throw new NotFoundException('Usuário que está aplicando o banimento não encontrado');
    }

    /**
     * ✅ VALIDAÇÃO 2: USUÁRIO ALVO EXISTE
     * 
     * 📚 CONCEITO - Target Validation:
     * Não podemos banir usuários que não existem.
     * Isso evita criação de banimentos órfãos.
     */
    const userToBan = await this.usersService.findById(dto.bannedUserId);
    if (!userToBan) {
      throw new NotFoundException('Usuário a ser banido não encontrado');
    }

    /**
     * 🚫 VALIDAÇÃO 3: PREVENIR AUTO-BANIMENTO
     * 
     * 📚 CONCEITO - Self-Harm Prevention:
     * Usuários não podem banir a si mesmos.
     * Isso previne acidentes e auto-sabotagem.
     * 
     * É como impedir que alguém "se expulse do próprio clube".
     */
    if (dto.bannedUserId === bannedByUserId) {
      throw new BadRequestException('Usuário não pode banir a si mesmo');
    }

    /**
     * 🔍 VALIDAÇÃO 4: BANIMENTO DUPLICADO
     * 
     * 📚 CONCEITO - Duplication Prevention:
     * Verificamos se o usuário já está banido no
     * contexto especificado (global ou grupo específico).
     * 
     * Evita banimentos redundantes e confusão.
     */
    const isAlreadyBanned = await this.banRepository.isUserBanned(dto.bannedUserId, dto.groupId);
    if (isAlreadyBanned) {
      throw new BadRequestException('Usuário já está banido');
    }

    /**
     * 👑 VALIDAÇÃO 5: PERMISSÕES DE GRUPO (PLACEHOLDER)
     * 
     * 📚 CONCEITO - Authorization Check:
     * Para banimentos de grupo específico, deveríamos
     * verificar se o usuário é admin do grupo.
     * 
     * Por simplicidade, assumindo que essa verificação
     * é feita no controller que chama este método.
     */
    if (dto.type === BanType.GROUP && dto.groupId) {
      // 🏗️ TODO: Implementar verificação de admin de grupo
      // Por simplicidade, assumindo que a verificação é feita no controller
    }

    /**
     * 💾 EXECUÇÃO DO BANIMENTO
     * 
     * 📚 CONCEITO - State Persistence:
     * Após todas as validações, delegamos para o
     * repository a persistência do banimento.
     */
    return await this.banRepository.create(dto, bannedByUserId);
  }

  /**
   * 📢 MÉTODO: REPORTAR USUÁRIO (SISTEMA DE DENÚNCIAS)
   * 
   * 📚 CONCEITO - Community Moderation:
   * Permite que usuários reportem comportamentos inadequados.
   * É como um "sistema de denúncias comunitárias".
   * 
   * FLUXO INTELIGENTE:
   * 1. ✅ Validar usuário reportado existe
   * 2. 🚫 Impedir auto-report
   * 3. 📊 Registrar report único por usuário
   * 4. 🤖 Verificar se atingiu threshold para auto-ban
   * 5. ⚡ Executar banimento automático se necessário
   * 
   * SISTEMA ANTI-SPAM:
   * - Cada usuário só pode reportar uma vez o mesmo alvo
   * - Reports são contabilizados por contexto (global ou grupo)
   * - Threshold configurável para flexibilidade
   * 
   * @param dto - Dados do report (quem está sendo reportado, onde, porquê)
   * @param reporterUserId - ID do usuário que está reportando
   * @returns Status do report e se houve auto-banimento
   */
  async reportUser(dto: ReportUserDto, reporterUserId: string): Promise<{ message: string; autoBanned?: boolean }> {
    
    /**
     * ✅ VALIDAÇÃO 1: USUÁRIO REPORTADO EXISTE
     * 
     * 📚 CONCEITO - Target Validation:
     * Verificamos se o usuário que está sendo reportado
     * realmente existe no sistema.
     */
    const reportedUser = await this.usersService.findById(dto.reportedUserId);
    if (!reportedUser) {
      throw new NotFoundException('Usuário reportado não encontrado');
    }

    /**
     * 🚫 VALIDAÇÃO 2: PREVENIR AUTO-REPORT
     * 
     * 📚 CONCEITO - Self-Report Prevention:
     * Usuários não podem reportar a si mesmos.
     * Isso previne manipulação do sistema de reports.
     */
    if (dto.reportedUserId === reporterUserId) {
      throw new BadRequestException('Usuário não pode reportar a si mesmo');
    }

    /**
     * 🗂️ GERENCIAMENTO DE REPORTS POR CONTEXTO
     * 
     * 📚 CONCEITO - Context-Aware Storage:
     * Criamos uma chave única baseada no contexto:
     * - Global: apenas "userId"
     * - Grupo: "userId:groupId"
     * 
     * Isso permite reportar o mesmo usuário em contextos
     * diferentes (pode ser problemático em um grupo, mas
     * OK em outros).
     */
    const reportKey = dto.groupId ? `${dto.reportedUserId}:${dto.groupId}` : dto.reportedUserId;
    const existingReports = this.reportStorage.get(reportKey) || [];
    
    /**
     * 🔒 VALIDAÇÃO 3: PREVENIR REPORTS DUPLICADOS
     * 
     * 📚 CONCEITO - Duplication Prevention:
     * Verificamos se este usuário já reportou
     * o mesmo alvo no mesmo contexto.
     * 
     * Isso mantém a integridade do sistema de contagem.
     */
    if (existingReports.includes(reporterUserId)) {
      throw new BadRequestException('Usuário já foi reportado por você');
    }

    /**
     * 📊 REGISTRO DO NOVO REPORT
     * 
     * 📚 CONCEITO - Report Accumulation:
     * Adicionamos o reportador à lista de reports
     * para este usuário/contexto e atualizamos o storage.
     */
    existingReports.push(reporterUserId);
    this.reportStorage.set(reportKey, existingReports);

    /**
     * 🤖 VERIFICAÇÃO DE AUTO-BANIMENTO
     * 
     * 📚 CONCEITO - Threshold-Based Automation:
     * Se o número de reports atingiu o threshold,
     * executamos um banimento automático.
     * 
     * É como "tribunal popular" - quando muitos
     * concordam que há um problema, ação é tomada.
     */
    if (existingReports.length >= this.MULTIPLE_REPORTS_THRESHOLD) {
      
      /**
       * 🏗️ CRIAÇÃO DO BAN AUTOMÁTICO
       * 
       * 📚 CONCEITO - System-Generated Action:
       * Construímos um DTO de banimento baseado nos reports:
       * - Tipo: GLOBAL ou GROUP baseado no contexto
       * - Razão: MULTIPLE_REPORTS (banimento automático)
       * - Evidências: Lista de usuários que reportaram
       */
      const banDto: CreateBanDto = {
        bannedUserId: dto.reportedUserId,      // 🎯 Quem será banido
        reason: BanReason.MULTIPLE_REPORTS,   // 📋 Motivo: múltiplos reports
        type: dto.groupId ? BanType.GROUP : BanType.GLOBAL, // 🌐 Escopo do ban
        groupId: dto.groupId,                 // 🏠 Grupo específico (se aplicável)
        reports: existingReports,             // 📊 Evidências (lista de reportadores)
      };

      /**
       * 💾 EXECUÇÃO DO BANIMENTO AUTOMÁTICO
       * 
       * 📚 CONCEITO - Automated Enforcement:
       * Criamos o banimento com autor "system" para
       * indicar que foi uma ação automática.
       */
      await this.banRepository.create(banDto, 'system');
      
      /**
       * 🧹 LIMPEZA DE REPORTS PROCESSADOS
       * 
       * 📚 CONCEITO - Data Cleanup:
       * Após tomar ação, removemos os reports do
       * storage temporário para liberar memória.
       */
      this.reportStorage.delete(reportKey);
      
      /**
       * 📦 RESPOSTA DE AUTO-BANIMENTO
       * 
       * Informamos que o report foi processado E
       * que resultou em banimento automático.
       */
      return { 
        message: 'Usuário reportado com sucesso e banido automaticamente por múltiplas denúncias',
        autoBanned: true 
      };
    }

    /**
     * 📦 RESPOSTA DE REPORT NORMAL
     * 
     * 📚 CONCEITO - Progress Feedback:
     * Informamos o progresso em direção ao threshold,
     * dando transparência ao sistema de moderação.
     */
    return { 
      message: `Usuário reportado com sucesso. Reports: ${existingReports.length}/${this.MULTIPLE_REPORTS_THRESHOLD}` 
    };
  }

  /**
   * 🔍 MÉTODO: VERIFICAR SE USUÁRIO ESTÁ BANIDO
   * 
   * 📚 CONCEITO - Access Control Check:
   * Método simples para verificar o status de banimento.
   * É como "consultar a lista de pessoas barradas".
   * 
   * FUNCIONALIDADE:
   * - Verifica banimentos globais (sem groupId)
   * - Verifica banimentos de grupo específico (com groupId)
   * - Usado em validações antes de permitir ações
   * 
   * @param userId - ID do usuário a verificar
   * @param groupId - ID do grupo (opcional, para banimentos de grupo)
   * @returns true se banido, false se liberado
   */
  async isUserBanned(userId: string, groupId?: string): Promise<boolean> {
    /**
     * 🔄 DELEGAÇÃO PARA REPOSITORY
     * 
     * 📚 CONCEITO - Separation of Concerns:
     * O service delega a consulta para o repository,
     * mantendo a responsabilidade de persistência
     * separada da lógica de negócio.
     */
    return await this.banRepository.isUserBanned(userId, groupId);
  }

  /**
   * 📚 MÉTODO: OBTER HISTÓRICO DE BANIMENTOS DO USUÁRIO
   * 
   * 📚 CONCEITO - User History:
   * Retorna todos os banimentos (ativos e inativos) de um usuário.
   * Útil para análise de comportamento e decisões de moderação.
   * 
   * CASOS DE USO:
   * - Administradores verificando histórico
   * - Análise de padrões de comportamento
   * - Auditoria de decisões de moderação
   * 
   * @param userId - ID do usuário
   * @returns Lista de banimentos do usuário
   */
  async getUserBans(userId: string): Promise<Ban[]> {
    /**
     * 🔄 DELEGAÇÃO SIMPLES
     * 
     * Repository pattern: service foca na lógica,
     * repository cuida dos detalhes de persistência.
     */
    return await this.banRepository.findByUserId(userId);
  }

  /**
   * 🔓 MÉTODO: DESBANIR USUÁRIO (SEGUNDA CHANCE)
   * 
   * 📚 CONCEITO - Redemption System:
   * Permite que administradores removam banimentos.
   * É como "dar uma segunda chance" ou "perdoar".
   * 
   * LÓGICA IMPLEMENTADA:
   * 1. 🔍 Buscar banimento pelo ID
   * 2. ✅ Verificar se existe e está ativo
   * 3. 🔄 Desativar o banimento
   * 4. 📦 Confirmar ação
   * 
   * @param banId - ID do banimento a ser removido
   * @param unbannedByUserId - ID do admin que está desbabindo
   * @returns Confirmação da ação
   */
  async unbanUser(banId: string, unbannedByUserId: string): Promise<{ message: string }> {
    
    /**
     * 🔍 BUSCAR BANIMENTO ESPECÍFICO
     * 
     * 📚 CONCEITO - Record Lookup:
     * Precisamos encontrar o banimento específico
     * que está sendo questionado.
     */
    const bans = await this.banRepository.findAll();
    const ban = bans.find(b => b.id === banId && b.isActive);
    
    /**
     * ✅ VALIDAÇÃO DE EXISTÊNCIA E STATUS
     * 
     * 📚 CONCEITO - State Validation:
     * Só podemos desbanir se:
     * - O banimento existe
     * - O banimento está ativo
     * 
     * Banimentos já inativos não precisam ser "desbabidos".
     */
    if (!ban) {
      throw new NotFoundException('Banimento não encontrado ou já inativo');
    }

    /**
     * 🔄 DESATIVAÇÃO DO BANIMENTO
     * 
     * 📚 CONCEITO - Soft Deletion:
     * Ao invés de deletar o registro, apenas marcamos
     * como inativo. Isso preserva o histórico para auditoria.
     */
    await this.banRepository.deactivate(banId);
    
    /**
     * 📦 CONFIRMAÇÃO DA AÇÃO
     * 
     * Retornamos uma mensagem amigável confirmando
     * que o usuário foi desbabido com sucesso.
     */
    return { message: 'Usuário desbanido com sucesso' };
  }

  /**
   * 📋 MÉTODO: LISTAR TODOS OS BANIMENTOS
   * 
   * 📚 CONCEITO - Administrative Overview:
   * Permite que administradores vejam todos os banimentos
   * do sistema para auditoria e gestão.
   * 
   * CASOS DE USO:
   * - Painel administrativo de moderação
   * - Relatórios de atividade de moderação
   * - Análise de padrões de problemas
   * 
   * @returns Lista completa de banimentos
   */
  async getAllBans(): Promise<Ban[]> {
    /**
     * 🔄 DELEGAÇÃO DIRETA
     * 
     * Método simples que expõe dados do repository
     * para consumo administrativo.
     */
    return await this.banRepository.findAll();
  }

  /**
   * 🛡️ MÉTODO: VALIDAR ACESSO DO USUÁRIO (GUARD HELPER)
   * 
   * 📚 CONCEITO - Access Validation Helper:
   * Método utilitário usado por outras partes do sistema
   * para verificar se um usuário pode realizar ações.
   * 
   * DIFERENÇA DE isUserBanned():
   * - isUserBanned(): Retorna boolean (consulta)
   * - validateUserAccess(): Lança exception se banido (bloqueio)
   * 
   * USO TÍPICO:
   * Outros services chamam este método antes de
   * executar operações críticas (criar grupo, enviar mensagem, etc.)
   * 
   * @param userId - ID do usuário a validar
   * @param groupId - ID do grupo (opcional)
   * @throws ForbiddenException se usuário estiver banido
   */
  async validateUserAccess(userId: string, groupId?: string): Promise<void> {
    
    /**
     * 🔍 VERIFICAÇÃO DE BANIMENTO
     * 
     * 📚 CONCEITO - Guard Pattern:
     * Verificamos o status e tomamos ação imediata
     * se encontrarmos problema.
     */
    const isBanned = await this.isUserBanned(userId, groupId);
    
    /**
     * 🚫 BLOQUEIO IMEDIATO SE BANIDO
     * 
     * 📚 CONCEITO - Fail-Fast Validation:
     * Se o usuário está banido, lançamos exception
     * imediatamente para interromper o fluxo.
     * 
     * Isso é mais conveniente que fazer verificações
     * manuais em cada controller/service.
     */
    if (isBanned) {
      throw new ForbiddenException('Usuário está banido e não pode realizar esta ação');
    }
    
    /**
     * ✅ SUCESSO SILENCIOSO
     * 
     * Se chegamos até aqui sem exception,
     * o usuário está liberado para continuar.
     * Método void = "sem notícias, boas notícias".
     */
  }
}

/**
 * 📚 RESUMO EDUCACIONAL - BAN SERVICE
 * 
 * 🎯 O QUE APRENDEMOS NESTE ARQUIVO:
 * 
 * 1. 🏗️ ARQUITETURA DE SERVICE COMPLEXO:
 *    - Múltiplas responsabilidades bem organizadas
 *    - Validações em cascata para operações críticas
 *    - Configurações centralizadas para flexibilidade
 *    - Storage temporário para dados de sessão
 * 
 * 2. 🧠 LÓGICA DE NEGÓCIO AVANÇADA:
 *    - Sistema de reports com threshold automático
 *    - Banimentos contextuais (global vs. grupo)
 *    - Anti-spam e anti-abuso integrados
 *    - Histórico e auditoria preservados
 * 
 * 3. 🔐 PADRÕES DE SEGURANÇA:
 *    - Validação de existência antes de ações
 *    - Prevenção de auto-sabotagem
 *    - Verificações de duplicação
 *    - Exception throwing para controle de fluxo
 * 
 * 4. 🎨 DESIGN PATTERNS OBSERVADOS:
 *    - Service Layer Pattern (lógica de negócio isolada)
 *    - Repository Pattern (persistência abstraída)
 *    - Guard Pattern (validateUserAccess)
 *    - Strategy Pattern (diferentes tipos de ban)
 * 
 * 5. 📊 GESTÃO DE DADOS INTELIGENTE:
 *    - Map para storage temporário eficiente
 *    - Chaves compostas para contextos diferentes
 *    - Soft deletion para preservar histórico
 *    - Threshold configurável para flexibilidade
 * 
 * 6. 🚀 CONCEITOS DE SISTEMA DE PRODUÇÃO:
 *    - Moderação automática baseada em comunidade
 *    - Sistemas de segunda chance (unban)
 *    - Auditoria e transparência
 *    - Prevenção de abuso do sistema
 * 
 * 💡 MELHORIAS SUGERIDAS PARA PRODUÇÃO:
 * - Persistent storage para reports (Redis/DB)
 * - Logs detalhados de todas as ações
 * - Rate limiting para reports
 * - Webhook notifications para banimentos
 * - Escalação automática para casos complexos
 * - Interface administrativa para gestão
 * 
 * 🔗 INTEGRAÇÃO COM OUTROS MÓDULOS:
 * - UsersService: Validação de existência
 * - GroupController: Verificação de permissões
 * - ChatGateway: Bloqueio em tempo real
 * - AuthGuard: Verificação preventiva
 */
