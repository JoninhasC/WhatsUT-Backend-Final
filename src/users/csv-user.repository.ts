import { Injectable } from '@nestjs/common';
import { User } from './entities/users.entity';
import * as fs from 'fs';
import * as path from 'path';
import { parse, writeToStream } from 'fast-csv';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 } from 'uuid';

export const CSV_FILE_USER = path.resolve(__dirname, '../../data/users.csv');
export const CSV_HEADERS_USER = 'id,name,password\n';

@Injectable()
export class UserRepository {
  async findAll(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      const users: User[] = [];
      fs.createReadStream(CSV_FILE_USER)
        .pipe(parse({ headers: true }))
        .on('error', reject)
        .on('data', (row) => users.push(row))
        .on('end', () => resolve(users));
    });
  }

  async findByName(name: string): Promise<User | undefined> {
    const users = (await this.findAll()).find((user) => user.name === name);
    return users;
  }

  async findById(id: string): Promise<User | undefined> {
    const users = (await this.findAll()).find((user) => user.id === id);
    return users;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user: User = {
      id: v4(),
      name: dto.name,
      password: dto.password,
    };

    const row = [user];

    await new Promise((resolve, reject) => {
      const writableStream = fs.createWriteStream(CSV_FILE_USER, {
        flags: 'a',
      });
      writeToStream(writableStream, row, {
        headers: false,
        includeEndRowDelimiter: true,
      })
        .on('error', reject)
        .on('finish', () => resolve(undefined));
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    const users = await this.findAll();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    const updatedUser = {
      ...users[userIndex],
      ...(dto.name && { name: dto.name }),
      ...(dto.password && { password: dto.password }),
    };

    users[userIndex] = updatedUser;

    // Reescrever todo o arquivo CSV
    await this.writeAllUsers(users);
    
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const users = await this.findAll();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);

    // Reescrever todo o arquivo CSV
    await this.writeAllUsers(users);
    
    return true;
  }

  private async writeAllUsers(users: User[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Recriar o arquivo com headers
      fs.writeFileSync(CSV_FILE_USER, CSV_HEADERS_USER);
      
      if (users.length === 0) {
        resolve();
        return;
      }

      const writableStream = fs.createWriteStream(CSV_FILE_USER, {
        flags: 'a',
      });
      
      writeToStream(writableStream, users, {
        headers: false,
        includeEndRowDelimiter: true,
      })
        .on('error', reject)
        .on('finish', () => resolve());
    });
  }
}
