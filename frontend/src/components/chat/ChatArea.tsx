/**
 * 💬 COMPONENTE ÁREA DE CHAT
 * 
 * Componente que exibe as mensagens e permite envio
 * de novas mensagens em uma conversa.
 */

import { useState, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { Avatar, Button, Input } from '../ui';
import { cn } from '../../utils/cn';
import type { Message, User } from '../../types';

export interface ChatAreaProps {
  selectedChat: { id: string; name: string; type: 'private' | 'group' } | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (message: string, file?: File) => Promise<void>;
  onFileUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  isConnected?: boolean;
}

export function ChatArea({
  selectedChat,
  messages,
  currentUser,
  onSendMessage,
  onFileUpload,
  isLoading = false,
  isConnected = false
}: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || !selectedChat) return;

    try {
      setIsSending(true);
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageTime = (date: Date | string) => {
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    return messageDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Se não há chat selecionado
  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecione uma conversa
          </h3>
          <p className="text-gray-500 max-w-sm">
            Escolha um usuário ou grupo na lista lateral para começar a conversar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header do chat */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              name={selectedChat.name}
              size="md"
              showStatus={selectedChat.type === 'private'}
            />
            <div>
              <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={cn(
                  'flex',
                  i % 2 === 0 ? 'justify-end' : 'justify-start'
                )}>
                  <div className={cn(
                    'rounded-lg px-4 py-2 max-w-xs',
                    i % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200'
                  )}>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mensagem ainda
              </h3>
              <p className="text-gray-500">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderId === currentUser?.id;
              const showAvatar = !isOwnMessage && (
                index === 0 || 
                messages[index - 1]?.senderId !== msg.senderId
              );

              return (
                <div
                  key={msg.id || index}
                  className={cn(
                    'flex items-end space-x-2',
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwnMessage && (
                    <div className="w-8">
                      {showAvatar && (
                        <Avatar
                          name={msg.senderName || 'Usuário'}
                          size="sm"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className={cn(
                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words',
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  )}>
                    {!isOwnMessage && selectedChat.type === 'group' && showAvatar && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {msg.senderName || 'Usuário'}
                      </p>
                    )}
                    
                    <p className="text-sm">{msg.content}</p>
                    
                    <p className={cn(
                      'text-xs mt-1',
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    )}>
                      {formatMessageTime(msg.timestamp || new Date())}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Área de input */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
