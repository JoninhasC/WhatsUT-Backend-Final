/*
 * ====================================================================
 * ARQUIVO: main.ts
 * LOCALIZAÇÃO: src/main.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este é o arquivo "CORAÇÃO" da aplicação backend do WhatsUT. É aqui
 * que TUDO começa! Quando você roda `npm run start`, este arquivo é
 * o primeiro a ser executado, e ele é responsável por "montar" e
 * configurar toda a aplicação antes de colocá-la no ar.
 * 
 * ANALOGIA SIMPLES:
 * Imagine que sua aplicação é um restaurante. Este arquivo seria:
 * - O gerente que chega primeiro e abre o restaurante
 * - Confere se todas as mesas estão no lugar (arquivos CSV)
 * - Liga todos os equipamentos (módulos do NestJS)
 * - Treina os garçons sobre as regras (pipes e filters)
 * - Abre as portas para os clientes (coloca servidor no ar)
 * 
 * RESPONSABILIDADES PRINCIPAIS:
 * 1. CRIAR aplicação NestJS
 * 2. CONFIGURAR validações e filtros globais
 * 3. VERIFICAR arquivos CSV necessários
 * 4. CONFIGURAR documentação automática (Swagger)
 * 5. HABILITAR CORS (permitir chamadas do frontend)
 * 6. COLOCAR servidor online na porta 3000
 */

// ===== IMPORTAÇÕES =====

// NestFactory: fábrica que cria aplicações NestJS
import { NestFactory } from '@nestjs/core';

// AppModule: módulo principal que importa todos os outros módulos
import { AppModule } from './app.module';

// Swagger: ferramentas para gerar documentação automática da API
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Pipes de validação e exceções
import { ValidationPipe, BadRequestException } from '@nestjs/common';

// Funções para verificar/criar arquivos CSV
import { ensureCsvFileExists } from './utils/CSV';

// Configurações dos arquivos CSV de cada módulo
import { CSV_FILE_USER, CSV_HEADERS_USER } from './users/csv-user.repository';
import { CSV_FILE_GROUP, CSV_HEADERS_GROUP } from './group/group.repository';
import { CSV_FILE_CHAT, CSV_HEADERS_CHAT } from './chat/chat.repository';
import { CSV_FILE_BAN, CSV_HEADERS_BAN } from './bans/ban.repository';

// Ferramentas para tratamento global de erros
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/*
 * ====================================================================
 * SEÇÃO 1: FILTRO GLOBAL DE EXCEÇÕES
 * ====================================================================
 */

// ===== DECORADOR @Catch() =====
// Este decorador diz: "capture TODOS os erros que acontecerem na aplicação"
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /*
   * PROPÓSITO DO FILTRO:
   * 
   * Quando alguma coisa dá errado em qualquer lugar da aplicação
   * (um usuário não existe, senha errada, arquivo muito grande, etc.),
   * este filtro "pega" o erro e transforma em uma resposta padronizada.
   * 
   * É como ter um "atendente de problemas" que sempre sabe como
   * responder de forma educada quando algo dá errado.
   */
  
  // ===== MÉTODO CATCH =====
  // Esta função é executada SEMPRE que um erro acontece
  catch(exception: any, host: ArgumentsHost) {
    /*
     * PARÂMETROS:
     * - exception: o erro que aconteceu
     * - host: contexto da requisição (request/response HTTP)
     */
    
    // Extrai objetos de requisição e resposta HTTP do contexto
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Valores padrão para erro genérico
    let status = HttpStatus.INTERNAL_SERVER_ERROR;  // 500 - erro interno
    let message = 'Internal server error';

    // ===== TRATAMENTO ESPECÍFICO POR TIPO DE ERRO =====
    
    if (exception instanceof HttpException) {
      // Erros HTTP conhecidos (401, 404, 400, etc.)
      status = exception.getStatus();
      message = exception.message;
      
    } else if (exception.code === 'LIMIT_FILE_SIZE') {
      // Erro específico do Multer: arquivo muito grande
      status = HttpStatus.BAD_REQUEST;  // 400
      message = 'Arquivo muito grande. Tamanho máximo permitido: 5MB';
      
    } else if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
      // Erro específico do Multer: arquivo inesperado
      status = HttpStatus.BAD_REQUEST;  // 400
      message = 'Arquivo inesperado';
    }

    // ===== RESPOSTA PADRONIZADA =====
    // Sempre retorna um objeto JSON com formato consistente
    response.status(status).json({
      statusCode: status,                    // Código do erro (400, 401, 500, etc.)
      timestamp: new Date().toISOString(),   // Quando aconteceu
      path: request.url,                     // Em qual endpoint aconteceu
      message: message,                      // Descrição do erro
    });
    
    /*
     * EXEMPLO DE RESPOSTA:
     * {
     *   "statusCode": 401,
     *   "timestamp": "2023-12-25T10:30:00.000Z",
     *   "path": "/auth/profile",
     *   "message": "Token inválido"
     * }
     */
  }
}

