/*
 * ========================================================================================
 * USER ENTITY - DEFINIÇÃO DA ESTRUTURA DE UM USUÁRIO
 * ========================================================================================
 * 
 * 🎯 CONCEITO: User Entity (Entidade de Usuário)
 * Esta entidade define EXATAMENTE como um usuário deve ser estruturado
 * no nosso sistema. É o "DNA" de todo usuário no WhatsUT.
 * 
 * 👤 DADOS QUE REPRESENTA:
 * - Identificação única do usuário
 * - Nome para exibição na interface
 * - Credenciais para autenticação
 * - Base para relacionamentos com outras entidades
 * 
 * 🏗️ ANALOGIA: 
 * É como uma "carteira de identidade digital" que TODO usuário deve ter:
 * - Número do documento (ID)
 * - Nome completo (name)
 * - Assinatura digital (password hash)
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS PARA VALIDAÇÃO
// ============================================================================

/*
 * 📦 CLASS-VALIDATOR: Biblioteca para validação automática
 * 
 * 🎯 FUNÇÃO: Valida dados que chegam na API automaticamente
 * 🛡️ SEGURANÇA: Impede dados inválidos ou maliciosos
 * 
 * 🔧 DECORATORS IMPORTADOS:
 * - @IsString(): Valida se é texto
 * - @IsNotEmpty(): Campo obrigatório, não pode estar vazio
 * - @MinLength(): Tamanho mínimo de caracteres
 * - @IsOptional(): Campo pode ser omitido
 */
import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

// ============================================================================
// ENTIDADE PRINCIPAL: USER (USUÁRIO)
// ============================================================================

/*
 * 👤 CLASSE USER
 * 
 * Esta classe define a estrutura completa de um usuário no sistema.
 * Cada propriedade tem uma função específica na identificação e autenticação.
 * 
 * 🎯 FUNÇÃO: Servir como "contrato" - todos os usuários DEVEM ter essas propriedades
 * 
 * 💡 ANALOGIA: 
 * Como um cadastro padrão de qualquer sistema:
 * - Todo usuário DEVE ter: ID, nome, senha
 * - Permite: login, identificação, personalização
 * 
 * 🔗 RELACIONAMENTOS:
 * Esta entity é referenciada em:
 * - Chat.senderId → User.id (quem enviou mensagem)
 * - Chat.targetId → User.id (para quem vai mensagem privada)
 * - Group.members → User.id[] (membros do grupo)
 * - Group.admins → User.id[] (administradores do grupo)
 */
export class User {
  
  /*
   * 🆔 ID: Identificador Único do Usuário
   * 
   * 🎯 FUNÇÃO: "CPF" do usuário - cada um tem ID único e irrepetível
   * 📊 FORMATO: UUID (ex: "user-bb145801-dd77-4e34-bdea-bee5dd790f3e")
   * 🔍 USO: Referência em mensagens, grupos, autenticação
   * 
   * 💡 ANALOGIA: Como o número de CPF ou RG
   * - Identifica unicamente uma pessoa
   * - Usado em todos os documentos e relacionamentos
   * - Nunca muda, mesmo se nome ou senha mudarem
   * 
   * 🔧 EXEMPLO PRÁTICO:
   * Chat usa senderId="user-123" para saber quem enviou
   * Grupo usa members=["user-123", "user-456"] para listar membros
   * 
   * 🔒 SEGURANÇA:
   * - Não contém informações pessoais
   * - Impossível de ser adivinhado
   * - Permite rastreamento seguro de ações
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  id: string;           // 🆔 Identificador único (ex: "user-123")

  /*
   * 👨‍💼 NAME: Nome do Usuário
   * 
   * 🎯 FUNÇÃO: Nome para exibição na interface do chat
   * 🖥️ USO: Mostrado em mensagens, listas de usuários, perfil
   * 📱 INTERFACE: "João disse: Oi pessoal!"
   * 
   * 💡 ANALOGIA: Como o nome em um crachá de evento
   * - É como você quer ser chamado
   * - Aparece quando você fala
   * - Outros usuários te identificam por este nome
   * 
   * 🔧 EXEMPLOS PRÁTICOS:
   * name: "João Silva" → Interface mostra "João Silva"
   * name: "Ana" → Interface mostra "Ana"
   * name: "Prof. Carlos" → Interface mostra "Prof. Carlos"
   * 
   * 📏 VALIDAÇÕES:
   * - Mínimo 2 caracteres (evita nomes muito curtos)
   * - String obrigatória (todo usuário deve ter nome)
   * - Pode conter espaços, acentos, caracteres especiais
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;         // 👨‍💼 Nome para exibição (ex: "João Silva")

  /*
   * 🔐 PASSWORD: Senha do Usuário
   * 
   * 🎯 FUNÇÃO: Credencial para autenticação e segurança
   * 🔒 SEGURANÇA: SEMPRE deve ser hasheada antes de salvar
   * 🚫 NUNCA: Armazenar senha em texto puro
   * 
   * 💡 ANALOGIA: Como a assinatura em documentos
   * - Só você sabe como fazer
   * - Prova que é realmente você
   * - Protege sua conta de invasores
   * 
   * 🔧 FLUXO DE SEGURANÇA:
   * 1. User digita senha: "minhaSenha123"
   * 2. Sistema aplica hash: bcrypt.hash("minhaSenha123")
   * 3. Salva hash: "$2b$10$rZ9nXF..." (não salva texto original)
   * 4. No login: compara hash da senha digitada com hash salvo
   * 
   * 📏 VALIDAÇÕES:
   * - Mínimo 6 caracteres (segurança básica)
   * - String obrigatória (todo usuário deve ter senha)
   * - Sistema adiciona mais validações (maiúscula, número, etc.)
   * 
   * ⚠️ ATENÇÃO DESENVOLVEDOR:
   * Este campo SEMPRE deve ser hasheado no AuthService antes
   * de chegar no Repository. NUNCA salvar senha em texto puro!
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;     // 🔐 Senha hasheada (ex: "$2b$10$rZ9nXF...")

  /*
   * 📧 EMAIL: Email do Usuário (Opcional)
   * 
   * 🎯 FUNÇÃO: Identificação alternativa e recuperação de senha
   * ⚪ OPCIONAL: Nem todo usuário precisa ter email
   * 🔄 FUTURO: Pode ser usado para notificações e recuperação
   * 
   * 💡 ANALOGIA: Como um endereço de correspondência
   * - Forma alternativa de te encontrar
   * - Útil para avisos importantes
   * - Pode ser usado como nome de usuário
   * 
   * 🔧 CASOS DE USO:
   * - Login por email (alternativa ao ID)
   * - "Esqueci minha senha" → enviar por email
   * - Notificações de segurança
   * - Convites para grupos por email
   */
  @IsOptional()         // 🔧 Validação: Campo opcional
  @IsString()           // 🔧 Validação: Deve ser string quando presente
  email?: string;       // 📧 Email para contato (ex: "joao@email.com")

