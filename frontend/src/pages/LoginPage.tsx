// 📚 EXPLICAÇÃO DIDÁTICA: PÁGINA DE LOGIN E REGISTRO
// ==================================================
//
// 🎯 O QUE É ESTA PÁGINA?
// Esta é a "porta de entrada" da aplicação - onde usuários fazem login ou se cadastram
// É como a recepção de um prédio: você precisa se identificar antes de entrar
//
// 🏗️ ARQUITETURA DO COMPONENTE:
// - Estado local para controlar formulários
// - Validação de dados no frontend
// - Integração com Context API para autenticação
// - Interface responsiva e moderna
// - Tratamento de erros e feedback visual
//
// 🎨 DESIGN PATTERN USADO:
// - Controlled Components (React controla o estado dos inputs)
// - Form Validation (validação antes de enviar)
// - Error Boundaries (tratamento de erros)
// - State Management (gerenciamento de estado local)

/**
 * 🔐 PÁGINA DE LOGIN E REGISTRO APRIMORADA
 * 
 * Componente redesenhado que gerencia autenticação de usuários,
 * com interface moderna e experiência aprimorada.
 */

// 📦 IMPORTAÇÕES: Ferramentas que vamos usar
import { useState } from 'react';                    // 🔄 Hook para gerenciar estado local
import { useAuth } from '../contexts/AuthContext';   // 🔐 Hook customizado para autenticação
import { MessageSquare, Users, Shield, Zap, UserPlus, LogIn } from 'lucide-react'; // 🎨 Ícones
import { Button, Input, Card, CardHeader, CardContent } from '../components/ui'; // 🧩 Componentes reutilizáveis
import toast from 'react-hot-toast';                 // 🍞 Notificações toast

// 🏷️ TIPOS TYPESCRIPT: Definições de estruturas de dados
type FormMode = 'login' | 'register';  // 🔄 Modo do formulário: login ou registro

// 📋 Interface para dados do formulário
interface FormData {
  name: string;              // 👤 Nome do usuário
  password: string;          // 🔐 Senha
  confirmPassword?: string;  // ✅ Confirmação de senha (apenas no registro)
}

// ❌ Interface para erros de validação
interface FormErrors {
  name?: string;             // ❌ Erro no campo nome
  password?: string;         // ❌ Erro no campo senha
  confirmPassword?: string;  // ❌ Erro na confirmação
  general?: string;          // ❌ Erro geral (do servidor)
}

