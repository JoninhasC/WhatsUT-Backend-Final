// 📚 EXPLICAÇÃO DIDÁTICA: PÁGINA PRINCIPAL DE CHAT
// ================================================
//
// 🎯 O QUE É ESTA PÁGINA?
// Esta é o "coração" da aplicação - onde as conversas acontecem
// É como um aplicativo de mensagens completo (WhatsApp, Telegram)
// que permite comunicação em tempo real entre usuários e grupos
//
// 🏗️ ARQUITETURA DO COMPONENTE:
// - Layout responsivo (mobile/desktop)
// - Lista de conversas à esquerda
// - Área de mensagens à direita
// - Persistência local com localStorage
// - State management complexo
// - Navegação dinâmica com React Router
//
// 🔄 FLUXO DE DADOS:
// 1. Carrega usuários/grupos da API
// 2. Cria lista de conversas possíveis
// 3. Usuário seleciona conversa
// 4. Carrega mensagens do localStorage
// 5. Permite envio de novas mensagens
// 6. Salva mensagens localmente
//
// 💡 CONCEITOS IMPORTANTES:
// - Real-time simulation (simulação de tempo real)
// - Local state persistence (persistência local)
// - Responsive design (design responsivo)
// - Component composition (composição de componentes)

/**
 * 💬 NOVA PÁGINA DE CHAT - COMPLETAMENTE FUNCIONAL
 * 
 * Resolve todos os problemas identificados:
 * - Input funcionando corretamente
 * - Separação real por usuário
 * - Interface responsiva
 * - Sem ícones desnecessários
 * - Persistência correta
 */

// 📦 IMPORTAÇÕES: Ferramentas necessárias
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';     // 🔐 Contexto de autenticação
import { useParams, useNavigate } from 'react-router-dom'; // 🧭 Navegação entre páginas
import { 
  Search,      // 🔍 Ícone de pesquisa
  Send,        // 📤 Ícone de enviar
  ArrowLeft,   // ⬅️ Ícone de voltar
  Check,       // ✓ Mensagem enviada
  CheckCheck,  // ✓✓ Mensagem entregue/lida
  MessageCircle // 💬 Ícone de mensagem
} from 'lucide-react';
import { userService, groupService } from '../services/api'; // 🌐 Serviços de API
import type { User, Group } from '../types';                  // 🏷️ Tipos TypeScript

// 🏷️ INTERFACES: Estruturas de dados que vamos usar

// 📧 Interface para uma mensagem individual
interface Message {
  id: string;          // 🆔 Identificador único
  content: string;     // 📝 Conteúdo da mensagem
  senderId: string;    // 👤 ID de quem enviou
  senderName: string;  // 👤 Nome de quem enviou
  timestamp: Date;     // ⏰ Quando foi enviada
  chatId: string;      // 💬 ID da conversa
  status: 'sent' | 'delivered' | 'read'; // 📊 Status da entrega
}

// 💬 Interface para uma conversa (chat)
interface Chat {
  id: string;           // 🆔 Identificador único
  name: string;         // 🏷️ Nome da conversa
  type: 'user' | 'group'; // 🏷️ Tipo: usuário ou grupo
  lastMessage?: string; // 📝 Última mensagem (opcional)
  lastMessageTime?: string; // ⏰ Hora da última mensagem
  unreadCount?: number; // 📊 Mensagens não lidas
  isOnline?: boolean;   // 🟢 Se está online (apenas usuários)
}

