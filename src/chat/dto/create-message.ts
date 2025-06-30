/*
 * ========================================================================================
 * CREATE MESSAGE DTO - ESTRUTURA E VALIDAÇÃO PARA ENVIO DE MENSAGENS
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Message DTOs
 * Este arquivo define como validar dados quando alguém quer enviar uma mensagem.
 * É como um "filtro de segurança" que verifica se a mensagem é segura antes
 * de permitir que ela seja processada pelo sistema.
 * 
 * 🛡️ FOCO EM SEGURANÇA:
 * Este DTO tem validações especiais contra ataques comuns:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - HTML malicioso
 * - Scripts perigosos
 * 
 * 🏗️ ANALOGIA: 
 * É como um detector de metais no aeroporto:
 * - Verifica se o conteúdo é "seguro para viajar"
 * - Bloqueia itens perigosos antes que entrem no sistema
 * - Só permite passar o que está dentro das regras
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS DE VALIDAÇÃO AVANÇADA
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 ApiProperty: Documentação automática
 * 🛡️ Validadores básicos: IsNotEmpty, IsString, MaxLength, Matches
 * 🔒 Validadores avançados: ValidatorConstraint, ValidatorConstraintInterface
 * 🎯 Validate: Permite usar validadores personalizados
 * ⚪ IsOptional: Para campos não obrigatórios
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty,      // ❌ Não pode estar vazio
  IsString,        // 📝 Deve ser texto
  MaxLength,       // 📏 Tamanho máximo
  Matches,         // 🔍 Deve seguir padrão específico
  ValidatorConstraint,           // 🏗️ Criar validador personalizado
  ValidatorConstraintInterface,  // 📋 Interface para validador
  Validate,        // 🎯 Aplicar validador personalizado
  IsOptional       // ⚪ Campo opcional
} from 'class-validator';

// ============================================================================
// VALIDADOR PERSONALIZADO: MENSAGEM SEGURA
// ============================================================================

/*
 * 🛡️ CLASSE SAFEMESSAGECONSTRAINT
 * 
 * Esta é uma classe especial que implementa verificações de segurança
 * personalizadas para o conteúdo das mensagens.
 * 
 * 🎯 FUNÇÃO: Detectar e bloquear conteúdo malicioso
 * 
 * 💡 ANALOGIA: 
 * Como um "analista de segurança" especializado que examina cada
 * mensagem em busca de sinais de perigo antes de liberar.
 */
@ValidatorConstraint({ name: 'safeMessage', async: false })
export class SafeMessageConstraint implements ValidatorConstraintInterface {
  
  /*
   * 🔍 MÉTODO VALIDATE: ANÁLISE COMPLETA DE SEGURANÇA
   * 
   * Este método executa múltiplas verificações em sequência
   * para garantir que a mensagem é segura.
   * 
   * @param message - A mensagem a ser validada
   * @returns true se segura, false se perigosa
   */
  validate(message: string) {
    
    // ====================================================================
    // VERIFICAÇÃO 1: EXISTÊNCIA E CONSISTÊNCIA
    // ====================================================================
    
    /*
     * ✅ VALIDAÇÃO BÁSICA: MENSAGEM EXISTE E NÃO É VAZIA
     * 
     * 🎯 VERIFICA:
     * - message existe (não é null/undefined)
     * - message é realmente uma string
     * - message não é só espaços em branco
     * 
     * 💡 EXEMPLO:
     * ❌ null → false
     * ❌ undefined → false  
     * ❌ 123 → false (não é string)
     * ❌ "   " → false (só espaços)
     * ✅ "Oi!" → passa para próxima verificação
     */
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return false;
    }
    
    // ====================================================================
    // VERIFICAÇÃO 2: PROTEÇÃO CONTRA XSS (CROSS-SITE SCRIPTING)
    // ====================================================================
    
