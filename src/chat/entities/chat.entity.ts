/*
 * ========================================================================================
 * CHAT ENTITY - DEFINIÇÃO DA ESTRUTURA DE UMA MENSAGEM
 * ========================================================================================
 * 
 * 🎯 CONCEI * 🌟 O QUE APRENDEMOS HOJE:O: Chat  * 💬 CASOS DE USO REAIS:nti * 🔄 FLUXO COMPLETO NO SI * 💡 DICAS PROFISSIONAIS:TEMA:y (Entidade de Mensagem)
 * Esta entidade define EXATAMENTE como uma mensagem deve ser estruturada
 * no nosso sistema. É o "DNA" de toda comunicação no WhatsUT.
 * 
 * 💬 TIPOS DE MENSAGEM QUE REPRESENTA:
 * - Mensagens privadas entre dois usuários
 * - Mensagens em grupos
 * - Arquivos compartilhados
 * - Qualquer tipo de comunicação do sistema
 * 
 * 🏗️ ANALOGIA: 
 * É como um "envelope postal padronizado" que TODA mensagem deve usar:
 * - Remetente (quem enviou)
 * - Destinatário (para onde vai)  
 * - Conteúdo (a mensagem em si)
 * - Data/hora (quando foi enviado)
 * - Tipo (carta, encomenda, etc.)
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
 * - @IsOptional(): Campo pode ser omitido
 * - @IsBoolean(): Valida se é true/false
 * - @IsIn([...]): Valida se valor está na lista permitida
 * - @IsDateString(): Valida formato de data
 * - @MaxLength(): Tamanho máximo de caracteres
 * - @IsUUID(): Valida formato de UUID
 */
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsIn, 
  IsDateString, 
  MaxLength, 
  IsUUID 
} from 'class-validator';

// ============================================================================
// ENTIDADE PRINCIPAL: CHAT (MENSAGEM)
// ============================================================================

/*
 * 🏛️ CLASSE CHAT
 * 
 * Esta classe define a estrutura completa de uma mensagem no sistema.
 * Cada propriedade tem uma função específica no processo de comunicação.
 * 
 * 🎯 FUNÇÃO: Servir como "contrato" - todas as mensagens DEVEM ter essas propriedades
 * 
 * 💡 ANALOGIA: 
 * Como um formulário oficial dos Correios. Toda encomenda DEVE ter:
 * - Número de rastreamento, remetente, destinatário, peso, tipo, etc.
 * 
 * Toda mensagem DEVE ter:
 * - ID, remetente, conteúdo, timestamp, tipo, destino, etc.
 */
export class Chat {
  
