/**
 * 🏠 GROUP REPOSITORY - CAMADA DE PERSISTÊNCIA PARA GRUPOS NO WHATSUT
 * 
 * 🎓 CONCEITO EDUCACIONAL FUNDAMENTAL:
 * Este é um Repository que implementa o padrão Repository Pattern para grupos.
 * É a "biblioteca" ou "arquivo" onde guardamos e organizamos todos os dados dos grupos.
 * 
 * ANALOGIA SIMPLES:
 * Imagine um arquivo de pastas suspenso em um escritório:
 * - Cada grupo é uma pasta com informações organizadas
 * - O repository é o arquivista que sabe como encontrar, guardar e organizar as pastas
 * - Ele lida com os detalhes técnicos de como os dados são armazenados
 * - Oferece uma interface simples para outras partes do sistema
 * 
 * 🎯 RESPONSABILIDADES DESTE REPOSITORY:
 * - Ler dados de grupos do arquivo CSV
 * - Escrever dados de grupos no arquivo CSV
 * - Buscar grupos específicos por ID ou critérios
 * - Criar novos grupos no sistema
 * - Atualizar grupos existentes
 * - Excluir grupos do sistema
 * - Filtrar grupos por usuário (meus grupos)
 * 
 * 🔧 OPERAÇÕES PRINCIPAIS (CRUD):
 * - CREATE: Criar novo grupo
 * - READ: Ler/buscar grupos (findAll, findById, findMyGroups)
 * - UPDATE: Atualizar grupo existente
 * - DELETE: Excluir grupo
 * 
 * 📁 PERSISTÊNCIA EM CSV:
 * - Arquivo: data/groups.csv
 * - Formato: id,name,adminsId,members,pendingRequests,lastAdminRule
 * - Arrays são salvos como strings separadas por ';'
 * - Sistema simples mas educativo para aprendizado
 */

// 📦 IMPORTAÇÕES DO NESTJS
import { Injectable } from '@nestjs/common'; // 💉 Decorator para injeção de dependências

// 📦 IMPORTAÇÕES DE TIPOS E ENTITIES
import { Group, LastAdminRule } from './entities/group.entity'; // 🏠 Interface/tipo de grupo

// 📦 IMPORTAÇÕES DE UTILITÁRIOS
import { v4 } from 'uuid';                     // 🆔 Gerador de IDs únicos
import { parse, writeToPath } from 'fast-csv'; // 📄 Biblioteca para manipular CSV
import * as fs from 'fs';                      // 📁 Sistema de arquivos do Node.js
import * as path from 'path';                  // 🛤️ Manipulação de caminhos de arquivo

// 📦 IMPORTAÇÕES DE DTOs
import { CreateGroupDto } from './dto/create-group.dto'; // 📋 DTO para criação de grupo

/**
 * 📁 CONFIGURAÇÃO DO ARQUIVO CSV
 * 
 * 📚 CONCEITO - File Path Resolution:
 * Definimos o caminho absoluto para o arquivo de dados.
 * __dirname é o diretório atual, navegamos para ../../data/
 */
export const CSV_FILE_GROUP = path.resolve(__dirname, '../../data/groups.csv');

/**
 * 📋 DEFINIÇÃO DOS HEADERS CSV
 * 
 * 📚 CONCEITO - CSV Structure:
 * Cabeçalho que define a estrutura das colunas do arquivo CSV.
 * Cada coluna representa um campo da entidade Group.
 * 
 * CAMPOS:
 * - id: Identificador único do grupo
 * - name: Nome do grupo
 * - adminsId: IDs dos administradores (separados por ;)
 * - members: IDs dos membros (separados por ;)
 * - pendingRequests: IDs dos pedidos pendentes (separados por ;)
 * - lastAdminRule: Regra quando último admin sai ('delete' ou 'promote')
 */
export const CSV_HEADERS_GROUP =
  'id,name,adminsId,members,pendingRequests,lastAdminRule\n';

/**
 * 🏗️ DECORATOR DE INJEÇÃO DE DEPENDÊNCIAS
 * 
 * 📚 CONCEITO - Injectable Service:
 * @Injectable marca esta classe como um service que pode
 * ser injetado em outros componentes do NestJS.
 */
