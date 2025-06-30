/**
 * 👥 GROUPS PAGE - PÁGINA DE GERENCIAMENTO E LISTAGEM DE GRUPOS DO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Esta é uma página React que exibe e gerencia grupos de chat/estudo.
 * É como um "catálogo de comunidades" onde você pode descobrir e participar de grupos.
 * 
 * ANALOGIA SIMPLES:
 * Imagine a página "Grupos" do WhatsApp ou Discord:
 * - Mostra todos os grupos disponíveis
 * - Permite criar novos grupos
 * - Exibe informações como número de membros
 * - Facilita entrada em grupos de interesse
 * - Organiza tudo em layout visual atrativo
 * 
 * 🎯 RESPONSABILIDADES DESTA PÁGINA:
 * - Carregar e exibir lista de grupos
 * - Mostrar informações dos grupos (nome, membros, data)
 * - Permitir criação de novos grupos
 * - Facilitar entrada/participação em grupos
 * - Navegar para chat dos grupos
 * - Estados de loading e vazio
 * 
 * 🔧 FUNCIONALIDADES PRINCIPAIS:
 * - Listagem em grid responsivo
 * - Botão de "Criar Grupo" no header
 * - Cards informativos para cada grupo
 * - Botões de ação (Entrar/Ver Mensagens)
 * - Loading states e empty states
 * 
 * 📱 DESIGN E UX:
 * - Layout em 2 colunas no desktop
 * - Cards com informações organizadas
 * - Ícones representativos (Users)
 * - Hover effects para interatividade
 * - Cores temáticas (azul para grupos)
 */

// 📦 IMPORTAÇÕES REACT PARA FUNCIONALIDADES BÁSICAS
import { 
  useEffect,    // 🔄 Hook para efeitos colaterais (carregar dados)
  useState      // 📊 Hook para gerenciar estado local
} from 'react';

// 📦 IMPORTAÇÕES DE NAVEGAÇÃO
import { useNavigate } from 'react-router-dom'; // 🧭 Hook para navegação programática

// 📦 IMPORTAÇÕES DE SERVIÇOS E COMUNICAÇÃO
import { groupService } from '../services/api'; // 🌐 Service para comunicação com backend de grupos

// 📦 IMPORTAÇÕES DE COMPONENTES UI REUTILIZÁVEIS
import { 
  Card,         // 🃏 Container visual elegante
  CardHeader,   // 📋 Cabeçalho do card
  CardContent   // 📄 Conteúdo do card
} from '../components/ui';

// 📦 IMPORTAÇÕES DE COMPONENTES ESPECÍFICOS
import LoadingSpinner from '../components/LoadingSpinner'; // ⏳ Indicador de carregamento

// 📦 IMPORTAÇÕES DE ÍCONES
import { 
  Users,          // 👥 Ícone de usuários/grupos
  MessageCircle   // 💬 Ícone de chat/mensagem
} from 'lucide-react';

// 📦 IMPORTAÇÕES DE TIPOS TYPESCRIPT
import type { Group } from '../types'; // 🏠 Interface/tipo de grupo

/**
 * 🏗️ COMPONENTE PRINCIPAL - GROUPS PAGE
 * 
 * 📚 CONCEITO - Functional Component:
 * Component React funcional que renderiza a página de grupos.
 * Foca em descoberta e gestão de comunidades.
 */
