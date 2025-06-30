/**
 * 📱 COMPONENTE INPUT REUTILIZÁVEL - WHATSUT FRONTEND
 * 
 * 🎓 CONCEITO EDUCACIONAL:
 * Este é um componente React reutilizável que cria campos de entrada (inputs)
 * personalizados e profissionais para nossa aplicação.
 * 
 * ANALOGIA: É como criar um "molde" para fabricar formulários.
 * Ao invés de escrever HTML de input básico toda vez, usamos este
 * componente que já vem com recursos avançados prontos.
 * 
 * 🏗️ ARQUITETURA DO COMPONENTE:
 * - Input básico + recursos extras (ícones, validação, senha)
 * - Reutilizável em qualquer lugar da aplicação
 * - Consistência visual em todos os formulários
 * - Acessibilidade e experiência do usuário aprimoradas
 * 
 * 🎯 RECURSOS INCLUÍDOS:
 * ✅ Labels (rótulos) automáticos
 * ✅ Mensagens de erro com estilo
 * ✅ Ícones à esquerda e direita
 * ✅ Campo de senha com botão mostrar/ocultar
 * ✅ Textos de ajuda
 * ✅ Estados visuais (erro, foco, desabilitado)
 * ✅ Responsivo e moderno
 */

// 📦 IMPORTAÇÕES NECESSÁRIAS
import React from 'react'; // 🛠️ Biblioteca principal do React
import { cn } from '../../utils/cn'; // 🎨 Utilitário para combinar classes CSS
import { Eye, EyeOff } from 'lucide-react'; // 👁️ Ícones para mostrar/ocultar senha