/*
 * ====================================================================
 * SEÇÃO 2: FUNÇÃO DE BOOTSTRAP (INICIALIZAÇÃO)
 * ====================================================================
 */

// ===== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO =====
// Esta função é executada quando a aplicação inicia
async function bootstrap() {
  /*
   * NOME "BOOTSTRAP":
   * 
   * "Bootstrap" é um termo da computação que significa "inicializar um sistema".
   * Vem da expressão "pull yourself up by your bootstraps" (se levantar
   * puxando as próprias botas), ou seja, o sistema se "levanta sozinho".
   */
  
  // ===== PASSO 1: VERIFICAR ARQUIVOS CSV =====
  // Lista todos os arquivos CSV que a aplicação precisa
  const csvFilesToCheck = [
    { CSV_FILE: CSV_FILE_USER, CSV_HEADERS: CSV_HEADERS_USER },      // users.csv
    { CSV_FILE: CSV_FILE_GROUP, CSV_HEADERS: CSV_HEADERS_GROUP },    // groups.csv
    { CSV_FILE: CSV_FILE_CHAT, CSV_HEADERS: CSV_HEADERS_CHAT },      // chats.csv
    { CSV_FILE: CSV_FILE_BAN, CSV_HEADERS: CSV_HEADERS_BAN },        // bans.csv
  ];
  
  // Verifica se todos os arquivos existem, se não existem, cria eles
  await Promise.all(csvFilesToCheck.map(ensureCsvFileExists));
  /*
   * Promise.all():
   * Executa todas as verificações ao mesmo tempo (paralelo)
   * É mais rápido que verificar um por vez
   * 
   * ensureCsvFileExists():
   * Para cada arquivo, verifica se existe na pasta data/
   * Se não existe, cria o arquivo com os headers corretos
   */

  // ===== PASSO 2: CRIAR APLICAÇÃO NESTJS =====
  const app = await NestFactory.create(AppModule);
  /*
   * NestFactory.create():
   * - Lê o AppModule (módulo principal)
   * - Carrega todos os módulos importados (AuthModule, UsersModule, etc.)
   * - Configura sistema de injeção de dependência
   * - Prepara todos os controllers e services
   * 
   * É como montar uma fábrica inteira seguindo a planta do AppModule
   */
  
  // ===== PASSO 3: HABILITAR CORS =====
  app.enableCors();
  /*
   * CORS = Cross-Origin Resource Sharing
   * 
   * POR QUE PRECISAMOS?
   * - Frontend roda em localhost:5173
   * - Backend roda em localhost:3000
   * - Navegadores bloqueiam chamadas entre portas diferentes por segurança
   * - CORS libera essa comunicação
   * 
   * É como dar permissão para o frontend conversar com o backend
   */

  // ===== PASSO 4: CONFIGURAR PIPES GLOBAIS =====
  app.useGlobalPipes(new ValidationPipe({
    /*
     * VALIDATION PIPE:
     * 
     * É um "inspetor" que verifica se os dados que chegam nos endpoints
     * estão no formato correto antes de processar.
     * 
     * É como ter um porteiro que confere se os documentos estão em ordem
     * antes de deixar alguém entrar no prédio.
     */
    
    whitelist: true,              // Remove propriedades não declaradas nos DTOs
    forbidNonWhitelisted: true,   // Retorna erro se receber propriedades extras
    transform: true,              // Converte tipos automaticamente (string → number)
    disableErrorMessages: false,  // Mostra mensagens de erro detalhadas
    validateCustomDecorators: true,   // Valida decoradores personalizados
    dismissDefaultMessages: false,    // Mantém mensagens padrão do sistema
  }));
  
  /*
   * EXEMPLO PRÁTICO:
   * 
   * Se o DTO espera: { name: string, age: number }
   * E chega: { name: "João", age: "25", hacker: "evil_code" }
   * 
   * O pipe vai:
   * 1. Converter "25" para 25 (transform: true)
   * 2. Remover "hacker" (whitelist: true)
   * 3. Processar: { name: "João", age: 25 }
   */

  // ===== PASSO 5: CONFIGURAR FILTRO GLOBAL DE ERROS =====
  app.useGlobalFilters(new GlobalExceptionFilter());
  /*
   * Registra nosso filtro personalizado para capturar TODOS os erros
   * da aplicação e transformá-los em respostas padronizadas.
   */

  // ===== PASSO 6: CONFIGURAR DOCUMENTAÇÃO SWAGGER =====
  const config = new DocumentBuilder()
    .setTitle('ZAP ZAP 2')                    // Nome da API na documentação
    .setDescription('bora passar')            // Descrição da API
    .setVersion('2.9.9')                      // Versão da API
    .addBearerAuth()                          // Indica que usa autenticação Bearer (JWT)
    // .addTag('cats')                        // Tags para organizar endpoints (comentado)
    .build();
  
  /*
   * SWAGGER:
   * 
   * É uma ferramenta que gera documentação automática da sua API.
   * Lê seus controllers, DTOs e decoradores, e cria uma interface web
   * onde você pode:
   * - Ver todos os endpoints disponíveis
   * - Testar cada endpoint diretamente
   * - Ver exemplos de requisições e respostas
   * 
   * É como ter um "manual de instruções" interativo da sua API
   */

  // Cria o documento Swagger baseado na configuração
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  
  // Disponibiliza a documentação na rota /api
  SwaggerModule.setup('api', app, documentFactory);
  /*
   * Após isso, você pode acessar:
   * http://localhost:3000/api
   * 
   * E vai ver uma interface bonita com toda documentação da API!
   */

  // ===== PASSO 7: COLOCAR SERVIDOR NO AR =====
  await app.listen(process.env.PORT ?? 3000);
  /*
   * app.listen():
   * - Inicia o servidor HTTP
   * - Fica "escutando" requisições na porta especificada
   * - process.env.PORT: lê variável de ambiente (para deploy)
   * - ?? 3000: se não há variável de ambiente, usa porta 3000
   * 
   * É como "abrir as portas" do restaurante para receber clientes
   */
  
  // Mensagem de confirmação no console
  console.log(`esta rodando em http://localhost:${3000}/api`);
  /*
   * Mostra onde a documentação Swagger está disponível
   * (poderia ser melhorado para mostrar também a URL base da API)
   */
}

