import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Chat } from './entities/chat.entity';
import { v4 } from 'uuid';
import { parse, writeToStream } from 'fast-csv';
import { CreateChatDto } from './dto/create-chat.dto';


export const CSV_FILE_CHAT = path.resolve(__dirname, '../../data/chats.csv');
export const CSV_HEADERS_CHAT =
  'id,senderId,content,timestamp,chatType,targetId,isArquivo\n';

@Injectable()
export class ChatRepository {
  async send(message: CreateChatDto): Promise<Chat> {
    
    const chat: Chat = {
      ...message,
      id: v4(),
      timestamp: new Date(),
    };

    const rowData = {
      id: chat.id,
      senderId: chat.senderId,
      content: chat.content,
      timestamp: chat.timestamp.toISOString(),
      chatType: chat.chatType,
      targetId: chat.targetId,
      isArquivo: chat.isArquivo ? 'true' : 'false',
    };

    // Verificar se o arquivo existe
    const fileExists = fs.existsSync(CSV_FILE_CHAT);
    
    if (!fileExists) {
      // Criar arquivo com cabeçalho primeiro
      fs.writeFileSync(CSV_FILE_CHAT, 'id,senderId,content,timestamp,chatType,targetId,isArquivo\n', 'utf8');
    }

    // Adicionar a linha de dados
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createWriteStream(CSV_FILE_CHAT, { flags: 'a' });
      writeToStream(stream, [rowData], {
        headers: false,
        includeEndRowDelimiter: true,
      })
        .on('error', reject)
        .on('finish', () => resolve());
    });

    return chat;
  }

  async findPrivateChat(userA: string, userB: string): Promise<Chat[]> {
    const messages = await this.readAllMessages();
    return messages.filter(
      (m) =>
        m.chatType === 'private' &&
        ((m.senderId === userA && m.targetId === userB) ||
          (m.senderId === userB && m.targetId === userA)),
    );
  }

  async findGroupChat(groupId: string): Promise<Chat[]> {
    const messages = await this.readAllMessages();
    return messages.filter(
      (m) => m.chatType === 'group' && m.targetId === groupId,
    );
  }

  private async readAllMessages(): Promise<Chat[]> {
    return new Promise((resolve, reject) => {
      const results: Chat[] = [];
      fs.createReadStream(CSV_FILE_CHAT)
        .pipe(parse({ headers: true }))
        .on('error', reject)
        .on('data', (row) => {
          results.push({
            id: row.id,
            senderId: row.senderId,
            content: row.content,
            timestamp: new Date(row.timestamp),
            chatType: row.chatType as 'private' | 'group',
            targetId: row.targetId,
            isArquivo: row.isArquivo === 'true',
          });
        })
        .on('end', () => resolve(results));
    });
  }
}