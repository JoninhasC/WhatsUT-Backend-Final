/**
 * 🔘 COMPONENTE BUTTON REUTILIZÁVEL - WHATSUT FRONTEND
 * 
 * 🎓 CONCEITO EDUCACIONAL:
 * Este é um componente React que cria botões personalizados e profissionais
 * para nossa aplicação, com diferentes estilos, tamanhos e estados.
 * 
 * ANALOGIA: É como ter uma "fábrica de botões" que pode produzir
 * diferentes tipos de botões (primário, secundário, etc.) com base
 * nas "especificações" (props) que você fornece.
 * 
 * 🎯 POR QUE CRIAR UM COMPONENTE BUTTON?
 * - Consistência visual em toda aplicação
 * - Comportamentos padronizados (loading, disabled, etc.)
 * - Facilita manutenção (mudar um arquivo afeta todos os botões)
 * - Melhora acessibilidade automaticamente
 * - Reduz duplicação de código
 * 
 * 🏗️ RECURSOS INCLUÍDOS:
 * ✅ 5 variantes visuais (primary, secondary, outline, ghost, destructive)
 * ✅ 3 tamanhos diferentes (sm, md, lg)
 * ✅ Estado de loading com spinner
 * ✅ Ícones à esquerda e direita
 * ✅ Estados disabled automáticos
 * ✅ Transições suaves
 * ✅ Foco para acessibilidade
 */

// 📦 IMPORTAÇÕES NECESSÁRIAS
import React from 'react'; // 🛠️ Biblioteca principal do React
import { cn } from '../../utils/cn'; // 🎨 Utilitário para combinar classes CSS
import { Loader2 } from 'lucide-react'; // ⏳ Ícone de carregamento animado

/**
 * 📋 INTERFACE DAS PROPRIEDADES DO COMPONENTE
 * 
 * 📚 CONCEITO - TypeScript Interface:
 * Define que propriedades nosso componente aceita.
 * Estendemos as propriedades padrão de um botão HTML e
 * adicionamos nossas propriedades personalizadas.
 * 
 * 🔧 EXTENDS: Herdamos todas as propriedades nativas de um button
 * (onClick, onMouseOver, style, etc.) e adicionamos as nossas.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'; // 🎨 Estilo visual
  size?: 'sm' | 'md' | 'lg';           // 📏 Tamanho do botão
  isLoading?: boolean;                 // ⏳ Estado de carregamento
  leftIcon?: React.ReactNode;          // 🎯 Ícone no lado esquerdo
  rightIcon?: React.ReactNode;         // 🎯 Ícone no lado direito
}

/**
 * 🎨 MAPEAMENTO DOS ESTILOS VISUAIS (VARIANTES)
 * 
 * 📚 CONCEITO - Object Mapping:
 * Criamos um objeto que mapeia cada variante para suas classes CSS.
 * É como ter um "catálogo de estilos" que podemos consultar.
 * 
 * 🎯 CADA VARIANTE SERVE PARA:
 * - primary: Ação principal (salvar, enviar, confirmar)
 * - secondary: Ação secundária (cancelar, voltar)
 * - outline: Ação neutra com destaque sutil
 * - ghost: Ação discreta (links, ações opcionais)
 * - destructive: Ações perigosas (deletar, remover)
 */
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700',
  ghost: 'hover:bg-gray-100 text-gray-700',
  destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

/**
 * 📏 MAPEAMENTO DOS TAMANHOS
 * 
 * 📚 CONCEITO - Size Variants:
 * Define diferentes tamanhos de botão para diferentes contextos.
 * 
 * 🎯 QUANDO USAR CADA TAMANHO:
 * - sm (small): Botões em tabelas, ações secundárias, espaços pequenos
 * - md (medium): Tamanho padrão para a maioria dos botões
 * - lg (large): Botões principais, CTAs importantes, mobile
 */
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',    // 🐁 Pequeno
  md: 'px-4 py-2 text-sm',      // 📱 Médio (padrão)
  lg: 'px-6 py-3 text-base',    // 🖥️ Grande
};

