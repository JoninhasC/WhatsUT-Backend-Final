import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SecurityGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Verificar headers suspeitos
    const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip', 'x-originating-ip'];
    for (const header of suspiciousHeaders) {
      if (request.headers[header]) {
        const value = request.headers[header];
        // Verificar tentativas de header injection
        if (typeof value === 'string' && (/[\r\n]/.test(value) || /<script/i.test(value))) {
          throw new BadRequestException('Header inválido detectado');
        }
      }
    }

    // Verificar User-Agent suspeito
    const userAgent = request.headers['user-agent'];
    if (userAgent && typeof userAgent === 'string') {
      // Bloquear bots maliciosos conhecidos
      const maliciousBots = [
        'sqlmap', 'nikto', 'whatweb', 'nessus', 'openvas', 
        'nmap', 'masscan', 'zap', 'w3af', 'skipfish'
      ];
      
      const lowerUserAgent = userAgent.toLowerCase();
      if (maliciousBots.some(bot => lowerUserAgent.includes(bot))) {
        throw new BadRequestException('User-Agent bloqueado');
      }
    }

    // Verificar parâmetros de query string suspeitos
    const query = request.query;
    if (query && typeof query === 'object') {
      for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'string') {
          // Verificar tentativas de path traversal
          if (/\.\.|\/etc\/|\/proc\/|\/sys\/|\\windows\\|\\system32\\/i.test(value)) {
            throw new BadRequestException('Parâmetro de query suspeito detectado');
          }
          
          // Verificar tentativas de command injection
          if (/[;&|`$(){}[\]]/g.test(value)) {
            throw new BadRequestException('Caracteres perigosos em parâmetro de query');
          }
        }
      }
    }

    return true;
  }
}
