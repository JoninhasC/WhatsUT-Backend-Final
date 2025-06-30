# 📱 WhatsUT - Guia Completo para Iniciantes

## 🎯 O que é o WhatsUT?

O WhatsUT é um **aplicativo de chat completo** similar ao WhatsApp, desenvolvido para fins educacionais. É como um "laboratório" onde você pode aprender conceitos fundamentais de desenvolvimento web moderno, incluindo:

- **Backend**: API REST com autenticação JWT
- **Frontend**: Interface React moderna e responsiva
- **Real-time**: Chat em tempo real com WebSockets
- **Segurança**: Criptografia de senhas e proteção de rotas
- **Persistência**: Dados salvos em arquivos CSV (fácil de entender)

## 🏗️ Arquitetura do Sistema

### 📊 Visão Geral
```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│    FRONTEND     │ ◄─────────────────► │     BACKEND     │
│   (React.js)    │                     │   (NestJS)      │
│                 │                     │                 │
│ • Interface     │                     │ • API REST      │
│ • Estado Global │                     │ • Autenticação  │
│ • WebSocket     │                     │ • WebSocket     │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   DADOS (CSV)   │
                                        │                 │
                                        │ • users.csv     │
                                        │ • chats.csv     │
                                        │ • groups.csv    │
                                        │ • bans.csv      │
                                        └─────────────────┘
```

## 📁 Estrutura Detalhada do Projeto

### 🔧 Backend (`src/`)

```
src/
├── 🔐 auth/                    # Sistema de Autenticação
│   ├── auth.controller.ts      # Recebe requisições de login/logout
│   ├── auth.service.ts         # Lógica de verificação de senhas e tokens
│   ├── jwt-auth.guard.ts       # "Porteiro" que verifica se está logado
│   ├── jwt.strategy.ts         # Define como verificar tokens JWT
│   └── online-users.service.ts # Controla quem está online
│
├── 👥 users/                   # Gerenciamento de Usuários
│   ├── users.controller.ts     # Endpoints para buscar/atualizar usuários
│   ├── users.service.ts        # Lógica de criação e busca de usuários
│   ├── csv-user.repository.ts  # Acesso direto ao arquivo users.csv
│   └── dto/                    # "Moldes" que definem como os dados devem ser
│
├── 💬 chat/                    # Sistema de Chat
│   ├── chat.controller.ts      # Endpoints para enviar/receber mensagens
│   ├── chat.service.ts         # Lógica de mensagens e conversas
│   └── chat.repository.ts      # Acesso ao arquivo chats.csv
│
├── 👨‍👩‍👧‍👦 group/                   # Sistema de Grupos
│   ├── group.controller.ts     # Endpoints para criar/gerenciar grupos
│   ├── group.service.ts        # Lógica de grupos e membros
│   └── group.repository.ts     # Acesso ao arquivo groups.csv
│
├── ⚡ realtime/                # WebSocket (Chat em Tempo Real)
│   ├── chat.gateway.ts         # Gerencia conexões WebSocket
│   └── realtime.module.ts      # Configuração do sistema real-time
│
├── 🚫 bans/                    # Sistema de Banimentos
│   └── ...                     # Gerencia usuários banidos
│
└── 🛠️ utils/                   # Utilitários
    └── CSV.ts                  # Funções para ler/escrever arquivos CSV
```

### 🎨 Frontend (`frontend/src/`)

```
src/
├── 🔄 contexts/                # Estado Global da Aplicação
│   └── AuthContext.tsx         # Gerencia login/logout em toda a app
│
├── 🌐 services/                # Comunicação com Backend
│   └── api.ts                  # Todas as funções que chamam a API
│
├── 📄 pages/                   # Páginas da Aplicação
│   ├── LoginPage.tsx           # Tela de login
│   ├── EnhancedChatPage.tsx    # Tela principal do chat
│   ├── GroupsPage.tsx          # Tela de grupos
│   ├── UsersPage.tsx           # Lista de usuários
│   └── AdminPage.tsx           # Painel administrativo
│
├── 🧩 components/              # Componentes Reutilizáveis
│   ├── LoadingSpinner.tsx      # Indicador de carregamento
│   └── ui/                     # Componentes de interface
│
├── 🔧 hooks/                   # Lógica Reutilizável
│   └── useNotifications.ts     # Gerencia notificações
│
├── 📝 types/                   # Definições de Tipos
│   └── index.ts                # Tipos TypeScript do projeto
│
└── 🎨 utils/                   # Funções Utilitárias
    └── cn.ts                   # Utilitários de CSS
```

