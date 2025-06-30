/**
 * 🔍 SISTEMA DE MONITORAMENTO E DEBUG
 * 
 * Hook para monitorar o estado da aplicação em tempo real
 * e detectar problemas automaticamente.
 */

import React, { useState, useEffect, useRef } from 'react';

interface AppHealth {
  frontend: 'healthy' | 'warning' | 'error';
  backend: 'healthy' | 'warning' | 'error';
  socket: 'connected' | 'disconnected' | 'error';
  lastCheck: Date;
  errors: string[];
  performance: {
    renderTime: number;
    apiLatency: number;
    memoryUsage: number;
  };
}

export function useAppMonitoring() {
  const [health, setHealth] = useState<AppHealth>({
    frontend: 'healthy',
    backend: 'healthy',
    socket: 'disconnected',
    lastCheck: new Date(),
    errors: [],
    performance: {
      renderTime: 0,
      apiLatency: 0,
      memoryUsage: 0
    }
  });

  const intervalRef = useRef<NodeJS.Timeout>();

  const checkBackendHealth = async (): Promise<'healthy' | 'warning' | 'error'> => {
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        timeout: 5000
      } as any);
      
      const latency = Date.now() - start;
      
      setHealth(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          apiLatency: latency
        }
      }));

      if (response.ok) {
        return latency < 1000 ? 'healthy' : 'warning';
      }
      return 'error';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return 'error';
    }
  };

  const checkPerformance = () => {
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setHealth(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          memoryUsage: memory.usedJSHeapSize / memory.totalJSHeapSize
        }
      }));
    }

    // Render time
    const start = Date.now();
    requestAnimationFrame(() => {
      const renderTime = Date.now() - start;
      setHealth(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          renderTime
        }
      }));
    });
  };

  const runHealthCheck = async () => {
    try {
      const backendStatus = await checkBackendHealth();
      checkPerformance();

      setHealth(prev => ({
        ...prev,
        backend: backendStatus,
        frontend: 'healthy',
        lastCheck: new Date(),
        errors: prev.errors.slice(-10) // Keep only last 10 errors
      }));
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        errors: [...prev.errors, `Health check failed: ${error}`].slice(-10)
      }));
    }
  };

  useEffect(() => {
    // Run initial check
    runHealthCheck();

    // Set up periodic checks
    intervalRef.current = setInterval(runHealthCheck, 30000); // Every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const addError = (error: string) => {
    setHealth(prev => ({
      ...prev,
      errors: [...prev.errors, error].slice(-10)
    }));
  };

  const setSocketStatus = (status: 'connected' | 'disconnected' | 'error') => {
    setHealth(prev => ({
      ...prev,
      socket: status
    }));
  };

  return {
    health,
    addError,
    setSocketStatus,
    runHealthCheck
  };
}

/**
 * Debug helper para renderizar informações de monitoramento
 */
export function getDebugInfo(health: AppHealth): string {
  return JSON.stringify({
    frontend: health.frontend,
    backend: health.backend,
    socket: health.socket,
    performance: health.performance,
    errorCount: health.errors.length
  }, null, 2);
}