    /*
     * 🚫 BLOQUEIO DE TAGS HTML
     * 
     * 🎯 REGEX: /<[^>]*>/i
     * - < : Procura por "<"
     * - [^>]* : Qualquer caractere que não seja ">" (zero ou mais)
     * - > : Procura por ">"
     * - i : Case insensitive (maiúscula/minúscula)
     * 
     * 🛡️ BLOQUEIA:
     * - <script>alert('hack')</script>
     * - <img src="x" onerror="alert()">
     * - <div onclick="malicious()">
     * - <iframe src="evil.com">
     * 
     * 💡 EXEMPLOS:
     * ❌ "Oi <script>alert('hack')</script>" → BLOQUEADO
     * ❌ "Clique <a href='#'>aqui</a>" → BLOQUEADO
     * ✅ "Oi pessoal! Como vão?" → LIBERADO
     * ✅ "2 < 3 e 5 > 4" → LIBERADO (não são tags)
     */
    if (/<[^>]*>/i.test(message)) {
      return false;
    }
    
    // ====================================================================
    // VERIFICAÇÃO 3: PROTEÇÃO CONTRA JAVASCRIPT MALICIOSO
    // ====================================================================
    
    /*
     * 🚫 BLOQUEIO DE SCRIPTS E EVENTOS PERIGOSOS
     * 
     * 🎯 REGEX: /javascript:|data:text\/html|vbscript:|on\w+\s*=|<script|<\/script/i
     * 
     * 🔍 DETECTA:
     * - javascript: → Links com JavaScript
     * - data:text/html → Data URLs com HTML
     * - vbscript: → VBScript (Internet Explorer)
     * - on\w+\s*= → Event handlers (onclick, onload, etc.)
     * - <script → Tags de script
     * - </script → Fechamento de script
     * 
     * 🛡️ BLOQUEIA:
     * - "javascript:alert('hack')"
     * - "data:text/html,<script>alert()</script>"
     * - "onclick=alert('hack')"
     * - "onload=malicious()"
     * 
     * 💡 EXEMPLOS:
     * ❌ "Clique aqui: javascript:alert('hack')" → BLOQUEADO
     * ❌ "onclick=alert('xss')" → BLOQUEADO  
     * ✅ "Java é uma linguagem de programação" → LIBERADO
     * ✅ "script do filme foi bom" → LIBERADO
     */
    if (/javascript:|data:text\/html|vbscript:|on\w+\s*=|<script|<\/script/i.test(message)) {
      return false;
    }
    
    // ====================================================================
    // VERIFICAÇÃO 4: PROTEÇÃO CONTRA SQL INJECTION
    // ====================================================================
    
    /*
     * 🚫 BLOQUEIO DE COMANDOS SQL MALICIOSOS
     * 
     * 🎯 REGEX: /(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set)/i
     * 
     * 🔍 DETECTA:
     * - union select → Tentativa de juntar consultas
     * - drop table → Tentativa de deletar tabelas
     * - delete from → Tentativa de deletar dados
     * - insert into → Tentativa de inserir dados
     * - update set → Tentativa de alterar dados
     * 
     * 🛡️ BLOQUEIA:
     * - "'; DROP TABLE users; --"
     * - "UNION SELECT password FROM users"
     * - "DELETE FROM messages WHERE id=1"
     * 
     * 💡 EXEMPLOS:
     * ❌ "nome'; DROP TABLE users; --" → BLOQUEADO
     * ❌ "test UNION SELECT * FROM passwords" → BLOQUEADO
     * ✅ "Vou deletar essa foto mais tarde" → LIBERADO
     * ✅ "Preciso inserir este dado na planilha" → LIBERADO
     * 
     * 📝 NOTA: Em um sistema com banco SQL, isso seria ainda mais crítico
     */
    if (/(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set)/i.test(message)) {
      return false;
    }
    
    // ====================================================================
    // RESULTADO: MENSAGEM APROVADA EM TODAS AS VERIFICAÇÕES
    // ====================================================================
    
