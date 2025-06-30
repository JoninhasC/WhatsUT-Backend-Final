/**
 * 💬 CHAT PAGE COM WEBSOCKET REAL - TEMPO REAL VERDADEIRO
 * 
 * Esta página implementa chat em tempo real usando WebSocket com o backend.
 * Diferente das outras páginas que simulam, esta conecta realmente ao socket.io.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Send, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Users,
  MessageCircle
} from 'lucide-react';
import { userService, groupService, chatService } from '../services/api';
import socketService from '../services/socket';
import type { User, Group } from '../types';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  name: string;
  type: 'user' | 'group';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface RealtimeMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  chatType: 'private' | 'group';
  targetId: string;
  tempId?: string;
}

function IntegratedChatPage() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  // Estados principais
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Conectar ao WebSocket quando componente monta
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Token de autenticação não encontrado');
      return;
    }

    // Conectar ao WebSocket
    socketService.connect(token);
    
    // Configurar listeners
    socketService.onNewMessage((message: RealtimeMessage) => {
      console.log('📨 Nova mensagem recebida:', message);
      
      setMessages(prev => {
        // Evitar duplicatas
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      
      // Atualizar última mensagem no chat
      setChats(prev => prev.map(chat => {
        if ((message.chatType === 'private' && chat.id === message.senderId) ||
            (message.chatType === 'group' && chat.id === message.targetId)) {
          return {
            ...chat,
            lastMessage: message.content,
            lastMessageTime: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
        }
        return chat;
      }));

      // Auto-scroll se for a conversa ativa
      if ((message.chatType === 'private' && selectedChat?.id === message.senderId) ||
          (message.chatType === 'group' && selectedChat?.id === message.targetId)) {
        setTimeout(scrollToBottom, 100);
      }
    });

    socketService.onMessageDelivered((data) => {
      console.log('✅ Mensagem entregue:', data);
      toast.success('Mensagem enviada!');
    });

    socketService.onUserStatusUpdate((data) => {
      console.log('👤 Status do usuário atualizado:', data);
      setChats(prev => prev.map(chat => {
        if (chat.type === 'user' && chat.id === data.userId) {
          return { ...chat, isOnline: data.status === 'online' };
        }
        return chat;
      }));
    });

    socketService.onRoomJoined((data) => {
      console.log('🏠 Entrou na sala:', data);
      toast.success(`Conectado ao grupo ${data.groupId}`);
    });

    // Atualizar status de conexão
    setIsConnected(socketService.getConnectionStatus());

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [user, selectedChat, scrollToBottom]);

  // Carregar usuários e grupos
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        setIsLoading(true);
        
        // Carregar usuários
        const users: User[] = await userService.getUsers();
        const userChats: Chat[] = users
          .filter((u: User) => u.id !== user.id)
          .map((u: User) => ({
            id: u.id,
            name: u.name,
            type: 'user' as const,
            isOnline: false
          }));

        // Carregar grupos
        const groups: Group[] = await groupService.getGroups();
        const groupChats: Chat[] = groups.map((g: Group) => ({
          id: g.id,
          name: g.name,
          type: 'group' as const
        }));

        setChats([...userChats, ...groupChats]);
        
        // Se há chatId na URL, selecionar automaticamente
        if (chatId) {
          const targetChat = [...userChats, ...groupChats].find(c => c.id === chatId);
          if (targetChat) {
            handleSelectChat(targetChat);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar chats:', error);
        toast.error('Erro ao carregar conversas');
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [user, chatId]);

  // Selecionar chat
  const handleSelectChat = useCallback(async (chat: Chat) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
    
    // Atualizar URL
    navigate(`/chat/${chat.id}`, { replace: true });

    try {
      // Carregar mensagens do backend
      let chatMessages: any[] = [];
      
      if (chat.type === 'user') {
        chatMessages = await chatService.getMessages(chat.id);
      } else {
        // Para grupos, implementar quando backend estiver pronto
        chatMessages = [];
      }

      // Converter para formato correto
      const formattedMessages: RealtimeMessage[] = chatMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName: msg.senderName || 'Usuário',
        timestamp: new Date(msg.timestamp),
        chatType: chat.type === 'user' ? 'private' : 'group',
        targetId: chat.id
      }));

      setMessages(formattedMessages);

      // Se for grupo, entrar na sala
      if (chat.type === 'group') {
        socketService.joinRoom(chat.id);
      }

      // Auto-scroll para última mensagem
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  }, [navigate, scrollToBottom]);

  // Enviar mensagem
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !selectedChat || !user) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: RealtimeMessage = {
      id: tempId,
      content: inputValue.trim(),
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      chatType: selectedChat.type === 'user' ? 'private' : 'group',
      targetId: selectedChat.id,
      tempId
    };

    // Adicionar mensagem localmente primeiro (UX responsivo)
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    // Auto-scroll
    setTimeout(scrollToBottom, 100);

    try {
      // Enviar via WebSocket
      socketService.sendMessage({
        content: newMessage.content,
        chatType: newMessage.chatType,
        targetId: newMessage.targetId,
        tempId
      });

      // Atualizar última mensagem no chat
      setChats(prev => prev.map(chat => {
        if (chat.id === selectedChat.id) {
          return {
            ...chat,
            lastMessage: newMessage.content,
            lastMessageTime: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
        }
        return chat;
      }));

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  }, [inputValue, selectedChat, user, scrollToBottom]);

  // Enter para enviar
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Filtrar chats por busca
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Você precisa estar logado para acessar o chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Lista de Conversas */}
      <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${
        showMobileChat ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header da Lista */}
        <div className="p-4 border-b border-gray-200 bg-green-600 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">WhatsUT</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-200" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-200" />
              )}
              <span className="text-sm">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando conversas...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {chat.type === 'group' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        chat.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {chat.type === 'user' && chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">{chat.lastMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className={`flex-1 flex flex-col ${
        showMobileChat ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center space-x-3">
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedChat.type === 'group' ? (
                  <Users className="w-5 h-5" />
                ) : (
                  selectedChat.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedChat.type === 'group' ? 'Grupo' : selectedChat.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie uma mensagem para começar a conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user.id
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      {selectedChat.type === 'group' && message.senderId !== user.id && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p className="break-words">{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.senderId === user.id ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !isConnected}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">WhatsUT Chat</h2>
              <p className="text-gray-500">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntegratedChatPage;