@Injectable()
export class GroupRepository {
 
  /**
   * 📖 MÉTODO PRIVADO: LER TODOS OS GRUPOS DO CSV
   * 
   * 📚 CONCEITO - Data Loading from CSV:
   * Método privado que lê o arquivo CSV e converte os dados
   * em objetos Group TypeScript. É a base para todas as operações de leitura.
   * 
   * PROCESSO:
   * 1. 📁 Abre stream de leitura do arquivo
   * 2. 📄 Usa fast-csv para parsear linha por linha
   * 3. 🔄 Converte strings CSV em objetos Group
   * 4. 📊 Processa arrays que estão como strings separadas por ';'
   * 5. ✅ Retorna array completo de grupos
   * 
   * @returns Promise<Group[]> - Array de todos os grupos
   */
  private async readAllGroupsFromCsv(): Promise<Group[]> {
    /**
     * 🔄 PROMISE PARA OPERAÇÃO ASSÍNCRONA
     * 
     * 📚 CONCEITO - Promise Wrapper:
     * Como a leitura de arquivo com streams é callback-based,
     * envolvemos em Promise para usar async/await.
     */
    return new Promise((resolve, reject) => {
      const groups: Group[] = []; // 📊 Array para acumular grupos
      
      /**
       * 📁 STREAM DE LEITURA DO ARQUIVO
       * 
       * 📚 CONCEITO - File Streaming:
       * Criamos um stream de leitura que é eficiente para arquivos grandes
       * e conectamos ao parser CSV com pipeline.
       */
      fs.createReadStream(CSV_FILE_GROUP)
        .pipe(parse({ headers: true })) // 📄 Parser CSV com headers automáticos
        .on('error', reject)            // ❌ Propaga erros para a Promise
        .on('data', (row) => {          // 📊 Processa cada linha do CSV
          
          /**
           * 🔄 CONVERSÃO DE LINHA CSV PARA OBJETO GROUP
           * 
           * 📚 CONCEITO - Data Transformation:
           * Cada linha do CSV vira um objeto Group, com
           * tratamento especial para arrays e enums.
           */
          const group: Group = {
            id: row.id,                 // 🆔 ID direto (string)
            name: row.name,             // 📛 Nome direto (string)
            
            /**
             * 👑 PROCESSAMENTO DE ARRAY DE ADMINS
             * 
             * 📚 CONCEITO - String to Array Conversion:
             * No CSV, arrays são salvos como "id1;id2;id3".
             * Aqui convertemos de volta para array.
             * Se vazio/null, retorna array vazio.
             */
            adminsId: row.adminsId ? row.adminsId.split(';') : [],
            
            /**
             * 👥 PROCESSAMENTO DE ARRAY DE MEMBROS
             * 
             * Mesmo processo dos admins.
             */
            members: row.members ? row.members.split(';') : [],
            
            /**
             * 📝 PROCESSAMENTO DE PEDIDOS PENDENTES
             * 
             * Mesmo processo, mas para solicitações de entrada.
             */
            pendingRequests: row.pendingRequests
              ? row.pendingRequests.split(';')
              : [],
            
            /**
             * ⚙️ PROCESSAMENTO DE ENUM
             * 
             * 📚 CONCEITO - Enum Validation:
             * lastAdminRule é um enum com valores específicos.
             * Validamos e aplicamos valor padrão se inválido.
             */
            lastAdminRule:
              row.lastAdminRule === 'delete' ? 'delete' : 'promote',
          };
          
          /**
           * ➕ ADICIONAR GRUPO AO ARRAY
           * 
           * Cada grupo processado é adicionado ao array acumulador.
           */
          groups.push(group);
        })
        .on('end', () => resolve(groups)); // ✅ Resolve Promise quando termina
    });
  }

 
  /**
   * 💾 MÉTODO PRIVADO: ESCREVER GRUPOS NO CSV
   * 
   * 📚 CONCEITO - Data Persistence to CSV:
   * Método privado que converte array de objetos Group
   * de volta para formato CSV e salva no arquivo.
   * 
   * PROCESSO:
   * 1. 🔄 Converte objetos Group em formato CSV
   * 2. 📊 Transforma arrays em strings separadas por ';'
   * 3. 📁 Sobrescreve arquivo completamente
   * 4. ✅ Confirma sucesso da operação
   * 
   * @param groups - Array de grupos para salvar
   */
  private async writeGroupsToCsv(groups: Group[]): Promise<void> {
    /**
     * 🔄 TRANSFORMAÇÃO DE DADOS
     * 
     * 📚 CONCEITO - Object to CSV Conversion:
     * Convertemos cada objeto Group em formato adequado para CSV.
     * Arrays são convertidos para strings com separador ';'.
     */
    const rows = groups.map((g) => ({
      id: g.id,                           // 🆔 ID direto (string)
      name: g.name,                       // 📛 Nome direto (string)
      
      /**
       * 👑 CONVERSÃO DE ARRAY PARA STRING
       * 
       * 📚 CONCEITO - Array Serialization:
       * Arrays de IDs são convertidos para string
       * usando ';' como separador: ["id1", "id2"] → "id1;id2"
       */
      adminsId: g.adminsId.join(';'),
      members: g.members.join(';'),
      pendingRequests: g.pendingRequests.join(';'),
      
      /**
       * ⚙️ ENUM COMO STRING
       * 
       * Enum já é string, pode ser salvo diretamente.
       */
      lastAdminRule: g.lastAdminRule, 
    }));

    /**
     * 💾 ESCRITA ASSÍNCRONA DO ARQUIVO
     * 
     * 📚 CONCEITO - File Writing with Promise:
     * Usamos fast-csv para escrever dados formatados
     * e envolvemos em Promise para async/await.
     */
    return new Promise<void>((resolve, reject) => {
      writeToPath(CSV_FILE_GROUP, rows, { headers: true })
        .on('error', reject)    // ❌ Propaga erros
        .on('finish', resolve); // ✅ Resolve quando termina
    });
  }

