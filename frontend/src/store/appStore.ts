/**
 * 🏪 STORE GLOBAL APRIMORADO
 * 
 * Sistema de estado global usando Zustand para melhor performance
 * e organização do estado da aplicação.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Group, Message } from '../types';

interface AppState {
  // Estados de dados
  users: User[];
  groups: Group[];
  messages: Message[];
  currentUser: User | null;
  
  // Estados de UI
  activeTab: 'users' | 'groups';
  selectedChat: { id: string; name: string; type: 'private' | 'group' } | null;
  searchTerm: string;
  isLoading: boolean;
  isConnected: boolean;
  
  // Estados de modais
  showCreateGroup: boolean;
  showAdminPanel: boolean;
  showSettings: boolean;
  
  // Configurações
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sounds: boolean;
  
  // Actions para dados
  setUsers: (users: User[]) => void;
  setGroups: (groups: Group[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setCurrentUser: (user: User | null) => void;
  
  // Actions para UI
  setActiveTab: (tab: 'users' | 'groups') => void;
  setSelectedChat: (chat: { id: string; name: string; type: 'private' | 'group' } | null) => void;
  setSearchTerm: (term: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  
  // Actions para modais
  setShowCreateGroup: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  
  // Actions para configurações
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotifications: (enabled: boolean) => void;
  setSounds: (enabled: boolean) => void;
  
  // Actions compostas
  reset: () => void;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estados iniciais
        users: [],
        groups: [],
        messages: [],
        currentUser: null,
        
        activeTab: 'users',
        selectedChat: null,
        searchTerm: '',
        isLoading: false,
        isConnected: false,
        
        showCreateGroup: false,
        showAdminPanel: false,
        showSettings: false,
        
        theme: 'system',
        notifications: true,
        sounds: true,
        
        // Actions para dados
        setUsers: (users) => set({ users }),
        setGroups: (groups) => set({ groups }),
        setMessages: (messages) => set({ messages }),
        addMessage: (message) => set((state) => ({
          messages: [...state.messages, message]
        })),
        setCurrentUser: (user) => set({ currentUser: user }),
        
        // Actions para UI
        setActiveTab: (tab) => set({ activeTab: tab }),
        setSelectedChat: (chat) => set({ selectedChat: chat }),
        setSearchTerm: (term) => set({ searchTerm: term }),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsConnected: (connected) => set({ isConnected: connected }),
        
        // Actions para modais
        setShowCreateGroup: (show) => set({ showCreateGroup: show }),
        setShowAdminPanel: (show) => set({ showAdminPanel: show }),
        setShowSettings: (show) => set({ showSettings: show }),
        
        // Actions para configurações
        setTheme: (theme) => set({ theme }),
        setNotifications: (enabled) => set({ notifications: enabled }),
        setSounds: (enabled) => set({ sounds: enabled }),
        
        // Actions compostas
        reset: () => set({
          users: [],
          groups: [],
          messages: [],
          selectedChat: null,
          searchTerm: '',
          showCreateGroup: false,
          showAdminPanel: false,
          showSettings: false,
        }),
        
        updateUserStatus: (userId, isOnline) => set((state) => ({
          users: state.users.map(user => 
            user.id === userId ? { ...user, isOnline } : user
          )
        })),
      }),
      {
        name: 'whatsut-app-store',
        partialize: (state) => ({
          theme: state.theme,
          notifications: state.notifications,
          sounds: state.sounds,
          currentUser: state.currentUser,
        }),
      }
    ),
    {
      name: 'WhatsUT Store',
    }
  )
);

// Hooks especializados para cada funcionalidade
export const useUsers = () => useAppStore((state) => ({
  users: state.users,
  setUsers: state.setUsers,
  updateUserStatus: state.updateUserStatus,
}));

export const useGroups = () => useAppStore((state) => ({
  groups: state.groups,
  setGroups: state.setGroups,
}));

export const useMessages = () => useAppStore((state) => ({
  messages: state.messages,
  setMessages: state.setMessages,
  addMessage: state.addMessage,
}));

export const useUIState = () => useAppStore((state) => ({
  activeTab: state.activeTab,
  selectedChat: state.selectedChat,
  searchTerm: state.searchTerm,
  isLoading: state.isLoading,
  isConnected: state.isConnected,
  setActiveTab: state.setActiveTab,
  setSelectedChat: state.setSelectedChat,
  setSearchTerm: state.setSearchTerm,
  setIsLoading: state.setIsLoading,
  setIsConnected: state.setIsConnected,
}));

export const useModals = () => useAppStore((state) => ({
  showCreateGroup: state.showCreateGroup,
  showAdminPanel: state.showAdminPanel,
  showSettings: state.showSettings,
  setShowCreateGroup: state.setShowCreateGroup,
  setShowAdminPanel: state.setShowAdminPanel,
  setShowSettings: state.setShowSettings,
}));

export const useSettings = () => useAppStore((state) => ({
  theme: state.theme,
  notifications: state.notifications,
  sounds: state.sounds,
  setTheme: state.setTheme,
  setNotifications: state.setNotifications,
  setSounds: state.setSounds,
}));