// ===== EXECUÇÃO =====
// Chama a função de inicialização
bootstrap();
/*
 * Esta linha efetivamente "liga" toda a aplicação.
 * A partir daqui, o servidor fica rodando e esperando requisições.
 */

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O main.ts é o "MAESTRO" da aplicação WhatsUT. Ele:
 * 
 * 1. 🏗️ CONSTRÓI: Monta toda a aplicação NestJS
 * 2. 🔧 CONFIGURA: Define pipes, filtros e middleware globais
 * 3. 📁 VERIFICA: Garante que arquivos CSV necessários existem
 * 4. 🌐 HABILITA: Permite comunicação entre frontend e backend (CORS)
 * 5. 📚 DOCUMENTA: Gera documentação automática da API (Swagger)
 * 6. 🚀 INICIA: Coloca o servidor online e pronto para receber requisições
 * 7. 🛡️ PROTEGE: Trata erros de forma consistente em toda aplicação
 * 
 * FLUXO DE INICIALIZAÇÃO:
 * 
 * npm run start → main.ts executa → bootstrap() é chamada
 *     ↓
 * Verifica arquivos CSV → Cria aplicação NestJS → Configura middleware
 *     ↓
 * Habilita CORS → Configura validação → Configura Swagger
 *     ↓
 * Inicia servidor na porta 3000 → Aplicação fica online
 *     ↓
 * Frontend pode se conectar e fazer requisições!
 * 
 * SEM ESTE ARQUIVO:
 * A aplicação simplesmente não existiria! É como tentar dirigir um carro
 * sem ligar o motor - nada funcionaria.
 * 
 * URLS IMPORTANTES APÓS INICIALIZAÇÃO:
 * - http://localhost:3000 → API base
 * - http://localhost:3000/api → Documentação Swagger
 * - http://localhost:3000/auth/login → Endpoint de login
 * - http://localhost:3000/users → Endpoint de usuários
 */
