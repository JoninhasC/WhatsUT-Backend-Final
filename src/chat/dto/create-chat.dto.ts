/*
 * ========================================================================================
 * CREATE CHAT DTO - ESTRUTURA PARA CRIAÇÃO DE MENSAGENS/CONVERSAS
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Create Chat DTO
 * Este DTO define e valida os dados necessários para criar uma nova mensagem
 * ou iniciar uma conversa. É como um "formulário de envio de mensagem" que
 * garante que todos os dados obrigatórios estejam presentes e corretos.
 * 
 * 🔄 DIFERENÇA DE SendMessageDto:
 * - CreateChatDto: Mais específico, todos os campos obrigatórios
 * - SendMessageDto: Mais flexível, campos opcionais para compatibilidade
 * 
 * 💬 USO TÍPICO:
 * - Criar primeira mensagem de uma conversa
 * - Envio de mensagem com dados completos
 * - Validação rigorosa de todos os campos
 * 
 * 🏗️ ANALOGIA: 
 * É como preencher um telegrama nos Correios:
 * - Todos os campos são obrigatórios
 * - Não pode deixar nada em branco
 * - Precisa especificar claramente remetente, destinatário e conteúdo
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS DE VALIDAÇÃO
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 ApiProperty: Documentação automática para Swagger
 * 🛡️ Validadores: Conjunto completo de validações rigorosas
 * - IsNotEmpty: Campo não pode estar vazio
 * - IsString: Deve ser texto
 * - IsIn: Deve estar em lista específica
 * - IsUUID: Deve ser UUID válido
 * - IsOptional: Campo pode ser omitido
 * - IsBoolean: Deve ser true/false
 * - MaxLength: Tamanho máximo
 * - Matches: Deve seguir padrão regex
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty,     // ❌ Não pode estar vazio
  IsString,       // 📝 Deve ser string
  IsIn,           // 📋 Deve estar na lista permitida
  IsUUID,         // 🆔 Deve ser UUID válido
  IsOptional,     // ⚪ Campo opcional
  IsBoolean,      // ✅ Deve ser boolean
  MaxLength,      // 📏 Tamanho máximo
  Matches         // 🔍 Deve seguir padrão regex
} from 'class-validator';

// ============================================================================
// DTO PRINCIPAL: CREATECHAT
// ============================================================================

/*
 * 🏛️ CLASSE CREATECHATDTO
 * 
 * DTO rigoroso que exige TODOS os campos principais para criar uma mensagem.
 * Diferente do SendMessageDto, aqui não há campos opcionais nos essenciais.
 * 
 * 🎯 FILOSOFIA: "Todos os dados ou nenhum"
 * - Melhor falhar cedo com dados incompletos
 * - Garante consistência na criação de mensagens
 * - Interface mais previsível para o service
 */
export class CreateChatDto {
  
  // ========================================================================
  // CAMPO: REMETENTE (OBRIGATÓRIO)
  // ========================================================================
  
  /*
   * 👤 CAMPO: SENDER_ID (Remetente da Mensagem)
   * 
   * Campo obrigatório que identifica quem está enviando a mensagem.
   * Diferente de outros DTOs, aqui o senderId deve ser fornecido
   * explicitamente (não inferido do token JWT).
   */
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',   // 📝 Exemplo de UUID
    description: 'ID do remetente (UUID válido)',        // 📋 Descrição clara
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO SENDER_ID:
   * 
   * Tripla validação para garantir dados corretos:
   * 1. IsNotEmpty: Não pode estar vazio
   * 2. IsString: Deve ser texto
   * 3. IsUUID: Deve ser UUID versão 4 válido
   */
  @IsNotEmpty({ message: 'ID do remetente é obrigatório' })
  @IsString({ message: 'ID do remetente deve ser uma string' })
  @IsUUID(4, { message: 'ID do remetente deve ser um UUID válido' })
  senderId: string;

  // ========================================================================
  // CAMPO: CONTEÚDO (OBRIGATÓRIO COM PROTEÇÃO XSS)
  // ========================================================================
  
