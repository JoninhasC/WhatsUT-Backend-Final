/*
 * ====================================================================
 * ARQUIVO: csv-user.repository.ts
 * LOCALIZAÇÃO: src/users/csv-user.repository.ts
 * ====================================================================
 * 
 * PROPÓSITO DESTE ARQUIVO:
 * Este arquivo é o "BIBLIOTECÁRIO" do WhatsUT. Ele sabe exatamente como
 * ler, escrever, atualizar e deletar dados no arquivo CSV de usuários.
 * É a única parte do sistema que realmente "toca" no arquivo físico.
 * 
 * ANALOGIA SIMPLES:
 * Imagine uma biblioteca com um fichário de fichas de usuários:
 * - Este arquivo seria o bibliotecário que sabe onde cada ficha está
 * - Sabe como adicionar novas fichas
 * - Sabe como procurar fichas específicas
 * - Sabe como atualizar informações nas fichas
 * - Sabe como remover fichas quando necessário
 * 
 * PADRÃO REPOSITORY:
 * Este é um padrão de design que separa a lógica de negócio
 * (UsersService) da lógica de persistência de dados (este arquivo).
 * É como ter um especialista só para gerenciar o armazenamento.
 * 
 * RESPONSABILIDADES:
 * 1. LER arquivo CSV e converter em objetos JavaScript
 * 2. ESCREVER novos usuários no arquivo CSV
 * 3. BUSCAR usuários específicos por nome ou ID
 * 4. ATUALIZAR dados de usuários existentes
 * 5. DELETAR usuários do arquivo
 * 6. MANTER integridade do formato CSV
 */

// ===== IMPORTAÇÕES =====

// @Injectable: marca como serviço que pode ser injetado
import { Injectable } from '@nestjs/common';

// Interface que define como um usuário deve ser estruturado
import { User } from './entities/users.entity';

// Módulos Node.js para trabalhar com arquivos e caminhos
import * as fs from 'fs';           // File System - para ler/escrever arquivos
import * as path from 'path';       // Para trabalhar com caminhos de arquivos

// Biblioteca fast-csv para trabalhar com arquivos CSV
import { parse, writeToStream } from 'fast-csv';

// DTOs que definem formatos de dados
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// UUID para gerar IDs únicos
import { v4 } from 'uuid';

// ===== CONFIGURAÇÕES DO ARQUIVO CSV =====

// Caminho completo para o arquivo users.csv
export const CSV_FILE_USER = path.resolve(__dirname, '../../data/users.csv');
/*
 * EXPLICAÇÃO DO CAMINHO:
 * - __dirname: diretório atual deste arquivo (src/users/)
 * - ../../: volta 2 níveis (src/users/ → src/ → raiz/)
 * - data/users.csv: pasta data e arquivo users.csv
 * - path.resolve(): cria o caminho absoluto completo
 * 
 * RESULTADO: C:\Users\jonin\Desktop\projetos\WhatsUT-Backend-Final\data\users.csv
 */

// Cabeçalho (primeira linha) do arquivo CSV
export const CSV_HEADERS_USER = 'id,name,password\n';
/*
 * FORMATO CSV:
 * id,name,password
 * 123,João,senha_criptografada
 * 456,Maria,outra_senha_criptografada
 * 
 * Cada linha representa um usuário, colunas separadas por vírgula
 */

// ===== CLASSE UserRepository =====

@Injectable()
export class UserRepository {
  