  /**
   * 📋 MÉTODO PÚBLICO: BUSCAR TODOS OS GRUPOS
   * 
   * 📚 CONCEITO - Repository Public Interface:
   * Método público que expõe funcionalidade de listagem.
   * É a interface simples que outros módulos usam.
   * 
   * CASO DE USO:
   * - Controller precisa listar todos os grupos disponíveis
   * - Página de descoberta de grupos
   * - Administração geral do sistema
   * 
   * @returns Promise<Group[]> - Lista de todos os grupos
   */
  async findAll(): Promise<Group[]> {
    /**
     * 🔄 DELEGAÇÃO PARA MÉTODO PRIVADO
     * 
     * 📚 CONCEITO - Separation of Concerns:
     * Método público delega para método privado que
     * lida com detalhes técnicos de leitura CSV.
     */
    return await this.readAllGroupsFromCsv();
  }

  /**
   * 👤 MÉTODO PÚBLICO: BUSCAR GRUPOS DO USUÁRIO
   * 
   * 📚 CONCEITO - Filtered Data Access:
   * Retorna apenas grupos dos quais o usuário é membro.
   * É como "filtrar minha estante de livros".
   * 
   * CASO DE USO:
   * - Endpoint /groups/my
   * - Dashboard personalizado do usuário
   * - Listagem de grupos que o usuário pode acessar
   * 
   * @param userId - ID do usuário para filtrar
   * @returns Promise<Group[]> - Grupos do usuário
   */
  async findMyGroups(userId: string): Promise<Group[]> {
    /**
     * 📊 CARREGAR E FILTRAR DADOS
     * 
     * 📚 CONCEITO - Data Filtering:
     * 1. Carrega todos os grupos
     * 2. Filtra apenas grupos onde usuário é membro
     * 3. Retorna lista personalizada
     */
    const allGroups = await this.findAll();
    return allGroups.filter((group) => group.members.includes(userId));
  }

