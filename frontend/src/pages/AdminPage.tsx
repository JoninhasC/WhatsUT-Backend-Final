/**
 * 🔧 PÁGINA DE ADMINISTRAÇÃO DO WHATSUT
 * 
 * Interface completa para administradores gerenciarem:
 * - Usuários e banimentos
 * - Grupos e permissões
 * - Relatórios e moderação
 * - Configurações do sistema
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, groupService, adminService } from '../services/api';
import { Card, CardHeader, CardContent, Button } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Shield, Settings, Ban, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, Group, Ban as BanType } from '../types';

interface AdminStats {
  totalUsers: number;
  totalGroups: number;
  totalBans: number;
  onlineUsers: number;
}

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'bans' | 'settings'>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalGroups: 0,
    totalBans: 0,
    onlineUsers: 0
  });
  
  // States para cada aba
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bans, setBans] = useState<BanType[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Carregar estatísticas
      const [usersData, groupsData, bansData] = await Promise.all([
        userService.getUsers(),
        groupService.getGroups(),
        adminService.getBans()
      ]);

      setUsers(usersData);
      setGroups(groupsData);
      setBans(bansData);

      setStats({
        totalUsers: usersData.length,
        totalGroups: groupsData.length,
        totalBans: bansData.length,
        onlineUsers: usersData.filter((u: User) => u.isOnline).length
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de administração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string = 'Violação das regras') => {
    try {
      await adminService.banUser({
        userId: userId,
        reason,
        type: 'global'
      });
      toast.success('Usuário banido com sucesso');
      loadInitialData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      toast.error('Erro ao banir usuário');
    }
  };

  const handleUnbanUser = async (banId: string) => {
    try {
      await adminService.unbanUser(banId);
      toast.success('Banimento removido com sucesso');
      loadInitialData();
    } catch (error) {
      console.error('Erro ao remover banimento:', error);
      toast.error('Erro ao remover banimento');
    }
  };

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciamento de Usuários</h3>
        <Button onClick={loadInitialData} variant="outline">
          Atualizar
        </Button>
      </div>
      
      <div className="grid gap-4">
        {users.map((user) => {
          const isBanned = bans.some(ban => ban.userId === user.id);
          return (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                  {isBanned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      <Ban className="w-3 h-3 mr-1" />
                      Banido
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/chat/${user.id}`)}
                >
                  Chat
                </Button>
                {!isBanned ? (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBanUser(user.id)}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Banir
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const userBan = bans.find(ban => ban.userId === user.id);
                      if (userBan) handleUnbanUser(userBan.id);
                    }}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Desbanir
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGroupManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciamento de Grupos</h3>
        <Button onClick={loadInitialData} variant="outline">
          Atualizar
        </Button>
      </div>
      
      <div className="grid gap-4">
        {groups.map((group) => (
          <div key={group.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{group.name}</h4>
              <span className="text-sm text-gray-500">
                {group.members?.length || 0} membros
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Admin: {group.adminId} | Criado: {new Date(group.createdAt || Date.now()).toLocaleDateString()}
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/chat/${group.id}`)}
              >
                Ver Chat
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => {
                  // TODO: Implementar exclusão de grupo
                  toast('Funcionalidade em desenvolvimento');
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBanManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciamento de Banimentos</h3>
        <Button onClick={loadInitialData} variant="outline">
          Atualizar
        </Button>
      </div>
      
      <div className="grid gap-4">
        {bans.map((ban) => (
          <div key={ban.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">Usuário: {ban.userName || ban.userId}</p>
                <p className="text-sm text-gray-600">Motivo: {ban.reason}</p>
                <p className="text-sm text-gray-500">
                  Banido em: {new Date(ban.timestamp).toLocaleString()}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleUnbanUser(ban.id)}
              >
                Remover Ban
              </Button>
            </div>
          </div>
        ))}
        
        {bans.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum banimento ativo
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h4 className="font-medium">Configurações de Segurança</h4>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Limite de tentativas de login</span>
              <input 
                type="number" 
                defaultValue="5" 
                className="w-20 px-2 py-1 border rounded"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Tempo de banimento automático (min)</span>
              <input 
                type="number" 
                defaultValue="60" 
                className="w-20 px-2 py-1 border rounded"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Reports necessários para auto-ban</span>
              <input 
                type="number" 
                defaultValue="3" 
                className="w-20 px-2 py-1 border rounded"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h4 className="font-medium">Configurações de Chat</h4>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Tamanho máximo de arquivo (MB)</span>
              <input 
                type="number" 
                defaultValue="5" 
                className="w-20 px-2 py-1 border rounded"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Histórico de mensagens (dias)</span>
              <input 
                type="number" 
                defaultValue="30" 
                className="w-20 px-2 py-1 border rounded"
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-gray-500">
        * Configurações são apenas demonstrativas nesta versão
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-gray-600">Gerencie usuários, grupos e configurações do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuários Online</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.onlineUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Grupos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Banimentos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegação por abas */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'groups', label: 'Grupos', icon: Users },
            { id: 'bans', label: 'Banimentos', icon: Shield },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo da aba ativa */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner message="Carregando dados..." />
              </div>
            ) : (
              <>
                {activeTab === 'users' && renderUserManagement()}
                {activeTab === 'groups' && renderGroupManagement()}
                {activeTab === 'bans' && renderBanManagement()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminPage;
