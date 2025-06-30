/*
 * ========================================================================================
 * CREATE GROUP DTO - ESTRUTURA DE DADOS PARA CRIAR NOVOS GRUPOS
 * ========================================================================================
 * 
 * 🎯 CONCEITO: DTO (Data Transfer Object)
 * Um DTO é como um "formulário digital" que define exatamente quais informações
 * são necessárias para criar alguma coisa no sistema. No caso, um grupo.
 * 
 * 🔍 DIFERENÇA ENTITY vs DTO:
 * - Entity: Como os dados são ARMAZENADOS no sistema (estrutura completa)
 * - DTO: Como os dados são ENVIADOS pelo usuário (apenas o necessário para criar)
 * 
 * 🏗️ ANALOGIA: 
 * Entity = Carteira de identidade completa (com foto, digital, etc.)
 * DTO = Formulário de solicitação de carteira (só os dados que você preenche)
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS PARA VALIDAÇÃO E DOCUMENTAÇÃO
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 @nestjs/swagger: Gera documentação automática da API
 * 🛡️ class-validator: Valida se os dados enviados estão corretos
 * 🏗️ ../entities/group.entity: Importa o tipo LastAdminRule que criamos
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty,      // ❌ Não pode estar vazio
  IsString,        // 📝 Deve ser texto
  IsArray,         // 📊 Deve ser uma lista
  ArrayNotEmpty,   // 📋 Lista não pode estar vazia  
  IsUUID,          // 🆔 Deve ser um ID válido
  IsOptional,      // ⚪ Campo opcional (não obrigatório)
  IsIn,            // 📋 Deve estar numa lista de valores válidos
  MinLength,       // 📏 Tamanho mínimo
  MaxLength,       // 📏 Tamanho máximo
  Matches          // 🔍 Deve seguir um padrão específico
} from 'class-validator';
import { LastAdminRule } from '../entities/group.entity';

// ============================================================================
// DTO PRINCIPAL: CREATEGROUP
// ============================================================================

/*
 * 🏛️ CLASSE CREATEGROUPDTO
 * 
 * Esta classe define quais dados o usuário DEVE enviar para criar um grupo.
 * Cada campo tem regras de validação para garantir que os dados estão corretos.
 * 
 * 🎯 FUNÇÃO: "Filtrar" e "validar" dados antes de chegar ao sistema
 * 
 * 💡 ANALOGIA: 
 * É como um segurança de boate que verifica se você tem idade mínima,
 * documento válido, dress code adequado, etc. antes de deixar entrar.
 */
export class CreateGroupDto {
  
  // ========================================================================
  // CAMPO: NOME DO GRUPO
  // ========================================================================
  
  /*
   * 📝 CAMPO: NAME (Nome do Grupo)
   * 
   * Este é o único campo OBRIGATÓRIO para criar um grupo.
   * Possui várias validações para garantir segurança e qualidade.
   */
  
  /*
   * 📖 @ApiProperty: DOCUMENTAÇÃO AUTOMÁTICA
   * 
   * 🎯 FUNÇÃO: Gera documentação que aparece no Swagger (interface web da API)
   * 📊 RESULTADO: Desenvolvedores podem ver exemplos e descrições
   * 
   * 💡 ANALOGIA: Como as instruções que vem numa caixa de remédio
   */
  @ApiProperty({
    example: 'Jogo do bicho',                                    // 📝 Exemplo que aparece na documentação
    description: 'Nome do grupo (3-50 caracteres, sem XSS)',    // 📋 Explicação do campo
  })
  
  /*
   * 🛡️ VALIDAÇÕES DO NOME:
   * Cada linha aqui é uma "regra de segurança" que o nome deve passar
   */
  
  /*
   * ❌ @IsNotEmpty: NÃO PODE ESTAR VAZIO
   * Impede que alguém crie um grupo sem nome
   */
  @IsNotEmpty({ message: 'Nome do grupo é obrigatório' })
  
  /*
   * 📝 @IsString: DEVE SER TEXTO
   * Impede que alguém envie número, objeto ou outro tipo de dado
   */
  @IsString({ message: 'Nome do grupo deve ser uma string' })
  