    /*
     * ✅ MENSAGEM SEGURA
     * 
     * Se chegou até aqui, a mensagem passou em todos os testes:
     * ✅ Existe e não é vazia
     * ✅ Não contém HTML malicioso
     * ✅ Não contém JavaScript perigoso  
     * ✅ Não contém SQL injection
     * 
     * 🎯 RESULTADO: Liberar para processamento
     */
    return true;
  }

  /*
   * 📝 MÉTODO DEFAULTMESSAGE: MENSAGEM DE ERRO
   * 
   * Define a mensagem que aparece quando a validação falha.
   * É mostrada ao usuário para explicar por que a mensagem foi rejeitada.
   * 
   * 💡 ANALOGIA: Como a explicação do detector de metais:
   * "Item bloqueado: contém material não permitido"
   */
  defaultMessage() {
    return 'Mensagem contém conteúdo potencialmente perigoso ou está vazia';
  }
}

// ============================================================================
// DTO SIMPLES: MESSAGEDTO (APENAS CONTEÚDO)
// ============================================================================

/*
 * 📝 CLASSE MESSAGEDTO
 * 
 * DTO simples que valida apenas o conteúdo da mensagem.
 * Usado em contextos onde só precisamos validar o texto.
 * 
 * 🎯 USO: Validação de conteúdo isolado
 */
export class MessageDto {
  
  /*
   * 📝 CAMPO: CONTENT (Conteúdo da Mensagem)
   * 
   * Campo único que representa o texto da mensagem.
   * Aplica todas as validações de segurança definidas acima.
   */
  @ApiProperty({
    example: 'Oi meu chapa',                                                    // 📝 Exemplo amigável
    description: 'Mensagem segura (máximo 1000 caracteres, sem HTML/scripts/SQL)', // 📋 Explicação completa
  })
  
  /*
   * 🛡️ VALIDAÇÕES APLICADAS:
   * 
   * 1. @IsNotEmpty: Não pode estar vazio
   * 2. @IsString: Deve ser texto
   * 3. @MaxLength: Máximo 1000 caracteres (evita spam)
   * 4. @Validate: Aplica verificações de segurança personalizadas
   */
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Validate(SafeMessageConstraint)  // 🔒 Aplicar validações de segurança customizadas
  content: string; // Nome padronizado como 'content'
}

// ============================================================================
// DTO COMPLETO: SENDMESSAGEDTO (MENSAGEM COM DESTINO)
// ============================================================================

/*
 * 📤 CLASSE SENDMESSAGEDTO
 * 
 * DTO completo para envio de mensagens que inclui:
 * - Conteúdo da mensagem (obrigatório)
 * - Informações de destino (opcionais, mas uma deve ser fornecida)
 * - Tipo de chat (opcional)
 * 
 * 🎯 USO: Endpoint de envio de mensagens
 * 
 * 💡 FLEXIBILIDADE:
 * Permite diferentes formas de especificar o destino:
 * - targetId: Genérico (usuário ou grupo)
 * - groupId: Específico para grupos
 * - receiverId: Específico para usuários
 */
export class SendMessageDto {
  
  // ========================================================================
  // CAMPO: CONTEÚDO DA MENSAGEM (OBRIGATÓRIO)
  // ========================================================================
  
