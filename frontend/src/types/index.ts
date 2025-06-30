/**
 * 🎯 DEFINIÇÕES DE TIPOS TYPESCRIPT PARA WHATSUT
 * 
 * Este arquivo contém todas as interfaces e tipos utilizados
 * na aplicação frontend para garantir type safety e melhor
 * experiência de desenvolvimento.
 */

/**
 * Interface para dados do usuário
 * Representa um usuário no sistema WhatsUT
 */
export interface User {
  id: string;
  name: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt?: Date;
}

/**
 * Interface para dados de autenticação
 * Utilizada no processo de login e registro
 */
export interface AuthData {
  name: string;
  password: string;
}

/**
 * Interface para resposta de login
 * Retornada pelo backend após autenticação bem-sucedida
 */
export interface LoginResponse {
  access_token: string;
  user?: User;
}

/**
 * Interface para grupos/salas de chat
 * Representa um grupo no sistema
 */
export interface Group {
  id: string;
  name: string;
  adminId: string;
  members: string[];
  pendingRequests: string[];
  lastAdminRule?: 'transfer' | 'delete';
  createdAt?: Date;
}

/**
 * Interface para representar um chat na lista de chats
 */
export interface Chat {
  id: string;
  name: string;
  type: 'user' | 'group';
  isOnline?: boolean;
}

/**
 * Tipos de chat suportados pelo sistema
 */
export type ChatType = 'private' | 'group';

/**
 * Interface para mensagens de chat
 * Representa uma mensagem individual no sistema
 */
export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: Date;
  chatType: ChatType;
  targetId: string; // ID do usuário (private) ou grupo (group)
  receiverId?: string; // Para compatibilidade com mensagens privadas
  groupId?: string; // Para compatibilidade com mensagens de grupo
  isArquivo: boolean;
  isFile?: boolean; // Alias para isArquivo para compatibilidade
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

/**
 * Interface para dados de criação de mensagem
 * Utilizada ao enviar novas mensagens
 */
export interface CreateMessage {
  content: string;
  chatType: ChatType;
  targetId: string;
}

/**
 * Interface para banimentos
 * Representa um banimento no sistema
 */
export interface Ban {
  id: string;
  userId: string;
  userName?: string;
  reason: string;
  type: 'global' | 'group';
  targetId?: string; // ID do grupo (se type === 'group')
  bannedBy: string;
  timestamp: Date;
}

/**
 * Interface para denúncias/reports
 * Utilizada no sistema de moderação
 */
export interface Report {
  reportedUserId: string;
  reason: string;
  description?: string;
}

/**
 * Interface para upload de arquivos
 * Contém informações sobre arquivos enviados
 */
export interface FileUpload {
  file: File;
  chatType: ChatType;
  targetId: string;
}

/**
 * Interface para configurações do usuário
 * Utilizada para personalização da aplicação
 */
export interface UserSettings {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  soundEnabled?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

/**
 * Interface para contexto de autenticação
 * Utilizada no React Context para gerenciar estado global
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthData) => Promise<void>;
  register: (authData: AuthData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

/**
 * Interface para contexto de chat
 * Gerencia estado global das conversas
 */
export interface ChatContextType {
  messages: Message[];
  users: User[];
  groups: Group[];
  activeChat: {
    id: string;
    type: ChatType;
    name: string;
  } | null;
  isConnected: boolean;
  sendMessage: (message: CreateMessage) => Promise<void>;
  sendFile: (fileUpload: FileUpload) => Promise<void>;
  setActiveChat: (chatId: string, type: ChatType, name: string) => void;
  loadMessages: (chatId: string, type: ChatType) => Promise<void>;
  loadUsers: () => Promise<void>;
  loadGroups: () => Promise<void>;
}

/**
 * Tipos para eventos WebSocket
 * Definem a estrutura dos eventos em tempo real
 */
export interface SocketEvents {
  // Eventos enviados pelo cliente
  joinRoom: { roomId: string };
  leaveRoom: { roomId: string };
  sendMessage: CreateMessage;
  typing: { targetId: string; chatType: ChatType };
  
  // Eventos recebidos do servidor
  newMessage: Message;
  userOnline: { userId: string };
  userOffline: { userId: string };
  userTyping: { userId: string; userName: string };
  groupUpdate: Group;
  banNotification: Ban;
}

/**
 * Interface para resposta da API
 * Estrutura padrão das respostas do backend
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

/**
 * Interface para paginação de dados
 * Utilizada em listagens com muitos itens
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Tipos para estados de carregamento
 * Utilizados para feedback visual ao usuário
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Interface para estados de erro
 * Estrutura padronizada para tratamento de erros
 */
export interface ErrorState {
  message: string;
  code?: string;
  field?: string;
  timestamp: Date;
}

/**
 * Tipos para filtros de mensagens
 * Utilizados na busca e filtros de chat
 */
export interface MessageFilters {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sender?: string;
  fileOnly?: boolean;
}

/**
 * Interface para estatísticas do sistema
 * Utilizada em dashboards administrativos
 */
export interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  totalGroups: number;
  totalMessages: number;
  activeBans: number;
  uploadsToday: number;
}

/**
 * Tipos de notificações no sistema
 */
export type NotificationType = 
  | 'message' 
  | 'group_invite' 
  | 'group_approved' 
  | 'group_rejected' 
  | 'ban_warning' 
  | 'system';

/**
 * Interface para notificações
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/**
 * Enum para status de conexão WebSocket
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Interface para configurações do WebSocket
 */
export interface SocketConfig {
  url: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
}
