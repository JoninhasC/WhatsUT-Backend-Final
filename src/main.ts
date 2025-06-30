import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ensureCsvFileExists } from './utils/CSV';
import { CSV_FILE_USER, CSV_HEADERS_USER } from './users/csv-user.repository';
import { CSV_FILE_GROUP, CSV_HEADERS_GROUP } from './group/group.repository';
import { CSV_FILE_CHAT, CSV_HEADERS_CHAT } from './chat/chat.repository';
import { CSV_FILE_BAN, CSV_HEADERS_BAN } from './bans/ban.repository';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.code === 'LIMIT_FILE_SIZE') {
      // Convert Multer file size error to 400 Bad Request
      status = HttpStatus.BAD_REQUEST;
      message = 'Arquivo muito grande. Tamanho máximo permitido: 5MB';
    } else if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Arquivo inesperado';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}

async function bootstrap() {
  const csvFilesToCheck = [
    { CSV_FILE: CSV_FILE_USER, CSV_HEADERS: CSV_HEADERS_USER },
    { CSV_FILE: CSV_FILE_GROUP, CSV_HEADERS: CSV_HEADERS_GROUP },
    { CSV_FILE: CSV_FILE_CHAT, CSV_HEADERS: CSV_HEADERS_CHAT },
    { CSV_FILE: CSV_FILE_BAN, CSV_HEADERS: CSV_HEADERS_BAN },
  ];

  await Promise.all(csvFilesToCheck.map(ensureCsvFileExists));

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
    validateCustomDecorators: true,
    dismissDefaultMessages: false,
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('ZAP ZAP 2')
    .setDescription('bora passar')
    .setVersion('2.9.9')
    .addBearerAuth()
    // .addTag('cats')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`esta rodando em http://localhost:${3000}/api`);
}
bootstrap();