/**
 * 🏗️ COMPONENTE BUTTON PRINCIPAL
 * 
 * 📚 CONCEITO - React.forwardRef:
 * Permite que componentes pais acessem diretamente o elemento button
 * interno. Útil para bibliotecas de formulários e testes automatizados.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,                   // 🎨 Classes CSS extras
    variant = 'primary',         // 🎨 Estilo visual (padrão: primary)
    size = 'md',                 // 📏 Tamanho (padrão: medium)
    isLoading = false,           // ⏳ Estado de carregamento (padrão: false)
    leftIcon,                    // 🎯 Ícone esquerdo
    rightIcon,                   // 🎯 Ícone direito
    children,                    // 📝 Conteúdo interno do botão (texto)
    disabled,                    // 🚫 Estado desabilitado
    ...props                     // ⚡ Todas as outras propriedades nativas
  }, ref) => {
    
    /**
     * 🎨 ESTRUTURA JSX DO COMPONENTE
     * 
     * 📚 CONCEITO - Conditional Rendering:
     * Mostramos diferentes elementos baseado no estado do componente.
     * 
     * 🏗️ ESTRUTURA INTERNA:
     * 1. Spinner de loading (quando isLoading=true)
     * 2. Ícone esquerdo (quando não está loading e leftIcon existe)
     * 3. Texto do botão (children)
     * 4. Ícone direito (quando não está loading e rightIcon existe)
     */
    return (
      <button
        className={cn(
          // 🎨 ESTILOS BASE (aplicados a todos os botões)
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          
          // 🎨 ESTILO DA VARIANTE ESCOLHIDA
          // Acessa o objeto buttonVariants usando a prop variant
          buttonVariants[variant],
          
          // 📏 TAMANHO ESCOLHIDO
          // Acessa o objeto buttonSizes usando a prop size
          buttonSizes[size],
          
          // 🎨 CLASSES ADICIONAIS PASSADAS COMO PROP
          className
        )}
        ref={ref}    // 🔗 Referência para acesso direto
        
        // 🚫 LÓGICA DE DISABLED
        // Desabilita o botão se disabled=true OU se isLoading=true
        disabled={disabled || isLoading}
        
        {...props}   // ⚡ Todas as outras props (onClick, onMouseOver, etc.)
      >
        {/* ⏳ SPINNER DE LOADING (condicional) */}
        {/* 
         * 📚 CONCEITO - Conditional Rendering:
         * Só renderiza o spinner se isLoading for true.
         * 
         * 🎯 SPINNER ANIMADO:
         * - Loader2: ícone de círculo
         * - animate-spin: classe CSS que faz rotação contínua
         */}
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        
        {/* 🎯 ÍCONE ESQUERDO (condicional) */}
        {/* Só mostra se NÃO está loading E se leftIcon foi fornecido */}
        {!isLoading && leftIcon && leftIcon}
        
        {/* 📝 CONTEÚDO PRINCIPAL DO BOTÃO */}
        {/* children é tudo que está entre <Button>conteúdo</Button> */}
        {children}
        
        {/* 🎯 ÍCONE DIREITO (condicional) */}
        {/* Só mostra se NÃO está loading E se rightIcon foi fornecido */}
        {!isLoading && rightIcon && rightIcon}
      </button>
    );
  }
);

/**
 * 🏷️ NOME DE EXIBIÇÃO PARA FERRAMENTAS DE DEBUG
 * 
 * 📚 CONCEITO:
 * Define um nome amigável que aparece nas ferramentas de
 * desenvolvedor do React. Sem isso, apareceria "ForwardRef".
 */
Button.displayName = 'Button';

/**
 * 🎓 EXEMPLOS DE USO DESTE COMPONENTE:
 * 
 * 🔵 Botão principal:
 * ```tsx
 * <Button variant="primary" size="lg">
 *   Entrar
 * </Button>
 * ```
 * 
 * ⏳ Botão com loading:
 * ```tsx
 * <Button variant="primary" isLoading={enviando}>
 *   {enviando ? 'Enviando...' : 'Enviar Mensagem'}
 * </Button>
 * ```
 * 
 * 🎯 Botão com ícones:
 * ```tsx
 * <Button 
 *   variant="outline" 
 *   leftIcon={<PlusIcon />}
 *   onClick={criarGrupo}
 * >
 *   Criar Grupo
 * </Button>
 * ```
 * 
 * 🗑️ Botão destrutivo:
 * ```tsx
 * <Button 
 *   variant="destructive" 
 *   rightIcon={<TrashIcon />}
 *   onClick={deletarMensagem}
 * >
 *   Deletar
 * </Button>
 * ```
 * 
 * 🎓 RESUMO EDUCACIONAL:
 * 
 * 📋 CONCEITOS APRENDIDOS:
 * 1. **Component Design**: Como criar componentes flexíveis e reutilizáveis
 * 2. **Variant Pattern**: Sistema de variantes para diferentes estilos
 * 3. **Conditional Rendering**: Mostrar elementos baseado em condições
 * 4. **forwardRef**: Permitir acesso direto a elementos internos
 * 5. **TypeScript Interfaces**: Definir contratos de propriedades
 * 6. **Object Mapping**: Mapear valores para classes CSS
 * 7. **State Management**: Gerenciar estados como loading e disabled
 * 8. **CSS Classes Composition**: Combinar múltiplas classes dinamicamente
 * 
 * 🎯 PRINCÍPIOS DE DESIGN APLICADOS:
 * ✅ **Consistência**: Todos os botões seguem o mesmo padrão visual
 * ✅ **Flexibilidade**: Múltiplas variantes e opções de customização
 * ✅ **Acessibilidade**: Focus rings, estados disabled, etc.
 * ✅ **Performance**: Classes CSS otimizadas e condicionais eficientes
 * ✅ **Manutenibilidade**: Fácil de modificar e estender
 * ✅ **Usabilidade**: Estados visuais claros (loading, hover, disabled)
 * 
 * 🔗 ONDE É USADO NO WHATSUT:
 * - Formulários de login e registro
 * - Envio de mensagens no chat
 * - Criação de grupos
 * - Ações de moderação (banimentos)
 * - Configurações de perfil
 * - Qualquer lugar que precise de interação do usuário
 * 
 * 💡 PRÓXIMOS PASSOS PARA MELHORAR:
 * 1. Adicionar mais variantes (info, warning, success)
 * 2. Implementar temas (modo escuro)
 * 3. Adicionar suporte a gradientes
 * 4. Melhorar acessibilidade com ARIA labels
 * 5. Adicionar animações de micro-interação
 * 6. Implementar tamanhos responsive (sm no mobile, lg no desktop)
 * 
 * 📚 CONCEITO ARQUITETURAL IMPORTANTE:
 * Este componente demonstra o padrão "Compound Components" onde:
 * - Temos um componente base (Button)
 * - Com variações controladas por props (variant, size)
 * - Que mantém consistência mas oferece flexibilidade
 * - E pode ser extendido sem quebrar a API existente
 * 
 * Esse padrão é fundamental em Design Systems e bibliotecas
 * de componentes como Material-UI, Ant Design, etc.
 */
