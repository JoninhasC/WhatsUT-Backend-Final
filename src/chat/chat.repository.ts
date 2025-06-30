// 📚 EXPLICAÇÃO DIDÁTICA: CHAT REPOSITORY
// =======================================
//
// 🎯 O QUE É UM REPOSITORY?
// Um repository é como um "bibliotecário especializado":
// - Sabe exatamente onde e como os dados estão armazenados
// - Oferece métodos simples para buscar, salvar e organizar informações
// - Esconde a complexidade do armazenamento dos outros componentes
// - Centraliza toda lógica de acesso a dados de mensagens
//
// 🗂️ ANALOGIA: Bibliotecário de Mensagens
// - Quando alguém quer enviar uma mensagem → salva no "arquivo"
// - Quando alguém quer ver conversas → busca e organiza as mensagens
// - Mantém tudo organizado por tipo (privada/grupo) e participantes
// - Cuida da persistência sem que ninguém mais precise saber como
//
// 💾 PADRÃO REPOSITORY:
// - Abstrai o mecanismo de persistência (CSV, banco, etc.)
// - Oferece interface limpa para operações de dados
// - Facilita testes (pode ser mockado facilmente)
// - Permite trocar implementação sem afetar resto do código
//
// 📁 ESTRUTURA DO CSV:
// id,senderId,content,timestamp,chatType,targetId,isArquivo
// Cada linha = uma mensagem com todas as informações necessárias

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';                        // 📁 Para trabalhar com arquivos
import * as path from 'path';                    // 🛣️ Para caminhos de arquivo
import { Chat } from './entities/chat.entity';   // 🏷️ Tipo da mensagem
import { v4 } from 'uuid';                       // 🆔 Gerador de IDs únicos
import { parse, writeToStream } from 'fast-csv'; // 📊 Biblioteca para CSV
import { CreateChatDto } from './dto/create-chat.dto'; // 📋 Estrutura de dados

// 📍 CONFIGURAÇÕES DO ARQUIVO CSV
// Define onde ficam os dados e como são organizados
export const CSV_FILE_CHAT = path.resolve(__dirname, '../../data/chats.csv');
export const CSV_HEADERS_CHAT =
  'id,senderId,content,timestamp,chatType,targetId,isArquivo\n';
/*
 * EXPLICAÇÃO DO CABEÇALHO:
 * - id: identificador único da mensagem
 * - senderId: quem enviou a mensagem
 * - content: conteúdo da mensagem
 * - timestamp: quando foi enviada
 * - chatType: 'private' (1-on-1) ou 'group' (grupo)
 * - targetId: para quem foi enviada (usuário ou grupo)
 * - isArquivo: se é um arquivo (true/false)
 */

// 🏷️ @Injectable: Marca como serviço injetável do NestJS
@Injectable()
export class ChatRepository {
  
  // 📤 MÉTODO PRINCIPAL: ENVIAR MENSAGEM
  // É como "depositar uma carta na caixa de correio"
  async send(message: CreateChatDto): Promise<Chat> {
    
    // 🏗️ CONSTRÓI OBJETO COMPLETO DA MENSAGEM
    // Pega dados recebidos e adiciona campos que faltam
    const chat: Chat = {
      ...message,              // 📋 Espalha os dados recebidos
      id: v4(),               // 🆔 Gera ID único (UUID)
      timestamp: new Date(),  // ⏰ Adiciona timestamp atual
    };

    // 📊 PREPARA DADOS PARA O CSV
    // Converte objeto JavaScript → linha CSV
    const rowData = {
      id: chat.id,
      senderId: chat.senderId,
      content: chat.content,
      timestamp: chat.timestamp.toISOString(),  // Date → string ISO
      chatType: chat.chatType,
      targetId: chat.targetId,
      isArquivo: chat.isArquivo ? 'true' : 'false', // boolean → string
    };

    // 🔍 VERIFICA SE ARQUIVO EXISTE
    // Se é a primeira mensagem, precisa criar o arquivo
    const fileExists = fs.existsSync(CSV_FILE_CHAT);
    
    if (!fileExists) {
      // 📄 CRIA ARQUIVO COM CABEÇALHO
      // Como criar um caderno novo com as colunas definidas
      fs.writeFileSync(CSV_FILE_CHAT, 'id,senderId,content,timestamp,chatType,targetId,isArquivo\n', 'utf8');
    }

    // ✍️ ADICIONA NOVA LINHA AO ARQUIVO
    // É como escrever uma nova entrada no diário
    await new Promise<void>((resolve, reject) => {
      // 📝 Cria stream para escrever no final do arquivo
      const stream = fs.createWriteStream(CSV_FILE_CHAT, { flags: 'a' }); // 'a' = append
      
      writeToStream(stream, [rowData], {
        headers: false,              // Não escreve cabeçalho novamente
        includeEndRowDelimiter: true, // Adiciona quebra de linha no final
      })
        .on('error', reject)         // Se der erro, rejeita Promise
        .on('finish', () => resolve()); // Quando terminar, resolve Promise
    });

    // 📤 RETORNA MENSAGEM CRIADA
    // Devolve o objeto completo com ID e timestamp para confirmação
    return chat;
  }

