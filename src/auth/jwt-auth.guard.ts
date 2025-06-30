/*
 * ====================================================================
 * ARQUIVO: jwt-auth.guard.ts
 * LOCALIZAÇÃO: src/auth/jwt-auth.guard.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é o "SEGURANÇA DA PORTA" do WhatsUT. Ele verifica se
 * a pessoa que está tentando acessar uma área protegida realmente
 * tem permissão para entrar (se tem um token JWT válido).
 * 
 * ANALOGIA SIMPLES:
 * Imagine um clube exclusivo com várias áreas:
 * - Área pública (qualquer um pode entrar)
 * - Área VIP (só membros com pulseirinha)
 * 
 * Este arquivo seria o segurança que fica na porta da área VIP
 * verificando as pulseirinhas. Se você tem uma pulseirinha válida,
 * pode entrar. Se não tem ou se a pulseirinha é falsa, é barrado.
 * 
 * QUANDO É USADO:
 * Sempre que uma rota tem o decorador @UseGuards(JwtAuthGuard),
 * este arquivo é executado ANTES da função da rota.
 * 
 * EXEMPLO:
 * @UseGuards(JwtAuthGuard)  ← Aqui o guard é ativado
 * @Post('logout')
 * async logout() { ... }
 * 
 * O QUE ACONTECE:
 * 1. Usuário faz requisição para /auth/logout
 * 2. JwtAuthGuard verifica se o token é válido
 * 3. Se válido: deixa continuar para a função logout()
 * 4. Se inválido: retorna erro 401 (Unauthorized)
 */

// ===== IMPORTAÇÕES =====

// @Injectable: marca esta classe como um "serviço" que pode ser injetado
import { Injectable } from '@nestjs/common';

// AuthGuard: classe base do Passport.js que faz a verificação de autenticação
// Passport.js é uma biblioteca muito popular para autenticação em Node.js
import { AuthGuard } from '@nestjs/passport';

// ===== CLASSE JwtAuthGuard =====

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /*
   * EXPLICAÇÃO DETALHADA:
   * 
   * Esta classe é bem simples, mas muito poderosa!
   * 
   * 1. "extends AuthGuard('jwt')": 
   *    - Herda todas as funcionalidades da classe AuthGuard
   *    - O parâmetro 'jwt' diz que queremos usar a estratégia JWT
   *    - A estratégia JWT está definida em jwt.strategy.ts
   * 
   * 2. Por que a classe está vazia?
   *    - Porque o AuthGuard já faz tudo que precisamos!
   *    - Ele automaticamente:
   *      * Pega o token do header Authorization
   *      * Verifica se o token é válido
   *      * Decodifica o token e extrai os dados do usuário
   *      * Coloca os dados do usuário em req.user
   *      * Permite ou nega o acesso
   * 
   * 3. Como funciona na prática:
   *    - Quando uma requisição chega em uma rota protegida
   *    - O NestJS chama automaticamente este guard
   *    - O guard verifica o header: Authorization: Bearer <token>
   *    - Se o token for válido, a requisição continua
   *    - Se não for, retorna erro 401
   * 
   * 4. Relação com jwt.strategy.ts:
   *    - Este guard usa a estratégia definida em jwt.strategy.ts
   *    - A estratégia define COMO verificar o token
   *    - Este guard define ONDE usar essa verificação
   * 
   * FLUXO COMPLETO:
   * 
   * Frontend envia: 
   * POST /auth/logout
   * Headers: { Authorization: "Bearer eyJ..." }
   *     ↓
   * JwtAuthGuard intercepta a requisição
   *     ↓
   * Guard pega o token do header Authorization
   *     ↓
   * Guard chama JwtStrategy para validar o token
   *     ↓
   * JwtStrategy verifica assinatura e expira��ão
   *     ↓
   * Se válido: Guard permite acesso + coloca dados em req.user
   * Se inválido: Guard retorna erro 401
   *     ↓
   * Se passou: função logout() é executada
   */
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O JwtAuthGuard é o "PORTEIRO DIGITAL" do WhatsUT. Ele:
 * 
 * 1. 🛡️ PROTEGE ROTAS: Só deixa entrar quem tem token válido
 * 2. 🔍 VERIFICA TOKENS: Confere se o JWT não foi alterado ou expirou
 * 3. 👤 EXTRAI DADOS: Pega informações do usuário do token
 * 4. 🚫 BLOQUEIA INVASORES: Impede acesso não autorizado
 * 5. 🔄 AUTOMATIZA SEGURANÇA: Funciona sem código adicional
 * 
 * ONDE É USADO:
 * - Logout (precisa saber quem está saindo)
 * - Perfil (precisa saber de quem é o perfil)
 * - Chat (só usuários logados podem enviar mensagens)
 * - Grupos (só membros podem acessar)
 * - Qualquer rota que tenha @UseGuards(JwtAuthGuard)
 * 
 * SEM ESTE ARQUIVO: 
 * Qualquer pessoa poderia acessar áreas protegidas sem fazer login!
 * Seria como um prédio sem porteiro - qualquer um entraria.
 */