/**
 * 📋 INTERFACE DAS PROPRIEDADES DO COMPONENTE
 * 
 * 📚 CONCEITO - TypeScript Interface:
 * Define que "contrato" (propriedades) nosso componente aceita.
 * É como uma "lista de ingredientes" que você pode passar para o componente.
 * 
 * 🔧 EXTENDS: Herdamos todas as propriedades padrão de um input HTML
 * e adicionamos nossas propriedades personalizadas.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;        // 📝 Texto do rótulo acima do campo
  error?: string;        // ❌ Mensagem de erro para exibir
  helperText?: string;   // 💡 Texto de ajuda explicativo
  leftIcon?: React.ReactNode;  // 🎯 Ícone no lado esquerdo
  rightIcon?: React.ReactNode; // 🎯 Ícone no lado direito
  isPassword?: boolean;  // 🔒 Se é campo de senha (com botão mostrar/ocultar)
}

/**
 * 🏗️ COMPONENTE INPUT PRINCIPAL
 * 
 * 📚 CONCEITO - React.forwardRef:
 * Permite que componentes pais acessem diretamente o elemento input
 * interno deste componente. É como permitir que alguém "passe por cima"
 * do nosso componente para mexer diretamente no input HTML.
 * 
 * 🎯 USO PRÁTICO: Necessário para bibliotecas de formulários
 * como React Hook Form acessarem o input diretamente.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,           // 🎨 Classes CSS extras
    type = 'text',       // 📝 Tipo do input (text, email, etc.)
    label,               // 📝 Rótulo do campo
    error,               // ❌ Mensagem de erro
    helperText,          // 💡 Texto de ajuda
    leftIcon,            // 🎯 Ícone esquerdo
    rightIcon,           // 🎯 Ícone direito
    isPassword = false,  // 🔒 Se é campo de senha
    ...props             // ⚡ Todas as outras propriedades padrão do input
  }, ref) => {
    
    /**
     * 👁️ ESTADO PARA CONTROLAR VISIBILIDADE DA SENHA
     * 
     * 📚 CONCEITO - useState Hook:
     * Permite que nosso componente "lembre" se a senha está
     * sendo mostrada ou ocultada.
     * 
     * ANALOGIA: É como um botão de liga/desliga que lembra
     * em que posição está (ligado ou desligado).
     */
    const [showPassword, setShowPassword] = React.useState(false);
    
    /**
     * 🔄 LÓGICA PARA DETERMINAR O TIPO DO INPUT
     * 
     * 📚 CONCEITO - Conditional Logic:
     * Decide dinamicamente se o input deve ser tipo "password"
     * (oculta o texto) ou "text" (mostra o texto).
     * 
     * 🔧 FUNCIONAMENTO:
     * - Se isPassword=true E showPassword=false → tipo "password" (oculto)
     * - Se isPassword=true E showPassword=true → tipo "text" (visível)
     * - Se isPassword=false → usa o tipo original passado
     */
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    /**
     * 🎨 ESTRUTURA JSX DO COMPONENTE
     * 
     * 📚 CONCEITO - JSX:
     * É uma mistura de JavaScript com HTML que permite
     * criar interfaces de usuário declarativas.
     * 
     * 🏗️ ESTRUTURA:
     * 1. Container principal (div)
     * 2. Label opcional
     * 3. Container do input com ícones
     * 4. Input principal
     * 5. Botão mostrar/ocultar senha (se aplicável)
     * 6. Ícone direito (se aplicável)
     * 7. Mensagem de erro ou texto de ajuda
     */
    return (
      <div className="space-y-2">
        {/* 📝 LABEL (RÓTULO) CONDICIONAL */}
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        {/* 📦 CONTAINER DO INPUT COM POSICIONAMENTO RELATIVO */}
        {/* 
         * 📚 CONCEITO - position: relative:
         * Permite que elementos filhos (ícones) sejam posicionados
         * de forma absoluta dentro deste container.
         * 
         * ANALOGIA: É como definir um "sistema de coordenadas local"
         * para posicionar os ícones exatamente onde queremos.
         */}
        <div className="relative">
          
          {/* 🎯 ÍCONE À ESQUERDA (CONDICIONAL) */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          {/* 📱 INPUT PRINCIPAL */}
          <input
            type={inputType}
            className={cn(
              // 🎨 ESTILOS BASE DO INPUT
              'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed',
              
              // 🎯 ESPAÇAMENTO CONDICIONAL PARA ÍCONES
              // Se tem ícone à esquerda, adiciona padding-left extra
              leftIcon && 'pl-10',
              
              // Se tem ícone à direita OU é campo de senha, adiciona padding-right extra
              (rightIcon || isPassword) && 'pr-10',
              
              // 🎨 ESTILOS CONDICIONAIS PARA ERRO
              // Se tem erro: borda vermelha, se não: borda cinza
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300',
              
              // 🎨 CLASSES ADICIONAIS PASSADAS COMO PROP
              className
            )}
            ref={ref}    // 🔗 Referência para acesso direto ao input
            {...props}   // ⚡ Todas as outras propriedades (placeholder, onChange, etc.)
          />
          
          {/* 👁️ BOTÃO MOSTRAR/OCULTAR SENHA (CONDICIONAL) */}
          {isPassword && (
            <button
              type="button"  // 🚫 Impede submit do formulário ao clicar
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)} // 🔄 Inverte o estado
            >
              {/* 🎯 ÍCONE DINÂMICO: Eye quando oculto, EyeOff quando visível */}
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          
          {/* 🎯 ÍCONE À DIREITA (CONDICIONAL) */}
          {/* Só mostra se não é campo de senha (para não conflitar com o botão) */}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* ❌ MENSAGEM DE ERRO (CONDICIONAL) */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {/* 💡 TEXTO DE AJUDA (CONDICIONAL) */}
        {/* Só mostra se não há erro (prioridade para mensagem de erro) */}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

/**
 * 🏷️ NOME DE EXIBIÇÃO PARA FERRAMENTAS DE DEBUG
 * 
 * 📚 CONCEITO:
 * Define um nome amigável para o componente que aparecerá
 * em ferramentas de desenvolvedor do React.
 * 
 * Sem isso, componentes criados com forwardRef aparecem
 * como "ForwardRef" nas ferramentas, o que não é útil.
 */
Input.displayName = 'Input';

/**
 * 🎓 EXEMPLOS DE USO DESTE COMPONENTE:
 * 
 * 📧 Campo de email básico:
 * ```tsx
 * <Input 
 *   type="email"
 *   label="Seu email"
 *   placeholder="digite@seuemail.com"
 * />
 * ```
 * 
 * 🔒 Campo de senha com validação:
 * ```tsx
 * <Input 
 *   isPassword
 *   label="Senha"
 *   error={senhaError}
 *   helperText="Mínimo 8 caracteres"
 * />
 * ```
 * 
 * 🔍 Campo de busca com ícone:
 * ```tsx
 * <Input 
 *   label="Buscar usuários"
 *   leftIcon={<SearchIcon />}
 *   placeholder="Digite o nome do usuário..."
 * />
 * ```
 * 
 * 🎓 RESUMO EDUCACIONAL:
 * 
 * 📋 CONCEITOS APRENDIDOS:
 * 1. **Componentes Reutilizáveis**: Como criar componentes que podem ser usados em vários lugares
 * 2. **TypeScript Interfaces**: Como definir "contratos" para propriedades
 * 3. **forwardRef**: Como permitir acesso direto a elementos internos
 * 4. **useState Hook**: Como gerenciar estado local do componente
 * 5. **Conditional Rendering**: Como mostrar/ocultar elementos baseado em condições
 * 6. **CSS Classes Dinâmicas**: Como aplicar estilos condicionalmente
 * 7. **Acessibilidade**: Labels, estados visuais e navegação por teclado
 * 8. **Composição**: Como combinar elementos simples em componentes complexos
 * 
 * 🎯 VANTAGENS DESTA ABORDAGEM:
 * ✅ **Consistência**: Todos os inputs da aplicação têm a mesma aparência
 * ✅ **Produtividade**: Não precisa reescrever HTML básico toda vez
 * ✅ **Manutenibilidade**: Mudanças no design afetam todos os inputs automaticamente
 * ✅ **Acessibilidade**: Recursos de acessibilidade incluídos por padrão
 * ✅ **Flexibilidade**: Muitas opções de customização via props
 * ✅ **Experiência do Usuário**: Recursos avançados como mostrar/ocultar senha
 * 
 * 🔗 ONDE É USADO:
 * - Formulário de login (LoginPage)
 * - Formulários de cadastro
 * - Campos de busca
 * - Configurações de perfil
 * - Qualquer lugar que precise de input de texto
 * 
 * 💡 PRÓXIMOS PASSOS:
 * 1. Adicionar mais tipos de validação
 * 2. Implementar máscaras de input (telefone, CPF, etc.)
 * 3. Adicionar suporte a temas (modo escuro)
 * 4. Melhorar acessibilidade com ARIA labels
 * 5. Adicionar animações de transição
 */
