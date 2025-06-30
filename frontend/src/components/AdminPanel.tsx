/**
 * 🛡️ PAINEL ADMINISTRATIVO
 * 
 * Componente para gerenciamento administrativo da aplicação.
 * Permite visualizar usuários, grupos, banimentos e outras
 * funcionalidades de moderação.
 * 
 * Funcionalidades:
 * - Lista de todos os usuários
 * - Gerenciamento de grupos
 * - Sistema de banimentos
 * - Relatórios e estatísticas
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Ban, 
  BarChart3, 
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { userService, groupService } from '../services/api';
import type { User, Group } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

/**
 * Componente do painel administrativo
 */
function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth();
  
  // Estados
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'bans' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carrega dados ao montar o componente
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carrega dados administrativos
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [usersData, groupsData] = await Promise.all([
        userService.getUsers(),
        groupService.getGroups()
      ]);

      setUsers(usersData);
      setGroups(groupsData);
      
    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error);
      toast.error('Erro ao carregar dados administrativos');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renderiza lista de usuários
   */
  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <span className="text-sm text-gray-500">{users.length} usuários</span>
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
            <div>Nome</div>
            <div>ID</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.map((userData) => (
            <div key={userData.id} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userData.name}</p>
                    {userData.id === user?.id && (
                      <span className="text-xs text-blue-600">(Você)</span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 font-mono">
                  {userData.id.slice(0, 8)}...
                </div>
                
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userData.isOnline 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userData.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => toast.success(`Funcionalidade em desenvolvimento para ${userData.name}`)}
                  >
                    Detalhes
                  </button>
                  {userData.id !== user?.id && (
                    <button
                      className="text-red-600 hover:text-red-800 text-sm"
                      onClick={() => toast.success(`Banimento em desenvolvimento para ${userData.name}`)}
                    >
                      Banir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza lista de grupos
   */
  const renderGroupsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Grupos do Sistema</h3>
        <span className="text-sm text-gray-500">{groups.length} grupos</span>
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
            <div>Nome do Grupo</div>
            <div>Membros</div>
            <div>Criado</div>
            <div>Ações</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {groups.map((group) => (
            <div key={group.id} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-500">ID: {group.id.slice(0, 8)}...</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700">
                  {group.members?.length || 0} membros
                </div>
                
                <div className="text-sm text-gray-500">
                  {group.createdAt ? new Date(group.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => toast.success(`Detalhes do grupo ${group.name} em desenvolvimento`)}
                  >
                    Detalhes
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={() => toast.success(`Exclusão do grupo ${group.name} em desenvolvimento`)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza estatísticas do sistema
   */
  const renderStatsTab = () => {
    const onlineUsers = users.filter(u => u.isOnline).length;
    const offlineUsers = users.length - onlineUsers;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Estatísticas do Sistema</h3>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usuários Online</p>
                <p className="text-2xl font-bold text-gray-900">{onlineUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Grupos</p>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usuários Offline</p>
                <p className="text-2xl font-bold text-gray-900">{offlineUsers}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações adicionais */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-md font-semibold mb-4">Resumo da Atividade</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de usuários online:</span>
              <span className="font-medium">
                {users.length > 0 ? Math.round((onlineUsers / users.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Grupos por usuário:</span>
              <span className="font-medium">
                {users.length > 0 ? (groups.length / users.length).toFixed(1) : '0.0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sistema:</span>
              <span className="font-medium text-green-600">Operacional</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderiza placeholder para banimentos
   */
  const renderBansTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sistema de Banimentos</h3>
      
      <div className="bg-white p-8 rounded-lg border text-center">
        <Ban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Sistema de Banimentos
        </h4>
        <p className="text-gray-600 mb-4">
          O sistema de banimentos está implementado no backend mas a interface
          administrativa ainda está em desenvolvimento.
        </p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades disponíveis via API:</p>
          <ul className="mt-2 space-y-1">
            <li>• Banimento global de usuários</li>
            <li>• Banimento de grupos específicos</li>
            <li>• Sistema de reports automáticos</li>
            <li>• Listagem de banimentos ativos</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Painel Administrativo</h1>
                  <p className="text-sm text-gray-500">WhatsUT - Sistema de Gestão</p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Administrador: <span className="font-medium">{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar de navegação */}
          <div className="w-64 bg-white border-r border-gray-200">
            <nav className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                  activeTab === 'users'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Usuários</span>
              </button>
              
              <button
                onClick={() => setActiveTab('groups')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                  activeTab === 'groups'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Grupos</span>
              </button>
              
              <button
                onClick={() => setActiveTab('bans')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                  activeTab === 'bans'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Ban className="w-5 h-5" />
                <span>Banimentos</span>
              </button>
              
              <button
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                  activeTab === 'stats'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Estatísticas</span>
              </button>
            </nav>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'groups' && renderGroupsTab()}
            {activeTab === 'bans' && renderBansTab()}
            {activeTab === 'stats' && renderStatsTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