### 📊 Dados (`data/`)

```
data/
├── users.csv      # Todos os usuários cadastrados
├── chats.csv      # Todas as mensagens enviadas
├── groups.csv     # Todos os grupos criados
└── bans.csv       # Usuários banidos do sistema
```

## 🔄 Como o Sistema Funciona?

### 1. 🔐 Fluxo de Autenticação

```
1. Usuário preenche login/senha no frontend
   ↓
2. Frontend chama authService.login()
   ↓
3. api.ts envia POST /auth/login para backend
   ↓
4. AuthController recebe requisição
   ↓
5. AuthService verifica senha com bcrypt
   ↓
6. Se correto: gera token JWT + retorna dados
   ↓
7. Frontend salva token no localStorage
   ↓
8. AuthContext atualiza estado global (isAuthenticated = true)
   ↓
9. Todas as páginas protegidas ficam acessíveis
```

### 2. 💬 Fluxo de Mensagens

```
1. Usuário digita mensagem e clica "Enviar"
   ↓
2. Frontend chama chatService.sendMessage()
   ↓
3. api.ts adiciona token automaticamente (interceptor)
   ↓
4. Backend verifica token (JwtAuthGuard)
   ↓
5. ChatController processa mensagem
   ↓
6. ChatService salva no chats.csv
   ↓
7. WebSocket notifica outros usuários em tempo real
   ↓
8. Frontend de outros usuários recebe mensagem automaticamente
```

### 3. 🛡️ Proteção de Rotas

```
Requisição para rota protegida
   ↓
JwtAuthGuard intercepta
   ↓
Verifica se há token no header Authorization
   ↓
JwtStrategy valida token com chave secreta
   ↓
Se válido: extrai dados do usuário + permite acesso
Se inválido: retorna erro 401
```

## 🔑 Conceitos Importantes

### 🎯 JWT (JSON Web Token)
- **O que é**: Uma "carteirinha digital" que prova quem você é
- **Como funciona**: Contém seus dados + assinatura digital impossível de falsificar
- **Onde fica**: Salvo no localStorage do navegador
- **Validade**: Expira após certo tempo (configurável)

### 🔒 bcrypt (Criptografia de Senhas)
- **O que é**: Algoritmo que "embaralha" senhas de forma irreversível
- **Por que usar**: Mesmo se alguém acessar o banco de dados, não consegue ver as senhas
- **Como funciona**: `senha123` vira `$2b$10$abcdef...xyz` (60 caracteres)

### ⚡ WebSocket (Tempo Real)
- **O que é**: Conexão permanente entre frontend e backend
- **Para que serve**: Mensagens aparecem instantaneamente sem precisar recarregar
- **Como funciona**: Como uma "ligação telefônica" sempre aberta entre navegador e servidor

### 🌐 React Context (Estado Global)
- **O que é**: Uma forma de compartilhar dados entre todos os componentes
- **Para que serve**: Saber se usuário está logado em qualquer lugar da app
- **Como funciona**: Como uma "central de informações" que todos podem consultar

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou pnpm
- Git

### 🔧 Setup do Backend
```bash
# Navegar para a raiz do projeto
cd WhatsUT-Backend-Final

# Instalar dependências
npm install

# Criar arquivo .env (opcional)
echo "JWT_SECRET=minha_chave_super_secreta" > .env

# Rodar o backend
npm run start:dev
```

### 🎨 Setup do Frontend
```bash
# Navegar para o frontend
cd frontend

# Instalar dependências
npm install

# Rodar o frontend
npm run dev
```

### ✅ Testar se Funcionou
1. Backend rodando em: `http://localhost:3000`
2. Frontend rodando em: `http://localhost:5173`
3. Abrir navegador e acessar o frontend
4. Criar conta ou fazer login com usuário existente

## 🎓 O que Você Vai Aprender

### 🔧 Backend (NestJS)
- ✅ **API REST**: Como criar endpoints que respondem a requisições HTTP
- ✅ **Autenticação JWT**: Como verificar se usuários estão logados
- ✅ **Criptografia**: Como proteger senhas de forma segura
- ✅ **WebSockets**: Como fazer comunicação em tempo real
- ✅ **Arquitetura**: Como organizar código de forma profissional
- ✅ **Validação**: Como garantir que dados chegam no formato correto
- ✅ **Error Handling**: Como tratar erros de forma elegante

