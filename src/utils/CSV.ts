/*
 * ========================================================================================
 * CSV UTILITIES - UTILITÁRIOS PARA GERENCIAMENTO DE ARQUIVOS CSV
 * ========================================================================================
 * 
 * 🎯 CONCEITO: CSV Utilities (Utilitários CSV)
 * Este arquivo contém funções auxiliares para trabalhar com arquivos CSV.
 * É como uma "caixa de ferramentas" especializada em operações de arquivo.
 * 
 * 💾 FUNÇÃO NO SISTEMA:
 * O WhatsUT usa arquivos CSV como "banco de dados" simples para armazenar:
 * - Usuários (users.csv)
 * - Grupos (groups.csv) 
 * - Mensagens (chats.csv)
 * - Banimentos (bans.csv)
 * 
 * 🔧 POR QUE CSV?
 * - Simplicidade: Não precisa instalar banco de dados
 * - Legibilidade: Pode abrir no Excel/Google Sheets
 * - Portabilidade: Funciona em qualquer sistema
 * - Debugging: Fácil ver os dados diretamente
 * 
 * 🏗️ ANALOGIA: 
 * É como ter um "kit de ferramentas para arquivista" que:
 * - Cria gavetas (arquivos) quando não existem
 * - Organiza pastas (diretórios) automaticamente
 * - Coloca etiquetas (headers) nas gavetas novas
 * - Verifica se arquivos existem antes de usar
 */

// ============================================================================
// IMPORTAÇÕES: FERRAMENTAS DO SISTEMA DE ARQUIVOS
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * 🗂️ fs (File System): Biblioteca padrão do Node.js para trabalhar com arquivos
 * - fs.promises.access(): Verifica se arquivo existe
 * - fs.promises.mkdir(): Cria diretórios
 * - fs.promises.writeFile(): Escreve conteúdo em arquivo
 * 
 * 📁 path: Biblioteca para trabalhar com caminhos de arquivo
 * - path.dirname(): Extrai o diretório de um caminho
 * - Garante compatibilidade entre Windows/Linux/Mac
 */
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// INTERFACE: PARÂMETROS PARA CRIAÇÃO DE ARQUIVO CSV
// ============================================================================

/*
 * 📋 INTERFACE IENSURECSVFILEEXISTS
 * 
 * Define exatamente quais informações são necessárias para
 * garantir que um arquivo CSV existe e está configurado corretamente.
 * 
 * 🎯 FUNÇÃO: Contrato que garante que quem chama essa função
 * forneça todas as informações necessárias.
 * 
 * 💡 ANALOGIA: Como uma "ficha de pedido" para criar arquivo
 * onde você deve preencher: onde criar e como organizar.
 */
interface IensureCsvFileExists {
  /*
   * 📁 CSV_FILE: Caminho Completo do Arquivo
   * 
   * 🎯 FUNÇÃO: Especifica exatamente onde o arquivo deve estar
   * 📊 FORMATO: Caminho absoluto ou relativo (ex: "./data/users.csv")
   * 
   * 💡 EXEMPLO: "./data/users.csv", "./data/groups.csv", etc.
   */
  CSV_FILE: string;
  
  /*
   * 📋 CSV_HEADERS: Cabeçalho do Arquivo CSV
   * 
   * 🎯 FUNÇÃO: Define as colunas que o arquivo CSV deve ter
   * 📊 FORMATO: String com nomes das colunas separadas por vírgula
   * 
   * 💡 EXEMPLOS:
   * - Users: "id,name,email,password,createdAt"
   * - Groups: "id,name,adminsId,members,createdAt"
   * - Messages: "id,senderId,content,timestamp,chatType,targetId"
   */
  CSV_HEADERS: string;
}

// ============================================================================
// FUNÇÃO PRINCIPAL: GARANTIR QUE ARQUIVO CSV EXISTE
// ============================================================================

