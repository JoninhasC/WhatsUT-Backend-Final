/*
 * ====================================================================
 * ARQUIVO: api.ts - VERSÃO EXPLICATIVA PARA INICIANTES
 * LOCALIZAÇÃO: frontend/src/services/api.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é o "CORREIO" entre o frontend e o backend do WhatsUT.
 * Ele contém todas as funções que fazem requisições HTTP para a API,
 * como login, registro, enviar mensagens, criar grupos, etc.
 * 
 * ANALOGIA SIMPLES:
 * Imagine que o frontend é um escritório e o backend é outro escritório
 * em um prédio diferente. Este arquivo seria como o "sistema de correio"
 * que leva mensagens de um escritório para o outro:
 * - Enviar documentos (requisições)
 * - Receber respostas
 * - Adicionar carimbos e assinaturas (headers e autenticação)
 * - Tratar problemas de entrega (erros)
 * 
 * CONCEITOS IMPORTANTES:
 * 
 * 1. AXIOS:
 *    - É uma biblioteca para fazer requisições HTTP
 *    - É como um "carteiro super inteligente" que sabe como entregar dados
 *    - Automatiza muitas tarefas como conversão JSON, headers, etc.
 * 
 * 2. INTERCEPTORS:
 *    - São "filtros" que processam todas as requisições/respostas
 *    - É como ter um assistente que automaticamente:
 *      * Adiciona seu cartão de identificação (token) em tudo que você envia
 *      * Verifica se suas credenciais ainda são válidas
 * 
 * 3. HEADERS HTTP:
 *    - São "etiquetas" que vão junto com os dados
 *    - Authorization: seu "cartão de identificação" (token JWT)
 *    - Content-Type: diz que tipo de dados está sendo enviado
 * 
 * 4. MÉTODOS HTTP:
 *    - GET: "me dê algo" (buscar dados)
 *    - POST: "aqui está algo novo" (criar dados)
 *    - PUT: "substitua isso" (atualizar dados)
 *    - DELETE: "remova isso" (deletar dados)
 */

// ===== IMPORTAÇÕES =====

// Axios é a biblioteca para fazer requisições HTTP
import axios from 'axios';

// ===== CONFIGURAÇÕES BÁSICAS =====

// URL base do nosso backend
const API_BASE_URL = 'http://localhost:3000';

// ===== CRIAÇÃO DA INSTÂNCIA AXIOS =====
// Cria uma instância personalizada do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,              // Todas as requisições vão para localhost:3000
  headers: {
    'Content-Type': 'application/json',  // Sempre enviamos dados em JSON
  },
});

/*
 * POR QUE CRIAR UMA INSTÂNCIA?
 * 
 * Em vez de usar axios diretamente, criamos uma instância personalizada.
 * É como ter um "carteiro pessoal" configurado especificamente para
 * entregar correspondências para o nosso backend.
 * 
 * VANTAGENS:
 * - Todas as requisições automaticamente vão para localhost:3000
 * - Todas automaticamente têm Content-Type JSON
 * - Podemos adicionar interceptors que afetam todas as requisições
 */

/*
 * ====================================================================
 * SEÇÃO 1: INTERCEPTORS (ASSISTENTES AUTOMÁTICOS)
 * ====================================================================
 */

// ===== INTERCEPTOR DE REQUISIÇÃO =====
// Este código executa ANTES de TODA requisição ser enviada
api.interceptors.request.use((config) => {
  /*
   * O QUE FAZ:
   * Para cada requisição que vai ser enviada, este código:
   * 1. Pega o token do localStorage
   * 2. Se tem token, adiciona no header Authorization
   * 3. Deixa a requisição continuar
   * 
   * É como ter um assistente que automaticamente:
   * - Verifica se você tem cartão de identificação
   * - Se tem, cola ele em tudo que você vai enviar
   * - Nunca esquece de fazer isso
   */
  
  // Busca o token salvo no navegador
  const token = localStorage.getItem('access_token');
  
  if (token) {
    // Se tem token, adiciona no header Authorization
    config.headers.Authorization = `Bearer ${token}`;
    /*
     * FORMATO DO HEADER:
     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * 
     * "Bearer" é o tipo de autenticação (padrão para JWT)
     * O resto é o token propriamente dito
     */
  }
  
  // Retorna a configuração (modificada ou não)
  return config;
});

