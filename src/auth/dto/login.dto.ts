/*
 * ========================================================================================
 * LOGIN DTO - VALIDAÇÃO DE DADOS DE LOGIN
 * ========================================================================================
 * 
 * 🎯 CONCEITO: DTO (Data Transfer Object)
 * Um DTO define EXATAMENTE quais dados são aceitos em um endpoint
 * e como eles devem ser validados ANTES de processar.
 * 
 * 🛡️ FUNÇÃO DE SEGURANÇA:
 * - Impede dados maliciosos ou inválidos
 * - Valida formato e conteúdo automaticamente
 * - Bloqueia requisições mal formadas
 * - Protege contra ataques de injeção
 * 
 * 🏗️ ANALOGIA: 
 * É como um "detector de metal no aeroporto":
 * - Todo dado que entra DEVE passar pela validação
 * - Se algo estiver errado, é rejeitado imediatamente
 * - Só dados "limpos" chegam até o controller
 * 
 * 📝 USO ESPECÍFICO:
 * Este DTO valida dados do endpoint POST /auth/login
 * Garante que login tenha nome e senha válidos
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS PARA VALIDAÇÃO E DOCUMENTAÇÃO
// ============================================================================

/*
 * 📦 NESTJS/SWAGGER: Documentação automática da API
 * 
 * 🎯 FUNÇÃO: Gera documentação interativa automaticamente
 * 📖 RESULTADO: Swagger UI mostra exemplos e descrições
 * 🔧 USO: Desenvolvedores podem testar API direto no browser
 * 
 * 🌐 ACESSO: http://localhost:3000/api (quando servidor rodando)
 * 
 * 💡 ANALOGIA: Como um manual de instruções automático
 * - @ApiProperty documenta cada campo
 * - Mostra exemplos de uso
 * - Explica o que cada campo faz
 */
import { ApiProperty } from '@nestjs/swagger';

/*
 * 📦 CLASS-VALIDATOR: Validação automática de dados
 * 
 * 🎯 FUNÇÃO: Valida dados que chegam na API automaticamente
 * 🛡️ SEGURANÇA: Impede dados inválidos ou maliciosos
 * ⚡ AUTOMÁTICO: NestJS aplica validações antes do controller
 * 
 * 🔧 DECORATORS IMPORTADOS:
 * - @IsNotEmpty(): Campo obrigatório, não pode estar vazio
 * - @IsString(): Deve ser texto (string)
 * - @MinLength(): Tamanho mínimo de caracteres
 * - @Matches(): Deve seguir padrão específico (regex)
 */
import { 
  IsNotEmpty, 
  IsString,
  MinLength,
  Matches
} from 'class-validator';

// ============================================================================
// DTO PRINCIPAL: LOGIN (DADOS DE AUTENTICAÇÃO)
// ============================================================================

/*
 * 🔐 CLASSE LOGIN DTO
 * 
 * Esta classe define EXATAMENTE quais dados são aceitos
 * no endpoint de login e como eles devem ser validados.
 * 
 * 🎯 FUNÇÃO: Garantir que dados de login sejam seguros e válidos
 * 
 * 💡 ANALOGIA: 
 * Como um formulário de login bem projetado:
 * - Só aceita dados no formato correto
 * - Mostra mensagens de erro claras
 * - Impede envio de dados inválidos
 * 
 * 🔄 FLUXO DE VALIDAÇÃO:
 * 1. Cliente envia POST /auth/login com dados
 * 2. NestJS aplica validações deste DTO automaticamente  
 * 3. Se válido: continua para AuthController.login()
 * 4. Se inválido: retorna erro 400 com detalhes
 * 
 * 📊 EXEMPLO DE USO:
 * POST /auth/login
 * Body: { "name": "João", "password": "senha123" }
 */
export class LoginDto {
  
