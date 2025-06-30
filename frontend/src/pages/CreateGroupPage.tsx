/**
 * 🏗️ PÁGINA DE CRIAÇÃO DE GRUPOS AVANÇADA
 * 
 * Permite criar grupos com configurações detalhadas:
 * - Nome e descrição
 * - Seleção de membros
 * - Configurações de administração
 * - Permissões e regras
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, userService } from '../services/api';
import { Card, CardHeader, CardContent, Button, Input } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Settings, Plus, Check, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../types';

interface GroupFormData {
  name: string;
  description: string;
  members: string[];
  adminsId: string[];
  isPrivate: boolean;
  lastAdminRule: 'transfer' | 'delete';
  maxMembers: number;
}

function CreateGroupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    members: [],
    adminsId: [],
    isPrivate: false,
    lastAdminRule: 'transfer',
    maxMembers: 50
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do grupo é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Descrição deve ter no máximo 200 caracteres';
    }

    if (selectedUsers.length === 0) {
      newErrors.members = 'Selecione pelo menos um membro';
    }

    if (selectedAdmins.length === 0) {
      newErrors.admins = 'Selecione pelo menos um administrador';
    }

    if (formData.maxMembers < selectedUsers.length) {
      newErrors.maxMembers = 'Limite de membros não pode ser menor que membros selecionados';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        // Se removendo usuário, remover também dos admins
        setSelectedAdmins(adminPrev => adminPrev.filter(id => id !== userId));
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAdminToggle = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      toast.error('Usuário deve ser membro antes de ser administrador');
      return;
    }

    setSelectedAdmins(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: selectedUsers,
        adminsId: selectedAdmins,
        lastAdminRule: formData.lastAdminRule,
        isPrivate: formData.isPrivate,
        maxMembers: formData.maxMembers
      };

      const newGroup = await groupService.createGroup(groupData);
      toast.success('Grupo criado com sucesso!');
      navigate(`/chat/${newGroup.id}`);
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Grupo</h1>
          <p className="text-gray-600">Configure seu grupo de chat com opções avançadas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Informações Básicas
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Grupo *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do grupo"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito do grupo"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Membros
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
                  />
                  {errors.maxMembers && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxMembers}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Grupo
                  </label>
                  <select
                    value={formData.isPrivate ? 'private' : 'public'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.value === 'private' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="public">Público</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quando o último admin sair
                </label>
                <select
                  value={formData.lastAdminRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastAdminRule: e.target.value as 'transfer' | 'delete' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="transfer">Transferir administração para outro membro</option>
                  <option value="delete">Excluir o grupo</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Membros */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Seleção de Membros
              </h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {errors.members && (
                <p className="text-red-500 text-sm mb-4">{errors.members}</p>
              )}

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  const isAdmin = selectedAdmins.includes(user.id);
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{user.name}</span>
                        {isAdmin && (
                          <span title="Administrador">
                            <Crown className="w-4 h-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUserToggle(user.id)}
                          className={`p-2 rounded-md transition-colors ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={isSelected ? 'Remover do grupo' : 'Adicionar ao grupo'}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => handleAdminToggle(user.id)}
                            className={`p-2 rounded-md transition-colors ${
                              isAdmin 
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={isAdmin ? 'Remover admin' : 'Tornar admin'}
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.admins && (
                <p className="text-red-500 text-sm mt-4">{errors.admins}</p>
              )}

              {/* Resumo da seleção */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{selectedUsers.length}</strong> membros selecionados, 
                  <strong> {selectedAdmins.length}</strong> administradores
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/groups')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Criar Grupo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupPage;
