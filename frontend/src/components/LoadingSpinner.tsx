/**
 * 🔄 COMPONENTE DE LOADING SPINNER
 * 
 * Componente reutilizável para indicar estados de carregamento
 * em diferentes partes da aplicação.
 * 
 * Funcionalidades:
 * - Múltiplos tamanhos (small, medium, large)
 * - Mensagem personalizada opcional
 * - Animação CSS suave
 * - Design responsivo
 */

/**
 * Interface para props do componente LoadingSpinner
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

/**
 * Componente LoadingSpinner
 * 
 * @param size - Tamanho do spinner (padrão: medium)
 * @param message - Mensagem opcional a ser exibida
 * @param className - Classes CSS adicionais
 */
function LoadingSpinner({ 
  size = 'medium', 
  message,
  className = '' 
}: LoadingSpinnerProps) {
  
  // Define tamanhos do spinner baseado na prop size
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  // Define tamanhos do texto baseado na prop size
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base', 
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Spinner animado */}
      <div 
        className={`
          ${sizeClasses[size]} 
          border-4 
          border-gray-200 
          border-t-blue-500 
          rounded-full 
          animate-spin
        `}
        role="status"
        aria-label={message || 'Carregando...'}
      />
      
      {/* Mensagem opcional */}
      {message && (
        <p className={`
          mt-3 
          text-gray-600 
          ${textSizeClasses[size]}
          animate-pulse
        `}>
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