  /*
   * ⏰ CREATED_AT: Data de Criação da Conta
   * 
   * 🎯 FUNÇÃO: Timestamp de quando o usuário se registrou
   * 📊 USO: Estatísticas, ordenação, auditoria
   * ⚪ OPCIONAL: Preenchido automaticamente no construtor
   * 
   * 💡 ANALOGIA: Como a data de emissão do RG
   * - Prova quando a conta foi criada
   * - Útil para relatórios ("usuários novos")
   * - Ajuda em debugs e suporte
   */
  @IsOptional()         // 🔧 Validação: Campo opcional
  createdAt?: Date;     // ⏰ Data de criação (ex: 2024-01-15T14:30:00Z)

  /*
   * 🌐 IS_ONLINE: Status Online/Offline
   * 
   * 🎯 FUNÇÃO: Indica se usuário está conectado no momento
   * 🔄 DINÂMICO: Atualizado pelo OnlineUsersService
   * 📱 INTERFACE: Mostra "🟢 Online" ou "⚫ Offline"
   * 
   * 💡 ANALOGIA: Como o "status" no WhatsApp
   * - Verde = online, disponível para chat
   * - Cinza = offline, pode não responder imediatamente
   * - Atualizado automaticamente pelo sistema
   */
  @IsOptional()         // 🔧 Validação: Campo opcional
  isOnline?: boolean;   // 🌐 Status online (ex: true/false)

  /*
   * 🏗️ CONSTRUTOR DA ENTIDADE USER
   * 
   * 🎯 FUNÇÃO: Cria uma nova instância de usuário com valores padrão
   * 📝 PARÂMETROS: Todos opcionais (Partial<User>)
   * 🔧 INICIALIZAÇÃO: Define valores padrão seguros
   * 
   * 💡 ANALOGIA: Como preencher um formulário de cadastro
   * - Alguns campos obrigatórios (id, name, password)
   * - Outros opcionais (email, createdAt)
   * - Sistema preenche o que conseguir automaticamente
   * 
   * 🚀 VALORES PADRÃO INTELIGENTES:
   * - createdAt: NOW (momento atual)
   * - isOnline: false (usuário começa offline)
   * - email: undefined (não obrigatório)
   * 
   * 📊 EXEMPLO DE USO:
   * const user = new User({
   *   id: 'user-123',
   *   name: 'João',
   *   password: 'hashedPassword'
   * })
   * // Resultado: { ..., createdAt: NOW, isOnline: false }
   */
  constructor(partial: Partial<User> = {}) {
    // 🔄 Object.assign: Copia propriedades do 'partial' para 'this'
    Object.assign(this, partial);
    
    // ⏰ Se não veio data de criação, usa o momento atual
    // Garante que todo usuário tenha timestamp de criação
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    
    // 🌐 Se não especificou status online, assume offline
    // Usuário só fica online quando faz login ativo
    if (this.isOnline === undefined) {
      this.isOnline = false;
    }
  }
}