  /*
   * 👤 NAME: Nome do Usuário para Login
   * 
   * 🎯 FUNÇÃO: Identificar qual usuário está tentando fazer login
   * 📝 FORMATO: Nome completo ou username (depende do sistema)
   * 🔍 BUSCA: Sistema procura usuário com este nome exato
   * 
   * 💡 ANALOGIA: Como seu nome na lista de convidados
   * - Porteiro (sistema) procura seu nome na lista
   * - Se não encontrar, não pode entrar
   * - Deve ser exatamente como cadastrado
   * 
   * 🔧 VALIDAÇÕES APLICADAS:
   * - @IsNotEmpty: Não pode enviar nome vazio
   * - @IsString: Deve ser texto, não número ou objeto
   * - @MinLength(2): Nome deve ter pelo menos 2 caracteres
   * 
   * 📋 SWAGGER DOCUMENTATION:
   * - example: Mostra exemplo no Swagger UI
   * - description: Explica para que serve o campo
   * 
   * ❌ EXEMPLOS QUE FALHAM:
   * - "" (vazio) → "Nome é obrigatório"
   * - 123 (número) → "Nome deve ser uma string"
   * - "A" (muito curto) → "Nome deve ter pelo menos 2 caracteres"
   * 
   * ✅ EXEMPLOS QUE PASSAM:
   * - "João Silva"
   * - "Ana"
   * - "Prof. Carlos"
   */
  @ApiProperty({
    example: 'João Silva',                    // 💡 Exemplo para documentação
    description: 'Nome do usuário para login', // 📖 Descrição do campo
    minLength: 2,                            // 📏 Tamanho mínimo
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })           // 🚫 Não pode estar vazio
  @IsString({ message: 'Nome deve ser uma string' })       // 📝 Deve ser texto
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })  // 📏 Tamanho mínimo
  name: string;     // 👤 Nome do usuário (ex: "João Silva")

  /*
   * 🔐 PASSWORD: Senha do Usuário
   * 
   * 🎯 FUNÇÃO: Credencial para autenticação e verificação de identidade
   * 🔒 SEGURANÇA: Senha em texto puro (será hasheada no AuthService)
   * ⚠️ ATENÇÃO: DTO recebe texto puro, mas sistema hasheia antes de comparar
   * 
   * 💡 ANALOGIA: Como a senha do seu cartão no banco
   * - Você digita a senha real
   * - Sistema verifica se confere com a cadastrada
   * - Se conferir, libera acesso
   * 
   * 🔧 VALIDAÇÕES APLICADAS:
   * - @IsNotEmpty: Senha é obrigatória para login
   * - @IsString: Deve ser texto, não número
   * - @MinLength(6): Política de segurança mínima
   * - @Matches: Padrão de complexidade (opcional)
   * 
   * 🔄 FLUXO DE SEGURANÇA:
   * 1. User digita senha: "minhaSenha123"
   * 2. DTO valida formato básico
   * 3. AuthService compara com hash salvo
   * 4. Se confere → gera JWT token
   * 5. Se não confere → erro "credenciais inválidas"
   * 
   * 📋 SWAGGER DOCUMENTATION:
   * - example: Senha de exemplo (não real)
   * - description: Explica requisitos de senha
   * 
   * ❌ EXEMPLOS QUE FALHAM:
   * - "" (vazio) → "Senha é obrigatória"
   * - "123" (muito curta) → "Senha deve ter pelo menos 6 caracteres"
   * - 123456 (número) → "Senha deve ser uma string"
   * 
   * ✅ EXEMPLOS QUE PASSAM:
   * - "minhasenha123"
   * - "SenhaSegura456"
   * - "password123"
   */
  @ApiProperty({
    example: 'minhasenha123',                // 💡 Exemplo para documentação
    description: 'Senha do usuário (mínimo 6 caracteres)', // 📖 Descrição com requisitos
    minLength: 6,                            // 📏 Tamanho mínimo
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })          // 🚫 Campo obrigatório
  @IsString({ message: 'Senha deve ser uma string' })      // 📝 Tipo correto
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })  // 📏 Segurança mínima
  password: string;  // 🔐 Senha em texto puro (ex: "minhasenha123")

  /*
   * 💾 REMEMBER_ME: Lembrar Login (Campo Futuro)
   * 
   * 🎯 FUNÇÃO: Opção para manter usuário logado por mais tempo
   * ⚪ OPCIONAL: Campo comentado, pode ser implementado no futuro
   * 🔄 USO: JWT com expiration mais longo quando true
   * 
   * 💡 ANALOGIA: Como "Lembrar de mim" em sites
   * - true = ficar logado por 30 dias
   * - false/undefined = logout automático em 1 dia
   * 
   * 🚀 IMPLEMENTAÇÃO FUTURA:
   * @ApiProperty({
   *   example: true,
   *   description: 'Manter login ativo por mais tempo',
   *   required: false
   * })
   * @IsOptional()
   * @IsBoolean({ message: 'Lembrar deve ser true ou false' })
   * rememberMe?: boolean;
   */
}

