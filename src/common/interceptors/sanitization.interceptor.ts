import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Sanitizar body da requisição
    if (request.body && typeof request.body === 'object') {
      this.sanitizeObject(request.body);
    }

    return next.handle().pipe(
      map((data) => {
        // Sanitizar resposta antes de enviar
        return this.sanitizeResponse(data);
      }),
    );
  }

  private sanitizeObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remover caracteres de controle invisíveis
        obj[key] = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Verificar tentativas de bypass de validação
        if (/null|undefined|NaN|infinity/i.test(value)) {
          throw new BadRequestException(`Valor suspeito no campo ${key}`);
        }
        
        // Limitar tamanho excessivo de strings
        if (value.length > 10000) {
          throw new BadRequestException(`Campo ${key} muito longo`);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.sanitizeObject(value);
      }
    }
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Remover informações sensíveis que podem vazar acidentalmente
      return data.replace(/password|token|secret|key/gi, '[REDACTED]');
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeResponse(item));
      }

      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Não incluir campos sensíveis na resposta
        if (['password', 'secret', 'token', 'privateKey'].includes(key)) {
          continue;
        }
        sanitized[key] = this.sanitizeResponse(value);
      }
      return sanitized;
    }

    return data;
  }
}