function LoginPage() {
  // 🔐 HOOK DE AUTENTICAÇÃO: Acesso às funções de login/registro
  const { login, register, isLoading } = useAuth();
  
  // 🔄 ESTADO DO MODO: Controla se está em login ou registro
  const [mode, setMode] = useState<FormMode>('login');
  
  // 📝 ESTADO DO FORMULÁRIO: Dados que o usuário está digitando
  const [formData, setFormData] = useState<FormData>({
    name: '',
    password: '',
    confirmPassword: '',
  });
  
  // ❌ ESTADO DOS ERROS: Mensagens de validação
  const [errors, setErrors] = useState<FormErrors>({});

  // ✅ FUNÇÃO DE VALIDAÇÃO: Verifica se os dados estão corretos
  // É como um "fiscal" que verifica se tudo está em ordem antes de processar
  const validateForm = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    // 👤 VALIDAÇÃO DO NOME
    if (!data.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (data.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    // 🔐 VALIDAÇÃO DA SENHA
    if (!data.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (mode === 'register') {
      // 📏 Validações mais rigorosas apenas no registro
      if (data.password.length < 8) {
        newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      } else if (!/(?=.*[a-z])/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos uma letra minúscula';
      } else if (!/(?=.*[A-Z])/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos uma letra maiúscula';
      } else if (!/(?=.*\d)/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos um número';
      }

      // ✅ VALIDAÇÃO DA CONFIRMAÇÃO DE SENHA (apenas no registro)
      if (!data.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
      } else if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    return newErrors;
  };

  // 📤 FUNÇÃO DE ENVIO DO FORMULÁRIO
  // É o "processador principal" que tenta fazer login ou registro
  const handleSubmit = async (e: React.FormEvent) => {
    // 🛑 Previne o comportamento padrão do form (recarregar página)
    e.preventDefault();
    
    // 1️⃣ VALIDAÇÃO LOCAL: Verifica se dados estão corretos
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    // Se há erros, para por aqui (não envia para o servidor)
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // 2️⃣ TENTATIVA DE AUTENTICAÇÃO: Envia dados para o servidor
      if (mode === 'login') {
        // 🔑 FLUXO DE LOGIN
        await login({
          name: formData.name.trim(),      // Remove espaços em branco
          password: formData.password,
        });
        toast.success('Login realizado com sucesso!');
        // 📍 O redirecionamento será feito automaticamente pelo ProtectedRoute
      } else {
        // 📝 FLUXO DE REGISTRO
        await register({
          name: formData.name.trim(),
          password: formData.password,
        });
        toast.success('Conta criada com sucesso! Agora faça seu login.');
        
        // 🔄 Após registro bem-sucedido, muda para modo login
        setMode('login');
        setFormData(prev => ({
          ...prev,
          password: '',        // 🔐 Limpa a senha por segurança
          confirmPassword: '',
        }));
        setErrors({}); // 🧹 Limpa erros
      }
    } catch (error: any) {
      // 3️⃣ TRATAMENTO DE ERROS: Se algo deu errado
      console.error('Erro de autenticação:', error);
      
      // 🔍 Extrai mensagem de erro do servidor ou usa mensagem padrão
      let errorMessage = 'Erro desconhecido';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;  // Erro específico do servidor
      } else if (error?.message) {
        errorMessage = error.message;                // Erro genérico
      }
      
      console.error('Mensagem de erro final:', errorMessage);
      
      // 📝 Mostra erro no formulário
      setErrors({ general: errorMessage });
      
      // 🍞 Toast de erro com configuração personalizada
      toast.error(errorMessage, {
        duration: 8000,        // 8 segundos
        position: 'top-center',
        style: {
          background: '#dc2626', // Vermelho
          color: '#fff',
          fontSize: '16px',
          padding: '16px',
          borderRadius: '8px',
          maxWidth: '500px',
        },
      });
    }
  };

  // ✏️ FUNÇÃO PARA MUDANÇAS NOS INPUTS
  // Cria uma função específica para cada campo do formulário
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // 📝 Atualiza o valor do campo específico
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // 🧹 Limpar erro do campo quando usuário começar a digitar
    // É como apagar um rascunho quando você começa a escrever de novo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // 🔄 FUNÇÃO PARA ALTERNAR ENTRE LOGIN E REGISTRO
  // É como trocar de aba em um navegador
  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    // 🧹 Limpa todos os dados quando troca de modo
    setFormData({
      name: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});  // 🧹 Limpa erros também
  };

  // 🎨 RENDERIZAÇÃO DO COMPONENTE (JSX)
  // Esta é a "interface visual" que o usuário vê
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* 🎯 LADO ESQUERDO - Informações do app */}
        {/* É como um "cartaz promocional" que explica o que é o app */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            {/* 🏷️ Logo e título */}
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsUT</h1>
            </div>
            
            {/* 📝 Título principal */}
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Conecte-se com seus colegas
            </h2>
            
            {/* 📄 Descrição */}
            <p className="text-lg text-gray-600">
              A plataforma de comunicação da universidade que conecta estudantes e facilita a colaboração.
            </p>
          </div>

          {/* ✨ SEÇÃO DE FUNCIONALIDADES */}
          {/* Mostra os principais benefícios do app */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Chats em Grupo</h3>
                <p className="text-sm text-gray-600">Organize conversas por matérias e projetos</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Seguro</h3>
                <p className="text-sm text-gray-600">Suas conversas são protegidas e privadas</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tempo Real</h3>
                <p className="text-sm text-gray-600">Mensagens instantâneas e notificações</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 LADO DIREITO - Formulário */}
        {/* É o "balcão de atendimento" onde o usuário faz login/registro */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0">
            {/* 🏷️ CABEÇALHO DO FORMULÁRIO */}
            <CardHeader className="text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'login' 
                    ? 'Acesse sua conta para continuar'
                    : 'Crie sua conta e comece a conversar'
                  }
                </p>
              </div>
            </CardHeader>

            {/* 📋 CONTEÚDO DO FORMULÁRIO */}
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ❌ EXIBIÇÃO DE ERRO GERAL */}
                {/* Aparece quando há erros do servidor */}
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                )}

                {/* 👤 CAMPO NOME */}
                <Input
                  label="Nome completo"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={errors.name}
                  placeholder="Digite seu nome"
                  disabled={isLoading}
                />

                {/* 🔐 CAMPO SENHA */}
                <Input
                  label="Senha"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  isPassword  // 👁️ Ativa funcionalidade de mostrar/ocultar senha
                />

                {/* ✅ CAMPO CONFIRMAR SENHA (apenas no registro) */}
                {/* Renderização condicional - só aparece quando mode === 'register' */}
                {mode === 'register' && (
                  <Input
                    label="Confirmar senha"
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange('confirmPassword')}
                    error={errors.confirmPassword}
                    placeholder="Confirme sua senha"
                    disabled={isLoading}
                    isPassword
                  />
                )}

                {/* 🚀 BOTÃO DE SUBMIT */}
                {/* O botão principal que envia o formulário */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}  // 🔄 Mostra spinner quando está carregando
                  leftIcon={!isLoading && (mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                >
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              {/* 🔄 TOGGLE ENTRE LOGIN/REGISTER */}
              {/* Link para alternar entre os modos */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </p>
                <Button
                  variant="ghost"        // 👻 Estilo "fantasma" (sem fundo)
                  onClick={toggleMode}   // 🔄 Chama função para trocar modo
                  disabled={isLoading}   // 🚫 Desabilita durante carregamento
                  className="mt-2"
                >
                  {mode === 'login' ? 'Criar conta' : 'Fazer login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

// 📝 RESUMO EDUCATIVO: O QUE APRENDEMOS NESTE COMPONENTE
// =======================================================
//
// 🎯 CONCEITOS REACT FUNDAMENTAIS:
// 1. 🪝 useState - Gerenciamento de estado local
// 2. 🎨 JSX - Sintaxe para criar interfaces
// 3. 🔄 Conditional Rendering - Mostrar elementos condicionalmente
// 4. 📋 Form Handling - Manipulação de formulários
// 5. 🎭 Event Handling - Tratamento de eventos
//
// 🏗️ PADRÕES DE DESIGN:
// 1. 🎛️ Controlled Components - React controla os inputs
// 2. ✅ Form Validation - Validação antes do envio
// 3. 🔄 State Management - Gerenciamento organizado do estado
// 4. 📱 Responsive Design - Interface adaptável a diferentes telas
// 5. 🎨 Component Composition - Combinação de componentes menores
//
// 🛡️ BOAS PRÁTICAS DE SEGURANÇA:
// 1. 🧹 Sanitização de dados (trim())
// 2. ✅ Validação no frontend E backend
// 3. 🔐 Não armazenar senhas em texto puro
// 4. ❌ Limpeza de dados sensíveis após uso
// 5. 🍞 Feedback visual apropriado para erros
//
// 🎨 UX/UI PATTERNS:
// 1. 📱 Mobile-first design
// 2. 🔄 Loading states (isLoading)
// 3. ❌ Error handling visível
// 4. 🍞 Toast notifications
// 5. ♿ Accessibility considerations
//
// 🔧 TYPESCRIPT BENEFITS:
// 1. 🏷️ Type safety para props e state
// 2. 📋 Interfaces para estruturar dados
// 3. 🔍 IntelliSense e autocompletar
// 4. 🛡️ Prevenção de erros em compile-time
// 5. 📚 Autodocumentação do código
//
// 💡 PRÓXIMOS PASSOS PARA APRIMORAMENTO:
// 1. 📱 PWA (Progressive Web App) capabilities
// 2. 🌐 Internacionalização (i18n)
// 3. 🎭 Animações e transições
// 4. ♿ Melhor acessibilidade (ARIA)
// 5. 🧪 Testes automatizados (Jest/Testing Library)