function GroupsPage() {
  
  /**
   * 🧭 HOOK DE NAVEGAÇÃO
   * 
   * 📚 CONCEITO - Programmatic Navigation:
   * Hook que permite navegar entre páginas via código.
   * Usado para ir para:
   * - Página de criação de grupo
   * - Chat específico do grupo
   */
  const navigate = useNavigate();
  
  /**
   * 📊 ESTADOS LOCAIS DO COMPONENTE
   * 
   * 📚 CONCEITO - Component State Management:
   * Gerenciamos os dados e estados visuais da página:
   * - groups: Lista de grupos carregados do backend
   * - isLoading: Indica se está carregando dados
   */
  const [groups, setGroups] = useState<Group[]>([]); // 🏠 Lista de grupos (inicia vazia)
  const [isLoading, setIsLoading] = useState(false); // ⏳ Estado de carregamento (inicia false)

  /**
   * 🔄 EFFECT PARA CARREGAR GRUPOS
   * 
   * 📚 CONCEITO - Data Fetching on Mount:
   * useEffect executa uma vez quando componente monta
   * para carregar dados iniciais.
   * 
   * Sem dependências ([]) = executa apenas na montagem.
   */
  useEffect(() => {
    
    /**
     * 📥 FUNÇÃO ASSÍNCRONA PARA BUSCAR GRUPOS
     * 
     * 📚 CONCEITO - API Data Loading:
     * Padrão comum para carregar dados:
     * 1. 🔄 Ativar loading
     * 2. 🌐 Fazer requisição
     * 3. ✅ Atualizar estado com dados
     * 4. ❌ Tratar erros
     * 5. 🔄 Desativar loading
     */
    const fetchGroups = async () => {
      setIsLoading(true); // 🔄 Início do loading
      
      try {
        /**
         * 🌐 REQUISIÇÃO AO BACKEND
         * 
         * 📚 CONCEITO - Service Layer:
         * Usamos groupService para encapsular
         * lógica de comunicação com API.
         */
        const data = await groupService.getGroups();
        
        /**
         * ✅ ATUALIZAR ESTADO COM DADOS
         * 
         * 📚 CONCEITO - State Update:
         * Substituímos o array vazio inicial
         * pelos dados reais do backend.
         */
        setGroups(data);
        
      } catch (error) {
        /**
         * ❌ TRATAMENTO DE ERROS
         * 
         * 📚 CONCEITO - Error Handling:
         * Logamos erro para debug, mas mantemos
         * interface funcional (lista vazia).
         */
        console.error('Erro ao carregar grupos:', error);
        
      } finally {
        /**
         * 🔄 FINALIZAÇÃO GARANTIDA
         * 
         * 📚 CONCEITO - Cleanup:
         * Sempre desativamos loading, independente
         * de sucesso ou erro.
         */
        setIsLoading(false);
      }
    };
    
    /**
     * 🚀 EXECUÇÃO IMEDIATA
     * 
     * Executamos a função assim que componente monta.
     */
    fetchGroups();
    
  }, []); // 🎯 Array vazio = executa só na montagem

  /**
   * 🏠 FUNÇÃO: ENTRAR/ACESSAR GRUPO
   * 
   * 📚 CONCEITO - Group Navigation:
   * Função que lida com ações relacionadas a grupos.
   * Por simplicidade, ambos botões levam ao chat do grupo.
   * 
   * @param group - Objeto do grupo selecionado
   */
  const handleJoinGroup = (group: Group) => {
    /**
     * 🧭 NAVEGAÇÃO PARA CHAT DO GRUPO
     * 
     * 📚 CONCEITO - Dynamic Routing:
     * Navegamos para rota de chat específica
     * usando o ID do grupo.
     * 
     * Em sistema completo, poderia:
     * - Verificar se já é membro
     * - Solicitar permissão se grupo privado
     * - Mostrar preview antes de entrar
     */
    navigate(`/chat/${group.id}`);
  };

  /**
   * 🎨 RENDERIZAÇÃO DA INTERFACE
   * 
   * 📚 CONCEITO - Complex Layout Rendering:
   * Interface mais complexa que outras páginas:
   * - Header com título E botão de ação
   * - Layout flexível para múltiplas ações
   * - Cards com mais informações por item
   * 
   * ESTRUTURA VISUAL:
   * 1. 🌐 Container full-screen
   * 2. 📋 Card com header bipartido
   * 3. 📊 Área de conteúdo condicional
   * 4. 🏠 Grid de grupos com ações múltiplas
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* 
        🌐 CONTAINER PRINCIPAL
        
        📚 CONCEITO - Consistent Layout:
        Mesmo padrão das outras páginas para
        experiência visual consistente.
      */}
      
      <div className="max-w-4xl mx-auto px-4">
        {/* 
          📏 CONTAINER CENTRALIZADO
          
          max-w-4xl: Largura máxima otimizada para grupos
        */}
        
        <Card className="shadow-lg">
          {/* 
            🃏 CARD PRINCIPAL
            
            shadow-lg: Sombra destacada para importância
          */}
          
          <CardHeader>
            {/* 
              📋 CABEÇALHO COMPLEXO
              
              📚 CONCEITO - Header with Actions:
              Diferente de outras páginas, este header
              tem TANTO informação QUANTO ação (botão).
            */}
            
            <div className="flex justify-between items-center">
              {/* 
                🔄 LAYOUT FLEXÍVEL BIPARTIDO
                
                📚 CONCEITO - Flex Layout:
                - flex: Layout flexível
                - justify-between: Espaça elementos nas extremidades
                - items-center: Alinha verticalmente
              */}
              
              <div>
                {/* 
                  📝 SEÇÃO DE INFORMAÇÕES (ESQUERDA)
                */}
                
                <h2 className="text-2xl font-bold text-gray-900">
                  Grupos Disponíveis
                </h2>
                {/* 
                  📛 TÍTULO PRINCIPAL
                  
                  Mesmo estilo das outras páginas para consistência
                */}
                
                <p className="text-gray-600">
                  Participe de grupos de estudo e discussões
                </p>
                {/* 
                  📝 SUBTÍTULO DESCRITIVO
                  
                  Explica o propósito da página
                */}
              </div>
              
              <button
                onClick={() => navigate('/create-group')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                {/* 
                  🔘 BOTÃO DE AÇÃO PRINCIPAL (DIREITA)
                  
                  📚 CONCEITO - Primary Action:
                  - onClick: Navega para página de criação
                  - bg-blue-500: Cor azul (tema de grupos)
                  - hover:bg-blue-600: Azul mais escuro no hover
                  - flex items-center space-x-2: Layout do ícone + texto
                */}
                
                <Users className="w-4 h-4" />
                {/* 
                  👥 ÍCONE DE GRUPOS
                  
                  w-4 h-4: Tamanho pequeno para botão
                */}
                
                <span>Criar Grupo</span>
                {/* 
                  📝 TEXTO DA AÇÃO
                  
                  Call-to-action claro e direto
                */}
              </button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* 
              📄 ÁREA DE CONTEÚDO PRINCIPAL
            */}
            
            {isLoading ? (
              /* 
                ⏳ ESTADO DE LOADING
                
                📚 CONCEITO - Loading State:
                Mesmo padrão das outras páginas
              */
              <div className="py-8">
                <LoadingSpinner message="Carregando grupos..." />
              </div>
              
            ) : groups.length === 0 ? (
              /* 
                📭 ESTADO VAZIO
                
                📚 CONCEITO - Empty State:
                Estado vazio específico para grupos
              */
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                {/* 
                  🎨 ÍCONE DE GRUPOS VAZIO
                  
                  Usa ícone temático (Users) ao invés de MessageCircle
                */}
                
                <p className="text-gray-500">
                  Nenhum grupo encontrado
                </p>
                {/* 
                  📝 MENSAGEM DE ESTADO VAZIO
                */}
              </div>
              
            ) : (
              /* 
                🏠 LISTA DE GRUPOS
                
                📚 CONCEITO - Data Grid:
                Layout em grid para exibir informações
                mais ricas sobre cada grupo
              */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 
                  🏗️ GRID RESPONSIVO PARA GRUPOS
                  
                  📚 CONCEITO - Responsive Layout:
                  - grid-cols-1: 1 coluna em mobile
                  - md:grid-cols-2: 2 colunas em tablet/desktop
                  - gap-6: Espaçamento maior entre cards
                  
                  NOTA: Só 2 colunas (não 3) porque grupos
                  precisam de mais espaço para informações
                */}
                
                {groups.map((group) => (
                  /* 
                    🔄 MAPEAMENTO DE GRUPOS
                    
                    📚 CONCEITO - Rich List Items:
                    Cada item de grupo tem mais informações
                    e ações que um item de usuário simples
                  */
                  <div
                    key={group.id}
                    className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* 
                      🃏 CARD INDIVIDUAL DO GRUPO
                      
                      📚 CONCEITO - Information Card:
                      - p-6: Padding maior para mais conteúdo
                      - Outros estilos iguais aos cards de usuário
                    */}
                    
                    <div className="flex items-start space-x-4 mb-4">
                      {/* 
                        📊 ÁREA DE INFORMAÇÕES PRINCIPAIS
                        
                        📚 CONCEITO - Content Layout:
                        - items-start: Alinha no topo (não centro)
                        - space-x-4: Espaçamento entre avatar e info
                        - mb-4: Margem bottom antes dos botões
                      */}
                      
                      <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                        <Users className="w-8 h-8" />
                      </div>
                      {/* 
                        🎨 AVATAR DO GRUPO
                        
                        📚 CONCEITO - Group Avatar:
                        - w-16 h-16: Maior que avatar de usuário (64px)
                        - bg-blue-500: Cor azul (tema de grupos)
                        - rounded-lg: Cantos arredondados (não círculo)
                        - Users w-8 h-8: Ícone grande para grupos
                        
                        DIFERENÇAS DO USUÁRIO:
                        - Quadrado vs círculo
                        - Azul vs verde
                        - Ícone vs inicial do nome
                      */}
                      
                      <div className="flex-1">
                        {/* 
                          📝 ÁREA DE INFORMAÇÕES TEXTUAIS
                          
                          flex-1: Ocupa espaço restante
                        */}
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {group.name}
                        </h3>
                        {/* 
                          📛 NOME DO GRUPO
                          
                          📚 CONCEITO - Hierarchy:
                          - text-lg: Maior que nome de usuário
                          - font-semibold: Mais peso que usuário
                          - mb-1: Espaçamento mínimo
                        */}
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {group.members?.length || 0} membros
                        </p>
                        {/* 
                          👥 CONTADOR DE MEMBROS
                          
                          📚 CONCEITO - Group Statistics:
                          - Mostra engajamento do grupo
                          - Optional chaining (?.) para segurança
                          - Fallback para 0 se undefined
                        */}
                        
                        <p className="text-sm text-gray-500">
                          Criado em {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                        {/* 
                          📅 DATA DE CRIAÇÃO
                          
                          📚 CONCEITO - Temporal Information:
                          - Mostra "idade" do grupo
                          - new Date().toLocaleDateString(): Formatação local
                          - Fallback para Date.now() se não tiver data
                          - text-gray-500: Cor mais sutil (info secundária)
                        */}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      {/* 
                        🔘 ÁREA DE BOTÕES DE AÇÃO
                        
                        📚 CONCEITO - Multiple Actions:
                        - flex space-x-3: Layout horizontal com espaçamento
                        - Múltiplos botões para diferentes ações
                      */}
                      
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        {/* 
                          🔘 BOTÃO: ENTRAR NO GRUPO
                          
                          📚 CONCEITO - Primary Action:
                          - flex-1: Ocupa metade do espaço disponível
                          - bg-blue-500: Cor azul (tema de grupos)
                          - Mesmo padrão de estilo dos outros botões
                        */}
                        
                        <Users className="w-4 h-4" />
                        {/* 
                          👥 ÍCONE DE GRUPOS
                        */}
                        
                        <span>Entrar no Grupo</span>
                        {/* 
                          📝 TEXTO DA AÇÃO
                        */}
                      </button>
                      
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        {/* 
                          🔘 BOTÃO: VER MENSAGENS
                          
                          📚 CONCEITO - Secondary Action:
                          - flex-1: Ocupa outra metade do espaço
                          - bg-green-500: Cor verde (tema de chat)
                          - Ação alternativa para mesmo resultado
                          
                          NOTA: Na implementação atual, ambos botões
                          fazem a mesma coisa. Em sistema completo:
                          - "Entrar": Solicitaria membership
                          - "Ver Mensagens": Visualização read-only
                        */}
                        
                        <MessageCircle className="w-4 h-4" />
                        {/* 
                          💬 ÍCONE DE CHAT
                        */}
                        
                        <span>Ver Mensagens</span>
                        {/* 
                          📝 TEXTO DA AÇÃO
                        */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default GroupsPage;

/**
 * 📚 RESUMO EDUCACIONAL - GROUPS PAGE
 * 
 * 🎯 O QUE APRENDEMOS NESTE ARQUIVO:
 * 
 * 1. 🏗️ ARQUITETURA DE PÁGINA COMPLEXA:
 *    - Layout bipartido no header (info + ação)
 *    - Cards com informações mais ricas
 *    - Múltiplas ações por item
 *    - Grid otimizado para conteúdo denso
 * 
 * 2. 📊 GESTÃO DE DADOS DE GRUPOS:
 *    - Loading de dados específicos (grupos)
 *    - Exibição de estatísticas (membros)
 *    - Formatação de datas
 *    - Fallbacks para dados opcionais
 * 
 * 3. 🎨 DESIGN SYSTEM EVOLUTION:
 *    - Tema de cores consistente (azul para grupos)
 *    - Avatars diferenciados (quadrado vs círculo)
 *    - Ícones temáticos (Users vs MessageCircle)
 *    - Hierarquia visual clara
 * 
 * 4. 🔧 PADRÕES DE INTERAÇÃO:
 *    - Botão de ação principal no header
 *    - Múltiplas ações por item
 *    - Navegação para diferentes contextos
 *    - Hover states para feedback
 * 
 * 5. 📱 RESPONSIVIDADE OTIMIZADA:
 *    - Grid de 2 colunas máximo (não 3)
 *    - Cards maiores para mais informação
 *    - Espaçamento adequado para conteúdo denso
 *    - Layout que funciona em mobile
 * 
 * 6. 💡 UX PATTERNS OBSERVADOS:
 *    - Primary action no topo da página
 *    - Informações contextuais (data, membros)
 *    - Estados vazios temáticos
 *    - Ações múltiplas mas claras
 * 
 * 7. 🔗 NAVEGAÇÃO E FLUXOS:
 *    - Criação de grupo (navigate('/create-group'))
 *    - Acesso a chat específico (navigate(`/chat/${group.id}`))
 *    - Fluxos intuitivos para diferentes casos de uso
 * 
 * 8. 📊 DISPLAY DE DADOS RICOS:
 *    - Contadores de membros
 *    - Formatação de datas
 *    - Informações de contexto
 *    - Visual hierarchy com tipografia
 * 
 * 🚀 CONCEITOS AVANÇADOS DEMONSTRADOS:
 * - Optional chaining para dados seguros (group.members?.length)
 * - Date formatting para UX (toLocaleDateString())
 * - Flex layouts com proporções (flex-1)
 * - Conditional styling baseado em contexto
 * - Multiple action patterns em lista
 * 
 * 💡 MELHORIAS SUGERIDAS PARA PRODUÇÃO:
 * - Busca/filtro de grupos por categoria
 * - Preview de mensagens recentes
 * - Status de membership (membro/pendente/não-membro)
 * - Diferentes ações baseadas em status
 * - Lazy loading para muitos grupos
 * - Sistema de favoritos/bookmarks
 * - Informações de atividade recente
 * 
 * 🔄 COMPARAÇÃO COM USERS PAGE:
 * - SIMILAR: Estrutura geral, estados de loading/vazio
 * - DIFERENTE: Header com ação, grid 2-col, cards maiores
 * - SIMILAR: Padrões de navegação e interação
 * - DIFERENTE: Tema de cores, tipos de informação
 */
