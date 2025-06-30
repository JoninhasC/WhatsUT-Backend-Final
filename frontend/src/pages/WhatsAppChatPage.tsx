/**
 * 💬 PÁGINA DE CHAT ESTILO WHATSAPP
 * 
 * Interface moderna inspirada no WhatsApp com:
 * - Lista de conversas à esquerda
 * - Área de mensagens à direita
 * - Busca de conversas
 * - Interface responsiva
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  Smile,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { userService, groupService, chatService } from '../services/api';
import type { User, Group, Message } from '../types';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  name: string;
  type: 'user' | 'group';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isOnline?: boolean;
}

function WhatsAppChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simular dados de chat para demonstração
  useEffect(() => {
    const mockChats: Chat[] = [
      {
        id: '1',
        name: 'João Silva',
        type: 'user',
        lastMessage: 'Oi, como você está?',
        lastMessageTime: '10:30',
        unreadCount: 2,
        isOnline: true
      },
      {
        id: '2',
        name: 'Grupo Projeto Final',
        type: 'group',
        lastMessage: 'Precisamos revisar o código',
        lastMessageTime: '09:15',
        unreadCount: 5
      },
      {
        id: '3',
        name: 'Maria Santos',
        type: 'user',
        lastMessage: 'Obrigada pela ajuda!',
        lastMessageTime: 'Ontem',
        isOnline: false
      },
      {
        id: '4',
        name: 'Matemática Discreta',
        type: 'group',
        lastMessage: 'Lista de exercícios disponível',
        lastMessageTime: 'Ontem',
        unreadCount: 1
      }
    ];
    setChats(mockChats);
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user?.id || '',
      senderName: user?.name || '',
      timestamp: new Date(),
      chatId: selectedChat.id,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular resposta (apenas para demonstração)
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Mensagem recebida!',
        senderId: selectedChat.id,
        senderName: selectedChat.name,
        timestamp: new Date(),
        chatId: selectedChat.id,
        type: 'text'
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setIsMobileView(true);
    
    // Simular carregamento de mensagens
    const mockMessages: Message[] = [
      {
        id: '1',
        content: `Olá! Como posso ajudar você hoje?`,
        senderId: chat.id,
        senderName: chat.name,
        timestamp: new Date(Date.now() - 3600000),
        chatId: chat.id,
        type: 'text'
      },
      {
        id: '2',
        content: 'Oi! Tudo bem?',
        senderId: user?.id || '',
        senderName: user?.name || '',
        timestamp: new Date(Date.now() - 1800000),
        chatId: chat.id,
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  // Componente da lista de conversas
  const ChatList = () => (
    <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col">
      {/* Header da lista */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Conversas</h2>
          <button className="p-2 hover:bg-gray-200 rounded-full">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map(chat => (
          <div
            key={chat.id}
            onClick={() => handleChatSelect(chat)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedChat?.id === chat.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {chat.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {chat.type === 'user' && chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Componente da área de mensagens
  const MessageArea = () => {
    if (!selectedChat) {
      return (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
            <p className="text-gray-600">Escolha uma conversa para começar a enviar mensagens</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Header da conversa */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              className="lg:hidden p-2 hover:bg-gray-200 rounded-full"
              onClick={() => setIsMobileView(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {selectedChat.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
              {selectedChat.type === 'user' && (
                <p className="text-sm text-gray-500">
                  {selectedChat.isOnline ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite uma mensagem..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded-full">
                <Smile className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile: mostrar apenas uma seção por vez */}
      <div className="lg:hidden w-full">
        {!isMobileView ? <ChatList /> : <MessageArea />}
      </div>
      
      {/* Desktop: mostrar ambas as seções */}
      <div className="hidden lg:flex w-full">
        <ChatList />
        <MessageArea />
      </div>
    </div>
  );
}

export default WhatsAppChatPage;