  // ===== MÉTODO: BUSCAR TODOS OS USUÁRIOS =====
  async findAll(): Promise<User[]> {
    /*
     * PROPÓSITO: Lê o arquivo CSV inteiro e retorna array com todos os usuários
     * 
     * ESTE É O MÉTODO "BASE":
     * Outros métodos (findByName, findById) usam este para buscar todos
     * e depois filtram o resultado. Para arquivos pequenos, é eficiente.
     * 
     * FLUXO:
     * 1. Cria stream de leitura do arquivo
     * 2. Usa fast-csv para parsear (converter) CSV → objetos
     * 3. Acumula todos os usuários em um array
     * 4. Retorna array completo
     */
    
    return new Promise((resolve, reject) => {
      /*
       * Promise MANUAL:
       * 
       * Como a leitura de arquivo é assíncrona (não sabemos quando vai terminar),
       * usamos Promise para "prometer" que vamos retornar um resultado.
       * - resolve(): chama quando deu certo
       * - reject(): chama quando deu erro
       */
      
      const users: User[] = [];  // Array para acumular usuários
      
      // ===== STREAM DE LEITURA =====
      fs.createReadStream(CSV_FILE_USER)
        /*
         * createReadStream():
         * Cria um "fluxo de leitura" do arquivo. É como uma mangueira
         * que vai "jorrar" dados do arquivo pouco a pouco.
         * 
         * VANTAGEM: não carrega o arquivo inteiro na memória de uma vez
         */
        
        .pipe(parse({ headers: true }))
        /*
         * .pipe():
         * "Conecta" o fluxo de dados a um processador.
         * É como conectar a mangueira a um filtro.
         * 
         * parse({ headers: true }):
         * - Usa a biblioteca fast-csv para converter CSV → objetos
         * - headers: true = primeira linha são nomes das colunas
         * - Resultado: cada linha vira um objeto { id: "123", name: "João", password: "..." }
         */
        
        .on('error', reject)
        /*
         * .on('error'):
         * Se algo der errado (arquivo não existe, permissão negada, etc.),
         * chama reject() para informar que a Promise falhou
         */
        
        .on('data', (row) => users.push(row))
        /*
         * .on('data'):
         * Para cada linha processada, esta função é executada.
         * 'row' é um objeto representando um usuário.
         * Adiciona o usuário no array 'users'
         */
        
        .on('end', () => resolve(users));
        /*
         * .on('end'):
         * Quando terminar de ler todo o arquivo, chama resolve()
         * passando o array completo de usuários
         */
    });
  }

  // ===== MÉTODO: BUSCAR USUÁRIO POR NOME =====
  async findByName(name: string): Promise<User | undefined> {
    /*
     * PROPÓSITO: Encontra um usuário específico pelo nome
     * 
     * ESTRATÉGIA:
     * 1. Busca todos os usuários
     * 2. Usa .find() para procurar o que tem o nome igual
     * 3. Retorna o usuário ou undefined se não achar
     */
    
    const users = (await this.findAll()).find((user) => user.name === name);
    /*
     * QUEBRA EM PARTES:
     * 
     * 1. await this.findAll(): espera carregar todos os usuários
     * 2. .find((user) => user.name === name): procura usuário com nome igual
     * 3. find() retorna o primeiro que der match ou undefined
     * 
     * EXEMPLO:
     * Se name = "João", vai procurar no array:
     * [{ id: "123", name: "João", password: "..." }, { id: "456", name: "Maria", ... }]
     * Retorna: { id: "123", name: "João", password: "..." }
     */
    
    return users;
  }

  // ===== MÉTODO: BUSCAR USUÁRIO POR ID =====
  async findById(id: string): Promise<User | undefined> {
    /*
     * PROPÓSITO: Encontra um usuário específico pelo ID único
     * 
     * LÓGICA SIMILAR ao findByName, mas busca pelo ID
     */
    
    const users = (await this.findAll()).find((user) => user.id === id);
    return users;
  }

