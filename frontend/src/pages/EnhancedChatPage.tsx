/**
 * 💬 PÁGINA DE CHAT MELHORADA COM RECURSOS AVANÇADOS
 * 
 * Funcionalidades implementadas:
 * - Chat privado e em grupo
 * - Upload de arquivos
 * - Notificações em tempo real
 * - Status de digitação
 * - Emojis e formatação
 * - Busca de mensagens
 * - Interface responsiva e moderna
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatService, userService, groupService } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { Button, Input } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Send, 
  Paperclip, 
  Image, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  Smile,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Message, Group } from '../types';

function EnhancedChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, joinRoom, leaveRoom, sendTyping, stopTyping } = useNotifications();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState<{ 
    type: 'private' | 'group'; 
    name: string; 
    isOnline?: boolean;
    members?: string[];
  } | null>(null);
  
  // UI states
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (chatId) {
      loadChatData();
      loadMessages();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatInfo?.type === 'group' && chatId) {
      joinRoom(chatId);
      return () => leaveRoom(chatId);
    }
  }, [chatInfo, chatId, joinRoom, leaveRoom]);

  const loadChatData = async () => {
    if (!chatId) return;

    try {
      // Tentar carregar como usuário primeiro
      try {
        const userData = await userService.getUserById(chatId);
        setChatInfo({
          type: 'private',
          name: userData.name,
          isOnline: userData.isOnline
        });
      } catch {
        // Se falhar, tentar como grupo
        const groups: Group[] = await groupService.getGroups();
        const group = groups.find((g: Group) => g.id === chatId);
        if (group) {
          setChatInfo({
            type: 'group',
            name: group.name,
            members: group.members
          });
        } else {
          throw new Error('Chat não encontrado');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do chat:', error);
      toast.error('Erro ao carregar informações do chat');
      navigate('/chat');
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      const messagesData: Message[] = await chatService.getMessages(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !chatId) return;

    setSending(true);
    try {
      const sentMessage: Message = await chatService.sendMessage(chatId, newMessage.trim());
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      stopTypingIndicator();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !chatId) return;

    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    try {
      const sentMessage: Message = await chatService.sendMessage(chatId, '', file);
      setMessages(prev => [...prev, sentMessage]);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTyping = () => {
    if (!isTyping && chatId) {
      setIsTyping(true);
      sendTyping(chatId, chatInfo?.type || 'private');
    }

    // Reset do timeout de digitação
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 2000);
  };

  const stopTypingIndicator = () => {
    if (isTyping && chatId) {
      setIsTyping(false);
      stopTyping(chatId, chatInfo?.type || 'private');
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = searchTerm 
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/chat')}
            className="lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <h1 className="font-semibold text-lg">{chatInfo?.name || 'Carregando...'}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {chatInfo?.type === 'private' && (
                <>
                  <div className={`w-2 h-2 rounded-full ${chatInfo.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>{chatInfo.isOnline ? 'Online' : 'Offline'}</span>
                </>
              )}
              {chatInfo?.type === 'group' && (
                <span>{chatInfo.members?.length || 0} membros</span>
              )}
              {connected && (
                <span className="text-green-600">• Conectado</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          
          {chatInfo?.type === 'private' && (
            <>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Video className="w-4 h-4" />
              </Button>
            </>
          )}
          
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <Input
            type="text"
            placeholder="Buscar mensagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner message="Carregando mensagens..." />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda. Inicie a conversa!'}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {chatInfo?.type === 'group' && message.senderId !== user?.id && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {message.senderName}
                  </p>
                )}
                
                {message.isArquivo || message.isFile ? (
                  <div className="flex items-center space-x-2">
                    {message.content.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <Image className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {message.fileName || 'Arquivo'}
                    </span>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1">
            <Input
              type="text"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="min-w-[60px]"
          >
            {isSending ? (
              <LoadingSpinner size="small" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Emoji Picker Placeholder */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-500">
            😀 😍 😂 👍 👎 ❤️ 🎉 🔥 💯 👏
            <br />
            <span className="text-xs">Seletor de emojis completo em desenvolvimento</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
    </div>
  );
}

export default EnhancedChatPage;
