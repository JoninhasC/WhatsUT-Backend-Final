/*
 * ====================================================================
 * ARQUIVO: jwt.strategy.ts
 * LOCALIZAÇÃO: src/auth/jwt.strategy.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo define COMO verificar e processar tokens JWT no WhatsUT.
 * É como um "manual de instruções" que ensina o sistema a ler e validar
 * as "pulseirinhas digitais" (tokens) que os usuários apresentam.
 * 
 * ANALOGIA SIMPLES:
 * Imagine que você criou um sistema de pulseirinhas para um evento.
 * Este arquivo seria:
 * - O "leitor de pulseirinhas" que sabe como decodificar as informações
 * - O "manual" que diz onde procurar a pulseirinha (no pulso? no bolso?)
 * - A "chave secreta" para verificar se a pulseirinha é legítima
 * 
 * RELAÇÃO COM OUTROS ARQUIVOS:
 * - JwtAuthGuard usa esta estratégia para verificar tokens
 * - AuthService cria tokens que esta estratégia vai verificar
 * - Qualquer rota protegida depende desta verificação
 * 
 * CONCEITO IMPORTANTE - JWT (JSON Web Token):
 * Um JWT é como uma carteira de identidade digital que contém:
 * - Quem você é (payload com nome e ID)
 * - Quando expira (timestamp)
 * - Uma "assinatura digital" que prova que é legítimo
 */

// ===== IMPORTAÇÕES =====

// @Injectable: marca como serviço que pode ser injetado
import { Injectable } from '@nestjs/common';

// PassportStrategy: classe base para criar estratégias de autenticação
import { PassportStrategy } from '@nestjs/passport';

// ExtractJwt: utilitários para extrair tokens de requisições HTTP
// Strategy: estratégia específica para tokens JWT
import { ExtractJwt, Strategy } from 'passport-jwt';