  // ===== MÉTODO: CRIAR NOVO USUÁRIO =====
  async create(dto: CreateUserDto): Promise<User> {
    /*
     * PROPÓSITO: Adiciona um novo usuário ao arquivo CSV
     * 
     * PROCESSO:
     * 1. Gera ID único para o usuário
     * 2. Cria objeto User completo
     * 3. Adiciona (append) ao final do arquivo CSV
     * 4. Retorna o usuário criado
     */
    
    // ===== PASSO 1: CRIAR OBJETO USER =====
    const user: User = {
      id: v4(),           // Gera UUID único (ex: "f47ac10b-58cc-4372-a567-0e02b2c3d479")
      name: dto.name,     // Nome que veio do DTO
      password: dto.password,  // Senha que veio do DTO (já criptografada pelo UsersService)
    };
    /*
     * v4(): Gera um UUID versão 4 (universally unique identifier)
     * É estatisticamente impossível gerar dois UUIDs iguais
     * Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     */

    // ===== PASSO 2: PREPARAR DADOS PARA ESCRITA =====
    const row = [user];  // fast-csv espera array de objetos
    
    // ===== PASSO 3: ESCREVER NO ARQUIVO =====
    await new Promise((resolve, reject) => {
      /*
       * STRATEGY: APPEND MODE
       * 
       * Não reescrevemos o arquivo inteiro, só adicionamos no final.
       * É mais eficiente para arquivos grandes.
       * 
       * flags: 'a' = append mode (adicionar no final)
       */
      
      const writableStream = fs.createWriteStream(CSV_FILE_USER, {
        flags: 'a',  // append - adiciona no final sem sobrescrever
      });
      
      writeToStream(writableStream, row, {
        headers: false,              // Não escreve headers (já existem no arquivo)
        includeEndRowDelimiter: true, // Adiciona \n no final da linha
      })
        .on('error', reject)      // Se der erro, rejeita a Promise
        .on('finish', () => resolve(undefined));  // Se terminar, resolve a Promise
    });

    return user;  // Retorna o usuário criado
  }

  // ===== MÉTODO: ATUALIZAR USUÁRIO =====
  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    /*
     * PROPÓSITO: Atualiza dados de um usuário existente
     * 
     * ESTRATÉGIA:
     * 1. Carrega todos os usuários
     * 2. Procura o usuário pelo ID
     * 3. Atualiza os dados que foram enviados
     * 4. Reescreve o arquivo inteiro com os dados atualizados
     * 
     * NOTA: Para CSVs pequenos, reescrever tudo é OK.
     * Para arquivos grandes, seria melhor usar banco de dados.
     */
    
    // ===== PASSO 1: CARREGAR TODOS OS USUÁRIOS =====
    const users = await this.findAll();
    
    // ===== PASSO 2: ENCONTRAR USUÁRIO =====
    const userIndex = users.findIndex(user => user.id === id);
    /*
     * findIndex(): procura e retorna o ÍNDICE (posição) no array
     * Se não encontrar, retorna -1
     */
    
    if (userIndex === -1) {
      return null;  // Usuário não encontrado
    }

    // ===== PASSO 3: ATUALIZAR DADOS =====
    const updatedUser = {
      ...users[userIndex],                    // Mantém dados existentes
      ...(dto.name && { name: dto.name }),    // Só atualiza name se foi enviado
      ...(dto.password && { password: dto.password }),  // Só atualiza password se foi enviado
    };
    /*
     * SPREAD OPERATOR (...):
     * 
     * 1. ...users[userIndex]: copia todas propriedades do usuário atual
     * 2. ...(dto.name && { name: dto.name }): se dto.name existe, sobrescreve
     * 3. ...(dto.password && { ... }): se dto.password existe, sobrescreve
     * 
     * RESULTADO: objeto com dados antigos + novos dados sobrepostos
     */

    users[userIndex] = updatedUser;  // Substitui usuário no array

    // ===== PASSO 4: REESCREVER ARQUIVO =====
    await this.writeAllUsers(users);
    