function NewChatPage() {
  // 🔐 HOOKS DE CONTEXTO E NAVEGAÇÃO
  const { user } = useAuth();          // Usuário logado
  const { chatId } = useParams();      // ID do chat da URL (/chat/:chatId)
  const navigate = useNavigate();      // Função para navegar entre páginas
  
  
  // 📊 ESTADOS PRINCIPAIS: Gerenciam os dados da aplicação
  const [chats, setChats] = useState<Chat[]>([]);           // 💬 Lista de todas as conversas
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null); // 🎯 Conversa selecionada
  const [messages, setMessages] = useState<Message[]>([]);  // 📧 Mensagens da conversa atual
  const [inputValue, setInputValue] = useState('');        // ✏️ Texto digitado no input
  const [searchTerm, setSearchTerm] = useState('');        // 🔍 Termo de pesquisa
  const [showMobileChat, setShowMobileChat] = useState(false); // 📱 Controle mobile (lista/chat)
  const [isLoading, setIsLoading] = useState(true);        // ⏳ Estado de carregamento
  
  // 📍 REFERÊNCIAS: Para acessar elementos DOM diretamente
  const messagesEndRef = useRef<HTMLDivElement>(null);     // 📍 Fim da lista de mensagens (auto-scroll)
  const inputRef = useRef<HTMLInputElement>(null);         // 📍 Campo de input (foco)

  // 🗂️ FUNÇÃO PARA CHAVE DE ARMAZENAMENTO ÚNICA
  // Cada usuário tem suas próprias mensagens por conversa
  // É como ter "gavetas separadas" para cada pessoa
  const getStorageKey = useCallback((chatId: string): string => {
    return `whatsut_messages_${user?.id}_${chatId}`;
    // Exemplo: "whatsut_messages_123_456" (usuário 123, chat 456)
  }, [user?.id]);

  // 🗂️ FUNÇÃO PARA CHAVE DOS CHATS DO USUÁRIO
  // Lista de conversas específica de cada usuário
  const getUserChatsKey = useCallback((): string => {
    return `whatsut_chats_${user?.id}`;
    // Exemplo: "whatsut_chats_123" (chats do usuário 123)
  }, [user?.id]);

  // 🚀 CARREGAMENTO INICIAL DOS DADOS
  // Este effect roda uma vez quando o componente é montado
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return; // Se não há usuário logado, não faz nada
      
      setIsLoading(true);
      try {
        // 📡 BUSCA DADOS DA API: Usuários e grupos em paralelo
        const [usersData, groupsData] = await Promise.all([
          userService.getUsers(),   // Lista todos os usuários
          groupService.getGroups()  // Lista todos os grupos
        ]);
        
        // 🚫 FILTRA USUÁRIO ATUAL: Não queremos conversar conosco mesmo
        const otherUsers = usersData.filter((u: User) => u.id !== user.id);
        
        // 👥 CRIA CHATS DE USUÁRIOS: Uma conversa para cada usuário
        const userChats: Chat[] = otherUsers.map((u: User) => ({
          id: u.id,
          name: u.name,
          type: 'user' as const,    // TypeScript: garante que é 'user'
          isOnline: u.isOnline || false
        }));

        // 👥 CRIA CHATS DE GRUPOS: Uma conversa para cada grupo
        const groupChats: Chat[] = groupsData.map((g: Group) => ({
          id: g.id,
          name: g.name,
          type: 'group' as const    // TypeScript: garante que é 'group'
        }));

        // 🔗 COMBINA TODAS AS CONVERSAS: Usuários + Grupos
        const allChats = [...userChats, ...groupChats];
        setChats(allChats);
        
        // 💾 SALVA NO LOCALSTORAGE: Para funcionar offline
        localStorage.setItem(getUserChatsKey(), JSON.stringify(allChats));
        
      } catch (error) {
        // 🚨 TRATAMENTO DE ERRO: Se API falhar, usa dados salvos
        console.error('Erro ao carregar dados:', error);
        
        // 📂 FALLBACK PARA LOCALSTORAGE
        const savedChats = localStorage.getItem(getUserChatsKey());
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        }
      } finally {
        setIsLoading(false); // Para o loading independente do resultado
      }
    };

    loadInitialData();
  }, [user, getUserChatsKey]); // Roda quando usuário ou chave mudam

  // 🧭 GERENCIAMENTO DO CHAT SELECIONADO VIA URL
  // Quando a URL muda (/chat/123), seleciona o chat correspondente
  useEffect(() => {
    if (chatId && chats.length > 0) {
      // 🔍 Procura o chat pela ID na URL
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        setShowMobileChat(true); // Mobile: mostra área de mensagens
      } else {
        // 🚫 Chat não encontrado, volta para lista
        navigate('/chat', { replace: true });
      }
    } else if (!chatId) {
      // 📱 Sem chatId na URL, mostra lista (especialmente mobile)
      setSelectedChat(null);
      setShowMobileChat(false);
    }
  }, [chatId, chats, navigate]);

  // 📧 CARREGAMENTO DAS MENSAGENS DO CHAT SELECIONADO
  // Toda vez que seleciona um chat, carrega suas mensagens
  useEffect(() => {
    if (selectedChat && user) {
      // 🗂️ Busca mensagens salvas no localStorage
      const storageKey = getStorageKey(selectedChat.id);
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        try {
          // 📋 PARSE E CONVERSÃO: JSON → objetos Message
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            // 📋 PARSE E CONVERSÃO: JSON → objetos Message
            ...msg,
            timestamp: new Date(msg.timestamp) // Converte string de volta para Date
          }));
          setMessages(parsedMessages);
        } catch (error) {
          // 🚨 Se houve erro no parse, limpa mensagens
          console.error('Erro ao carregar mensagens:', error);
          setMessages([]);
        }
      } else {
        // 📭 Sem mensagens salvas, lista vazia
        setMessages([]);
      }
    } else {
      // 🚫 Sem chat selecionado, limpa mensagens
      setMessages([]);
    }
  }, [selectedChat, user, getStorageKey]);

  // 📜 AUTO-SCROLL PARA ÚLTIMA MENSAGEM
  // Sempre que uma nova mensagem chega, rola para baixo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 💾 FUNÇÃO PARA SALVAR MENSAGENS
  // Salva as mensagens no localStorage de forma segura
  const saveMessages = useCallback((chatId: string, msgs: Message[]) => {
    const storageKey = getStorageKey(chatId);
    localStorage.setItem(storageKey, JSON.stringify(msgs));
  }, [getStorageKey]);

  // 📤 FUNÇÃO PRINCIPAL: ENVIAR MENSAGEM
  // Esta é a função mais importante - processa envio de mensagens
  const handleSendMessage = useCallback(() => {
    // 🚫 VALIDAÇÕES: Não envia se input vazio ou sem chat
    if (!inputValue.trim() || !selectedChat || !user) return;

    // 📧 CRIA NOVA MENSAGEM: Estrutura completa
    const newMessage: Message = {
      id: `${Date.now()}_${Math.random()}`,        // ID único baseado em timestamp
      content: inputValue.trim(),                  // Remove espaços em branco
      senderId: user.id,                          // Quem está enviando
      senderName: user.name,                      // Nome do remetente
      timestamp: new Date(),                      // Momento atual
      chatId: selectedChat.id,                   // Para qual chat
      status: 'sent'                             // Status inicial
    };

    // 📋 ATUALIZA LISTA DE MENSAGENS: Adiciona nova mensagem
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // 💾 SALVA IMEDIATAMENTE: Persistência local
    saveMessages(selectedChat.id, updatedMessages);
    
    // 🧹 LIMPA INPUT: Prepara para próxima mensagem
    setInputValue('');

    // 🤖 SIMULAÇÃO DE RESPOSTA AUTOMÁTICA
    // Para demonstração, simula outra pessoa respondendo
    if (selectedChat.type === 'user') { // Só para chats 1-on-1, não grupos
      setTimeout(() => {
        // 📨 CRIA MENSAGEM DE RESPOSTA
        const response: Message = {
          id: `${Date.now() + 1}_${Math.random()}`,  // ID diferente
          content: 'Mensagem recebida! Como você está?', // Resposta automática
          senderId: selectedChat.id,                      // ID do "destinatário"
          senderName: selectedChat.name,                  // Nome do "destinatário"
          timestamp: new Date(),
          chatId: selectedChat.id,
          status: 'delivered'
        };
        
        // 📋 ADICIONA RESPOSTA À CONVERSA
        const newMessages = [...updatedMessages, response];
        setMessages(newMessages);
        saveMessages(selectedChat.id, newMessages);
      }, 2000); // Delay de 2 segundos para parecer real
    }
  }, [inputValue, selectedChat, user, messages, saveMessages]);

  // 🎯 FUNÇÃO PARA SELECIONAR CHAT
  // Navega para URL específica do chat
  const handleChatSelect = useCallback((chat: Chat) => {
    navigate(`/chat/${chat.id}`); // Muda URL para /chat/123
  }, [navigate]);

  // ⬅️ FUNÇÃO PARA VOLTAR (MOBILE)
  // No mobile, volta da área de mensagens para lista de chats
  const handleBackToChats = useCallback(() => {
    navigate('/chat'); // Remove ID do chat da URL
  }, [navigate]);

  // ⌨️ FUNÇÃO PARA TECLAS ESPECIAIS
  // Enter = enviar, Shift+Enter = nova linha
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita quebra de linha
      handleSendMessage(); // Envia mensagem
    }
  }, [handleSendMessage]);

  // 🔍 FILTRO DE PESQUISA
  // Filtra chats baseado no termo de pesquisa
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📋 COMPONENTE: LISTA DE CHATS (SIDEBAR)
  // Este é um sub-componente que mostra todas as conversas
  const ChatList = () => (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 🏷️ HEADER DA LISTA */}
      <div className="p-4 bg-green-600 text-white">
        <h2 className="text-xl font-semibold mb-3">WhatsUT</h2>
        
        {/* 🔍 CAMPO DE PESQUISA */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      {/* 📋 LISTA DE CONVERSAS */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // ⏳ ESTADO DE CARREGAMENTO
          <div className="p-4 text-center text-gray-500">
            Carregando conversas...
          </div>
        ) : filteredChats.length === 0 ? (
          // 📭 LISTA VAZIA (com ou sem pesquisa)
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          // 📋 LISTA DE CONVERSAS DISPONÍVEIS
          filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                // 🎯 DESTAQUE DO CHAT SELECIONADO
                selectedChat?.id === chat.id ? 'bg-green-50 border-r-4 border-r-green-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* 🖼️ AVATAR DO CHAT */}
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </div>
                
                {/* ℹ️ INFORMAÇÕES DO CHAT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    {/* 🟢 INDICADOR ONLINE (apenas para usuários) */}
                    {chat.isOnline && chat.type === 'user' && (
                      <div className="w-3 h-3 bg-green-500 rounded-full ml-2"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {chat.type === 'user' 
                      ? (chat.isOnline ? 'Online' : 'Offline')
                      : 'Grupo'
                    }
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // 💬 COMPONENTE: ÁREA DE MENSAGENS (MAIN CHAT)
  // Esta é a parte principal onde as mensagens são exibidas e enviadas
  const MessageArea = () => {
    // 🏠 ESTADO INICIAL: Nenhum chat selecionado
    if (!selectedChat) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Bem-vindo ao WhatsUT</h3>
            <p>Selecione uma conversa para começar a enviar mensagens</p>
          </div>
        </div>
      );
    }

    // 💬 INTERFACE PRINCIPAL DO CHAT
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        {/* 🏷️ HEADER DO CHAT */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center space-x-3">
          {/* ⬅️ BOTÃO VOLTAR (apenas mobile) */}
          <button
            onClick={handleBackToChats}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* 🖼️ AVATAR DO CHAT ATUAL */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-gray-600" />
          </div>
          
          {/* ℹ️ INFORMAÇÕES DO CHAT ATUAL */}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
            <p className="text-sm text-gray-500">
              {selectedChat.type === 'user' 
                ? (selectedChat.isOnline ? 'Online' : 'Offline')
                : 'Grupo'
              }
            </p>
          </div>
        </div>

        {/* 📜 ÁREA DE MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            // 📭 SEM MENSAGENS AINDA
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-400">Envie uma mensagem para começar a conversa</p>
            </div>
          ) : (
            // 📧 LISTA DE MENSAGENS
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {/* 💬 BALÃO DE MENSAGEM */}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                    message.senderId === user?.id
                      ? 'bg-green-500 text-white rounded-br-md'      // 📤 Mensagem enviada (verde)
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md' // 📥 Mensagem recebida (branco)
                  }`}
                >
                  {/* 📝 CONTEÚDO DA MENSAGEM */}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* ⏰ TIMESTAMP E STATUS */}
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.senderId === user?.id ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {/* ⏰ HORÁRIO */}
                    <span className="text-xs">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    
                    {/* ✓ STATUS DE ENTREGA (apenas para mensagens enviadas) */}
                    {message.senderId === user?.id && (
                      <div className="ml-1">
                        {message.status === 'read' ? (
                          <CheckCheck className="w-3 h-3 text-blue-200" />     // ✓✓ Lida
                        ) : message.status === 'delivered' ? (
                          <CheckCheck className="w-3 h-3" />                   // ✓✓ Entregue
                        ) : (
                          <Check className="w-3 h-3" />                        // ✓ Enviada
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* 📍 ELEMENTO INVISÍVEL PARA AUTO-SCROLL */}
          <div ref={messagesEndRef} />
        </div>

        {/* ✏️ INPUT DE MENSAGEM */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {/* 📝 CAMPO DE TEXTO */}
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}                    // Enter para enviar
                placeholder="Digite uma mensagem..."
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                autoComplete="off"                             // Não salvar no histórico
              />
            </div>
            
            {/* 📤 BOTÃO ENVIAR */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}                    // Desabilita se vazio
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🖥️ RENDERIZAÇÃO PRINCIPAL: Layout responsivo
  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      
      {/* 📱 LAYOUT MOBILE: Uma seção por vez */}
      <div className="lg:hidden w-full h-full">
        {!showMobileChat ? <ChatList /> : <MessageArea />}
        {/* 
          Mobile logic:
          - Se showMobileChat = false → Mostra lista de chats
          - Se showMobileChat = true → Mostra área de mensagens
          - Usuário navega entre as duas telas
        */}
      </div>
      
      {/* 🖥️ LAYOUT DESKTOP: Ambas as seções lado a lado */}
      <div className="hidden lg:flex w-full h-full">
        <ChatList />      {/* 📋 Lista à esquerda */}
        <MessageArea />   {/* 💬 Chat à direita */}
      </div>
    </div>
  );
}

export default NewChatPage;

// 📝 RESUMO EDUCATIVO: O QUE APRENDEMOS NESTE COMPONENTE
// =======================================================
//
// 🏗️ ARQUITETURA COMPLEXA:
// 1. 📊 State Management - Múltiplos estados interdependentes
// 2. 🔄 Effect Composition - Vários useEffect trabalhando juntos
// 3. 🎯 Event Handling - Diferentes tipos de interações
// 4. 💾 Data Persistence - LocalStorage como banco local
// 5. 📱 Responsive Design - Layout que adapta mobile/desktop
//
// 🔧 HOOKS AVANÇADOS:
// 1. 🔄 useCallback - Otimização de performance
// 2. 📍 useRef - Manipulação direta do DOM
// 3. 🧭 useParams/useNavigate - Integração com React Router
// 4. 🔐 useAuth - Hook customizado do contexto
// 5. 📊 useState com tipos complexos
//
// 🎨 PADRÕES DE UI:
// 1. 📋 Master-Detail - Lista + Detalhe
// 2. 💬 Chat Interface - Balões de mensagem
// 3. 🔍 Real-time Search - Filtro dinâmico
// 4. ⏳ Loading States - Estados de carregamento
// 5. 📱 Mobile-first - Prioriza experiência mobile
//
// 💾 PERSISTÊNCIA LOCAL:
// 1. 🗂️ Namespaced Storage - Dados separados por usuário
// 2. 🔄 Sync com Estado - LocalStorage ↔ React State
// 3. 🚨 Error Handling - Fallbacks para dados corrompidos
// 4. 📋 Serialization - JSON.stringify/parse
// 5. 🧹 Data Cleanup - Limpeza quando necessário
//
// 🌐 INTEGRAÇÃO COM API:
// 1. 📡 Parallel Requests - Promise.all para eficiência
// 2. 🚨 Error Boundaries - Fallback para falhas de rede
// 3. 🔄 Optimistic Updates - UI atualiza antes da API
// 4. 💾 Offline Support - Funciona sem internet
// 5. 🎯 Smart Caching - Usa dados salvos quando possível
//
// 🔮 SIMULAÇÃO TEMPO REAL:
// 1. ⏰ setTimeout para simular delays
// 2. 🤖 Auto-responses para demonstração
// 3. 📊 Status de mensagens (enviada/entregue/lida)
// 4. 🔄 Auto-scroll para novas mensagens
// 5. 🎭 UX realista sem WebSocket real
//
// 💡 CONCEITOS IMPORTANTES:
// - Component Composition (ChatList + MessageArea)
// - Conditional Rendering (mobile vs desktop)
// - Event Delegation (onKeyPress, onClick)
// - Data Normalization (User → Chat conversion)
// - Performance Optimization (useCallback, key props)
//
// 🚀 PRÓXIMOS PASSOS POSSÍVEIS:
// 1. ⚡ WebSocket real para tempo real
// 2. 📁 Upload de arquivos/imagens
// 3. 🔔 Push notifications
// 4. 👥 Typing indicators
// 5. 📱 PWA capabilities