### 🎨 Frontend (React)
- ✅ **React Hooks**: useState, useEffect, useContext, useReducer
- ✅ **Estado Global**: Como compartilhar dados entre componentes
- ✅ **Requisições HTTP**: Como se comunicar com APIs
- ✅ **Autenticação**: Como gerenciar login/logout no frontend
- ✅ **TypeScript**: Como tipar dados para evitar erros
- ✅ **Real-time**: Como receber atualizações instantâneas
- ✅ **UI/UX**: Como criar interfaces bonitas e funcionais

### 🛠️ Conceitos Gerais
- ✅ **Arquitetura de Software**: Como organizar um projeto real
- ✅ **Segurança**: Como proteger aplicações web
- ✅ **APIs**: Como sistemas diferentes se comunicam
- ✅ **Persistência**: Como salvar e recuperar dados
- ✅ **Deploy**: Como colocar aplicações no ar
- ✅ **Debug**: Como encontrar e corrigir problemas

## 🔍 Arquivos Principais Comentados

Criamos versões didáticas dos arquivos mais importantes:

### Backend
- **`auth.service.ts`**: Já comentado detalhadamente (coração da autenticação)
- **`auth.controller.ts`**: Já comentado (recepção de requisições)
- **`jwt-auth.guard.ts`**: Já comentado (porteiro digital)
- **`jwt.strategy.ts`**: Já comentado (verificador de tokens)
- **`users.service.ts`**: Já comentado (gerenciador de usuários)

### Frontend
- **`AuthContext-EXPLICACAO.tsx`**: Versão comentada do gerenciador de estado global
- **`api-EXPLICACAO.ts`**: Versão comentada do comunicador com backend

## 🎯 Próximos Passos

### Para Iniciantes
1. **Leia os comentários**: Comece pelos arquivos já comentados
2. **Execute o projeto**: Veja funcionando primeiro
3. **Faça mudanças pequenas**: Altere textos, cores, etc.
4. **Entenda o fluxo**: Acompanhe desde o clique até o banco de dados

### Para Avançar
1. **Adicione funcionalidades**: Emojis, anexos, notificações
2. **Melhore a UI**: Temas, animações, responsividade
3. **Otimize performance**: Lazy loading, cache, paginação
4. **Adicione testes**: Unit tests, integration tests
5. **Faça deploy**: Heroku, Vercel, AWS

## 🆘 Problemas Comuns e Soluções

### Backend não inicia
```bash
# Verificar se porta 3000 está ocupada
netstat -ano | findstr :3000

# Matar processo se necessário
taskkill /PID <PID_NUMBER> /F

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Frontend não conecta
- Verificar se backend está rodando
- Verificar se URL no `api.ts` está correta
- Abrir DevTools e verificar erros no console

### Erro 401 (Unauthorized)
- Token pode ter expirado
- Fazer logout e login novamente
- Verificar se JWT_SECRET é o mesmo no backend

### WebSocket não funciona
- Verificar se backend real-time está ativo
- Verificar firewall e antivírus
- Testar em navegador diferente

## 💡 Dicas de Estudo

1. **Use o Console**: `console.log()` é seu melhor amigo
2. **DevTools do Navegador**: Network tab mostra todas as requisições
3. **Postman**: Teste endpoints independentemente
4. **Git**: Faça commits pequenos e frequentes
5. **Documentação**: Leia docs oficiais do React e NestJS

## 🎉 Conclusão

O WhatsUT é um projeto educacional completo que abrange todas as tecnologias modernas de desenvolvimento web. Cada arquivo foi pensado para ensinar conceitos específicos de forma didática.

**Lembre-se**: Programação se aprende fazendo! Não tenha medo de experimentar, quebrar e consertar. É assim que se aprende de verdade.

Boa sorte na sua jornada de aprendizado! 🚀

---

**📚 Recursos Adicionais:**
- [Documentação React](https://react.dev/)
- [Documentação NestJS](https://nestjs.com/)
- [JWT.io](https://jwt.io/) - Para entender tokens
- [Axios Docs](https://axios-http.com/) - Para requisições HTTP