    return updatedUser;
  }

  // ===== MÉTODO: DELETAR USUÁRIO =====
  async delete(id: string): Promise<boolean> {
    /*
     * PROPÓSITO: Remove um usuário do arquivo CSV
     * 
     * ESTRATÉGIA:
     * 1. Carrega todos os usuários
     * 2. Remove o usuário do array
     * 3. Reescreve arquivo sem o usuário removido
     */
    
    const users = await this.findAll();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return false;  // Usuário não encontrado
    }

    users.splice(userIndex, 1);  // Remove 1 elemento na posição userIndex
    /*
     * splice(start, deleteCount):
     * - start: posição onde começar
     * - deleteCount: quantos elementos remover
     * 
     * EXEMPLO:
     * [a, b, c, d].splice(1, 1) → [a, c, d]  (removeu 'b')
     */

    await this.writeAllUsers(users);  // Reescreve arquivo
    
    return true;  // Sucesso
  }

  // ===== MÉTODO PRIVADO: REESCREVER ARQUIVO COMPLETO =====
  private async writeAllUsers(users: User[]): Promise<void> {
    /*
     * PROPÓSITO: Reescreve todo o arquivo CSV com uma nova lista de usuários
     * 
     * USADO POR: update() e delete()
     * 
     * PROCESSO:
     * 1. Limpa arquivo e escreve headers
     * 2. Escreve todos os usuários do array
     */
    
    return new Promise((resolve, reject) => {
      // ===== PASSO 1: RECRIAR ARQUIVO COM HEADERS =====
      fs.writeFileSync(CSV_FILE_USER, CSV_HEADERS_USER);
      /*
       * writeFileSync(): versão SÍNCRONA de escrita
       * - Apaga conteúdo anterior
       * - Escreve só os headers
       * - Bloqueia até terminar (por isso Sync)
       */
      
      // ===== PASSO 2: VERIFICAR SE HÁ USUÁRIOS =====
      if (users.length === 0) {
        resolve();  // Se não há usuários, só os headers bastam
        return;
      }

      // ===== PASSO 3: ESCREVER TODOS OS USUÁRIOS =====
      const writableStream = fs.createWriteStream(CSV_FILE_USER, {
        flags: 'a',  // append - adiciona após os headers
      });
      
      writeToStream(writableStream, users, {
        headers: false,              // Headers já foram escritos
        includeEndRowDelimiter: true, // \n no final de cada linha
      })
        .on('error', reject)
        .on('finish', () => resolve());
    });
  }
}

/*
 * ====================================================================
 * RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * ====================================================================
 * 
 * O UserRepository é o "ESPECIALISTA EM DADOS" do WhatsUT. Ele:
 * 
 * 1. 📁 GERENCIA ARQUIVO: Único responsável por ler/escrever users.csv
 * 2. 🔍 BUSCA DADOS: Por ID, nome ou todos os usuários
 * 3. ➕ CRIA REGISTROS: Adiciona novos usuários com IDs únicos
 * 4. ✏️ ATUALIZA DADOS: Modifica informações existentes
 * 5. 🗑️ REMOVE DADOS: Deleta usuários quando necessário
 * 6. 🛡️ MANTÉM INTEGRIDADE: Garante formato CSV correto
 * 
 * PADRÃO ARQUITETURAL:
 * 
 * UsersService (lógica de negócio)
 *     ↓ chama métodos
 * UserRepository (lógica de dados)
 *     ↓ lê/escreve
 * users.csv (armazenamento físico)
 * 
 * VANTAGENS DESTA SEPARAÇÃO:
 * - Mudança de CSV para banco de dados: só altera Repository
 * - Lógica de negócio não se mistura com lógica de dados
 * - Facilita testes (pode usar mock do Repository)
 * - Facilita manutenção (responsabilidades bem definidas)
 * 
 * CONCEITOS IMPORTANTES APLICADOS:
 * - Promises para operações assíncronas
 * - Streams para eficiência de memória
 * - UUID para IDs únicos
 * - Spread operator para atualização parcial
 * - Error handling com reject/resolve
 * 
 * SEM ESTE ARQUIVO:
 * Não haveria como persistir dados! Toda informação seria perdida
 * quando a aplicação fosse reiniciada.
 */