  /**
   * 🔍 MÉTODO PÚBLICO: BUSCAR GRUPO POR ID
   * 
   * 📚 CONCEITO - Single Record Lookup:
   * Encontra um grupo específico pelo ID único.
   * É como "procurar uma pasta específica no arquivo".
   * 
   * CASO DE USO:
   * - Validar se grupo existe antes de operações
   * - Carregar dados completos de um grupo
   * - Verificações de permissão
   * 
   * @param id - ID único do grupo
   * @returns Promise<Group | undefined> - Grupo encontrado ou undefined
   */
  async findById(id: string): Promise<Group | undefined> {
    /**
     * 📊 BUSCA LINEAR EM MEMÓRIA
     * 
     * 📚 CONCEITO - Linear Search:
     * Carrega todos grupos e busca o que tem ID correspondente.
     * Em sistemas maiores, seria otimizado com índices.
     */
    const allGroups = await this.findAll();
    return allGroups.find((group) => group.id === id);
  }

  /**
   * 🆕 MÉTODO PÚBLICO: CRIAR NOVO GRUPO
   * 
   * 📚 CONCEITO - Data Creation:
   * Cria um novo grupo no sistema com dados validados.
   * É como "abrir uma nova pasta no arquivo".
   * 
   * PROCESSO:
   * 1. 🆔 Gera ID único para o grupo
   * 2. 📋 Cria objeto Group com dados do DTO
   * 3. ⚙️ Aplica valores padrão para campos opcionais
   * 4. 📊 Adiciona ao array existente
   * 5. 💾 Persiste no arquivo CSV
   * 6. ✅ Retorna grupo criado
   * 
   * @param createGroupDto - Dados validados para criação
   * @returns Promise<Group> - Grupo criado com ID gerado
   */
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    /**
     * 🏗️ CONSTRUÇÃO DO NOVO GRUPO
     * 
     * 📚 CONCEITO - Object Construction:
     * Criamos objeto Group completo combinando:
     * - Dados fornecidos no DTO
     * - ID único gerado automaticamente
     * - Valores padrão para campos opcionais
     */
    const newGroup: Group = {
      id: v4(),                                         // 🆔 ID único (UUID v4)
      name: createGroupDto.name,                        // 📛 Nome fornecido
      adminsId: createGroupDto.adminsId || [],          // 👑 Admins ou array vazio
      members: createGroupDto.members || [],            // 👥 Membros ou array vazio
      pendingRequests: [],                              // 📝 Sempre vazio para novo grupo
      
      /**
       * ⚙️ REGRA PADRÃO PARA ÚLTIMO ADMIN
       * 
       * 📚 CONCEITO - Default Values:
       * Se não especificado, usamos 'promote' como padrão.
       * Isso significa que quando último admin sair,
       * o primeiro membro será promovido automaticamente.
       */
      lastAdminRule: createGroupDto.lastAdminRule || 'promote',
    };

    /**
     * 💾 PERSISTÊNCIA DO NOVO GRUPO
     * 
     * 📚 CONCEITO - Data Persistence:
     * 1. Carrega grupos existentes
     * 2. Adiciona novo grupo ao array
     * 3. Salva array atualizado no CSV
     */
    const allGroups = await this.findAll();
    allGroups.push(newGroup);

    await this.writeGroupsToCsv(allGroups);
    
    /**
     * ✅ RETORNO DO GRUPO CRIADO
     * 
     * Retornamos o objeto completo para que o controller
     * possa responder com os dados atualizados.
     */
    return newGroup;
  }

  async update(updatedGroup: Group): Promise<Group> {
    const allGroups = await this.findAll();
    const groupIndex = allGroups.findIndex((g) => g.id === updatedGroup.id);

    if (groupIndex === -1) {
      throw new Error('Grupo não encontrado para atualização');
    }

    allGroups[groupIndex] = updatedGroup;
    await this.writeGroupsToCsv(allGroups);

    return updatedGroup;
  }

  async delete(groupId: string): Promise<void> {
    const allGroups = await this.findAll();
    const updatedGroups = allGroups.filter((g) => g.id !== groupId);
    await this.writeGroupsToCsv(updatedGroups);
  }
}