/*
 * ========================================================================================
 * UPDATE GROUP DTO - ESTRUTURA DE DADOS PARA ATUALIZAR GRUPOS EXISTENTES
 * ========================================================================================
 * 
 * 🎯 CONCEITO: DTO de Atualização
 * Este DTO define quais campos podem ser modificados em um grupo já existente.
 * É diferente do CreateGroupDto porque:
 * - Todos os campos são opcionais (você pode alterar só o que quiser)
 * - Possui campos extras específicos para grupos já criados
 * 
 * 🔄 HERANÇA INTELIGENTE:
 * Usa PartialType() para "herdar" todos os campos do CreateGroupDto,
 * mas tornando-os opcionais automaticamente.
 * 
 * 🏗️ ANALOGIA: 
 * CreateGroupDto = Formulário de matrícula completo (todos os dados obrigatórios)
 * UpdateGroupDto = Formulário de alteração cadastral (só o que você quer mudar)
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS PARA VALIDAÇÃO E HERANÇA
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🔧 ApiProperty: Documentação automática para Swagger
 * 🎯 PartialType: Torna todos os campos de CreateGroupDto opcionais
 * 🛡️ Validadores: Para garantir dados corretos
 * 📁 CreateGroupDto: DTO base que vamos "estender"
 */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';

// ============================================================================
// DTO PRINCIPAL: UPDATEGROUP
// ============================================================================

/*
 * 🏛️ CLASSE UPDATEGROUPDTO
 * 
 * 🎯 HERANÇA COM PARTIALTYPE:
 * extends PartialType(CreateGroupDto) significa:
 * "Pegue TODOS os campos de CreateGroupDto e torne-os opcionais"
 * 
 * 📊 RESULTADO: UpdateGroupDto automaticamente terá:
 * - name?: string (opcional)
 * - adminsId?: string[] (opcional)  
 * - members?: string[] (opcional)
 * - lastAdminRule?: LastAdminRule (opcional)
 * 
 * 💡 VANTAGEM: Se adicionarmos um campo novo em CreateGroupDto,
 * ele aparecerá automaticamente aqui como opcional!
 * 
 * 🔧 ANALOGIA: 
 * É como uma "cópia inteligente" que se atualiza sozinha.
 * Se você adiciona um campo na ficha de matrícula,
 * ele aparece automaticamente na ficha de alteração.
 */
export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  
  // ========================================================================
  // CAMPO EXTRA: SOLICITAÇÕES PENDENTES
  // ========================================================================
  
  /*
   * ⏳ CAMPO: PENDING_REQUESTS (Solicitações Pendentes)
   * 
   * 🎯 POR QUE SÓ AQUI E NÃO NO CREATE?
   * - Na CRIAÇÃO: Grupo sempre começa sem solicitações pendentes
   * - Na ATUALIZAÇÃO: Administradores podem gerenciar solicitações
   * 
   * 📱 USO PRÁTICO:
   * - Admin pode aprovar/rejeitar solicitações
   * - Admin pode limpar lista de pendências
   * - Admin pode adicionar manualmente alguém à lista de espera
   */
  @ApiProperty({
    example: [
      'bb145801-dd77-4e34-bdea-bee5dd790f3e',    // 📝 ID de quem pediu para entrar
      '6ee878d0-e36c-4596-a249-46f2cd948146',    // 📝 Outro ID na fila de espera
    ],
    description: 'Lista de IDs de solicitações pendentes (UUIDs válidos)',
    required: false,                             // ⚪ Sempre opcional
  })
  
  /*
   * ⚪ @IsOptional: CAMPO OPCIONAL
   * Admin não é obrigado a mexer nas solicitações a cada atualização
   */
  @IsOptional()
  
  /*
   * 📊 @IsArray: DEVE SER UMA LISTA
   * Se enviado, deve ser um array como ["id1", "id2"]
   */
  @IsArray({ message: 'Lista de solicitações pendentes deve ser um array' })
  
  /*
   * 🆔 @IsUUID: CADA ITEM DEVE SER UM UUID VÁLIDO
   * 
   * 🎯 VALIDAÇÃO: Cada ID na lista deve ser um UUID real
   * 🔒 SEGURANÇA: Evita IDs falsos ou maliciosos
   * 
   * 💡 EXEMPLO DE USO:
   * 
   * Para APROVAR uma solicitação:
   * 1. Remove o ID de pendingRequests
   * 2. Adiciona o ID em members
   * 
   * Para REJEITAR uma solicitação:
   * 1. Remove o ID de pendingRequests
   * 2. Não adiciona em lugar nenhum
   * 
   * Para LIMPAR todas as pendências:
   * { "pendingRequests": [] }
   */
  @IsUUID(4, { each: true, message: 'Cada ID de solicitação pendente deve ser um UUID válido' })
  pendingRequests?: string[];
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - UPDATE GROUP DTO
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🧬 HERANÇA COM PARTIALTYPE:
 *    - Reaproveita código de CreateGroupDto
 *    - Torna todos os campos opcionais automaticamente
 *    - Mantém todas as validações do DTO original
 *    - Se atualiza sozinho quando CreateGroupDto muda
 * 
 * 2. 🔄 CAMPOS ESPECÍFICOS DE ATUALIZAÇÃO:
 *    - pendingRequests só faz sentido em grupos existentes
 *    - Permite gerenciar solicitações de entrada
 *    - Admin pode aprovar/rejeitar membros
 * 
 * 3. 💡 FLEXIBILIDADE DE USO:
 *    - Pode enviar só o campo que quer alterar
 *    - Campos não enviados permanecem inalterados
 *    - Todas as validações ainda funcionam
 * 
 * 4. 🛡️ VALIDAÇÃO MANTIDA:
 *    - Se enviar "name", ainda valida tamanho e XSS
 *    - Se enviar "adminsId", ainda valida UUIDs
 *    - Herança preserva todas as regras de segurança
 * 
 * 💡 EXEMPLOS PRÁTICOS DE USO:
 * 
 * ALTERAR SÓ O NOME:
 * {
 *   "name": "Novo Nome do Grupo"
 * }
 * 
 * ADICIONAR UM ADMIN:
 * {
 *   "adminsId": ["admin-existente", "novo-admin"]
 * }
 * 
 * APROVAR UMA SOLICITAÇÃO:
 * {
 *   "members": ["membros-existentes", "novo-membro"],
 *   "pendingRequests": ["outros-ainda-pendentes"]
 * }
 * 
 * MUDANÇA COMPLETA:
 * {
 *   "name": "Nome Atualizado",
 *   "adminsId": ["admin1", "admin2"],
 *   "members": ["member1", "member2", "member3"],
 *   "pendingRequests": [],
 *   "lastAdminRule": "delete"
 * }
 * 
 * 📈 VANTAGEM DO PARTIALTYPE:
 * Se amanhã adicionarmos um campo "description" no CreateGroupDto,
 * automaticamente teremos "description?" no UpdateGroupDto,
 * sem precisar mexer em nada aqui!
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora vamos ver como esses DTOs são usados:
 * - Controller recebe e valida os dados
 * - Service aplica a lógica de negócio
 * - Repository persiste as mudanças
 * 
 * ========================================================================================
 */