// ===== CLASSE JwtStrategy =====

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /*
   * EXPLICAÇÃO DA HERANÇA:
   * 
   * "extends PassportStrategy(Strategy)":
   * - PassportStrategy: classe que gerencia estratégias de autenticação
   * - Strategy: estratégia específica para JWT (importada do passport-jwt)
   * - É como herdar um "modelo padrão" e personalizá-lo para nossas necessidades
   */

  // ===== CONSTRUTOR (CONFIGURAÇÃO DA ESTRATÉGIA) =====
  constructor() {
    // super(): chama o construtor da classe pai (PassportStrategy)
    // Passa um objeto de configuração que define COMO processar tokens
    super({
      
      // ===== CONFIGURAÇÃO 1: ONDE ENCONTRAR O TOKEN =====
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      /*
       * EXPLICAÇÃO DETALHADA:
       * 
       * ExtractJwt.fromAuthHeaderAsBearerToken() diz:
       * "Procure o token no header Authorization da requisição HTTP"
       * 
       * FORMATO ESPERADO:
       * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
       * 
       * OUTRAS OPÇÕES POSSÍVEIS:
       * - ExtractJwt.fromBodyField('token'): buscar no corpo da requisição
       * - ExtractJwt.fromUrlQueryParameter('token'): buscar na query string
       * - ExtractJwt.fromCookies('jwt'): buscar nos cookies
       * 
       * Escolhemos o header Authorization porque é o padrão de segurança mais usado
       */
      
      // ===== CONFIGURAÇÃO 2: CHAVE SECRETA PARA VERIFICAR ASSINATURA =====
      secretOrKey: process.env.JWT_SECRET || 'senhasemenv', // Cuidado com env
      /*
       * EXPLICAÇÃO DETALHADA:
       * 
       * Esta é a "chave secreta" que usamos para:
       * 1. CRIAR tokens (no AuthService)
       * 2. VERIFICAR tokens (aqui na Strategy)
       * 
       * É como a chave que assina documentos oficiais:
       * - Se alguém alterar o token, a assinatura não vai bater
       * - Só quem tem a chave secreta pode criar tokens válidos
       * 
       * SEGURANÇA IMPORTANTE:
       * - process.env.JWT_SECRET: busca a chave nas variáveis de ambiente
       * - 'senhasemenv': fallback caso não tenha .env (APENAS PARA DESENVOLVIMENTO!)
       * - Em produção, SEMPRE use uma variável de ambiente segura
       * 
       * ONDE DEFINIR A VARIÁVEL:
       * Crie um arquivo .env na raiz do projeto:
       * JWT_SECRET=minha_chave_super_secreta_e_complexa_123456
       */
      
      // NOTA: Não definimos ignoreExpiration, então tokens expirados serão rejeitados automaticamente
      // NOTA: Não definimos algorithms, então aceita o padrão (HS256)
    });
  }

  // ===== MÉTODO VALIDATE (PROCESSAR DADOS DO TOKEN) =====
  async validate(payload: any) {
    /*
     * QUANDO ESTA FUNÇÃO É CHAMADA:
     * 
     * Esta função é executada automaticamente quando:
     * 1. Um token JWT é encontrado na requisição
     * 2. O token passou na verificação de assinatura
     * 3. O token não está expirado
     * 
     * Se chegou até aqui, o token é VÁLIDO!
     * 
     * PARÂMETRO payload:
     * É o conteúdo decodificado do token, ou seja, as informações
     * que foram colocadas no token quando ele foi criado.
     * 
     * No nosso caso, o payload contém:
     * {
     *   name: "João",           // Nome do usuário
     *   sub: "user-123",        // ID do usuário (sub = subject)
     *   iat: 1234567890,        // Quando foi criado (issued at)
     *   exp: 1234567890         // Quando expira (expiration)
     * }
     */
    
    // O que retornamos aqui será colocado em req.user
    // nas rotas protegidas pelo JwtAuthGuard
    return { 
      id: payload.sub,    // Extraímos o ID do usuário (sub = subject)
      name: payload.name  // Extraímos o nome do usuário
    };
    
    /*
     * RESULTADO:
     * 
     * Após esta função, em qualquer rota protegida, você pode fazer:
     * 
     * @UseGuards(JwtAuthGuard)
     * @Post('alguma-rota')
     * minhaFuncao(@Request() req) {
     *   console.log(req.user); // { id: "user-123", name: "João" }
     * }
     * 
     * É como se o sistema automaticamente "anexasse" a identidade
     * do usuário a cada requisição autenticada.
     */
  }
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O JwtStrategy é o "DECODIFICADOR DE IDENTIDADES" do WhatsUT. Ele:
 * 
 * 1. 🔍 LOCALIZA TOKENS: Sabe onde procurar o JWT na requisição HTTP
 * 2. 🔐 VERIFICA ASSINATURA: Usa a chave secreta para validar autenticidade
 * 3. ⏰ CONFERE EXPIRAÇÃO: Garante que o token ainda é válido
 * 4. 📋 EXTRAI DADOS: Decodifica as informações do usuário do token
 * 5. 🎫 PREPARA CONTEXTO: Disponibiliza os dados em req.user
 * 
 * FLUXO COMPLETO:
 * 
 * 1. Frontend envia requisição com token:
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * 2. JwtAuthGuard intercepta e chama JwtStrategy
 * 
 * 3. JwtStrategy:
 *    - Extrai token do header Authorization
 *    - Verifica assinatura com a chave secreta
 *    - Confere se não expirou
 *    - Decodifica payload: { name: "João", sub: "123" }
 *    - Chama validate() com esse payload
 * 
 * 4. validate() retorna: { id: "123", name: "João" }
 * 
 * 5. JwtAuthGuard coloca resultado em req.user
 * 
 * 6. Rota protegida pode usar req.user com dados do usuário
 * 
 * SEM ESTE ARQUIVO: 
 * Não haveria como verificar se os tokens são legítimos!
 * Qualquer um poderia criar tokens falsos e se passar por outros usuários.
 */
