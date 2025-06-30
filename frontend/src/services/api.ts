/**
 * 🌐 SERVIÇO DE API PARA COMUNICAÇÃO COM BACKEND
 * 
 * Este arquivo contém todas as funções para comunicação HTTP
 * com o backend WhatsUT, incluindo autenticação, chat, grupos,
 * usuários e upload de arquivos.
 * 
 * Utiliza Axios para requisições HTTP com interceptors para
 * tratamento automático de tokens JWT e erros.
 */

import axios, { AxiosResponse, AxiosError } from 'axios';
import type {
  User,
  AuthData,
  LoginResponse,
  Message,
  Group,
  CreateMessage,
  FileUpload,
  Ban,
  Report,
  ApiResponse
} from '../types';

/**
 * Configuração base do Axios
 * Define a URL base da API e timeout das requisições
 * Usa /api como proxy para o backend via Vite
 */
const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 10000; // 10 segundos

/**
 * Instância do Axios configurada
 * Inclui interceptors para token JWT e tratamento de erros
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de requisição
 * Adiciona automaticamente o token JWT nas requisições autenticadas
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('📡 API Request:', config.method?.toUpperCase(), config.url, 'Token presente:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta
 * Trata automaticamente erros de autenticação e outros erros comuns
 */
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Response Error:', error.response?.status, error.config?.method?.toUpperCase(), error.config?.url, error.message);
    
    // Se o token expirou ou é inválido, redireciona para login
    if (error.response?.status === 401) {
      console.error('🚨 Token inválido ou expirado, redirecionando para login...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    
    // Trata outros erros comuns
    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data);
    }
    
    if (error.response?.status && error.response.status >= 500) {
      console.error('Erro interno do servidor:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 🔐 SERVIÇOS DE AUTENTICAÇÃO
 * Funções para registro, login, logout e gerenciamento de perfil
 */
export const authService = {
  /**
   * Registra um novo usuário no sistema
   * @param authData - Dados de registro (nome e senha)
   * @returns Promise com dados do usuário criado
   */
  async register(authData: AuthData): Promise<User> {
    const response: AxiosResponse<User> = await api.post('/auth/register', authData);
    return response.data;
  },

  /**
   * Realiza login do usuário
   * @param authData - Credenciais de login (nome e senha)
   * @returns Promise com token JWT e dados do usuário
   */
  async login(authData: AuthData): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', authData);
    
    // Armazena o token no localStorage para requisições futuras
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  },

  /**
   * Realiza logout do usuário
   * Remove token e dados do localStorage
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Remove dados locais independente da resposta do servidor
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    }
  },

  /**
   * Obtém perfil do usuário autenticado
   * @returns Promise com dados do usuário atual
   */
  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await api.get('/auth/profile');
    return response.data;
  },
};

/**
 * 👤 SERVIÇOS DE USUÁRIOS
 * Funções para gerenciamento de usuários
 */
export const userService = {
  /**
   * Lista todos os usuários do sistema
   * @returns Promise com array de usuários
   */
  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await api.get('/users');
    return response.data;
  },

  /**
   * Busca usuário específico por ID
   * @param userId - ID do usuário
   * @returns Promise com dados do usuário
   */
  async getUserById(userId: string): Promise<User> {
    const response: AxiosResponse<User> = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Atualiza perfil do usuário atual
   * @param userData - Dados a serem atualizados
   * @returns Promise com dados atualizados
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await api.patch('/users/profile', userData);
    return response.data;
  },

  /**
   * Exclui conta do usuário atual
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/users/profile');
  },
};

/**
 * 🏢 SERVIÇOS DE GRUPOS
 * Funções para gerenciamento de grupos
 */
