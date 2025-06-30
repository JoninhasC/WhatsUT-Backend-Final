/**
 * 💬 PÁGINA PRINCIPAL DE CHAT
 * 
 * Componente principal da aplicação que gerencia toda a interface
 * de chat, incluindo lista de usuários, grupos e área de mensagens.
 * 
 * Funcionalidades implementadas:
 * - Layout responsivo com sidebar e área de chat
 * - Lista de usuários online/offline (dados reais da API)
 * - Lista de grupos disponíveis (dados reais da API)
 * - Área de chat com histórico de mensagens (dados reais da API)
 * - Envio de mensagens via API
 * - Upload de arquivos
 * - Comunicação em tempo real via WebSocket
 * - Integração completa com backend NestJS
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Users, Settings, Plus, Search, Send, Paperclip, LogOut, Upload, Shield } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminPanel from '../components/AdminPanel';
import toast from 'react-hot-toast';
import { userService, groupService, chatService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { User, Group, Message } from '../types';

/**
 * Componente principal da página de chat
 */
function ChatPage() {
  console.log('🚀 ChatPage renderizando...');
  const { user, logout } = useAuth();
  console.log('👤 Usuário atual:', user);
  console.log('🔍 ChatPage: user existe?', !!user);
  console.log('🔍 ChatPage: detalhes do user:', JSON.stringify(user, null, 2));
  
  // Debug adicional para rastrear possível problema
  console.log('🔍 ChatPage: typeof user:', typeof user);
  console.log('🔍 ChatPage: user null/undefined?', user === null || user === undefined);
  
  // Estados locais
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string; type: 'private' | 'group' } | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Estados para dados
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook do WebSocket
  const { socket, isConnected } = useSocket();

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Configura WebSocket para receber mensagens em tempo real
   */
  useEffect(() => {
    if (socket && isConnected) {
      // Escutar novas mensagens
      socket.on('newMessage', (newMessage: Message) => {
        // Adicionar mensagem se for para o chat ativo
        if (selectedChat) {
          const isRelevantMessage = 
            (selectedChat.type === 'private' && 
             ((newMessage.senderId === selectedChat.id && newMessage.receiverId === user?.id) ||
              (newMessage.senderId === user?.id && newMessage.receiverId === selectedChat.id))) ||
            (selectedChat.type === 'group' && newMessage.groupId === selectedChat.id);

          if (isRelevantMessage) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        }
      });

      // Escutar atualizações de usuários online
      socket.on('userStatusChanged', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isOnline } : u
        ));
      });

      return () => {
        socket.off('newMessage');
        socket.off('userStatusChanged');
      };
    }
  }, [socket, isConnected, selectedChat, user?.id]);

  /**
   * Scroll automático para última mensagem
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Carrega todos os dados iniciais
   */
  const loadInitialData = async () => {
    console.log('📊 ChatPage: Iniciando carregamento de dados...');
    try {
      setIsLoadingData(true);
      console.log('📊 ChatPage: Estado de loading definido como true');
      
      // Carregar usuários e grupos em paralelo
      console.log('📊 ChatPage: Fazendo requisições para usuários e grupos...');
      const [usersData, groupsData] = await Promise.all([
        userService.getUsers(),
        groupService.getMyGroups()
      ]);

      console.log('📊 ChatPage: Dados recebidos - usuários:', usersData?.length, 'grupos:', groupsData?.length);
      console.log('📊 ChatPage: usersData type:', typeof usersData, Array.isArray(usersData));
      console.log('📊 ChatPage: groupsData type:', typeof groupsData, Array.isArray(groupsData));
      setUsers(usersData.filter((u: User) => u.id !== user?.id)); // Remover o próprio usuário
      setGroups(groupsData);
      console.log('📊 ChatPage: Estados atualizados com sucesso');
      
    } catch (error) {
      console.error('❌ ChatPage: Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setIsLoadingData(false);
      console.log('📊 ChatPage: Loading finalizado');
    }
  };

  /**
   * Scroll para o final das mensagens
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Manipula logout do usuário
   */
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  /**
   * Manipula seleção de chat
   */
  const handleSelectChat = async (id: string, name: string, type: 'private' | 'group') => {
    try {
      setSelectedChat({ id, name, type });
      setIsLoading(true);

      // Carregar mensagens do chat selecionado
      let chatMessages: Message[] = [];
      
      if (type === 'private') {
        chatMessages = await chatService.getPrivateMessages(id);
      } else {
        chatMessages = await chatService.getGroupMessages(id);
      }

      setMessages(chatMessages);
      
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens do chat');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manipula envio de mensagem
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat || isLoading) return;

    try {
      setIsLoading(true);
      
      let sentMessage: Message;
      
      if (selectedChat.type === 'private') {
        sentMessage = await chatService.sendPrivateMessage(selectedChat.id, message.trim());
      } else {
        sentMessage = await chatService.sendGroupMessage(selectedChat.id, message.trim());
      }

      // Adicionar mensagem à lista local
      setMessages(prev => [...prev, sentMessage]);
      setMessage('');
      
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manipula upload de arquivo
   */
  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;

    try {
      setIsLoading(true);
      
      let uploadedFile: any;
      
      if (selectedChat.type === 'private') {
        uploadedFile = await chatService.uploadPrivateFile(selectedChat.id, file);
      } else {
        uploadedFile = await chatService.uploadGroupFile(selectedChat.id, file);
      }

      // Adicionar mensagem de arquivo à lista
      const fileMessage: Message = {
        id: uploadedFile.data.id || Date.now().toString(),
        content: file.name,
        senderId: user?.id || '',
        senderName: user?.name || '',
        timestamp: new Date(),
        chatType: selectedChat.type,
        targetId: selectedChat.id,
        receiverId: selectedChat.type === 'private' ? selectedChat.id : undefined,
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        isArquivo: true,
        isFile: true,
        fileName: file.name
      };

      setMessages(prev => [...prev, fileMessage]);
      
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manipula clique no botão de anexo
   */
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  /**
   * Filtra usuários com base no termo de busca
   */
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Filtra grupos com base no termo de busca
   */
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingData) {
    console.log('⏳ ChatPage: Ainda carregando dados...');
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Carregando WhatsUT...</p>
        </div>
      </div>
    );
  }

  console.log('✅ ChatPage: Renderizando interface principal...');
  console.log('📊 ChatPage: Dados carregados - usuários:', users.length, 'grupos:', groups.length);
  console.log('🔍 ChatPage: isLoadingData atual:', isLoadingData);
  console.log('🔍 ChatPage: Renderizando interface principal - INÍCIO DO RETURN');

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        
        {/* Header da sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">WhatsUT</h1>
                <p className="text-sm text-gray-500">Olá, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Status de conexão WebSocket */}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={isConnected ? 'Conectado' : 'Desconectado'} />
              
              {/* Botão Admin (demo) */}
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                title="Painel Admin (Demo)"
              >
                <Shield className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'users'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Usuários ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'groups'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline-block mr-2" />
              Grupos ({filteredGroups.length})
            </button>
          </div>
        </div>

        {/* Lista de usuários/grupos */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'users' ? (
            <div>
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectChat(user.id, user.name, 'private')}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?.id === user.id && selectedChat?.type === 'private' 
                        ? 'bg-primary-50 border-r-2 border-primary-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {/* Botão para criar grupo */}
              <div className="p-4 border-b border-gray-100">
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Criar Grupo</span>
                </button>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Nenhum grupo encontrado' : 'Você não participa de nenhum grupo'}
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => handleSelectChat(group.id, group.name, 'group')}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?.id === group.id && selectedChat?.type === 'group' 
                        ? 'bg-primary-50 border-r-2 border-primary-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-whatsapp-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-whatsapp-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.members?.length || 0} membros
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        
        {selectedChat ? (
          <>
            {/* Header do chat */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedChat.type === 'group' ? (
                    <Users className="w-5 h-5 text-gray-600" />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedChat.type === 'group' ? 'Grupo' : 'Conversa privada'}
                  </p>
                </div>
                
                {/* Indicador de carregamento */}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <LoadingSpinner size="small" />
                    <span>Carregando...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {!isOwn && selectedChat.type === 'group' && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {msg.senderName || 'Usuário'}
                          </p>
                        )}
                        
                        {(msg.isFile || msg.isArquivo) ? (
                          <div className="flex items-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span className="break-words">{msg.fileName || msg.content}</span>
                          </div>
                        ) : (
                          <p className="break-words">{msg.content}</p>
                        )}
                        
                        <p className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'opacity-50'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                {/* Input oculto para upload de arquivos */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={handleAttachClick}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Anexar arquivo"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Estado vazio - nenhum chat selecionado */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Bem-vindo ao WhatsUT!
              </h3>
              <p className="text-gray-500 max-w-sm">
                Selecione um usuário ou grupo na barra lateral para começar uma conversa.
              </p>
              
              {/* Estatísticas */}
              <div className="flex justify-center space-x-8 mt-6 text-sm text-gray-500">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{users.length}</div>
                  <div>Usuários</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{groups.length}</div>
                  <div>Grupos</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Online' : 'Offline'}
                  </div>
                  <div>Status</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para criar grupo (placeholder) */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Grupo</h3>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Em breve você poderá criar grupos diretamente pela interface.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel Administrativo */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
}

export default ChatPage;