/*
 * ========================================================================================
 * 🎓 RESUMO EDUCACIONAL COMPLETO - LOGIN DTO
 * ========================================================================================
 * 
 * 🌟 O QUE APRENDEMOS HOJE:
 * 
 * 1️⃣ DTO PATTERN (Data Transfer Object):
 *    ✅ Define estrutura de dados de entrada
 *    ✅ Valida automaticamente antes do controller
 *    ✅ Documenta API com Swagger
 *    ✅ Protege contra dados maliciosos
 * 
 * 2️⃣ VALIDAÇÕES ROBUSTAS:
 *    ✅ @IsNotEmpty(): Campos obrigatórios
 *    ✅ @IsString(): Tipo correto de dados
 *    ✅ @MinLength(): Segurança básica
 *    ✅ Mensagens de erro personalizadas
 * 
 * 3️⃣ DOCUMENTAÇÃO AUTOMÁTICA:
 *    ✅ @ApiProperty(): Swagger UI interativo
 *    ✅ Exemplos práticos para desenvolvedores
 *    ✅ Descrições claras de cada campo
 *    ✅ Requisitos e limitações documentados
 * 
 * 4️⃣ SEGURANÇA DE DADOS:
 *    ✅ Validação antes de processamento
 *    ✅ Bloqueio de dados inválidos
 *    ✅ Mensagens de erro seguras
 *    ✅ Prevenção de ataques básicos
 * 
 * 🔄 FLUXO COMPLETO DE LOGIN:
 * 
 * 1. 📱 FRONTEND: Envia POST /auth/login com { name, password }
 * 2. 🛡️ DTO: Valida dados (este arquivo)
 * 3. 🎮 CONTROLLER: Recebe dados já validados
 * 4. 🏛️ SERVICE: Verifica credenciais no CSV
 * 5. 🔐 AUTH: Gera JWT token se válido
 * 6. 📱 RESPONSE: Retorna token ou erro
 * 
 * 💬 EXEMPLOS PRÁTICOS:
 * 
 * ✅ REQUISIÇÃO VÁLIDA:
 *    POST /auth/login
 *    {
 *      "name": "João Silva",
 *      "password": "minhasenha123"
 *    }
 *    → Passa validação → Vai para controller
 * 
 * ❌ REQUISIÇÃO INVÁLIDA:
 *    POST /auth/login
 *    {
 *      "name": "",
 *      "password": "123"
 *    }
 *    → Falha validação → Erro 400 Bad Request
 *    → Resposta: {
 *        "message": [
 *          "Nome é obrigatório",
 *          "Senha deve ter pelo menos 6 caracteres"
 *        ]
 *      }
 * 
 * 🔧 TESTANDO A VALIDAÇÃO:
 * 
 * 📍 SWAGGER UI: http://localhost:3000/api
 * - Abra o endpoint POST /auth/login
 * - Teste com dados válidos e inválidos
 * - Veja mensagens de erro em tempo real
 * 
 * 📍 CURL COMMAND:
 * curl -X POST http://localhost:3000/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"João","password":"senha123"}'
 * 
 * 🚀 PRÓXIMOS ARQUIVOS PARA ESTUDAR:
 * 
 * 📁 Outros DTOs:
 *    ├── create-user.dto.ts → Validação de registro
 *    ├── create-message.dto.ts → Validação de mensagens
 *    └── create-group.dto.ts → Validação de grupos
 * 
 * 🎮 Controller que usa este DTO:
 *    └── auth.controller.ts → Como dados validados são processados
 * 
 * 🏛️ Service que processa login:
 *    └── auth.service.ts → Lógica de autenticação
 * 
 * 📊 Entity relacionada:
 *    └── users.entity.ts → Estrutura do usuário
 * 
 * 💡 DICAS PROFISSIONAIS:
 * 
 * 🔍 DEBUGGING: Use console.log no controller para ver dados após validação
 * 
 * 🛡️ SEGURANÇA: Nunca confie em dados do frontend - sempre valide!
 * 
 * 📈 ESCALABILIDADE: DTOs facilitam mudanças na API sem quebrar clientes
 * 
 * 🎯 MANUTENIBILIDADE: Validações centralizadas e reutilizáveis
 * 
 * ⚡ PERFORMANCE: Validação rápida evita processamento desnecessário
 * 
 * 🔧 TESTING: DTOs facilitam testes unitários com dados controlados
 * 
 * 📖 DOCUMENTAÇÃO: Swagger gerado automaticamente mantém docs atualizadas
 * 
 * ========================================================================================
 */
