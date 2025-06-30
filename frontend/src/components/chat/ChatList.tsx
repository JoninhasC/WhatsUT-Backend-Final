/**
 * 💬 COMPONENTE LISTA DE CHATS
 * 
 * Componente que exibe a lista de usuários e grupos
 * disponíveis para chat com busca e filtros.
 */

import { Search, Users, MessageSquare, Plus } from 'lucide-react';
import { Avatar, Button, Input } from '../ui';
import { cn } from '../../utils/cn';
import type { User, Group } from '../../types';

export interface ChatListProps {
  activeTab: 'users' | 'groups';
  onTabChange: (tab: 'users' | 'groups') => void;
  users: User[];
  groups: Group[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedChat: { id: string; name: string; type: 'private' | 'group' } | null;
  onSelectChat: (id: string, name: string, type: 'private' | 'group') => void;
  onCreateGroup: () => void;
  isLoading?: boolean;
}

export function ChatList({
  activeTab,
  onTabChange,
  users,
  groups,
  searchTerm,
  onSearchChange,
  selectedChat,
  onSelectChat,
  onCreateGroup,
  isLoading = false
}: ChatListProps) {
  // Filtrar dados baseado na busca
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header da sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">WhatsUT</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateGroup}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Grupo
            </Button>
          </div>
        </div>

        {/* Campo de busca */}
        <Input
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="mb-4"
        />

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange('users')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </button>
          <button
            onClick={() => onTabChange('groups')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              activeTab === 'groups'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Grupos</span>
          </button>
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <ChatListItem
                      key={user.id}
                      id={user.id}
                      name={user.name}
                      type="private"
                      isOnline={user.isOnline}
                      lastSeen={user.lastSeen}
                      isSelected={selectedChat?.id === user.id && selectedChat?.type === 'private'}
                      onClick={() => onSelectChat(user.id, user.name, 'private')}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="space-y-1">
                {filteredGroups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">
                      {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponível'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCreateGroup}
                      className="mt-2"
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Criar grupo
                    </Button>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <ChatListItem
                      key={group.id}
                      id={group.id}
                      name={group.name}
                      type="group"
                      memberCount={group.members?.length}
                      isSelected={selectedChat?.id === group.id && selectedChat?.type === 'group'}
                      onClick={() => onSelectChat(group.id, group.name, 'group')}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ChatListItemProps {
  id: string;
  name: string;
  type: 'private' | 'group';
  isOnline?: boolean;
  lastSeen?: Date;
  memberCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

function ChatListItem({
  name,
  type,
  isOnline,
  lastSeen,
  memberCount,
  isSelected,
  onClick
}: ChatListItemProps) {
  const formatLastSeen = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors duration-150',
        isSelected && 'bg-blue-50 border-blue-200'
      )}
    >
      <div className="flex items-center space-x-3">
        <Avatar
          name={name}
          size="md"
          showStatus={type === 'private'}
          isOnline={isOnline}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {name}
            </h3>
            {type === 'private' && lastSeen && !isOnline && (
              <span className="text-xs text-gray-500">
                {formatLastSeen(lastSeen)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {type === 'group' 
                ? `${memberCount || 0} membros`
                : isOnline ? 'Online' : 'Offline'
              }
            </p>
            
            {type === 'group' && (
              <MessageSquare className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