  /*
   * 🆔 ID: Identificador Único da Mensagem
   * 
   * 🎯 FUNÇÃO: "CPF" da mensagem - cada uma tem ID único e irrepetível
   * 📊 FORMATO: UUID (ex: "bb145801-dd77-4e34-bdea-bee5dd790f3e")
   * 🔍 USO: Permite encontrar, editar ou deletar uma mensagem específica
   * 
   * 💡 ANALOGIA: Como o número de protocolo de um processo
   * - Você pode rastrear exatamente aquela mensagem específica
   * - Útil para editar, apagar ou responder mensagens
   * 
   * 🔧 EXEMPLO PRÁTICO:
   * User clica "responder" → sistema usa o ID para saber qual mensagem
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @IsUUID('4', { message: 'ID deve ser um UUID válido' })  // 🔧 Validação: Formato UUID
  id: string;           // 🆔 Identificador único (ex: "msg-001")

  /*
   * 👤 SENDER_ID: Quem Enviou a Mensagem
   * 
   * 🎯 FUNÇÃO: Identificação do remetente (UUID do usuário)
   * 🔒 IMPORTÂNCIA: Permite saber quem disse o quê
   * 📱 USO: Mostrar nome e foto do remetente na interface
   * 
   * 💡 ANALOGIA: Como o "De:" em um email
   * - Sistema busca dados do usuário pelo ID
   * - Mostra nome, foto, status online, etc.
   * 
   * 🔧 EXEMPLO PRÁTICO:
   * senderId: "user-123" → sistema busca: nome="João", foto="avatar.jpg"
   * Interface mostra: "João disse: Oi pessoal!"
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @IsUUID('4', { message: 'SenderId deve ser um UUID válido' })  // 🔧 Validação: UUID do usuário
  senderId: string;     // 👤 ID do remetente (ex: "user-123")

  /*
   * 📝 CONTENT: Conteúdo da Mensagem
   * 
   * 🎯 FUNÇÃO: O texto ou informação que está sendo enviada
   * 📊 TIPOS: Pode ser texto, emoji, nome de arquivo, etc.
   * 🔒 SEGURANÇA: Validado contra XSS e conteúdo malicioso
   * 
   * 💡 ANALOGIA: Como o "corpo" de uma carta
   * - Para texto: "Oi, como você está?"
   * - Para arquivo: "documento.pdf (1.2MB)"
   * - Para emoji: "😄👍🎉"
   * 
   * 🔧 EXEMPLOS PRÁTICOS:
   * Mensagem texto: content = "Reunião hoje às 14h"
   * Mensagem arquivo: content = "relatorio.pdf"
   * Mensagem emoji: content = "👍"
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @MaxLength(5000, { message: 'Conteúdo não pode ter mais de 5000 caracteres' })  // 🔧 Limitação de tamanho
  content: string;      // 📝 Conteúdo da mensagem (ex: "Oi!" ou "doc.pdf")

  /*
   * ⏰ TIMESTAMP: Data e Hora da Mensagem
   * 
   * 🎯 FUNÇÃO: Marca temporal exata de quando a mensagem foi criada
   * 📊 FORMATO: Date object (ex: 2024-01-15T14:30:25.123Z)
   * 🔄 USO: Ordenar mensagens, mostrar "há 5 minutos", etc.
   * 
   * 💡 ANALOGIA: Como o carimbo dos Correios
   * - Prova quando a mensagem foi enviada
   * - Permite organizar conversa por ordem cronológica
   * - Mostra "mensagem de hoje", "mensagem de ontem", etc.
   * 
   * 🔧 EXEMPLO PRÁTICO:
   * timestamp: 2024-01-15T14:30:00Z
   * Interface mostra: "hoje às 14:30" ou "há 2 horas"
   */
  @IsDateString()       // 🔧 Validação: Deve ser uma data válida
  timestamp: Date;      // ⏰ Data e hora (ex: 2024-01-15T14:30:00Z)

  /*
   * 🏷️ CHAT_TYPE: Tipo da Comunicação
   * 
   * 🎯 FUNÇÃO: Define que tipo de mensagem é e como deve ser tratada
   * 📊 VALORES POSSÍVEIS:
   * - 'private': Conversa privada entre dois usuários
   * - 'group': Mensagem enviada em um grupo
   * - 'text': Mensagem de texto puro (pode ser redundante com outros tipos)
   * - 'file': Mensagem contém arquivo anexado
   * 
   * 💡 ANALOGIA: Como tipos de correspondência dos Correios
   * - Carta simples, SEDEX, encomenda, etc.
   * - Cada tipo tem tratamento diferente
   * 
   * 🔧 EXEMPLOS PRÁTICOS:
   * private + text: "Oi João, como vai?" (direto para João)
   * group + text: "Oi pessoal!" (para grupo "Família")
   * private + file: "documento.pdf" (arquivo para João)
   * group + file: "foto.jpg" (foto para grupo)
   * 
   * 🚨 OBSERVAÇÃO: Parece haver sobreposição entre tipos.
   * Uma mensagem pode ser private+file ou group+text.
   * Seria melhor ter dois campos: scope e messageType.
   */
  @IsIn(['private', 'group', 'text', 'file'])  // 🔧 Validação: Só valores permitidos
  chatType: 'private' | 'group' | 'text' | 'file';  // 🏷️ Tipo da comunicação

  /*
   * 🎯 TARGET_ID: Para Onde a Mensagem Vai
   * 
   * 🎯 FUNÇÃO: Identificação do destinatário ou grupo
   * 📊 CONTEÚDO:
   * - Se chatType='private': UUID do usuário destinatário
   * - Se chatType='group': UUID do grupo de destino
   * 
   * 💡 ANALOGIA: Como o "Para:" em um email
   * - Em mensagem privada: "Para: João (user-456)"
   * - Em mensagem de grupo: "Para: Grupo Família (group-789)"
   * 
   * 🔧 EXEMPLOS PRÁTICOS:
   * Mensagem privada: targetId = "user-456" (João)
   * Mensagem de grupo: targetId = "group-789" (Grupo Família)
   * 
   * 🔄 FLUXO DE ENTREGA:
   * Sistema usa targetId para saber onde entregar a mensagem
   */
  @IsString()           // 🔧 Validação: Deve ser uma string
  @IsNotEmpty()         // 🔧 Validação: Não pode estar vazio
  @IsUUID('4', { message: 'TargetId deve ser um UUID válido' })  // 🔧 Validação: UUID do destinatário
  targetId: string;     // 🎯 ID do destinatário ou grupo (ex: "user-456")

