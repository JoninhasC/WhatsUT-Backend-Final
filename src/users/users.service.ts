/*
 * ====================================================================
 * ARQUIVO: users.service.ts
 * LOCALIZAÇÃO: src/users/users.service.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é o "DEPARTAMENTO DE USUÁRIOS" do WhatsUT. Ele gerencia
 * todas as operações relacionadas aos usuários: criar, buscar, verificar
 * se já existe, criptografar senhas, etc.
 * 
 * ANALOGIA SIMPLES:
 * Imagine um banco. Este arquivo seria o departamento que:
 * - Abre novas contas (criar usuário)
 * - Consulta dados de clientes (buscar usuário)
 * - Verifica se CPF já está cadastrado (evitar duplicatas)
 * - Guarda documentos no cofre (criptografar senhas)
 * 
 * RESPONSABILIDADES:
 * 1. CRIAR novos usuários com senhas criptografadas
 * 2. BUSCAR usuários por nome ou ID
 * 3. VALIDAR se usuário já existe antes de criar
 * 4. GERENCIAR criptografia de senhas (bcrypt)
 * 5. COMUNICAR com o repositório (que acessa o CSV)
 * 
 * RELAÇÃO COM OUTROS ARQUIVOS:
 * - É USADO por: AuthService (para login e registro)
 * - USA: UserRepository (para acessar dados no CSV)
 * - RETORNA: dados dos usuários para quem solicitar
 */

// ===== IMPORTAÇÕES =====

// ConflictException: tipo de erro para quando algo já existe (usuário duplicado)
// Injectable: marca como serviço que pode ser injetado
import { ConflictException, Injectable } from '@nestjs/common';

// DTO que define como os dados de um novo usuário devem chegar
import { CreateUserDto } from './dto/create-user.dto';

// Repositório que acessa o arquivo CSV de usuários
import { UserRepository } from './csv-user.repository';

// Biblioteca para criptografar senhas de forma segura
import * as bcrypt from 'bcrypt';

// ===== CLASSE UsersService =====

@Injectable()
export class UsersService {
  
  // ===== CONSTRUTOR =====
  constructor(private usersRepo: UserRepository) {
    /*
     * INJEÇÃO DE DEPENDÊNCIA:
     * 
     * Recebemos o UserRepository (repositório de usuários) que sabe
     * como acessar e manipular o arquivo CSV onde os usuários são salvos.
     * 
     * É como ter acesso ao "arquivo de clientes" do banco.
     * Este serviço faz as operações de negócio, e o repositório
     * faz as operações técnicas de salvar/buscar dados.
     */
  }

  // ===== MÉTODO: BUSCAR USUÁRIO POR NOME =====
  async findOne(username: string) {
    /*
     * PROPÓSITO: Encontrar um usuário específico pelo nome
     * 
     * QUANDO É USADO:
     * - No login (para verificar se o usuário existe)
     * - Na criação (para verificar se nome já está em uso)
     * 
     * EXEMPLO DE USO:
     * const usuario = await usersService.findOne("João");
     * if (usuario) {
     *   console.log("Usuário encontrado:", usuario.name);
     * }
     */
    
    // Delega a busca para o repositório, que sabe como acessar o CSV
    return this.usersRepo.findByName(username);
    
    /*
     * RETORNO:
     * - Se encontrar: objeto com { id, name, password }
     * - Se não encontrar: null ou undefined
     */
  }

  // ===== MÉTODO: BUSCAR USUÁRIO POR ID =====
  async findById(userId: string) {
    /*
     * PROPÓSITO: Encontrar um usuário específico pelo ID único
     * 
     * QUANDO É USADO:
     * - Quando temos o ID do usuário (ex: do token JWT)
     * - Para buscar dados completos do usuário
     * 
     * DIFERENÇA ENTRE findOne e findById:
     * - findOne: busca por nome (para login)
     * - findById: busca por ID (para operações internas)
     */
    
    return this.usersRepo.findById(userId);
  }

