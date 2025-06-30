/**
 * 🎯 COMPONENTE AVATAR REUTILIZÁVEL
 * 
 * Componente para exibir avatar de usuário com
 * diferentes tamanhos e estados.
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  fallbackIcon?: React.ReactNode;
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

/**
 * Gera iniciais do nome para fallback
 */
function getInitials(name?: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Gera cor baseada no nome
 */
function getAvatarColor(name?: string): string {
  if (!name) return 'bg-gray-500';
  
  const colors = [
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-gray-500',
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className,
    src,
    alt,
    name,
    size = 'md',
    showStatus = false,
    isOnline = false,
    fallbackIcon,
    ...props 
  }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(name);

    return (
      <div 
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden',
          avatarSizes[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <div className={cn(
            'w-full h-full flex items-center justify-center text-white font-medium',
            avatarColor
          )}>
            {initials}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            {fallbackIcon || <User className="w-1/2 h-1/2" />}
          </div>
        )}
        
        {showStatus && (
          <div 
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-white',
              statusSizes[size],
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
