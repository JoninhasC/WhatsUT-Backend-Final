import { Injectable } from '@nestjs/common';
import { Ban, BanReason } from './entities/ban.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 } from 'uuid';
import { CreateBanDto } from './dto/create-ban.dto';

export const CSV_FILE_BAN = path.resolve(__dirname, '../../data/bans.csv');
export const CSV_HEADERS_BAN = 'id,bannedUserId,bannedByUserId,reason,bannedAt,expiresAt,isActive,groupId,reports\n';

@Injectable()
export class BanRepository {
  constructor() {
    this.ensureFileExists();
  }

  private ensureFileExists() {
    if (!fs.existsSync(CSV_FILE_BAN)) {
      const dataDir = path.dirname(CSV_FILE_BAN);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(CSV_FILE_BAN, CSV_HEADERS_BAN);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async findAll(): Promise<Ban[]> {
    try {
      const fileContent = fs.readFileSync(CSV_FILE_BAN, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        return [];
      }

      // Skip header line
      const dataLines = lines.slice(1);
      const bans: Ban[] = [];

      for (const line of dataLines) {
        if (!line.trim()) continue;

        const columns = this.parseCSVLine(line);
        
        // Ensure we have the expected number of columns
        if (columns.length !== 9) {
          console.warn(`Skipping malformed CSV line with ${columns.length} columns: ${line}`);
          continue;
        }

        const [id, bannedUserId, bannedByUserId, reason, bannedAt, expiresAt, isActive, groupId, reports] = columns;

        if (!id) continue; // Skip empty rows

        const ban: Ban = {
          id,
          bannedUserId,
          bannedByUserId,
          reason,
          bannedAt: new Date(bannedAt),
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          isActive: isActive === 'true',
          groupId: groupId || undefined,
          reports: reports ? reports.split(';').filter(r => r.trim() !== '') : undefined,
        };
        
        bans.push(ban);
      }

      return bans;
    } catch (error) {
      console.error('Error reading bans CSV:', error);
      return [];
    }
  }

  async findByUserId(userId: string): Promise<Ban[]> {
    const bans = await this.findAll();
    return bans.filter(ban => ban.bannedUserId === userId && ban.isActive);
  }

  async findActiveGlobalBan(userId: string): Promise<Ban | undefined> {
    const bans = await this.findByUserId(userId);
    return bans.find(ban => !ban.groupId && this.isActiveBan(ban));
  }

  async findActiveGroupBan(userId: string, groupId: string): Promise<Ban | undefined> {
    const bans = await this.findByUserId(userId);
    return bans.find(ban => ban.groupId === groupId && this.isActiveBan(ban));
  }

  async isUserBanned(userId: string, groupId?: string): Promise<boolean> {
    // Verificar banimento global
    const globalBan = await this.findActiveGlobalBan(userId);
    if (globalBan) return true;

    // Verificar banimento específico do grupo se fornecido
    if (groupId) {
      const groupBan = await this.findActiveGroupBan(userId, groupId);
      if (groupBan) return true;
    }

    return false;
  }

  private isActiveBan(ban: Ban): boolean {
    if (!ban.isActive) return false;
    if (ban.expiresAt && new Date() > ban.expiresAt) return false;
    return true;
  }

  async create(dto: CreateBanDto, bannedByUserId: string): Promise<Ban> {
    const ban: Ban = {
      id: v4(),
      bannedUserId: dto.bannedUserId,
      bannedByUserId,
      reason: dto.reason || BanReason.ADMIN_DECISION,
      bannedAt: new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isActive: true,
      groupId: dto.groupId,
      reports: dto.reports,
    };

    // Append the new ban to the CSV file
    const csvLine = [
      this.escapeCSVValue(ban.id),
      this.escapeCSVValue(ban.bannedUserId),
      this.escapeCSVValue(ban.bannedByUserId),
      this.escapeCSVValue(ban.reason),
      this.escapeCSVValue(ban.bannedAt.toISOString()),
      this.escapeCSVValue(ban.expiresAt?.toISOString() || ''),
      this.escapeCSVValue(ban.isActive.toString()),
      this.escapeCSVValue(ban.groupId || ''),
      this.escapeCSVValue(ban.reports?.join(';') || ''),
    ].join(',') + '\n';

    fs.appendFileSync(CSV_FILE_BAN, csvLine, 'utf8');

    return ban;
  }

  async deactivate(banId: string): Promise<void> {
    const bans = await this.findAll();
    const updatedBans = bans.map(ban => 
      ban.id === banId ? { ...ban, isActive: false } : ban
    );

    await this.writeAllBans(updatedBans);
  }

  private async writeAllBans(bans: Ban[]): Promise<void> {
    const csvLines = [CSV_HEADERS_BAN.trim()]; // Start with header
    
    for (const ban of bans) {
      const csvLine = [
        this.escapeCSVValue(ban.id),
        this.escapeCSVValue(ban.bannedUserId),
        this.escapeCSVValue(ban.bannedByUserId),
        this.escapeCSVValue(ban.reason),
        this.escapeCSVValue(ban.bannedAt.toISOString()),
        this.escapeCSVValue(ban.expiresAt?.toISOString() || ''),
        this.escapeCSVValue(ban.isActive.toString()),
        this.escapeCSVValue(ban.groupId || ''),
        this.escapeCSVValue(ban.reports?.join(';') || ''),
      ].join(',');
      
      csvLines.push(csvLine);
    }

    const csvContent = csvLines.join('\n') + '\n';
    fs.writeFileSync(CSV_FILE_BAN, csvContent, 'utf8');
  }
}