export const groupService = {
  /**
   * Lista todos os grupos disponíveis
   * @returns Promise com array de grupos
   */
  async getGroups(): Promise<Group[]> {
    const response: AxiosResponse<Group[]> = await api.get('/groups');
    return response.data;
  },

  /**
   * Lista grupos do usuário atual
   * @returns Promise com grupos que o usuário participa
   */
  async getMyGroups(): Promise<Group[]> {
    const response: AxiosResponse<Group[]> = await api.get('/groups/my');
    return response.data;
  },

  /**
   * Cria um novo grupo
   * @param name - Nome do grupo
   * @returns Promise com dados do grupo criado
   */
  async createGroup(name: string): Promise<Group> {
    const response: AxiosResponse<Group> = await api.post('/groups/create', { name });
    return response.data;
  },

  /**
   * Solicita entrada em um grupo
   * @param groupId - ID do grupo
   */
  async joinGroup(groupId: string): Promise<void> {
    await api.patch(`/groups/${groupId}/join`);
  },

  /**
   * Aprova entrada de usuário no grupo (apenas admin)
   * @param groupId - ID do grupo
   * @param userId - ID do usuário a ser aprovado
   */
  async approveUser(groupId: string, userId: string): Promise<void> {
    await api.patch(`/groups/${groupId}/approve/${userId}`);
  },

  /**
   * Rejeita entrada de usuário no grupo (apenas admin)
   * @param groupId - ID do grupo
   * @param userId - ID do usuário a ser rejeitado
   */
  async rejectUser(groupId: string, userId: string): Promise<void> {
    await api.patch(`/groups/${groupId}/reject/${userId}`);
  },

  /**
   * Bane usuário do grupo (apenas admin)
   * @param groupId - ID do grupo
   * @param userId - ID do usuário a ser banido
   */
  async banUser(groupId: string, userId: string): Promise<void> {
    await api.patch(`/groups/${groupId}/ban/${userId}`);
  },

  /**
   * Sai do grupo
   * @param groupId - ID do grupo
   */
  async leaveGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/leave`);
  },

  /**
   * Atualiza dados do grupo (apenas admin)
   * @param groupId - ID do grupo
   * @param updateData - Dados a serem atualizados
   */
  async updateGroup(groupId: string, updateData: Partial<Group>): Promise<Group> {
    const response: AxiosResponse<Group> = await api.patch(`/groups/${groupId}`, updateData);
    return response.data;
  },

  /**
   * Exclui grupo (apenas admin)
   * @param groupId - ID do grupo
   */
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  },
};

/**
 * 💬 SERVIÇOS DE CHAT
 * Funções para envio e recebimento de mensagens
 */
export const chatService = {
  /**
   * Obtém mensagens de chat privado
   * @param userId - ID do usuário para conversa privada
   * @returns Promise com array de mensagens
   */
  async getPrivateMessages(userId: string): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await api.get(`/chat/private/${userId}`);
    return response.data;
  },

  /**
   * Obtém mensagens de grupo
   * @param groupId - ID do grupo
   * @returns Promise com array de mensagens
   */
  async getGroupMessages(groupId: string): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await api.get(`/chat/group/${groupId}`);
    return response.data;
  },

  /**
   * Envia mensagem privada
   * @param userId - ID do destinatário
   * @param content - Conteúdo da mensagem
   * @returns Promise com dados da mensagem enviada
   */
  async sendPrivateMessage(userId: string, content: string): Promise<Message> {
    const response: AxiosResponse<Message> = await api.post(`/chat/private/${userId}`, { content });
    return response.data;
  },

  /**
   * Envia mensagem para grupo
   * @param groupId - ID do grupo
   * @param content - Conteúdo da mensagem
   * @returns Promise com dados da mensagem enviada
   */
  async sendGroupMessage(groupId: string, content: string): Promise<Message> {
    const response: AxiosResponse<Message> = await api.post(`/chat/group/${groupId}`, { content });
    return response.data;
  },

  /**
   * Faz upload de arquivo em chat privado
   * @param userId - ID do destinatário
   * @param file - Arquivo a ser enviado
   * @returns Promise com dados da mensagem/arquivo
   */
  async uploadPrivateFile(userId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<Message> = await api.post(
      `/chat/private/${userId}/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  /**
   * Faz upload de arquivo em grupo
   * @param groupId - ID do grupo
   * @param file - Arquivo a ser enviado
   * @returns Promise com dados da mensagem/arquivo
   */
  async uploadGroupFile(groupId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<Message> = await api.post(
      `/chat/group/${groupId}/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
};

/**
 * 🚫 SERVIÇOS DE BANIMENTOS
 * Funções para sistema de moderação e banimentos
 */
export const banService = {
  /**
   * Lista todos os banimentos (admin)
   * @returns Promise com array de banimentos
   */
  async getBans(): Promise<Ban[]> {
    const response: AxiosResponse<Ban[]> = await api.get('/bans');
    return response.data;
  },

  /**
   * Lista banimentos de usuário específico
   * @param userId - ID do usuário
   * @returns Promise com banimentos do usuário
   */
  async getUserBans(userId: string): Promise<Ban[]> {
    const response: AxiosResponse<Ban[]> = await api.get(`/bans/user/${userId}`);
    return response.data;
  },

  /**
   * Verifica se usuário está banido
   * @param userId - ID do usuário
   * @returns Promise com status de banimento
   */
  async checkBanStatus(userId: string): Promise<{ isBanned: boolean; bans: Ban[] }> {
    const response: AxiosResponse<{ isBanned: boolean; bans: Ban[] }> = await api.get(`/bans/check/${userId}`);
    return response.data;
  },

  /**
   * Bane usuário (admin)
   * @param banData - Dados do banimento
   * @returns Promise com dados do banimento criado
   */
  async banUser(banData: Omit<Ban, 'id' | 'timestamp' | 'bannedBy'>): Promise<Ban> {
    const response: AxiosResponse<Ban> = await api.post('/bans', banData);
    return response.data;
  },

  /**
   * Denuncia usuário
   * @param reportData - Dados da denúncia
   */
  async reportUser(reportData: Report): Promise<void> {
    await api.post('/bans/report', reportData);
  },

  /**
   * Remove banimento (admin)
   * @param banId - ID do banimento
   */
  async unbanUser(banId: string): Promise<void> {
    await api.delete(`/bans/${banId}`);
  },
};

/**
 * 📊 SERVIÇOS UTILITÁRIOS
 * Funções auxiliares e de configuração
 */
export const utilsService = {
  /**
   * Testa conectividade com a API
   * @returns Promise com status da conexão
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    const response: AxiosResponse<{ status: string; timestamp: Date }> = await api.get('/');
    return response.data;
  },

  /**
   * Obtém configurações do servidor
   * @returns Promise com configurações públicas
   */
  async getServerConfig(): Promise<{
    maxFileSize: number;
    allowedFileTypes: string[];
    version: string;
  }> {
    // Como não temos endpoint específico, retornamos configurações padrão
    return {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      version: '1.0.0',
    };
  },

  /**
   * Valida formato de arquivo antes do upload
   * @param file - Arquivo a ser validado
   * @returns boolean indicando se o arquivo é válido
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Arquivo muito grande. Tamanho máximo: 5MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de arquivo não permitido'
      };
    }

    return { isValid: true };
  },

  /**
   * Formata tamanho de arquivo para exibição
   * @param bytes - Tamanho em bytes
   * @returns String formatada (ex: "1.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Formata data para exibição
   * @param date - Data a ser formatada
   * @returns String formatada
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return d.toLocaleDateString('pt-BR');
  },
};

/**
 * Exporta a instância configurada do Axios para uso direto quando necessário
 */
export { api };

/**
 * Exporta todas as funções de serviço organizadas
 */
export default {
  auth: authService,
  user: userService,
  group: groupService,
  chat: chatService,
  ban: banService,
  utils: utilsService,
};