/*
 * 🛠️ FUNÇÃO ENSURECSVFILEEXISTS
 * 
 * Esta é uma função "inteligente" que verifica se um arquivo CSV existe
 * e, se não existir, cria todo o necessário (pasta + arquivo + headers).
 * 
 * 🎯 FUNÇÃO: Garantir que arquivo CSV esteja pronto para uso
 * 
 * 💡 ANALOGIA: 
 * É como um "assistente organizador" que:
 * 1. Verifica se a gaveta existe
 * 2. Se não existe, cria a estante inteira (pasta)
 * 3. Cria a gaveta (arquivo)
 * 4. Coloca etiquetas (headers) na gaveta
 * 
 * 🔄 PROCESSO COMPLETO:
 * 1. Tenta acessar o arquivo
 * 2. Se arquivo existe → não faz nada (tudo OK)
 * 3. Se arquivo não existe → cria tudo do zero
 * 
 * @param {IensureCsvFileExists} config - Configuração do arquivo
 * @returns Promise<void> - Completa quando arquivo está garantido
 */
export async function ensureCsvFileExists({
  CSV_FILE,
  CSV_HEADERS,
}: IensureCsvFileExists) {
  
  // ========================================================================
  // ETAPA 1: VERIFICAR SE ARQUIVO JÁ EXISTE
  // ========================================================================
  
  /*
   * 🔍 TRY-CATCH: PADRÃO PARA VERIFICAÇÃO DE EXISTÊNCIA
   * 
   * 🎯 LÓGICA:
   * - try: Tenta acessar o arquivo
   * - Se sucesso: arquivo existe → não faz nada
   * - Se erro: arquivo não existe → catch cria tudo
   * 
   * 💡 ANALOGIA: 
   * É como tentar abrir uma gaveta:
   * - Se abre → gaveta existe, está tudo OK
   * - Se não abre → gaveta não existe, precisa criar
   */
  try {
    /*
     * 📁 fs.promises.access(): VERIFICAÇÃO DE EXISTÊNCIA
     * 
     * 🎯 FUNÇÃO: Tenta "tocar" o arquivo para ver se existe
     * 🔧 COMPORTAMENTO:
     * - Se arquivo existe → função completa sem erro
     * - Se arquivo não existe → lança erro (vai para catch)
     * 
     * ⚡ ASYNC/AWAIT: Usa promises para não bloquear aplicação
     */
    await fs.promises.access(CSV_FILE);
    
    /*
     * ✅ SE CHEGOU AQUI: ARQUIVO EXISTE
     * 
     * Não faz mais nada. O arquivo já está criado e pronto para uso.
     * A função termina aqui se o arquivo existir.
     */
    
  } catch {
    // ======================================================================
    // ETAPA 2: ARQUIVO NÃO EXISTE - CRIAR TUDO DO ZERO
    // ======================================================================
    
    /*
     * 🗂️ CATCH: ARQUIVO NÃO EXISTE, VAMOS CRIAR
     * 
     * Se chegamos aqui, significa que fs.access() falhou,
     * ou seja, o arquivo não existe. Agora vamos criar:
     * 1. A pasta (se não existir)
     * 2. O arquivo com headers
     */
    
    // ====================================================================
    // SUB-ETAPA 2.1: CRIAR DIRETÓRIO (PASTA)
    // ====================================================================
    
    /*
     * 📁 CRIAÇÃO DE DIRETÓRIO RECURSIVA
     * 
     * 🎯 path.dirname(CSV_FILE): Extrai só a parte da pasta do caminho
     * 
     * 💡 EXEMPLO:
     * CSV_FILE = "./data/users.csv"
     * path.dirname() retorna "./data"
     * 
     * 🔧 fs.promises.mkdir() com { recursive: true }:
     * - Cria a pasta e todas as pastas "pai" se necessário
     * - "./data" não existe? Cria "./data"
     * - "./data/subpasta" não existe? Cria "./data" e depois "./data/subpasta"
     * 
     * 💡 ANALOGIA: 
     * É como montar uma estante completa antes de colocar gavetas.
     * Se precisa de 3 níveis de estante, monta os 3 automaticamente.
     */
    await fs.promises.mkdir(path.dirname(CSV_FILE), { recursive: true });
    
    // ====================================================================
    // SUB-ETAPA 2.2: CRIAR ARQUIVO COM HEADERS
    // ====================================================================
    
    /*
     * 📄 CRIAÇÃO DO ARQUIVO CSV COM CABEÇALHO
     * 
     * 🎯 fs.promises.writeFile(): Cria arquivo e escreve conteúdo
     * 
     * 📋 CONTEÚDO: CSV_HEADERS (ex: "id,name,email,password")
     * 
     * 🔧 RESULTADO: Arquivo criado com primeira linha sendo o cabeçalho
     * 
     * 💡 EXEMPLO PRÁTICO:
     * Se CSV_HEADERS = "id,name,email,password"
     * O arquivo users.csv será criado com conteúdo:
     * ```
     * id,name,email,password
     * ```
     * 
     * Depois, quando repositories salvarem dados, ficará:
     * ```
     * id,name,email,password
     * uuid-123,João,joao@email.com,hashedpassword
     * uuid-456,Maria,maria@email.com,hashedpassword
     * ```
     * 
     * 💡 ANALOGIA: 
     * É como criar uma planilha nova no Excel e já colocar
     * os títulos das colunas na primeira linha.
     */
    await fs.promises.writeFile(CSV_FILE, CSV_HEADERS);
  }
}

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - CSV UTILITIES
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🛠️ UTILITÁRIOS DE SISTEMA:
 *    - Funções auxiliares que ajudam outros componentes
 *    - Responsabilidade única (só gerenciar arquivos CSV)
 *    - Reutilização (todos os repositories podem usar)
 * 
 * 2. 📁 MANIPULAÇÃO DE ARQUIVOS:
 *    - fs.promises para operações assíncronas
 *    - path para compatibilidade entre sistemas operacionais
 *    - Criação recursiva de diretórios
 *    - Verificação de existência com try-catch
 * 
 * 3. 🔧 PADRÃO TRY-CATCH PARA ARQUIVOS:
 *    - try: Tenta operação (verificar se existe)
 *    - catch: Se falha, executa plano B (criar arquivo)
 *    - Padrão comum para "criar se não existir"
 * 
 * 4. 📋 DESIGN DE INTERFACE:
 *    - Interface clara com parâmetros necessários
 *    - TypeScript garante que quem chama forneça tudo
 *    - Função pura (só depende dos parâmetros)
 * 
 * 💡 EXEMPLO PRÁTICO DE USO:
 * 
 * Em UserRepository:
 * ```typescript
 * await ensureCsvFileExists({
 *   CSV_FILE: './data/users.csv',
 *   CSV_HEADERS: 'id,name,email,password,createdAt'
 * });
 * ```
 * 
 * Em GroupRepository:
 * ```typescript
 * await ensureCsvFileExists({
 *   CSV_FILE: './data/groups.csv', 
 *   CSV_HEADERS: 'id,name,adminsId,members,lastAdminRule'
 * });
 * ```
 * 
 * Em ChatRepository:
 * ```typescript
 * await ensureCsvFileExists({
 *   CSV_FILE: './data/chats.csv',
 *   CSV_HEADERS: 'id,senderId,content,timestamp,chatType,targetId'
 * });
 * ```
 * 
 * 📈 VANTAGENS DESTA ABORDAGEM:
 * - Não precisa criar arquivos manualmente
 * - Aplicação funciona em qualquer ambiente "limpo"
 * - Repositories não precisam se preocupar com criação de arquivos
 * - Desenvolvimento mais ágil (clone do projeto e roda direto)
 * 
 * 🔄 FLUXO TÍPICO:
 * 1. 🚀 Aplicação inicia
 * 2. 📁 Repository precisa ler/escrever dados
 * 3. 🛠️ Repository chama ensureCsvFileExists()
 * 4. ✅ Função garante que arquivo existe
 * 5. 📊 Repository pode trabalhar normalmente
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Esta função é a base para entender:
 * - Como repositories gerenciam persistência
 * - Como o sistema se auto-inicializa
 * - Como tratar arquivos de forma robusta
 * - Padrões de error handling em Node.js
 * 
 * ========================================================================================
 */