  /*
   * 📏 @MinLength: TAMANHO MÍNIMO
   * Evita nomes muito curtos como "a" ou "xy"
   */
  @MinLength(3, { message: 'Nome do grupo deve ter pelo menos 3 caracteres' })
  
  /*
   * 📏 @MaxLength: TAMANHO MÁXIMO  
   * Evita nomes gigantes que quebram a interface
   */
  @MaxLength(50, { message: 'Nome do grupo deve ter no máximo 50 caracteres' })
  
  /*
   * 🔍 @Matches: PADRÃO DE SEGURANÇA
   * 
   * 🎯 REGEX EXPLICADA: /^[a-zA-Z0-9\sÀ-ÿ]+$/
   * - ^: Começo da string
   * - [a-zA-Z0-9\sÀ-ÿ]: Caracteres permitidos:
   *   * a-z: letras minúsculas
   *   * A-Z: letras maiúsculas  
   *   * 0-9: números
   *   * \s: espaços
   *   * À-ÿ: caracteres acentuados (á, ç, ñ, etc.)
   * - +: Um ou mais caracteres
   * - $: Final da string
   * 
   * 🚫 BLOQUEIA: <script>, ", ', &, <, >, etc.
   * 🎯 MOTIVO: Evita ataques XSS (código malicioso injetado)
   * 
   * 💡 EXEMPLO:
   * ✅ "Família Silva" → Permitido
   * ✅ "Trabalho 2024" → Permitido  
   * ✅ "Futebol São Paulo" → Permitido
   * ❌ "Grupo<script>alert('hack')</script>" → BLOQUEADO
   * ❌ "Nome com 'aspas' simples" → BLOQUEADO
   */
  @Matches(/^[a-zA-Z0-9\sÀ-ÿ]+$/, { 
    message: 'Nome do grupo deve conter apenas letras, números, espaços e caracteres acentuados. Caracteres especiais como <, >, ", \' não são permitidos' 
  })
  name: string;

  // ========================================================================
  // CAMPO: ADMINISTRADORES (OPCIONAL)
  // ========================================================================
  
  /*
   * 👑 CAMPO: ADMINS_ID (Lista de Administradores)
   * 
   * Campo OPCIONAL que permite definir administradores além do criador.
   * Se não fornecido, apenas o criador do grupo será administrador.
   */
  @ApiProperty({
    example: ['bb145801-dd77-4e34-bdea-bee5dd790f3e'],           // 📝 Exemplo de UUID
    description: 'Lista de IDs dos administradores (UUIDs válidos) - opcional, usuário criador será adicionado automaticamente',
    required: false,                                            // ⚪ Campo opcional
  })
  
  /*
   * ⚪ @IsOptional: CAMPO OPCIONAL
   * Se não enviado, será undefined e está tudo bem
   */
  @IsOptional()
  
  /*
   * 📊 @IsArray: DEVE SER UMA LISTA
   * Garante que, se enviado, seja um array: ["id1", "id2"]
   */
  @IsArray({ message: 'Lista de administradores deve ser um array' })
  
  /*
   * 🆔 @IsUUID: CADA ITEM DEVE SER UM UUID VÁLIDO
   * 
   * 🎯 UUID: Identificador único universal (32 caracteres + hífens)
   * 📊 FORMATO: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   * 🔧 VERSÃO 4: Gerado aleatoriamente
   * 
   * each: true → Valida CADA item do array individualmente
   * 
   * 💡 EXEMPLO:
   * ✅ ["bb145801-dd77-4e34-bdea-bee5dd790f3e"] → Válido
   * ❌ ["abc123"] → Inválido (não é UUID)
   * ❌ [""] → Inválido (vazio)
   */
  @IsUUID(4, { each: true, message: 'Cada ID de administrador deve ser um UUID válido' })
  adminsId?: string[];

  // ========================================================================
  // CAMPO: MEMBROS (OPCIONAL)
  // ========================================================================
  