  /*
   * 📁 IS_ARQUIVO: Indica Se é um Arquivo (Campo Opcional)
   * 
   * 🎯 FUNÇÃO: Flag booleana para identificar rapidamente mensagens com arquivo
   * ⚪ OPCIONAL: Pode ser undefined/null se não for arquivo
   * 🤔 REDUNDÂNCIA: Parece duplicar informação do chatType='file'
   * 
   * 💡 ANALOGIA: Como um adesivo "FRÁGIL" na encomenda
   * - Ajuda a identificar rapidamente o tipo especial
   * - Permite filtros rápidos "mostrar só arquivos"
   * 
   * 🔧 EXEMPLOS PRÁTICOS:
   * Mensagem texto: isArquivo = undefined ou false
   * Mensagem arquivo: isArquivo = true
   * 
   * 📊 USO NO FRONTEND:
   * - if (message.isArquivo) { showDownloadButton() }
   * - Ícone diferente para mensagens com arquivo
   * - Filtro "Só arquivos" usa este campo
   * 
   * 🚨 SUGESTÃO DE MELHORIA:
   * Seria melhor unificar com chatType ou ter tipos mais claros:
   * messageType: 'text' | 'image' | 'document' | 'video' | 'audio'
   */
  @IsOptional()          // 🔧 Validação: Campo não obrigatório (pode ser omitido)
  @IsBoolean()           // 🔧 Validação: Deve ser true/false quando presente
  isArquivo?: boolean;   // 📁 Flag de arquivo (ex: true para PDF, false para texto)

  /*
   * 🏗️ CONSTRUTOR DA ENTIDADE CHAT
   * 
   * 🎯 FUNÇÃO: Cria uma nova instância de mensagem com valores padrão
   * 📝 PARÂMETROS: Todos opcionais (Partial<Chat>)
   * 🔧 INICIALIZAÇÃO: Define valores padrão seguros
   * 
   * 💡 ANALOGIA: Como o formulário pré-preenchido de uma mensagem
   * - Alguns campos vêm em branco (para preencher)
   * - Outros já vêm com valores padrão (timestamp, tipo)
   * 
   * 🚀 VALORES PADRÃO INTELIGENTES:
   * - timestamp: NOW (momento atual)
   * - chatType: 'text' (tipo mais comum)
   * - isArquivo: false (maioria são textos)
   * 
   * 📊 EXEMPLO DE USO:
   * const msg = new Chat({ content: 'Oi!', senderId: 123 })
   * // Resultado: { content: 'Oi!', senderId: 123, timestamp: NOW, chatType: 'text' }
   */
  constructor(partial: Partial<Chat> = {}) {
    // 🔄 Object.assign: Copia propriedades do 'partial' para 'this'
    Object.assign(this, partial);
    
    // ⏰ Se não veio timestamp, usa o momento atual
    // Garante que toda mensagem tenha data/hora
    if (!this.timestamp) {
      this.timestamp = new Date();
    }
    
    // 📝 Se não veio tipo, assume texto comum
    // 95% das mensagens são texto, então é um padrão seguro
    if (!this.chatType) {
      this.chatType = 'text';
    }
    
    // 📁 Se não especificou arquivo, assume que não é
    // Evita problemas com campos undefined
    if (this.isArquivo === undefined) {
      this.isArquivo = false;
    }
  }

  /*
   * 🔧 MÉTODOS AUXILIARES DA ENTIDADE
   * 
   * Métodos que facilitam o trabalho com mensagens
   * sem precisar acessar propriedades diretamente
   */

  /**
   * 📱 isPrivateMessage: Verifica se é mensagem privada
   * 
   * 🎯 FUNÇÃO: Determina se a mensagem é entre dois usuários
   * 📊 RETORNO: true se for privada, false se for em grupo
   * 
   * 💡 USO: if (message.isPrivateMessage()) { showPrivateIcon() }
   */
  isPrivateMessage(): boolean {
    return this.chatType === 'private';
  }