// ===== INTERCEPTOR DE RESPOSTA =====
// Este código executa DEPOIS de TODA resposta ser recebida
api.interceptors.response.use(
  // Se a resposta foi bem-sucedida (status 200, 201, etc.)
  (response) => response,  // Só deixa passar
  
  // Se a resposta foi um erro (status 400, 401, 500, etc.)
  (error) => {
    /*
     * TRATAMENTO ESPECIAL PARA ERRO 401:
     * 
     * Erro 401 = Unauthorized (não autorizado)
     * Acontece quando:
     * - Token expirou
     * - Token é inválido
     * - Token foi removido do servidor
     * 
     * AÇÃO AUTOMÁTICA:
     * Quando recebe 401, automaticamente:
     * 1. Remove dados de login do navegador
     * 2. Redireciona para página de login
     */
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido - limpar dados de autenticação
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      
      // Redirecionar para login se não estiver na página de login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
      /*
       * POR QUE REDIRECIONAR?
       * 
       * Se o token expirou, o usuário não está mais "logado" efetivamente.
       * É como se o cartão de acesso dele tivesse expirado.
       * Redirecionamos para login para ele se "reautenticar".
       */
    }
    
    // "Joga" o erro para frente para quem chamou a função poder tratar
    return Promise.reject(error);
  }
);

/*
 * ====================================================================
 * SEÇÃO 2: SERVIÇOS DE AUTENTICAÇÃO
 * ====================================================================
 */