  /*
   * 👥 CAMPO: MEMBERS (Lista de Membros)
   * 
   * Campo OPCIONAL para adicionar membros iniciais ao grupo.
   * Se não fornecido, apenas o criador será membro inicial.
   */
  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',
      '6ee878d0-e36c-4596-a249-46f2cd948146',
    ],
    description: 'Lista de IDs dos membros (UUIDs válidos) - opcional, usuário criador será adicionado automaticamente',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Lista de membros deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID de membro deve ser um UUID válido' })
  members?: string[];

  // ========================================================================
  // CAMPO: REGRA DO ÚLTIMO ADMIN (OPCIONAL)
  // ========================================================================
  
  /*
   * ⚖️ CAMPO: LAST_ADMIN_RULE (Regra para o Último Admin)
   * 
   * Define o que acontece quando o último administrador sai do grupo.
   * Se não fornecido, será usado um valor padrão no service.
   */
  @ApiProperty({
    description: "Regra para quando o último admin sair: 'promote' ou 'delete'",
    example: 'promote',
    required: false,
    enum: ['promote', 'delete'],                               // 📋 Lista de valores válidos na documentação
  })
  @IsOptional()
  @IsString({ message: 'Regra do último admin deve ser uma string' })
  
  /*
   * 📋 @IsIn: DEVE ESTAR NA LISTA DE VALORES VÁLIDOS
   * 
   * 🎯 FUNÇÃO: Só aceita 'promote' ou 'delete', nada mais
   * 🔒 SEGURANÇA: Evita valores inválidos como 'explode' ou 'hack'
   * 
   * 💡 EXEMPLO:
   * ✅ 'promote' → Válido
   * ✅ 'delete' → Válido
   * ❌ 'destroy' → Inválido
   * ❌ 'promote_all' → Inválido
   */
  @IsIn(['promote', 'delete'], { message: 'Regra do último admin deve ser "promote" ou "delete"' })
  lastAdminRule?: LastAdminRule;
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - CREATE GROUP DTO
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 📋 DTO vs ENTITY:
 *    - DTO: Dados necessários para CRIAR (enviados pelo usuário)
 *    - Entity: Estrutura completa para ARMAZENAR (no sistema)
 * 
 * 2. 🛡️ VALIDAÇÃO EM CAMADAS:
 *    - Tipo de dado (string, array, etc.)
 *    - Tamanho (mínimo/máximo)
 *    - Formato (UUID, regex)
 *    - Valores permitidos (enum)
 * 
 * 3. 🔒 SEGURANÇA:
 *    - XSS Protection: Regex bloqueia código malicioso
 *    - UUID Validation: Garante IDs válidos
 *    - Input Sanitization: Limpa dados antes de processar
 * 
 * 4. 📖 DOCUMENTAÇÃO AUTOMÁTICA:
 *    - @ApiProperty gera documentação visual
 *    - Exemplos ajudam desenvolvedores
 *    - Swagger UI mostra como usar a API
 * 
 * 5. ⚪ FLEXIBILIDADE:
 *    - Campos opcionais permitem uso simples ou avançado
 *    - Valores padrão podem ser aplicados no service
 * 
 * 6. 🔄 FLUXO DE DADOS:
 *    Usuário → DTO (validação) → Service (lógica) → Entity (armazenamento)
 * 
 * 💡 EXEMPLO PRÁTICO DE USO:
 * 
 * Requisição SIMPLES (só o essencial):
 * {
 *   "name": "Família Silva"
 * }
 * 
 * Requisição COMPLETA (com todas as opções):
 * {
 *   "name": "Projeto WhatsUT",
 *   "adminsId": ["uuid-admin1", "uuid-admin2"],
 *   "members": ["uuid-member1", "uuid-member2"],
 *   "lastAdminRule": "promote"
 * }
 * 
 * 📈 PRÓXIMOS PASSOS:
 * Agora que sabemos como VALIDAR dados de entrada, vamos ver:
 * - Como o Service PROCESSA esses dados
 * - Como o Controller RECEBE a requisição
 * - Como o Repository SALVA no arquivo CSV
 * 
 * ========================================================================================
 */