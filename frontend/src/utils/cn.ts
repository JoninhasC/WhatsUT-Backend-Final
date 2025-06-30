/**
 * 🎯 UTILITÁRIO PARA COMBINAR CLASSES CSS
 * 
 * Função utilitária que combina classes CSS de forma inteligente,
 * utilizando clsx para combinar condicionalmente e tailwind-merge
 * para resolver conflitos entre classes do Tailwind.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma inteligente
 * @param inputs - Classes CSS ou condições
 * @returns String com classes combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