  /*
   * 📝 CAMPO: CONTENT (Texto da Mensagem)
   * 
   * Campo principal que contém o que o usuário quer enviar.
   * Usa exatamente as mesmas validações do MessageDto.
   */
  @ApiProperty({
    example: 'Oi meu chapa',
    description: 'Mensagem segura (máximo 1000 caracteres, sem HTML/scripts/SQL)',
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(1000, { message: 'Mensagem deve ter no máximo 1000 caracteres' })
  @Validate(SafeMessageConstraint)  // 🔒 Mesmas validações de segurança
  content: string;

  // ========================================================================
  // CAMPOS: DESTINO DA MENSAGEM (OPCIONAIS E FLEXÍVEIS)
  // ========================================================================
  
  /*
   * 🎯 CAMPO: TARGET_ID (Destino Genérico)
   * 
   * Campo genérico que pode receber:
   * - UUID de usuário (para mensagem privada)
   * - UUID de grupo (para mensagem de grupo)
   * 
   * 💡 VANTAGEM: Interface única para diferentes tipos de destino
   */
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do destinatário ou grupo',
    required: false    // ⚪ Opcional, mas service validará se ao menos um destino foi fornecido
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  /*
   * 👥 CAMPO: GROUP_ID (Destino Específico - Grupo)
   * 
   * Campo específico para identificar grupos.
   * Útil quando a interface quer ser explícita sobre o tipo de destino.
   * 
   * 💡 USO: Interface com abas separadas "Conversa" vs "Grupo"
   */
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do grupo',
    required: false
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  /*
   * 👤 CAMPO: RECEIVER_ID (Destino Específico - Usuário)
   * 
   * Campo específico para identificar usuários.
   * Funciona como alias para targetId em mensagens privadas.
   * 
   * 💡 USO: Para compatibilidade com APIs anteriores ou interfaces específicas
   */
  @ApiProperty({
    example: 'bb145801-dd77-4e34-bdea-bee5dd790f3e',
    description: 'ID do receptor (alias para targetId)',
    required: false
  })
  @IsOptional()
  @IsString()
  receiverId?: string;

  /*
   * 🏷️ CAMPO: CHAT_TYPE (Tipo de Chat)
   * 
   * Campo para especificar explicitamente o tipo de conversa.
   * Ajuda o service a tomar decisões corretas sobre processamento.
   * 
   * 💡 VALORES ESPERADOS:
   * - 'private': Conversa entre dois usuários
   * - 'group': Mensagem para grupo
   * 
   * 🔧 USO PELO SERVICE:
   * - Validar se o destino corresponde ao tipo
   * - Aplicar regras específicas por tipo
   * - Otimizar processamento
   */
  @ApiProperty({
    example: 'private',
    description: 'Tipo de chat: private ou group',
    required: false
  })
  @IsOptional()
  @IsString()
  chatType?: string;
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - CREATE MESSAGE DTO
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🛡️ VALIDAÇÕES PERSONALIZADAS:
 *    - ValidatorConstraint permite criar regras específicas
 *    - Múltiplas verificações de segurança em sequência
 *    - Proteção contra XSS, SQL Injection e scripts maliciosos
 * 
 * 2. 🔒 SEGURANÇA EM CAMADAS:
 *    - Validação de tipo (IsString, IsNotEmpty)
 *    - Validação de tamanho (MaxLength)
 *    - Validação de conteúdo (SafeMessageConstraint)
 *    - Cada camada captura diferentes tipos de problemas
 * 
 * 3. 📊 FLEXIBILIDADE DE API:
 *    - MessageDto: Simples, só conteúdo
 *    - SendMessageDto: Completo, com opções de destino
 *    - Campos opcionais permitem diferentes formas de uso
 * 
 * 4. 🎯 COMPATIBILIDADE:
 *    - targetId: Genérico (usuário ou grupo)
 *    - groupId/receiverId: Específicos
 *    - chatType: Para lógica de negócio
 * 
 * 💡 EXEMPLOS PRÁTICOS DE USO:
 * 
 * MENSAGEM SIMPLES (só validar conteúdo):
 * MessageDto: { content: "Oi pessoal!" }
 * 
 * MENSAGEM PRIVADA:
 * SendMessageDto: {
 *   content: "Oi João!",
 *   targetId: "user-123",
 *   chatType: "private"
 * }
 * 
 * MENSAGEM EM GRUPO:
 * SendMessageDto: {
 *   content: "Oi pessoal do grupo!",
 *   groupId: "group-456",
 *   chatType: "group"
 * }
 * 
 * MENSAGEM COM MÚLTIPLAS OPÇÕES:
 * SendMessageDto: {
 *   content: "Olá!",
 *   targetId: "user-123",
 *   receiverId: "user-123",  // redundante, mas compatível
 *   chatType: "private"
 * }
 * 
 * 📈 FLUXO COMPLETO:
 * 1. 🌐 Controller recebe SendMessageDto
 * 2. 🛡️ NestJS aplica todas as validações automaticamente
 * 3. ✅ Se válido → Service recebe dados limpos e seguros
 * 4. ❌ Se inválido → Usuário recebe erro específico
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora que sabemos como validar mensagens, vamos ver:
 * - Como o Service processa essas mensagens
 * - Como o Repository salva de forma eficiente
 * - Como o sistema de tempo real entrega mensagens
 * 
 * ========================================================================================
 */