// ===== SERVIÇO DE AUTENTICAÇÃO =====
// Agrupa todas as funções relacionadas a login, logout, etc.
export const authService = {
  
  // ===== FUNÇÃO DE LOGIN =====
  login: async (username: string, password: string) => {
    /*
     * O QUE FAZ:
     * 1. Envia POST para /auth/login com nome e senha
     * 2. Backend verifica credenciais
     * 3. Se válidas, backend retorna token + dados do usuário
     * 4. Retorna essa resposta para quem chamou
     * 
     * FLUXO COMPLETO:
     * Frontend → api.post('/auth/login') → Backend → AuthController.signIn()
     * → AuthService.signIn() → UsersService.findOne() → JWT gerado → resposta
     */
    
    const response = await api.post('/auth/login', { 
      name: username, 
      password 
    });
    return response.data;
    /*
     * EXEMPLO DE RESPOSTA:
     * {
     *   access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   user: {
     *     id: "123",
     *     name: "João",
     *     isOnline: true
     *   }
     * }
     */
  },
  
  // ===== FUNÇÃO DE REGISTRO =====
  register: async (authData: any) => {
    /*
     * O QUE FAZ:
     * 1. Envia POST para /auth/register com dados do novo usuário
     * 2. Backend cria conta (criptografa senha, salva no CSV)
     * 3. Retorna confirmação ou erro
     */
    
    const response = await api.post('/auth/register', authData);
    return response.data;
  },
  
  // ===== FUNÇÃO DE LOGOUT =====
  logout: async () => {
    /*
     * O QUE FAZ:
     * 1. Envia POST para /auth/logout (com token no header)
     * 2. Backend remove usuário da lista de "online"
     * 3. Retorna confirmação
     * 
     * NOTA: O token é automaticamente adicionado pelo interceptor!
     */
    
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  // ===== FUNÇÃO DE OBTER PERFIL =====
  getProfile: async () => {
    /*
     * O QUE FAZ:
     * 1. Envia GET para /auth/profile (com token no header)
     * 2. Backend decodifica token e retorna dados do usuário
     * 3. Útil para verificar se token ainda é válido
     * 
     * NOTA: No fluxo atual, isso não é mais necessário pois o login
     * já retorna os dados do usuário. Mantemos para compatibilidade.
     */
    
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

/*
 * ====================================================================
 * SEÇÃO 3: SERVIÇOS DE USUÁRIOS
 * ====================================================================
 */

// ===== SERVIÇO DE USUÁRIOS =====
export const userService = {
  
  // ===== OBTER LISTA DE USUÁRIOS =====
  getUsers: async () => {
    /*
     * Busca todos os usuários do sistema.
     * Útil para:
     * - Lista de contatos para chat
     * - Administração do sistema
     * - Buscar pessoas para adicionar em grupos
     */
    const response = await api.get('/users');
    return response.data;
  },
  
  // ===== OBTER USUÁRIO POR ID =====
  getUserById: async (id: string) => {
    /*
     * Busca um usuário específico pelo ID.
     * Útil para:
     * - Mostrar perfil de outro usuário
     * - Validar se usuário existe antes de enviar mensagem
     */
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  // ===== ATUALIZAR PERFIL =====
  updateProfile: async (data: any) => {
    /*
     * Atualiza dados do próprio usuário.
     * Pode incluir nome, senha, etc.
     */
    const response = await api.put('/users/profile', data);
    return response.data;
  }
};

/*
 * ====================================================================
 * SEÇÃO 4: SERVIÇOS DE CHAT
 * ====================================================================
 */

// ===== SERVIÇO DE CHAT =====
export const chatService = {
  
  // ===== OBTER CHATS =====
  getChats: async () => {
    /*
     * NOTA: O endpoint /chats pode não existir no backend atual.
     * Por isso, usamos /users para obter lista de pessoas com quem
     * se pode conversar.
     */
    const response = await api.get('/users');
    return response.data;
  },
  
  // ===== OBTER CHAT POR ID =====
  getChatById: async (id: string) => {
    /*
     * Busca as mensagens de um chat específico.
     * Assumimos que é um chat privado (1 para 1).
     */
    const response = await api.get(`/chat/private/${id}`);
    return response.data;
  },
  
  // ===== CRIAR CHAT =====
  createChat: async (data: any) => {
    /*
     * Inicia um novo chat enviando a primeira mensagem.
     * No WhatsUT, um chat é criado implicitamente quando
     * você envia a primeira mensagem para alguém.
     */
    const response = await api.post(`/chat/private/${data.userId}`, { 
      content: data.content || 'Chat iniciado' 
    });
    return response.data;
  },
  
  // ===== ENVIAR MENSAGEM =====
  sendMessage: async (chatId: string, content: string, file?: File) => {
    /*
     * ENVIO COM ARQUIVO:
     * Se há arquivo, usa FormData (multipart/form-data)
     * Isso permite enviar texto + arquivo na mesma requisição
     */
    if (file) {
      const formData = new FormData();
      formData.append('content', content);  // Texto da mensagem
      formData.append('file', file);        // Arquivo (imagem, documento, etc.)
      
      const response = await api.post(`/chat/upload/private/${chatId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // Tipo especial para arquivos
        },
      });
      return response.data;
    } else {
      /*
       * ENVIO SÓ TEXTO:
       * Se é só texto, envia JSON normal
       */
      const response = await api.post(`/chat/private/${chatId}`, { content });
      return response.data;
    }
  },
  
  // ===== OBTER MENSAGENS =====
  getMessages: async (chatId: string) => {
    /*
     * Busca todas as mensagens de um chat específico.
     * Usado para "carregar histórico" quando abre uma conversa.
     */
    const response = await api.get(`/chat/private/${chatId}`);
    return response.data;
  }
};

/*
 * ====================================================================
 * SEÇÃO 5: SERVIÇOS DE GRUPOS
 * ====================================================================
 */

// ===== SERVIÇO DE GRUPOS =====
export const groupService = {
  
  // ===== OBTER GRUPOS =====
  getGroups: async () => {
    /*
     * Lista todos os grupos do sistema.
     * Pode incluir grupos públicos e privados.
     */
    const response = await api.get('/group');
    return response.data;
  },
  
  // ===== OBTER GRUPO POR ID =====
  getGroupById: async (id: string) => {
    /*
     * Busca detalhes de um grupo específico:
     * - Nome, descrição
     * - Lista de membros
     * - Lista de administradores
     * - Mensagens recentes
     */
    const response = await api.get(`/group/${id}`);
    return response.data;
  },
  
  // ===== CRIAR GRUPO =====
  createGroup: async (data: any) => {
    /*
     * Cria um novo grupo.
     * Dados podem incluir:
     * - name: nome do grupo
     * - description: descrição
     * - isPublic: se é público ou privado
     */
    const response = await api.post('/group', data);
    return response.data;
  },
  
  // ===== ATUALIZAR GRUPO =====
  updateGroup: async (id: string, data: any) => {
    /*
     * Atualiza dados de um grupo existente.
     * Só administradores podem fazer isso.
     */
    const response = await api.put(`/group/${id}`, data);
    return response.data;
  },
  
  // ===== DELETAR GRUPO =====
  deleteGroup: async (id: string) => {
    /*
     * Remove um grupo completamente.
     * Só o criador do grupo pode fazer isso.
     */
    const response = await api.delete(`/group/${id}`);
    return response.data;
  },
  
  // ===== ADICIONAR MEMBRO =====
  addMember: async (groupId: string, userId: string) => {
    /*
     * Adiciona uma pessoa ao grupo.
     * Administradores podem adicionar qualquer pessoa.
     */
    const response = await api.post(`/group/${groupId}/members/${userId}`);
    return response.data;
  },
  
  // ===== REMOVER MEMBRO =====
  removeMember: async (groupId: string, userId: string) => {
    /*
     * Remove uma pessoa do grupo.
     * Administradores podem remover qualquer pessoa.
     */
    const response = await api.delete(`/group/${groupId}/members/${userId}`);
    return response.data;
  },
  
  // ===== TORNAR ADMINISTRADOR =====
  makeAdmin: async (groupId: string, userId: string) => {
    /*
     * Dá privilégios de administrador para um membro.
     * Só administradores atuais podem fazer isso.
     */
    const response = await api.post(`/group/${groupId}/admins/${userId}`);
    return response.data;
  },
  
  // ===== REMOVER ADMINISTRADOR =====
  removeAdmin: async (groupId: string, userId: string) => {
    /*
     * Remove privilégios de administrador de alguém.
     */
    const response = await api.delete(`/group/${groupId}/admins/${userId}`);
    return response.data;
  }
};

/*
 * ====================================================================
 * SEÇÃO 6: SERVIÇOS DE ADMINISTRAÇÃO
 * ====================================================================
 */

// ===== SERVIÇO DE ADMINISTRAÇÃO =====
export const adminService = {
  
  // ===== OBTER USUÁRIOS (ADMIN) =====
  getUsers: async () => {
    /*
     * Visão administrativa de todos os usuários.
     * Pode incluir informações extras como:
     * - Status de banimento
     * - Data de cadastro
     * - Atividade recente
     */
    const response = await api.get('/users');
    return response.data;
  },
  
  // ===== OBTER GRUPOS (ADMIN) =====
  getGroups: async () => {
    /*
     * Visão administrativa de todos os grupos.
     * Administradores podem ver todos os grupos,
     * mesmo os privados.
     */
    const response = await api.get('/group');
    return response.data;
  },
  
  // ===== OBTER BANIMENTOS =====
  getBans: async () => {
    /*
     * Lista todos os usuários banidos do sistema.
     * Mostra motivo, data de banimento, etc.
     */
    const response = await api.get('/bans');
    return response.data;
  },
  
  // ===== BANIR USUÁRIO =====
  banUser: async (data: any) => {
    /*
     * Bane um usuário do sistema.
     * Dados podem incluir:
     * - userId: ID do usuário a ser banido
     * - reason: motivo do banimento
     * - duration: duração (temporário ou permanente)
     */
    const response = await api.post('/bans', data);
    return response.data;
  },
  
  // ===== DESBANIR USUÁRIO =====
  unbanUser: async (userId: string) => {
    /*
     * Remove o banimento de um usuário.
     * Ele volta a poder usar o sistema normalmente.
     */
    const response = await api.delete(`/bans/${userId}`);
    return response.data;
  }
};

/*
 * ====================================================================
 * EXPORTAÇÃO PADRÃO
 * ====================================================================
 */

// Exporta a instância do axios para uso direto se necessário
export default api;

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O api.ts é a "PONTE DE COMUNICAÇÃO" entre frontend e backend. Ele:
 * 
 * 1. 🌉 CONECTA SISTEMAS: Liga React (frontend) com NestJS (backend)
 * 2. 🔒 GERENCIA AUTENTICAÇÃO: Adiciona tokens automaticamente
 * 3. 🛡️ TRATA ERROS: Lida com tokens expirados e problemas de rede
 * 4. 📦 ORGANIZA FUNÇÕES: Agrupa por contexto (auth, users, chat, etc.)
 * 5. 🔄 PADRONIZA COMUNICAÇÃO: Todas as requisições seguem mesmo padrão
 * 
 * FLUXO TÍPICO DE USO:
 * 
 * Componente React chama: authService.login("João", "123")
 *     ↓
 * api.ts envia: POST /auth/login { name: "João", password: "123" }
 *     ↓
 * Interceptor adiciona: Authorization: Bearer <token> (se houver)
 *     ↓
 * Backend processa e responde: { access_token: "...", user: {...} }
 *     ↓
 * api.ts retorna dados para o componente
 *     ↓
 * Componente atualiza interface com os dados recebidos
 * 
 * VANTAGENS DESTA ORGANIZAÇÃO:
 * - Centralização: todos os endpoints ficam em um lugar
 * - Reutilização: qualquer componente pode usar essas funções
 * - Manutenção: fácil de alterar URLs ou adicionar novos endpoints
 * - Consistência: mesmo padrão de error handling em toda app
 * - Segurança: autenticação automática em todas as requisições
 * 
 * SEM ESTE ARQUIVO:
 * Cada componente teria que fazer suas próprias requisições HTTP,
 * gerenciar tokens manualmente e tratar erros individualmente.
 * Seria muito código repetido e difícil de manter!
 */