  /*
   * 📝 CAMPO: CONTENT (Conteúdo da Mensagem)
   * 
   * O texto ou informação sendo enviada. Possui validações especiais
   * de segurança mais simples que o SafeMessageConstraint.
   */
  @ApiProperty({
    example: 'Oi meu chapa',                                    // 📝 Exemplo amigável
    description: 'Conteúdo da mensagem (máximo 1000 caracteres, sem XSS)', // 📋 Limitações claras
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO CONTENT:
   * 
   * Validações em camadas para segurança e qualidade:
   * 1. IsNotEmpty: Mensagem não pode estar vazia
   * 2. IsString: Deve ser texto (não número ou objeto)
   * 3. MaxLength: Máximo 1000 caracteres (evita spam)
   * 4. Matches: Proteção básica contra XSS
   */
  @IsNotEmpty({ message: 'Conteúdo da mensagem é obrigatório' })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  
  /*
   * 🔒 REGEX DE SEGURANÇA: /^[^<>'"]*$/
   * 
   * 🎯 EXPLICAÇÃO DO PADRÃO:
   * - ^ : Início da string
   * - [^<>'"]: Qualquer caractere EXCETO <, >, ', "
   * - * : Zero ou mais caracteres
   * - $ : Final da string
   * 
   * 🚫 BLOQUEIA:
   * - < e > : Tags HTML (<script>, <img>, etc.)
   * - ' e " : Aspas (podem quebrar SQL ou JavaScript)
   * 
   * ✅ PERMITE:
   * - Letras, números, espaços
   * - Caracteres acentuados (á, ç, ñ)
   * - Pontuação básica (., !, ?, -, etc.)
   * 
   * 💡 EXEMPLOS:
   * ✅ "Oi pessoal! Como vão?" → PERMITIDO
   * ✅ "Reunião às 14h30 na sala 2" → PERMITIDO
   * ❌ "Clique <a href='#'>aqui</a>" → BLOQUEADO
   * ❌ "Nome = 'João'" → BLOQUEADO
   * 
   * 🔧 DIFERENÇA DO SafeMessageConstraint:
   * Esta validação é mais simples e permissiva, mas ainda bloqueia
   * os ataques mais comuns. Para validação mais rigorosa, use
   * o SafeMessageConstraint do SendMessageDto.
   */
  @Matches(/^[^<>'"]*$/, { message: 'Mensagem não pode conter caracteres especiais como <, >, \', "' })
  content: string;

  // ========================================================================
  // CAMPO: TIPO DE CHAT (OBRIGATÓRIO)
  // ========================================================================
  
  /*
   * 🏷️ CAMPO: CHAT_TYPE (Tipo da Conversa)
   * 
   * Campo obrigatório que define claramente se é conversa privada ou grupo.
   * Evita ambiguidade na lógica de negócio.
   */
  @ApiProperty({
    example: 'private',                       // 📝 Exemplo padrão
    description: 'Tipo do chat: private ou group', // 📋 Opções claras
    enum: ['private', 'group'],               // 📊 Lista na documentação
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO CHAT_TYPE:
   * 
   * Validação rigorosa para garantir tipo correto:
   * 1. IsNotEmpty: Deve especificar o tipo
   * 2. IsString: Deve ser texto
   * 3. IsIn: Deve ser exatamente 'private' ou 'group'
   */
  @IsNotEmpty({ message: 'Tipo do chat é obrigatório' })
  @IsString({ message: 'Tipo do chat deve ser uma string' })
  @IsIn(['private', 'group'], { message: 'Tipo do chat deve ser "private" ou "group"' })
  chatType: 'private' | 'group';

  // ========================================================================
  // CAMPO: DESTINATÁRIO (OBRIGATÓRIO)
  // ========================================================================
  
  /*
   * 🎯 CAMPO: TARGET_ID (Destinatário da Mensagem)
   * 
   * Campo obrigatório que especifica para onde a mensagem vai.
   * Deve ser UUID válido de usuário ou grupo, dependendo do chatType.
   */
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',   // 📝 Exemplo de UUID
    description: 'ID do destinatário ou grupo (UUID válido)', // 📋 Descrição clara
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO TARGET_ID:
   * 
   * Mesmas validações rigorosas do senderId:
   * 1. IsNotEmpty: Deve especificar destino
   * 2. IsString: Deve ser texto
   * 3. IsUUID: Deve ser UUID versão 4 válido
   * 
   * 🔗 RELACIONAMENTO COM CHAT_TYPE:
   * - Se chatType='private' → targetId deve ser UUID de usuário
   * - Se chatType='group' → targetId deve ser UUID de grupo
   * (Essa validação é feita no service, não no DTO)
   */
  @IsNotEmpty({ message: 'ID do destinatário é obrigatório' })
  @IsString({ message: 'ID do destinatário deve ser uma string' })
  @IsUUID(4, { message: 'ID do destinatário deve ser um UUID válido' })
  targetId: string;

  // ========================================================================
  // CAMPO: INDICADOR DE ARQUIVO (OPCIONAL)
  // ========================================================================
  
  /*
   * 📁 CAMPO: IS_ARQUIVO (Indica Arquivo)
   * 
   * Campo opcional que especifica se a mensagem contém arquivo.
   * Único campo opcional neste DTO rigoroso.
   */
  @ApiProperty({
    example: false,                           // 📝 Exemplo padrão (não é arquivo)
    description: 'Indica se a mensagem é um arquivo', // 📋 Explicação simples
    required: false,                          // ⚪ Marcado como opcional na documentação
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO IS_ARQUIVO:
   * 
   * Validação simples para campo opcional:
   * 1. IsOptional: Pode ser omitido
   * 2. IsBoolean: Se fornecido, deve ser true ou false
   * 
   * 💡 VALORES POSSÍVEIS:
   * - undefined: Não especificado (padrão: false)
   * - false: Mensagem de texto
   * - true: Mensagem contém arquivo
   */
  @IsOptional()
  @IsBoolean({ message: 'isArquivo deve ser um valor booleano' })
  isArquivo?: boolean; 
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - CREATE CHAT DTO
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🔒 DTO RIGOROSO vs DTO FLEXÍVEL:
 *    - CreateChatDto: Todos campos obrigatórios (exceto isArquivo)
 *    - SendMessageDto: Múltiplos campos opcionais para flexibilidade
 *    - Cada um serve um propósito específico
 * 
 * 2. 🛡️ CAMADAS DE VALIDAÇÃO:
 *    - Tipo (IsString, IsBoolean)
 *    - Presença (IsNotEmpty)
 *    - Formato (IsUUID, IsIn)
 *    - Tamanho (MaxLength)
 *    - Segurança (Matches para XSS)
 * 
 * 3. 🔍 VALIDAÇÃO DE SEGURANÇA BÁSICA:
 *    - Regex simples mas efetiva contra XSS comum
 *    - Bloqueia caracteres perigosos principais
 *    - Menos rigorosa que SafeMessageConstraint
 * 
 * 4. 📊 DESIGN DE API:
 *    - Campos obrigatórios claramente definidos
 *    - Documentação completa com exemplos
 *    - Tipos TypeScript para segurança de compilação
 * 
 * 💡 EXEMPLO PRÁTICO DE USO:
 * 
 * MENSAGEM PRIVADA:
 * {
 *   senderId: "user-123",
 *   content: "Oi João, como você está?",
 *   chatType: "private",
 *   targetId: "user-456",
 *   isArquivo: false
 * }
 * 
 * MENSAGEM EM GRUPO:
 * {
 *   senderId: "user-123", 
 *   content: "Oi pessoal do trabalho!",
 *   chatType: "group",
 *   targetId: "group-789",
 *   isArquivo: false
 * }
 * 
 * ARQUIVO EM CONVERSA PRIVADA:
 * {
 *   senderId: "user-123",
 *   content: "documento.pdf",
 *   chatType: "private", 
 *   targetId: "user-456",
 *   isArquivo: true
 * }
 * 
 * 📈 QUANDO USAR CADA DTO:
 * 
 * 🎯 USE CreateChatDto QUANDO:
 * - Criar primeira mensagem de conversa
 * - Precisar de validação rigorosa
 * - Todos os dados estão disponíveis
 * - Interface controlada (não pública)
 * 
 * 🎯 USE SendMessageDto QUANDO:
 * - API pública com múltiplas formas de uso
 * - Compatibilidade com versões anteriores
 * - Flexibilidade nos campos de destino
 * - Validação de segurança mais rigorosa
 * 
 * 🔄 FLUXO TÍPICO:
 * 1. 🌐 Controller recebe CreateChatDto
 * 2. 🛡️ NestJS valida todos os campos automaticamente
 * 3. ✅ Se válido → Service recebe dados estruturados
 * 4. 🔄 Service pode processar sem validações extras
 * 5. 💾 Repository salva mensagem no CSV
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora que entendemos os diferentes DTOs de chat, podemos ver:
 * - Como o ChatService escolhe qual usar
 * - Como o Controller decide entre CreateChatDto e SendMessageDto
 * - Como as validações impactam a segurança geral
 * 
 * ========================================================================================
 */