  /**
   * 👥 isGroupMessage: Verifica se é mensagem de grupo
   * 
   * 🎯 FUNÇÃO: Determina se a mensagem é em um grupo
   * 📊 RETORNO: true se for grupo, false se for privada
   * 
   * 💡 USO: if (message.isGroupMessage()) { showGroupInfo() }
   */
  isGroupMessage(): boolean {
    return this.chatType === 'group';
  }

  /**
   * 📁 hasAttachment: Verifica se tem arquivo anexado
   * 
   * 🎯 FUNÇÃO: Determina se a mensagem contém arquivo
   * 📊 RETORNO: true se tiver arquivo, false se for só texto
   * 
   * 💡 USO: if (message.hasAttachment()) { showDownloadButton() }
   */
  hasAttachment(): boolean {
    return this.isArquivo === true || this.chatType === 'file';
  }

  /**
   * ⏰ getFormattedTime: Retorna horário formatado
   * 
   * 🎯 FUNÇÃO: Converte timestamp em formato legível
   * 📊 RETORNO: String com horário (ex: "14:30" ou "Ontem 15:45")
   * 
   * 💡 USO: message.getFormattedTime() → "14:30"
   */
  getFormattedTime(): string {
    const now = new Date();
    const messageDate = new Date(this.timestamp);
    
    // Se foi hoje, mostra só o horário
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Se foi ontem, mostra "Ontem HH:MM"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Ontem ${messageDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Se foi há mais tempo, mostra data completa
    return messageDate.toLocaleDateString('pt-BR') + ' ' + 
           messageDate.toLocaleTimeString('pt-BR', { 
             hour: '2-digit', 
             minute: '2-digit' 
           });
  }

  /**
   * 🆔 isSentBy: Verifica se foi enviada por usuário específico
   * 
   * 🎯 FUNÇÃO: Compara se o remetente é o usuário informado
   * 📊 PARÂMETROS: userId (string) - ID do usuário para comparar
   * 📊 RETORNO: true se for o mesmo usuário, false caso contrário
   * 
   * 💡 USO: if (message.isSentBy(currentUser.id)) { showEditButton() }
   */
  isSentBy(userId: string): boolean {
    return this.senderId === userId;
  }

  /**
   * 📋 toSummary: Retorna resumo da mensagem para logs
   * 
   * 🎯 FUNÇÃO: Cria descrição resumida para debugging/logs
   * 📊 RETORNO: String com informações principais
   * 
   * 💡 USO: console.log(message.toSummary()) → "Private text from user-123: Oi!"
   */
  toSummary(): string {
    const type = this.isPrivateMessage() ? 'Private' : 'Group';
    const contentType = this.hasAttachment() ? 'file' : 'text';
    const preview = this.content.length > 30 ? 
                   this.content.substring(0, 30) + '...' : 
                   this.content;
    
    return `${type} ${contentType} from ${this.senderId}: ${preview}`;
  }
}

/*
 * ========================================================================================
 * 🎓 RESUMO EDUCACIONAL COMPLETO - CHAT ENTITY
 * ========================================================================================
 * 
 * � O QUE APRENDEMOS HOJE:
 * 
 * 1️⃣ ENTITY PATTERN (Padrão Entidade):
 *    ✅ Representação de dados do mundo real em código
 *    ✅ Encapsula propriedades e comportamentos
 *    ✅ Ponte entre banco de dados e aplicação
 *    ✅ Define "contrato" para estrutura de dados
 * 
 * 2️⃣ VALIDAÇÕES COM CLASS-VALIDATOR:
 *    ✅ @IsString(): Garante que é texto
 *    ✅ @IsDateString(): Valida formato de data
 *    ✅ @IsOptional(): Campo pode ser omitido
 *    ✅ @IsBoolean(): Garante true/false
 *    ✅ @IsIn([...]): Só valores específicos permitidos
 *    ✅ Validação automática em todos os endpoints
 * 
 * 3️⃣ TYPESCRIPT AVANÇADO:
 *    ✅ Union Types: 'text' | 'image' | 'file'
 *    ✅ Optional Properties: isArquivo?
 *    ✅ Partial<T>: Todos os campos opcionais no construtor
 *    ✅ Type Safety: Previne erros em tempo de compilação
 * 
 * 4️⃣ DESIGN DE SISTEMA DE MENSAGENS:
 *    ✅ IDs únicos para rastreamento preciso
 *    ✅ Timestamps para ordenação cronológica
 *    ✅ Tipos para tratamento diferenciado
 *    ✅ Identificação clara de remetente/destinatário
 * 
 * 5️⃣ MÉTODOS AUXILIARES ÚTEIS:
 *    ✅ isPrivateMessage(): Identifica mensagens privadas
 *    ✅ isGroupMessage(): Identifica mensagens de grupo
 *    ✅ hasAttachment(): Detecta arquivos anexados
 *    ✅ getFormattedTime(): Formatação inteligente de horários
 *    ✅ isSentBy(): Verifica autoria da mensagem
 *    ✅ toSummary(): Resumo para logs e debugging
 * 
 * 🏗️ PADRÕES APLICADOS:
 * 
 * ✅ ENTITY PATTERN: Representa dados de forma consistente
 * ✅ BUILDER PATTERN: Construtor flexível com defaults
 * ✅ VALIDATION PATTERN: Validação declarativa com decorators
 * ✅ TYPE SAFETY: TypeScript previne erros de tipo
 * ✅ IMMUTABLE DESIGN: Estrutura estável e previsível
 * ✅ HELPER METHODS: Métodos auxiliares para facilitar uso da entity
 * 
 * � CASOS DE USO REAIS:
 * 
 * 📝 Mensagem Texto Simples:
 *    new Chat({
 *      content: "Oi pessoal!",
 *      senderId: "user-123",
 *      targetId: "group-456",
 *      chatType: "group"
 *    })
 * 
 * 🖼️ Compartilhamento de Imagem:
 *    new Chat({
 *      content: "/uploads/foto_familia.jpg",
 *      senderId: "user-123",
 *      targetId: "group-456",
 *      chatType: "file",
 *      isArquivo: true
 *    })
 * 
 * 📄 Documento Privado:
 *    new Chat({
 *      content: "/uploads/contrato.pdf",
 *      senderId: "user-123",
 *      targetId: "user-789",
 *      chatType: "private",
 *      isArquivo: true
 *    })
 * 
 * 🔧 Usando Métodos Auxiliares:
 *    const msg = new Chat({ ... });
 *    
 *    // Verificações de tipo
 *    if (msg.isPrivateMessage()) { showPrivateIcon(); }
 *    if (msg.hasAttachment()) { showDownloadButton(); }
 *    
 *    // Formatação
 *    console.log(msg.getFormattedTime()); // "14:30" ou "Ontem 15:45"
 *    console.log(msg.toSummary()); // "Private text from user-123: Oi!"
 *    
 *    // Verificação de autoria
 *    if (msg.isSentBy(currentUser.id)) { showEditOptions(); }
 * 
 * � FLUXO COMPLETO NO SISTEMA:
 * 
 * 1. 📱 USER ENVIA: Frontend cria objeto seguindo esta entity
 * 2. 🛡️ VALIDAÇÃO: Decorators verificam se dados estão corretos
 * 3. 💾 PERSISTÊNCIA: ChatService salva no CSV via Repository
 * 4. 🔄 TEMPO REAL: Gateway distribui para usuários conectados
 * 5. 📱 ENTREGA: Frontend recebe e renderiza na interface
 * 
 * 🚀 PRÓXIMOS ARQUIVOS PARA ESTUDAR:
 * 
 * 📁 DTOs (Data Transfer Objects):
 *    ├── create-message.dto.ts → Como criar mensagem
 *    └── create-chat.dto.ts → Como criar chat
 * 
 * 🏛️ Services (Regras de Negócio):
 *    └── chat.service.ts → Lógica de mensagens
 * 
 * 📊 Repository (Persistência):
 *    └── chat.repository.ts → Salvar/buscar mensagens
 * 
 * 🎮 Controller (Endpoints):
 *    └── chat.controller.ts → APIs REST
 * 
 * ⚡ Gateway (Tempo Real):
 *    └── chat.gateway.ts → WebSockets
 * 
 * � DICAS PROFISSIONAIS:
 * 
 * 🔍 CODE REVIEW: Esta entity é o "contrato" entre backend e frontend.
 *    Mudanças aqui afetam TODA a aplicação!
 * 
 * 🛡️ SEGURANÇA: Validações impedem dados maliciosos ou inconsistentes
 * 
 * 📈 ESCALABILIDADE: Estrutura permite adicionar novos tipos facilmente
 * 
 * 🎯 MANUTENIBILIDADE: Comentários facilitam entendimento futuro
 * 
 * ⚡ PERFORMANCE: Campos opcionais reduzem uso de memória
 * 
 * 🔧 DEBUGGING: IDs únicos facilitam rastreamento de problemas
 * 
 * ========================================================================================
 */
