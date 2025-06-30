/**
 * 💬 PÁGINA DE CHAT FUNCIONAL E RESPONSIVA
 * 
 * Interface limpa e funcional com:
 * - Chat individual por usuário
 * - Interface responsiva
 * - Persistência de mensagens
 * - Funcionalidades essenciais
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Send, 
  ArrowLeft,
  Check,
  CheckCheck,
  MessageCircle
} from 'lucide-react';
import { userService, groupService } from '../services/api';
import type { User, Group } from '../types';

interface ExtendedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  chatId: string;
  type: 'text';
  status: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  name: string;
  type: 'user' | 'group';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

function ImprovedChatPage() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chave única para armazenar mensagens por usuário
  const getUserStorageKey = (chatId: string) => `messages_${user?.id}_${chatId}`;
  const getUserChatsKey = () => `chats_${user?.id}`;

  // Carregar usuários e grupos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, groupsData] = await Promise.all([
          userService.getUsers(),
          groupService.getGroups()
        ]);
        
        setUsers(usersData.filter(u => u.id !== user?.id)); // Excluir usuário atual
        setGroups(groupsData);
        
        // Criar lista de chats baseada em usuários e grupos
        const userChats: Chat[] = usersData
          .filter(u => u.id !== user?.id)
          .map(u => ({
            id: u.id,
            name: u.name,
            type: 'user' as const,
            isOnline: u.isOnline || false
          }));

        const groupChats: Chat[] = groupsData.map(g => ({
          id: g.id,
          name: g.name,
          type: 'group' as const
        }));

        const allChats = [...userChats, ...groupChats];
        setChats(allChats);
        
        // Salvar chats do usuário
        localStorage.setItem(getUserChatsKey(), JSON.stringify(allChats));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Abrir chat específico via URL
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        setShowMobileChat(true);
      }
    }
  }, [chatId, chats]);

  // Carregar mensagens do chat selecionado
  useEffect(() => {
    if (selectedChat && user) {
      const storageKey = getUserStorageKey(selectedChat.id);
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    }
  }, [selectedChat, user]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filtrar chats por pesquisa
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Salvar mensagens no localStorage
  const saveMessages = (chatId: string, msgs: ExtendedMessage[]) => {
    const storageKey = getUserStorageKey(chatId);
    localStorage.setItem(storageKey, JSON.stringify(msgs));
  };

  // Enviar mensagem
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const message: ExtendedMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      chatId: selectedChat.id,
      type: 'text',
      status: 'sent'
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(selectedChat.id, updatedMessages);
    setNewMessage('');

    // Simular resposta após 2 segundos (apenas para usuários, não grupos)
    if (selectedChat.type === 'user') {
      setTimeout(() => {
        const response: ExtendedMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Mensagem recebida! Como você está?',
          senderId: selectedChat.id,
          senderName: selectedChat.name,
          timestamp: new Date(),
          chatId: selectedChat.id,
          type: 'text',
          status: 'delivered'
        };
        
        const newMessages = [...updatedMessages, response];
        setMessages(newMessages);
        saveMessages(selectedChat.id, newMessages);
      }, 2000);
    }
  };

  // Selecionar chat
  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
    navigate(`/chat/${chat.id}`);
  };

  // Voltar para lista de chats (mobile)
  const handleBackToChats = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
    navigate('/chat');
  };

  // Componente da lista de chats
  const ChatList = () => (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-green-600 text-white">
        <h2 className="text-xl font-semibold mb-3">WhatsUT</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat?.id === chat.id ? 'bg-green-50 border-r-4 border-r-green-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  {chat.type === 'user' && chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                  <p className="text-sm text-gray-600">
                    {chat.type === 'user' ? 'Conversa privada' : 'Grupo'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Componente da área de mensagens
  const MessageArea = () => {
    if (!selectedChat) {
      return (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
            <p className="text-gray-600">Escolha uma conversa para começar a enviar mensagens</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white h-full">
        {/* Header da conversa */}
        <div className="p-4 bg-green-600 text-white flex items-center space-x-3">
          <button 
            className="lg:hidden p-2 hover:bg-green-700 rounded-full"
            onClick={handleBackToChats}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {selectedChat.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div>
            <h3 className="font-medium">{selectedChat.name}</h3>
            <p className="text-sm text-green-100">
              {selectedChat.type === 'user' 
                ? (selectedChat.isOnline ? 'Online' : 'Offline')
                : 'Grupo'
              }
            </p>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-400">Envie uma mensagem para começar a conversa</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative ${
                    message.senderId === user?.id
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.senderId === user?.id ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.senderId === user?.id && (
                      <div className="ml-1">
                        {message.status === 'read' ? (
                          <CheckCheck className="w-4 h-4 text-blue-200" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite uma mensagem..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Mobile: mostrar apenas uma seção por vez */}
      <div className="lg:hidden w-full h-full">
        {!showMobileChat ? <ChatList /> : <MessageArea />}
      </div>
      
      {/* Desktop: mostrar ambas as seções */}
      <div className="hidden lg:flex w-full h-full">
        <ChatList />
        <MessageArea />
      </div>
    </div>
  );
}

export default ImprovedChatPage;