  // ===== MÉTODO: CRIAR NOVO USUÁRIO =====
  async create({ name, password }: CreateUserDto) {
    /*
     * PROPÓSITO: Criar uma nova conta de usuário
     * 
     * PARÂMETROS:
     * - name: nome do usuário (deve ser único)
     * - password: senha em texto puro (será criptografada)
     * 
     * PROCESSO COMPLETO:
     * 1. Verifica se usuário já existe
     * 2. Criptografa a senha
     * 3. Salva no arquivo CSV
     * 4. Retorna dados básicos (sem a senha)
     */
    
    // ===== PASSO 1: VERIFICAR SE USUÁRIO JÁ EXISTE =====
    const exitUser = await this.usersRepo.findByName(name);
    if (exitUser) {
      // Se já existe, lança erro específico
      throw new ConflictException('Usario ja cadastrado');
      /*
       * ConflictException gera erro HTTP 409 (Conflict)
       * É o código correto para "recurso já existe"
       * 
       * O frontend recebe este erro e pode mostrar mensagem:
       * "Este nome de usuário já está em uso"
       */
    }
    
    // ===== PASSO 2: CRIPTOGRAFAR A SENHA =====
    
    // 2.1: Gerar "sal" (salt) - um valor aleatório único
    const salt = await bcrypt.genSalt();
    /*
     * O QUE É SALT?
     * 
     * Salt é um valor aleatório adicionado à senha antes de criptografar.
     * Isso impede ataques de "rainbow table" (tabelas pré-computadas).
     * 
     * EXEMPLO:
     * Senha: "123456"
     * Salt: "$2b$10$abcdef..."
     * Hash final: resultado de criptografar("123456" + salt)
     * 
     * Mesmo que duas pessoas tenham a mesma senha, os hashes serão diferentes
     * por causa do salt único de cada uma.
     */
    
    // 2.2: Criptografar senha + salt
    const hashed = await bcrypt.hash(password, salt);
    /*
     * bcrypt.hash() faz a "mágica":
     * - Combina senha + salt
     * - Aplica algoritmo de criptografia
     * - Retorna um hash que é impossível de reverter
     * 
     * EXEMPLO:
     * Entrada: "123456"
     * Saída: "$2b$10$abcdef...xyz" (60 caracteres)
     * 
     * PROPRIEDADES IMPORTANTES:
     * - É "one-way": você pode gerar o hash, mas não pode voltar à senha
     * - É "determinístico": mesma senha + mesmo salt = mesmo hash
     * - É "resistente": muito difícil de quebrar por força bruta
     */
    
    // ===== PASSO 3: SALVAR NO ARQUIVO CSV =====
    const user = await this.usersRepo.create({
      name,           // Nome do usuário
      password: hashed, // Senha criptografada (nunca a senha original!)
    });
    /*
     * O repositório vai:
     * - Gerar um ID único para o usuário
     * - Adicionar uma linha no arquivo users.csv
     * - Retornar os dados do usuário criado
     */
    
    // ===== PASSO 4: RETORNAR DADOS SEGUROS =====
    return { 
      id: user.id, 
      name: user.name 
    };
    /*
     * IMPORTANTE: NÃO retornamos a senha!
     * 
     * Mesmo que seja criptografada, é boa prática nunca enviar
     * senhas de volta para o frontend. Retornamos apenas dados
     * que são seguros de expor.
     * 
     * O frontend vai receber: { id: "123", name: "João" }
     */
  }
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O UsersService é o "GERENTE DE USUÁRIOS" do WhatsUT. Ele:
 * 
 * 1. 👤 CRIA CONTAS: Registra novos usuários com segurança
 * 2. 🔍 BUSCA USUÁRIOS: Por nome (login) ou ID (operações internas)
 * 3. 🛡️ PROTEGE SENHAS: Criptografa todas as senhas com bcrypt
 * 4. ✅ EVITA DUPLICATAS: Verifica se usuário já existe antes de criar
 * 5. 🔒 MANTÉM SEGURANÇA: Nunca expõe senhas em retornos
 * 
 * FLUXO DE CRIAÇÃO DE USUÁRIO:
 * 
 * Frontend → AuthController → AuthService → UsersService → UserRepository → CSV
 *                                              ↑
 *                                   Este arquivo faz:
 *                                   - Validação de duplicata
 *                                   - Criptografia da senha
 *                                   - Retorno seguro dos dados
 * 
 * CONCEITOS DE SEGURANÇA APLICADOS:
 * - Hash de senhas (bcrypt)
 * - Salt único por usuário
 * - Validação de dados
 * - Não exposição de senhas
 * - Tratamento de erros específicos
 * 
 * SEM ESTE ARQUIVO: 
 * Não haveria como criar ou buscar usuários de forma segura!
 * As senhas ficariam em texto puro (muito perigoso).
 */
