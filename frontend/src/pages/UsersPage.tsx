/**
 * 👥 USERS PAGE - PÁGINA DE LISTAGEM DE USUÁRIOS DO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Esta é uma página React que exibe uma lista de usuários disponíveis para chat.
 * É como um "catálogo de pessoas" que você pode contactar.
 * 
 * ANALOGIA SIMPLES:
 * Imagine a agenda de contatos do seu celular ou a lista de amigos do WhatsApp:
 * - Mostra quem está disponível para conversar
 * - Indica se estão online/offline
 * - Permite iniciar uma conversa com um clique
 * - Organiza tudo de forma visual e acessível
 * 
 * 🎯 RESPONSABILIDADES DESTA PÁGINA:
 * - Carregar lista de usuários do backend
 * - Exibir status online/offline
 * - Filtrar usuário atual da lista
 * - Mostrar estados de loading/vazio
 * - Permitir início de conversas
 * - Interface responsiva e acessível
 * 
 * 🔧 COMPONENTES UTILIZADOS:
 * - Card: Container visual elegante
 * - LoadingSpinner: Indicador de carregamento
 * - MessageCircle: Ícone de chat (Lucide React)
 * - useAuth: Context de autenticação
 * - useNavigate: Navegação programática
 * 
 * 📱 DESIGN RESPONSIVO:
 * - Grid adaptativo (1 col mobile, 2 tablet, 3 desktop)
 * - Cards com hover effects
 * - Avatars com iniciais
 * - Status visual de online/offline
 */

// 📦 IMPORTAÇÕES REACT PARA FUNCIONALIDADES BÁSICAS
import { 
  useEffect,    // 🔄 Hook para efeitos colaterais (carregar dados)
  useState      // 📊 Hook para gerenciar estado local
} from 'react';

// 📦 IMPORTAÇÕES DE NAVEGAÇÃO
import { useNavigate } from 'react-router-dom'; // 🧭 Hook para navegação programática

// 📦 IMPORTAÇÕES DE SERVIÇOS E COMUNICAÇÃO
import { userService } from '../services/api';  // 🌐 Service para comunicação com backend

// 📦 IMPORTAÇÕES DE COMPONENTES UI REUTILIZÁVEIS
import { 
  Card,         // 🃏 Container visual elegante
  CardHeader,   // 📋 Cabeçalho do card
  CardContent   // 📄 Conteúdo do card
} from '../components/ui';

// 📦 IMPORTAÇÕES DE COMPONENTES ESPECÍFICOS
import LoadingSpinner from '../components/LoadingSpinner'; // ⏳ Indicador de carregamento

// 📦 IMPORTAÇÕES DE ÍCONES
import { MessageCircle } from 'lucide-react'; // 💬 Ícone de chat/mensagem

// 📦 IMPORTAÇÕES DE CONTEXTOS
import { useAuth } from '../contexts/AuthContext'; // 🔐 Context de autenticação

// 📦 IMPORTAÇÕES DE TIPOS TYPESCRIPT
import type { User } from '../types'; // 👤 Interface/tipo de usuário

/**
 * 🏗️ COMPONENTE PRINCIPAL - USERS PAGE
 * 
 * 📚 CONCEITO - Functional Component:
 * Component React funcional que renderiza a página de usuários.
 * Usa hooks para gerenciar estado e efeitos colaterais.
 */
