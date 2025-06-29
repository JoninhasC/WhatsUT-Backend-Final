import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let isSecurityIssue = false;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || exception.message;

      // Detectar problemas de segurança
      const securityKeywords = [
        'sql injection', 'xss', 'csrf', 'header injection',
        'path traversal', 'command injection', 'script injection'
      ];
      
      isSecurityIssue = securityKeywords.some(keyword => 
        message.toLowerCase().includes(keyword) ||
        exception.message.toLowerCase().includes(keyword)
      );
    }

    // Log de segurança para tentativas maliciosas
    if (isSecurityIssue || status === HttpStatus.BAD_REQUEST) {
      this.logger.warn(`Possível tentativa de ataque detectada: ${message}`, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        url: request.url,
        method: request.method,
        body: request.body,
        query: request.query,
        timestamp: new Date().toISOString(),
      });
    }

    // Não vazar informações sensíveis em produção
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    response.status(status).json({
      statusCode: status,
      message: isDevelopment ? message : this.getSafeErrorMessage(status),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isDevelopment && { details: exception instanceof Error ? exception.stack : exception }),
    });
  }

  private getSafeErrorMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Solicitação inválida';
      case HttpStatus.UNAUTHORIZED:
        return 'Não autorizado';
      case HttpStatus.FORBIDDEN:
        return 'Acesso negado';
      case HttpStatus.NOT_FOUND:
        return 'Recurso não encontrado';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Muitas solicitações';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Erro interno do servidor';
      default:
        return 'Erro na solicitação';
    }
  }
}
