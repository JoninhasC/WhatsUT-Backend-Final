/**
 * 📊 INDICADOR DE SAÚDE DA APLICAÇÃO
 * 
 * Componente que exibe o status de saúde da aplicação em tempo real,
 * incluindo conexão, performance e indicadores visuais.
 */

import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap 
} from 'lucide-react';
import { useAppMonitoring } from '../hooks/useAppMonitoring';

interface AppHealthIndicatorProps {
  className?: string;
}

export function AppHealthIndicator({ 
  className = '' 
}: AppHealthIndicatorProps) {
  const { health } = useAppMonitoring();

  const getConnectionIcon = () => {
    switch (health.socket) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthIcon = () => {
    const overallHealth = health.frontend === 'healthy' && health.backend === 'healthy' 
      ? 'healthy' 
      : health.frontend === 'error' || health.backend === 'error' 
        ? 'error' 
        : 'warning';
        
    switch (overallHealth) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = () => {
    if (health.performance.apiLatency < 100) return 'text-green-500';
    if (health.performance.apiLatency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConnectionStatusText = () => {
    switch (health.socket) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Indefinido';
    }
  };

  const getHealthStatusText = () => {
    if (health.frontend === 'healthy' && health.backend === 'healthy') {
      return 'Saudável';
    } else if (health.frontend === 'error' || health.backend === 'error') {
      return 'Erro';
    } else {
      return 'Atenção';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-40 ${className}`}>
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-4">
          {/* Conexão */}
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{getConnectionStatusText()}</p>
              {health.performance.apiLatency > 0 && (
                <p className="text-xs text-muted-foreground">
                  {health.performance.apiLatency}ms
                </p>
              )}
            </div>
          </div>

          {/* Saúde */}
          <div className="flex items-center space-x-2">
            {getHealthIcon()}
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{getHealthStatusText()}</p>
              {health.errors.length > 0 && (
                <p className="text-xs text-red-500">
                  {health.errors.length} erro{health.errors.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="flex items-center space-x-2">
            <Zap className={`h-4 w-4 ${getPerformanceColor()}`} />
            <div className="hidden sm:block">
              <p className="text-xs font-medium">Performance</p>
              <p className={`text-xs ${getPerformanceColor()}`}>
                {Math.round(health.performance.apiLatency)}ms
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes expandidos (apenas em telas maiores) */}
        {(health.errors.length > 0 || health.backend !== 'healthy' || health.frontend !== 'healthy') && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="text-xs space-y-1">
              {health.backend !== 'healthy' && (
                <p className="text-muted-foreground">
                  Backend: {health.backend}
                </p>
              )}
              {health.frontend !== 'healthy' && (
                <p className="text-muted-foreground">
                  Frontend: {health.frontend}
                </p>
              )}
              {health.performance.memoryUsage > 0 && (
                <p className="text-muted-foreground">
                  Memória: {Math.round(health.performance.memoryUsage * 100)}%
                </p>
              )}
              {health.errors.length > 0 && (
                <p className="text-red-500 truncate">
                  Último erro: {health.errors[health.errors.length - 1]}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppHealthIndicator;