function UsersPage() {
  
  /**
   * 🔐 CONTEXTO DE AUTENTICAÇÃO
   * 
   * 📚 CONCEITO - Context Consumption:
   * Extraímos dados do usuário atual do contexto de autenticação.
   * Isso nos permite saber quem está logado.
   * 
   * Renomeamos 'user' para 'currentUser' para clareza.
   */
  const { user: currentUser } = useAuth();
  
  /**
   * 🧭 HOOK DE NAVEGAÇÃO
   * 
   * 📚 CONCEITO - Programmatic Navigation:
   * Hook que permite navegar entre páginas via código
   * (não apenas por clique em links).
   * 
   * Usado para ir para página de chat quando usuário clica
   * em "Iniciar Conversa".
   */
  const navigate = useNavigate();
  
  /**
   * 📊 ESTADOS LOCAIS DO COMPONENTE
   * 
   * 📚 CONCEITO - Component State Management:
   * Gerenciamos múltiplos estados independentes:
   * - users: Lista de usuários carregados
   * - isLoading: Se está carregando dados
   * 
   * Cada useState retorna [valor, setter] para gerenciar o estado.
   */
  const [users, setUsers] = useState<User[]>([]); // 👥 Lista de usuários (inicia vazia)
  const [isLoading, setIsLoading] = useState(false); // ⏳ Estado de carregamento (inicia false)

  /**
   * 🔄 EFFECT PARA CARREGAR DADOS
   * 
   * 📚 CONCEITO - Side Effects:
   * useEffect executa código quando componente monta
   * ou quando dependências mudam.
   * 
   * Aqui carregamos a lista de usuários quando:
   * - Componente monta pela primeira vez
   * - currentUser muda (login/logout)
   */
  useEffect(() => {
    
    /**
     * 📥 FUNÇÃO ASSÍNCRONA PARA BUSCAR USUÁRIOS
     * 
     * 📚 CONCEITO - Async Operations in Effects:
     * Como useEffect não pode ser async diretamente,
     * criamos uma função async interna.
     * 
     * FLUXO COMPLETO:
     * 1. 🔄 Ativar loading
     * 2. 🌐 Fazer requisição ao backend
     * 3. 🔍 Filtrar usuário atual da lista
     * 4. ✅ Atualizar estado com dados
     * 5. ❌ Tratar erros se houver
     * 6. 🔄 Desativar loading sempre
     */
    const fetchUsers = async () => {
      setIsLoading(true); // 🔄 Início do loading
      
      try {
        /**
         * 🌐 REQUISIÇÃO AO BACKEND
         * 
         * 📚 CONCEITO - API Call:
         * Usamos o userService para buscar dados do backend.
         * Esta chamada é assíncrona e pode falhar.
         */
        const data = await userService.getUsers();
        
        /**
         * 🔍 FILTRAR USUÁRIO ATUAL
         * 
         * 📚 CONCEITO - Data Filtering:
         * Removemos o usuário logado da lista porque
         * não faz sentido ele iniciar conversa consigo mesmo.
         * 
         * É como remover seu próprio nome da agenda de contatos.
         */
        const otherUsers = data.filter((u: any) => u.id !== currentUser?.id);
        
        /**
         * ✅ ATUALIZAR ESTADO COM DADOS FILTRADOS
         * 
         * 📚 CONCEITO - State Update:
         * Atualizamos o estado 'users' com a lista filtrada.
         * Isso fará o componente re-renderizar com os novos dados.
         */
        setUsers(otherUsers);
        
      } catch (error) {
        /**
         * ❌ TRATAMENTO DE ERROS
         * 
         * 📚 CONCEITO - Error Handling:
         * Se a requisição falhar, logamos o erro.
         * Em produção, poderíamos mostrar notificação ao usuário.
         */
        console.error('Erro ao carregar usuários:', error);
        
      } finally {
        /**
         * 🔄 FINALIZAÇÃO GARANTIDA
         * 
         * 📚 CONCEITO - Finally Block:
         * finally executa independente de sucesso/erro.
         * Garantimos que o loading seja desativado sempre.
         */
        setIsLoading(false);
      }
    };
    
    /**
     * 🔐 EXECUÇÃO CONDICIONAL
     * 
     * 📚 CONCEITO - Conditional Execution:
     * Só executamos a busca se temos um usuário logado.
     * Isso evita chamadas desnecessárias ou errors.
     */
    if (currentUser) {
      fetchUsers();
    }
    
  }, [currentUser]); // 🎯 Dependência: re-executa se currentUser mudar

  /**
   * 💬 FUNÇÃO: INICIAR CHAT COM USUÁRIO
   * 
   * 📚 CONCEITO - Event Handler:
   * Função que lida com clique no botão "Iniciar Conversa".
   * Navega para página de chat específica do usuário.
   * 
   * @param user - Objeto do usuário selecionado
   */
  const handleStartChat = (user: User) => {
    /**
     * 🧭 NAVEGAÇÃO PROGRAMÁTICA
     * 
     * 📚 CONCEITO - Dynamic Routing:
     * Navegamos para uma rota dinâmica que inclui o ID
     * do usuário na URL (/chat/:userId).
     * 
     * É como "abrir a conversa" com uma pessoa específica.
     */
    navigate(`/chat/${user.id}`);
  };

  /**
   * 🎨 RENDERIZAÇÃO DA INTERFACE
   * 
   * 📚 CONCEITO - JSX Rendering:
   * Função que retorna JSX (JavaScript XML) descrevendo
   * como a interface deve aparecer.
   * 
   * ESTRUTURA VISUAL:
   * 1. 🌐 Container full-screen com background
   * 2. 📋 Card principal centralizado
   * 3. 📊 Área de conteúdo com estados condicionais
   * 4. 🎯 Grid responsivo de usuários
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* 
        🌐 CONTAINER PRINCIPAL
        
        📚 CONCEITO - Layout Container:
        - min-h-screen: Altura mínima da tela inteira
        - bg-gray-50: Background cinza claro
        - py-8: Padding vertical para espaçamento
      */}
      
      <div className="max-w-4xl mx-auto px-4">
        {/* 
          📏 CONTAINER CENTRALIZADO
          
          📚 CONCEITO - Responsive Layout:
          - max-w-4xl: Largura máxima limitada
          - mx-auto: Margem horizontal automática (centraliza)
          - px-4: Padding horizontal para mobile
        */}
        
        <Card className="shadow-lg">
          {/* 
            🃏 CARD PRINCIPAL
            
            📚 CONCEITO - Card Component:
            Componente reutilizável que cria um container
            visual elegante com bordas, sombra e espaçamento.
            
            shadow-lg: Sombra grande para destaque
          */}
          
          <CardHeader>
            {/* 
              📋 CABEÇALHO DO CARD
              
              📚 CONCEITO - Component Composition:
              CardHeader é um componente filho que
              estiliza automaticamente o cabeçalho.
            */}
            
            <h2 className="text-2xl font-bold text-gray-900">
              Usuários Online
            </h2>
            {/* 
              📝 TÍTULO PRINCIPAL
              
              📚 CONCEITO - Typography Classes:
              - text-2xl: Tamanho de fonte grande
              - font-bold: Texto em negrito
              - text-gray-900: Cor cinza escuro (quase preto)
            */}
            
            <p className="text-gray-600">
              Usuários disponíveis para conversar
            </p>
            {/* 
              📝 SUBTÍTULO DESCRITIVO
              
              text-gray-600: Cor cinza médio (menos destaque que título)
            */}
          </CardHeader>
          
          <CardContent>
            {/* 
              📄 ÁREA DE CONTEÚDO PRINCIPAL
              
              📚 CONCEITO - Content Area:
              CardContent aplica padding e espaçamento
              adequados para o conteúdo interno.
            */}
            
            {isLoading ? (
              /* 
                ⏳ ESTADO DE LOADING
                
                📚 CONCEITO - Conditional Rendering:
                Se isLoading é true, mostra spinner.
                Isso dá feedback visual ao usuário.
              */
              <div className="py-8">
                {/* 
                  py-8: Padding vertical para espaçamento
                */}
                <LoadingSpinner message="Carregando usuários..." />
                {/* 
                  📊 COMPONENTE DE LOADING
                  
                  📚 CONCEITO - Loading State:
                  Componente reutilizável que mostra
                  uma animação de carregamento com mensagem.
                */}
              </div>
              
            ) : users.length === 0 ? (
              /* 
                📭 ESTADO VAZIO
                
                📚 CONCEITO - Empty State:
                Se não está carregando E lista está vazia,
                mostra estado vazio amigável.
              */
              <div className="text-center py-8">
                {/* 
                  text-center: Centraliza texto
                  py-8: Padding vertical generoso
                */}
                
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                {/* 
                  🎨 ÍCONE DECORATIVO
                  
                  📚 CONCEITO - Empty State Icon:
                  - w-16 h-16: Tamanho grande (64px)
                  - mx-auto: Centraliza horizontalmente
                  - mb-4: Margem bottom
                  - text-gray-300: Cor cinza clara (sutil)
                */}
                
                <p className="text-gray-500">
                  Nenhum usuário encontrado
                </p>
                {/* 
                  📝 MENSAGEM DE ESTADO VAZIO
                  
                  text-gray-500: Cor cinza média para mensagem secundária
                */}
              </div>
              
            ) : (
              /* 
                👥 LISTA DE USUÁRIOS
                
                📚 CONCEITO - Data Rendering:
                Se há usuários, renderiza em grid responsivo.
              */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 
                  🏗️ GRID RESPONSIVO
                  
                  📚 CONCEITO - Responsive Grid:
                  - grid: Layout em grade
                  - grid-cols-1: 1 coluna em mobile
                  - md:grid-cols-2: 2 colunas em tablet (medium)
                  - lg:grid-cols-3: 3 colunas em desktop (large)
                  - gap-4: Espaçamento entre itens
                */}
                
                {users.map((user) => (
                  /* 
                    🔄 MAPEAMENTO DE DADOS
                    
                    📚 CONCEITO - List Rendering:
                    Para cada usuário no array, renderiza
                    um card individual.
                    
                    map() transforma cada item em JSX.
                  */
                  <div
                    key={user.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* 
                      🃏 CARD INDIVIDUAL DO USUÁRIO
                      
                      📚 CONCEITO - List Item:
                      - key={user.id}: Identificador único (required para React)
                      - p-4: Padding interno
                      - border border-gray-200: Borda cinza clara
                      - rounded-lg: Cantos arredondados
                      - hover:shadow-md: Sombra ao passar mouse
                      - transition-shadow: Animação suave da sombra
                    */}
                    
                    <div className="flex items-center space-x-3 mb-3">
                      {/* 
                        👤 ÁREA DE INFORMAÇÕES DO USUÁRIO
                        
                        📚 CONCEITO - Flex Layout:
                        - flex: Layout flexível
                        - items-center: Alinha itens verticalmente
                        - space-x-3: Espaçamento horizontal entre filhos
                        - mb-3: Margem bottom
                      */}
                      
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {/* 
                        🎨 AVATAR COM INICIAL
                        
                        📚 CONCEITO - Avatar Component:
                        - w-12 h-12: Tamanho fixo (48px)
                        - bg-green-500: Background verde
                        - rounded-full: Círculo perfeito
                        - flex items-center justify-center: Centraliza conteúdo
                        - text-white font-semibold: Texto branco e negrito
                        
                        user.name.charAt(0).toUpperCase(): Primeira letra maiúscula
                      */}
                      
                      <div>
                        {/* 
                          📝 INFORMAÇÕES TEXTUAIS
                        */}
                        
                        <h3 className="font-medium text-gray-900">
                          {user.name}
                        </h3>
                        {/* 
                          📛 NOME DO USUÁRIO
                          
                          - font-medium: Peso da fonte médio
                          - text-gray-900: Cor escura para destaque
                        */}
                        
                        <p className="text-sm text-gray-500">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </p>
                        {/* 
                          🟢 STATUS ONLINE/OFFLINE
                          
                          📚 CONCEITO - Conditional Text:
                          - text-sm: Tamanho pequeno
                          - text-gray-500: Cor cinza para informação secundária
                          - Operador ternário para mostrar status dinâmico
                        */}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartChat(user)}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      {/* 
                        🔘 BOTÃO DE AÇÃO
                        
                        📚 CONCEITO - Action Button:
                        - onClick: Event handler que chama função
                        - w-full: Largura total do container
                        - bg-green-500: Background verde
                        - text-white: Texto branco
                        - py-2 px-4: Padding vertical e horizontal
                        - rounded-lg: Cantos arredondados
                        - hover:bg-green-600: Verde mais escuro no hover
                        - transition-colors: Animação suave da cor
                        - flex items-center justify-center: Layout flexível centralizado
                        - space-x-2: Espaçamento entre ícone e texto
                      */}
                      
                      <MessageCircle className="w-4 h-4" />
                      {/* 
                        💬 ÍCONE DE CHAT
                        
                        w-4 h-4: Tamanho pequeno (16px) para ícone
                      */}
                      
                      <span>Iniciar Conversa</span>
                      {/* 
                        📝 TEXTO DO BOTÃO
                        
                        Texto descritivo da ação
                      */}
                    </button>
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

export default UsersPage;

/**
 * 📚 RESUMO EDUCACIONAL - USERS PAGE
 * 
 * 🎯 O QUE APRENDEMOS NESTE ARQUIVO:
 * 
 * 1. 🏗️ ARQUITETURA DE PÁGINA REACT:
 *    - Functional component com hooks
 *    - Estado local com useState
 *    - Efeitos colaterais com useEffect
 *    - Context consumption para dados globais
 * 
 * 2. 📊 GERENCIAMENTO DE ESTADO:
 *    - Estado de loading para UX
 *    - Lista de dados dinâmica
 *    - Filtragem de dados baseada em lógica
 *    - Atualização reativa de interface
 * 
 * 3. 🌐 COMUNICAÇÃO COM BACKEND:
 *    - Chamadas API assíncronas
 *    - Tratamento de erros
 *    - Loading states
 *    - Transformação de dados
 * 
 * 4. 🎨 DESIGN E UI/UX:
 *    - Layout responsivo com Tailwind CSS
 *    - Grid adaptativo para diferentes telas
 *    - Estados visuais (loading, empty, populated)
 *    - Hover effects e transições
 *    - Hierarquia visual clara
 * 
 * 5. 🧭 NAVEGAÇÃO E INTERAÇÃO:
 *    - Navegação programática com useNavigate
 *    - Event handlers para ações do usuário
 *    - Rotas dinâmicas com parâmetros
 * 
 * 6. ♿ ACESSIBILIDADE E USABILIDADE:
 *    - Estrutura semântica (h2, p, button)
 *    - Feedback visual para ações
 *    - Estados vazios informativos
 *    - Botões com área de clique adequada
 * 
 * 7. 🔧 PADRÕES DE DESENVOLVIMENTO:
 *    - Component composition (Card components)
 *    - Conditional rendering
 *    - List rendering com keys
 *    - Event delegation
 *    - Separation of concerns
 * 
 * 8. 📱 RESPONSIVIDADE:
 *    - Grid que adapta de 1 para 3 colunas
 *    - Breakpoints para mobile/tablet/desktop
 *    - Layout que funciona em qualquer tamanho
 * 
 * 🚀 CONCEITOS AVANÇADOS DEMONSTRADOS:
 * - Estado derivado (filtrar usuário atual)
 * - Dependências de efeitos otimizadas
 * - Conditional chaining (user?.id)
 * - Template literals para rotas dinâmicas
 * - Avatar generation with initials
 * 
 * 💡 MELHORIAS SUGERIDAS:
 * - Adicionar pesquisa/filtro de usuários
 * - Implementar paginação para muitos usuários
 * - Cache de dados para melhor performance
 * - Skeleton loading ao invés de spinner
 * - Status mais detalhado (última vez online)
 * - Integração com sistema de presença real-time
 */