  // 💬 BUSCAR CONVERSAS PRIVADAS (1-ON-1)
  // É como "buscar todas as cartas trocadas entre duas pessoas"
  async findPrivateChat(userA: string, userB: string): Promise<Chat[]> {
    // 📚 Lê todas as mensagens do arquivo
    const messages = await this.readAllMessages();
    
    // 🔍 FILTRA MENSAGENS PRIVADAS ENTRE OS DOIS USUÁRIOS
    // Busca mensagens onde:
    // - Tipo é 'private' E
    // - (A enviou para B) OU (B enviou para A)
    return messages.filter(
      (m) =>
        m.chatType === 'private' &&
        ((m.senderId === userA && m.targetId === userB) ||  // A → B
          (m.senderId === userB && m.targetId === userA)),  // B → A
    );
    /*
     * LÓGICA DE CONVERSA PRIVADA:
     * Para encontrar uma conversa entre João e Maria, precisamos buscar:
     * - Mensagens que João enviou para Maria
     * - Mensagens que Maria enviou para João
     * Juntas, elas formam a conversa completa entre os dois
     */
  }

  // 👥 BUSCAR MENSAGENS DE GRUPO
  // É como "buscar todas as mensagens de um grupo específico"
  async findGroupChat(groupId: string): Promise<Chat[]> {
    // 📚 Lê todas as mensagens do arquivo
    const messages = await this.readAllMessages();
    
    // 🔍 FILTRA MENSAGENS DO GRUPO ESPECÍFICO
    // Busca mensagens onde:
    // - Tipo é 'group' E 
    // - Foi enviada para este grupo específico
    return messages.filter(
      (m) => m.chatType === 'group' && m.targetId === groupId,
    ).filter(m => m.targetId === groupId && m.chatType === 'group') as Chat[];
    /*
     * NOTA: Há filtro duplicado aqui - pode ser otimizado removendo o segundo .filter()
     * Provavelmente foi deixado durante desenvolvimento/debugging
     */
  }

  // 📖 MÉTODO PRIVADO: LER TODAS AS MENSAGENS
  // É como "abrir o arquivo e ler todas as linhas, convertendo para objetos"
  private async readAllMessages(): Promise<Chat[]> {
    return new Promise((resolve, reject) => {
      const results: Chat[] = [];  // 📋 Array para coletar resultados
      
      // 📂 CRIA STREAM DE LEITURA DO ARQUIVO CSV
      fs.createReadStream(CSV_FILE_CHAT)
        .pipe(parse({ headers: true }))  // 📊 Parse CSV com primeira linha como cabeçalho
        .on('error', reject)             // 🚨 Se der erro na leitura
        .on('data', (row) => {           // 📝 Para cada linha do arquivo
          // 🔄 CONVERTE LINHA CSV → OBJETO TYPESCRIPT
          results.push({
            id: row.id,
            senderId: row.senderId,
            content: row.content,
            timestamp: new Date(row.timestamp),        // string → Date
            chatType: row.chatType as 'private' | 'group', // TypeScript casting
            targetId: row.targetId,
            isArquivo: row.isArquivo === 'true',      // string → boolean
          });
        })
        .on('end', () => resolve(results)); // ✅ Quando terminar, retorna resultados
    });
    /*
     * PADRÃO STREAM:
     * - Lê arquivo linha por linha (eficiente para arquivos grandes)
     * - Converte cada linha em objeto JavaScript
     * - Acumula resultados em array
     * - Usa Promise para operação assíncrona
     */
  }
}

// 📝 RESUMO EDUCATIVO: PADRÃO REPOSITORY COM CSV
// ==============================================
//
// 🎯 VANTAGENS DESTA IMPLEMENTAÇÃO:
// 1. 📁 Simples - Usa arquivos CSV (fácil de ver/debug)
// 2. 🔄 Assíncrono - Não bloqueia aplicação durante I/O
// 3. 📊 Estruturado - Dados organizados e tipados
// 4. 🛡️ Encapsulado - Lógica de persistência isolada
// 5. 🧪 Testável - Interface clara para mocks
//
// 🏗️ PADRÕES DE DESIGN APLICADOS:
// 1. 📚 Repository Pattern - Abstração de persistência
// 2. 🏭 Dependency Injection - Injetável via NestJS
// 3. 🔄 Promise Pattern - Operações assíncronas
// 4. 📊 Stream Pattern - Leitura eficiente de arquivos
// 5. 🏷️ DTO Pattern - Estrutura de dados de entrada
//
// 💡 CONCEITOS DE PERSISTÊNCIA:
// 1. 📁 File I/O - Operações de arquivo
// 2. 📊 CSV Parsing - Processamento de dados tabulares
// 3. 🔄 Data Mapping - Conversão entre formatos
// 4. 🆔 UUID Generation - IDs únicos
// 5. ⏰ Timestamp Management - Controle temporal
//
// 🚀 POSSÍVEIS MELHORIAS:
// 1. 🗄️ Migrar para banco de dados real
// 2. 🔍 Adicionar índices para buscas mais rápidas
// 3. 📄 Implementar paginação para conversas grandes
// 4. 🔄 Cache em memória para consultas frequentes
// 5. 🛡️ Validação mais robusta de dados
//
// 🌟 ALTERNATIVAS DE IMPLEMENTAÇÃO:
// - MongoDB: Documentos JSON naturais
// - PostgreSQL: Queries SQL poderosas
// - Redis: Cache ultra-rápido
// - SQLite: Banco local simples
// - Elasticsearch: Busca avançada de texto