/*
 * ========================================================================================
 * 🎓 RESUMO EDUCACIONAL COMPLETO - USER ENTITY
 * ========================================================================================
 * 
 * 🌟 O QUE APRENDEMOS HOJE:
 * 
 * 1️⃣ ENTITY PATTERN PARA USUÁRIOS:
 *    ✅ Identificação única e segura (id)
 *    ✅ Dados essenciais mínimos (name, password)
 *    ✅ Informações opcionais úteis (email, timestamps)
 *    ✅ Status dinâmico (isOnline)
 * 
 * 2️⃣ SEGURANÇA DE DADOS:
 *    ✅ IDs não sequenciais (UUID)
 *    ✅ Senhas hasheadas (bcrypt)
 *    ✅ Validações de entrada (decorators)
 *    ✅ Campos opcionais para flexibilidade
 * 
 * 3️⃣ DESIGN DE SISTEMA:
 *    ✅ Estrutura mínima mas completa
 *    ✅ Extensível para futuras funcionalidades
 *    ✅ Relacionamentos claros com outras entities
 *    ✅ Construtor inteligente com defaults
 * 
 * 4️⃣ VALIDAÇÕES ROBUSTAS:
 *    ✅ @IsString(): Tipo correto
 *    ✅ @IsNotEmpty(): Campos obrigatórios
 *    ✅ @MinLength(): Segurança mínima
 *    ✅ @IsOptional(): Flexibilidade
 * 
 * 🔗 RELACIONAMENTOS NO SISTEMA:
 * 
 * 📝 Em Mensagens:
 *    Chat.senderId → User.id (quem enviou)
 *    Chat.targetId → User.id (destinatário privado)
 * 
 * 👥 Em Grupos:
 *    Group.members → User.id[] (lista de membros)
 *    Group.admins → User.id[] (administradores)
 * 
 * 🔐 Em Autenticação:
 *    JWT.sub → User.id (usuário logado)
 *    Session.userId → User.id (sessão ativa)
 * 
 * 💬 CASOS DE USO REAIS:
 * 
 * 👤 Usuário Simples:
 *    new User({
 *      id: "user-123",
 *      name: "João Silva",
 *      password: "$2b$10$hashedPassword..."
 *    })
 * 
 * 📧 Usuário Completo:
 *    new User({
 *      id: "user-456",
 *      name: "Ana Santos",
 *      password: "$2b$10$hashedPassword...",
 *      email: "ana@email.com",
 *      isOnline: true
 *    })
 * 
 * 🔄 FLUXO COMPLETO NO SISTEMA:
 * 
 * 1. 📝 REGISTRO: Frontend envia dados → AuthService valida → User criado
 * 2. 🔐 LOGIN: AuthService verifica senha → JWT gerado com User.id
 * 3. 💬 CHAT: Message.senderId aponta para User.id
 * 4. 🌐 ONLINE: OnlineUsersService atualiza User.isOnline
 * 5. 👥 GRUPOS: Group.members lista User.id dos participantes
 * 
 * 🚀 PRÓXIMOS ARQUIVOS PARA ESTUDAR:
 * 
 * 📁 DTOs (Validação de Entrada):
 *    ├── create-user.dto.ts → Como criar usuário
 *    └── update-user.dto.ts → Como atualizar dados
 * 
 * 🏛️ Services (Regras de Negócio):
 *    └── users.service.ts → Lógica de usuários
 * 
 * 📊 Repository (Persistência):
 *    └── csv-user.repository.ts → Salvar/buscar usuários
 * 
 * 🎮 Controller (Endpoints):
 *    └── users.controller.ts → APIs REST
 * 
 * 🔐 Auth System (Relacionado):
 *    ├── auth.service.ts → Autenticação
 *    └── jwt.strategy.ts → Validação de tokens
 * 
 * 💡 DICAS PROFISSIONAIS:
 * 
 * 🔍 CODE REVIEW: Esta entity é referenciada em TODO o sistema.
 *    Mudanças aqui afetam autenticação, chat, grupos, etc.
 * 
 * 🛡️ SEGURANÇA: NUNCA salve senhas em texto puro!
 *    Sempre use bcrypt.hash() antes de persistir.
 * 
 * 📈 ESCALABILIDADE: Estrutura permite adicionar campos facilmente:
 *    - avatar?: string (foto do perfil)
 *    - bio?: string (descrição pessoal)
 *    - lastSeen?: Date (última atividade)
 * 
 * 🎯 MANUTENIBILIDADE: IDs únicos facilitam debugging e suporte
 * 
 * ⚡ PERFORMANCE: Campos opcionais reduzem uso de memória
 * 
 * 🔧 DEBUGGING: Timestamps ajudam a rastrear problemas temporais
 * 
 * ========================================================================================
 */
