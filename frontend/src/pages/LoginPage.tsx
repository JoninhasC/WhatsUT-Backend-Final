/**
 * 🔐 PÁGINA DE LOGIN E REGISTRO APRIMORADA
 * 
 * Componente redesenhado que gerencia autenticação de usuários,
 * com interface moderna e experiência aprimorada.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Users, Shield, Zap, UserPlus, LogIn } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardContent } from '../components/ui';
import toast from 'react-hot-toast';

type FormMode = 'login' | 'register';

interface FormData {
  name: string;
  password: string;
  confirmPassword?: string;
}

interface FormErrors {
  name?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function LoginPage() {
  const { login, register, isLoading } = useAuth();
  
  const [mode, setMode] = useState<FormMode>('login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (data.name.trim().length > 50) {
      newErrors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    if (!data.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (mode === 'register') {
      if (data.password.length < 8) {
        newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      } else if (!/(?=.*[a-z])/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos uma letra minúscula';
      } else if (!/(?=.*[A-Z])/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos uma letra maiúscula';
      } else if (!/(?=.*\d)/.test(data.password)) {
        newErrors.password = 'Senha deve conter pelo menos um número';
      }

      if (!data.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
      } else if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      if (mode === 'login') {
        await login({
          name: formData.name.trim(),
          password: formData.password,
        });
        toast.success('Login realizado com sucesso!');
        // O redirecionamento será feito automaticamente pelo ProtectedRoute
      } else {
        await register({
          name: formData.name.trim(),
          password: formData.password,
        });
        toast.success('Conta criada com sucesso! Agora faça seu login.');
        
        // Após registro bem-sucedido, muda para modo login e preenche o nome
        setMode('login');
        setFormData(prev => ({
          ...prev,
          password: '', // Limpa a senha por segurança
          confirmPassword: '',
        }));
        setErrors({}); // Limpa erros
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({
      name: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Lado esquerdo - Informações do app */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsUT</h1>
            </div>
            
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Conecte-se com seus colegas
            </h2>
            
            <p className="text-lg text-gray-600">
              A plataforma de comunicação da universidade que conecta estudantes e facilita a colaboração.
            </p>
          </div>

          {/* Features */}
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

        {/* Lado direito - Formulário */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0">
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

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Erro geral */}
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                )}

                {/* Campo Nome */}
                <Input
                  label="Nome completo"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={errors.name}
                  placeholder="Digite seu nome"
                  disabled={isLoading}
                />

                {/* Campo Senha */}
                <Input
                  label="Senha"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  isPassword
                />

                {/* Campo Confirmar Senha (apenas no registro) */}
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

                {/* Botão de submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={!isLoading && (mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                >
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              {/* Toggle entre login/register */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </p>
                <Button
                  variant="ghost"
                  onClick={toggleMode}
                  disabled={isLoading}
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
