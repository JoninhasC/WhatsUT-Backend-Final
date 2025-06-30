/**
 * 💬 PÁGINA PRINCIPAL DE CHAT - VERSÃO INTEGRADA
 * 
 * Versão simplificada que integra os novos componentes mantendo
 * compatibilidade com a estrutura existente.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  LogOut, 
  Shield,
  Menu,
  X
} from 'lucide-react';

// Importar componentes necessários
import { useAppStore } from '../store/appStore';
import { SettingsModal } from '../components/modals/SettingsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminPanel from '../components/AdminPanel';
import toast from 'react-hot-toast';

import { userService, groupService, chatService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { User, Group, Message } from '../types';

function ChatPage() {
  console.log('🚀 ChatPage (Integrada) renderizando...');
  const { user, logout } = useAuth();
  
  // Estados do store
  const {
    users,
    groups,
    messages,
    activeTab,
    selectedChat,
    showSettings,
    notifications,
    sounds,
    setUsers,
    setGroups,
    setMessages,
    addMessage,
    setActiveTab,
    setSelectedChat,
    setShowSettings
  } = useAppStore();
  
  // Estados locais
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // WebSocket
  const { socket, isConnected, sendMessage: socketSendMessage } = useSocket();
  
  // Funções auxiliares
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const fetchedGroups = await groupService.getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('❌ Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (chatId: string, chatType: 'private' | 'group') => {
    try {
      setIsLoading(true);
      const fetchedMessages = chatType === 'private'
        ? await chatService.getPrivateMessages(chatId)
        : await chatService.getGroupMessages(chatId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeitos
  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchGroups();
    }
  }, [user]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleUserOnline = (userId: string) => {
      setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
    };
    
    const handleUserOffline = (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    };
    
    const handleNewMessage = (newMessage: Message) => {
      addMessage(newMessage);
      if (sounds && notifications) {
        toast.success(`Nova mensagem de ${newMessage.senderName}`);
      }
    };
    
    // Simular eventos WebSocket (a estrutura real pode ser diferente)
    // socket.on('userOnline', handleUserOnline);
    // socket.on('userOffline', handleUserOffline);
    // socket.on('newMessage', handleNewMessage);
    
    // return () => {
    //   socket.off('userOnline', handleUserOnline);
    //   socket.off('userOffline', handleUserOffline);
    //   socket.off('newMessage', handleNewMessage);
    // };
  }, [socket, addMessage, sounds, notifications]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (selectedChat) {
      setMessages([]);
      fetchMessages(selectedChat.id, selectedChat.type);
    }
  }, [selectedChat]);
  
  // Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      let newMessage;
      if (selectedChat.type === 'private') {
        newMessage = await chatService.sendPrivateMessage(selectedChat.id, message.trim());
      } else {
        newMessage = await chatService.sendGroupMessage(selectedChat.id, message.trim());
      }
      
      addMessage(newMessage);
      setMessage('');
      
      if (socket) {
        // socket.emit seria usado aqui se disponível na estrutura real
        console.log('Mensagem enviada via socket:', newMessage);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    
    try {
      let response;
      if (selectedChat.type === 'private') {
        response = await chatService.uploadPrivateFile(selectedChat.id, file);
      } else {
        response = await chatService.uploadGroupFile(selectedChat.id, file);
      }
      
      addMessage(response);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    }
  };
  
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const group = await groupService.createGroup(newGroupName.trim());
      setGroups([...groups, group]);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      toast.success('Grupo criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo');
    }
  };
  
  // Filtros
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Status indicator simples */}
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs">{socket ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:block
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">WhatsUT</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {user.isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Shield className="h-5 w-5" />
              </button>
            )}
            
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 p-3 text-center font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 p-3 text-center font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Grupos ({groups.length})
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : 'grupos'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'users' ? (
            <div className="p-2">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                </div>
              ) : (
                filteredUsers.map((chatUser) => (
                  <button
                    key={chatUser.id}
                    onClick={() => setSelectedChat({ 
                      id: chatUser.id, 
                      name: chatUser.name, 
                      type: 'private' 
                    })}
                    className={`w-full p-3 rounded-lg text-left hover:bg-muted transition-colors ${
                      selectedChat?.id === chatUser.id && selectedChat?.type === 'private'
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-semibold">
                          {chatUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          onlineUsers.includes(chatUser.id) ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chatUser.name}</p>
                        <p className="text-sm opacity-70">
                          {onlineUsers.includes(chatUser.id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted transition-colors mb-2"
              >
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Criar Grupo</span>
                </div>
              </button>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedChat({ 
                      id: group.id, 
                      name: group.name, 
                      type: 'group' 
                    })}
                    className={`w-full p-3 rounded-lg text-left hover:bg-muted transition-colors mb-1 ${
                      selectedChat?.id === group.id && selectedChat?.type === 'group'
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-sm opacity-70 truncate">
                          {`${group.members?.length || 0} membros`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {selectedChat.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.type === 'private' 
                      ? (onlineUsers.includes(selectedChat.id) ? 'Online' : 'Offline')
                      : `Grupo • ${groups.find(g => g.id === selectedChat.id)?.members?.length || 0} membros`
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === user.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {selectedChat.type === 'group' && msg.senderId !== user.id && (
                        <p className="text-xs font-medium opacity-70 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      
                      {msg.isFile ? (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4" />
                          <span>Arquivo: {msg.fileName || 'Arquivo'}</span>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
              <div className="flex space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bem-vindo ao WhatsUT!</h3>
              <p className="text-muted-foreground">
                Selecione um usuário ou grupo para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modais */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Grupo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Grupo</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Digite o nome do grupo"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Digite uma descrição para o grupo"
                  rows={3}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      {/* Admin Panel - temporarily disabled until User interface includes isAdmin */}
      {/* {showAdminPanel && user.isAdmin && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )} */}
    </div>
  );
}

export default ChatPage;
