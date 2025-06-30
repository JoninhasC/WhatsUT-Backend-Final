/*
 * ========================================================================================
 * GROUP ENTITY - DEFINIÇÃO DA ESTRUTURA DE DADOS DE UM GRUPO
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Entity (Entidade)
 * Uma entidade representa um objeto do mundo real no nosso sistema.
 * No caso de um grupo, pensamos em todas as características que um grupo 
 * de WhatsApp tem: nome, membros, administradores, etc.
 * 
 * É como um "molde" ou "planta baixa" que define como deve ser um grupo.
 * Toda vez que criarmos um grupo novo, ele seguirá essa estrutura.
 * 
 * 🏗️ ANALOGIA: 
 * Imagine que você está criando uma ficha de cadastro para grupos de WhatsApp.
 * Essa ficha tem campos específicos que TODOS os grupos devem preencher.
 * Esta entity é exatamente essa "ficha modelo".
 */

// ============================================================================
// TIPOS PERSONALIZADOS
// ============================================================================

/*
 * 📋 TIPO: LastAdminRule
 * 
 * 🎯 PROPÓSITO: Define o que acontece quando o último administrador sai do grupo
 * 
 * 📊 OPÇÕES DISPONÍVEIS:
 * - 'promote': Promove automaticamente outro membro a administrador
 * - 'delete': Deleta o grupo automaticamente (sem admin = sem grupo)
 * 
 * 🔧 BENEFÍCIO: TypeScript vai nos avisar se tentarmos usar um valor inválido
 * ao invés de aceitar qualquer string. É como ter uma "lista de opções válidas".
 */
export type LastAdminRule = 'promote' | 'delete';

// ============================================================================
// ENTIDADE PRINCIPAL: GROUP
// ============================================================================

/*
 * 🏛️ CLASSE GROUP
 * 
 * Esta classe define EXATAMENTE como um grupo deve ser estruturado.
 * Cada propriedade aqui representa uma informação essencial de um grupo.
 * 
 * 🎯 FUNÇÃO: Serve como "contrato" - todos os grupos DEVEM ter essas propriedades
 * 
 * 💡 ANALOGIA: 
 * É como uma carteira de identidade. Toda pessoa tem:
 * - Nome, RG, CPF, endereço, etc.
 * 
 * Todo grupo tem:
 * - ID, nome, administradores, membros, etc.
 */
export class Group {
  /*
   * 🆔 ID: Identificador Único do Grupo
   * 
   * 🎯 FUNÇÃO: Como o "CPF" do grupo - cada grupo tem um ID único
   * 📊 FORMATO: UUID (ex: "bb145801-dd77-4e34-bdea-bee5dd790f3e")
   * 🔒 IMPORTÂNCIA: Permite encontrar um grupo específico entre milhares
   * 
   * 💡 ANALOGIA: Como o número de série de um produto - nunca se repete
   */
  id: string;

  /*
   * 📝 NAME: Nome do Grupo
   * 
   * 🎯 FUNÇÃO: Nome que aparece para os usuários (ex: "Família Silva", "Trabalho TI")
   * 📊 REGRAS: 3-50 caracteres, sem símbolos especiais (por segurança)
   * 🔒 VALIDAÇÃO: Evita nomes como "<script>alert('hack')</script>"
   * 
   * 💡 ANALOGIA: Como o nome de contato no seu celular
   */
  name: string;

  /*
   * 👑 ADMINS_ID: Lista de IDs dos Administradores
   * 
   * 🎯 FUNÇÃO: Quem pode adicionar/remover membros, alterar configurações
   * 📊 FORMATO: Array de UUIDs ["id1", "id2", "id3"]
   * 🔒 PODER: Administradores têm controle total sobre o grupo
   * 
   * 💡 ANALOGIA: Como os "donos" de um grupo de WhatsApp que podem adicionar pessoas
   */
  adminsId: string[];

  /*
   * 👥 MEMBERS: Lista de IDs de Todos os Membros
   * 
   * 🎯 FUNÇÃO: Todas as pessoas que fazem parte do grupo (incluindo admins)
   * 📊 FORMATO: Array de UUIDs ["membro1", "membro2", "admin1"]
   * 📱 USO: Para saber quem pode ver as mensagens do grupo
   * 
   * 💡 ANALOGIA: Como a lista de participantes que você vê quando clica em "info do grupo"
   */
  members: string[];

  /*
   * ⏳ PENDING_REQUESTS: Solicitações Pendentes de Entrada
   * 
   * 🎯 FUNÇÃO: Lista de pessoas que pediram para entrar mas ainda não foram aceitas
   * 📊 FORMATO: Array de UUIDs ["solicitante1", "solicitante2"]
   * 🔄 FLUXO: Admin pode aceitar ou rejeitar essas solicitações
   * 
   * 💡 ANALOGIA: Como uma "sala de espera" - pessoas esperando aprovação para entrar
   */
  pendingRequests: string[];

  /*
   * ⚖️ LAST_ADMIN_RULE: Regra para o Último Administrador
   * 
   * 🎯 FUNÇÃO: Define o que acontece quando o último admin sai do grupo
   * 📊 OPÇÕES: 
   *    - 'promote': Promove automaticamente outro membro a admin
   *    - 'delete': Deleta o grupo (sem admin = grupo inválido)
   * 
   * 💡 ANALOGIA: Como um "testamento" do grupo - instruções para quando não houver mais responsável
   * 
   * 🔧 EXEMPLO PRÁTICO:
   * Grupo "Família Silva" com regra 'promote':
   * - Admin João sai → Maria (membro mais antigo) vira admin automaticamente
   * 
   * Grupo "Projeto Temporário" com regra 'delete':
   * - Admin Pedro sai → Grupo é deletado automaticamente
   */
  lastAdminRule: LastAdminRule;
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - GROUP ENTITY
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 📋 ENTITIES: São "modelos" que definem como os dados devem ser estruturados
 * 
 * 2. 🎯 TYPESCRIPT: Nos ajuda a definir tipos específicos e evitar erros
 * 
 * 3. 🏗️ ARQUITETURA: Esta entity será usada por:
 *    - Services (lógica de negócio)
 *    - Controllers (endpoints da API)
 *    - Repositories (salvamento/busca de dados)
 * 
 * 4. 🔒 SEGURANÇA: Cada campo tem uma função específica para manter o grupo organizado
 * 
 * 5. 🔄 FLUXO DE DADOS: Esta estrutura garante que todos os grupos tenham:
 *    - Identificação única (id)
 *    - Nome legível (name)
 *    - Controle de acesso (adminsId, members)
 *    - Gestão de entrada (pendingRequests)
 *    - Regras de governança (lastAdminRule)
 * 
 * 💡 PRÓXIMOS PASSOS:
 * Agora que sabemos COMO um grupo é estruturado, podemos entender:
 * - Como CRIAR grupos (DTOs)
 * - Como GERENCIAR grupos (Services)
 * - Como ACESSAR grupos via API (Controllers)
 * 
 * ========================================================================================
 */
