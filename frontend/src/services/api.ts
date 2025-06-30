import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido - limpar dados de autenticação
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      
      // Redirecionar para login se não estiver na página de login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { name: username, password });
    return response.data;
  },
  
  register: async (authData: any) => {
    const response = await api.post('/auth/register', authData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// User service
export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  }
};

// Chat service
export const chatService = {
  getChats: async () => {
    // Este endpoint pode não existir - vamos usar uma abordagem diferente
    const response = await api.get('/users'); // Isso vai retornar lista de usuários para chat
    return response.data;
  },
  
  getChatById: async (id: string) => {
    // Assumindo que é um chat privado, vamos usar o endpoint correto
    const response = await api.get(`/chat/private/${id}`);
    return response.data;
  },
  
  createChat: async (data: any) => {
    // Para criar chat, usamos o endpoint de enviar mensagem
    const response = await api.post(`/chat/private/${data.userId}`, { content: data.content || 'Chat iniciado' });
    return response.data;
  },
  
  sendMessage: async (chatId: string, content: string, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('file', file);
      
      // Assumindo que é um upload privado por padrão
      const response = await api.post(`/chat/upload/private/${chatId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Assumindo chat privado por padrão
      const response = await api.post(`/chat/private/${chatId}`, { content });
      return response.data;
    }
  },
  
  getMessages: async (chatId: string) => {
    // Por padrão, assumir chat privado
    const response = await api.get(`/chat/private/${chatId}`);
    return response.data;
  }
};

// Group service
export const groupService = {
  getGroups: async () => {
    const response = await api.get('/group');
    return response.data;
  },
  
  getGroupById: async (id: string) => {
    const response = await api.get(`/group/${id}`);
    return response.data;
  },
  
  createGroup: async (data: any) => {
    const response = await api.post('/group', data);
    return response.data;
  },
  
  updateGroup: async (id: string, data: any) => {
    const response = await api.put(`/group/${id}`, data);
    return response.data;
  },
  
  deleteGroup: async (id: string) => {
    const response = await api.delete(`/group/${id}`);
    return response.data;
  },
  
  addMember: async (groupId: string, userId: string) => {
    const response = await api.post(`/group/${groupId}/members/${userId}`);
    return response.data;
  },
  
  removeMember: async (groupId: string, userId: string) => {
    const response = await api.delete(`/group/${groupId}/members/${userId}`);
    return response.data;
  },
  
  makeAdmin: async (groupId: string, userId: string) => {
    const response = await api.post(`/group/${groupId}/admins/${userId}`);
    return response.data;
  },
  
  removeAdmin: async (groupId: string, userId: string) => {
    const response = await api.delete(`/group/${groupId}/admins/${userId}`);
    return response.data;
  }
};

// Admin service
export const adminService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getGroups: async () => {
    const response = await api.get('/group');
    return response.data;
  },
  
  getBans: async () => {
    const response = await api.get('/bans');
    return response.data;
  },
  
  banUser: async (data: any) => {
    const response = await api.post('/bans', data);
    return response.data;
  },
  
  unbanUser: async (userId: string) => {
    const response = await api.delete(`/bans/${userId}`);
    return response.data;
  }
};

export default api;
