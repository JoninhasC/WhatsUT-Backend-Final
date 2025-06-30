import { Injectable } from '@nestjs/common';

interface ReportEntry {
  reportedUserId: string;
  reporterUserId: string;
  timestamp: Date;
}

@Injectable()
export class ReportStateService {
  private reports: ReportEntry[] = [];
  private bannedUsers: Set<string> = new Set();

  addReport(reportedUserId: string, reporterUserId: string): { reportCount: number; autoBanned: boolean } {
    // Verificar se é auto-report
    if (reportedUserId === reporterUserId) {
      throw new Error('Usuário não pode reportar a si mesmo');
    }

    // Verificar se já existe report duplicado
    const existingReport = this.reports.find(
      r => r.reportedUserId === reportedUserId && r.reporterUserId === reporterUserId
    );
    if (existingReport) {
      throw new Error('Report duplicado não é permitido');
    }

    // Adicionar novo report
    this.reports.push({
      reportedUserId,
      reporterUserId,
      timestamp: new Date()
    });

    // Contar reports para este usuário
    const reportCount = this.reports.filter(r => r.reportedUserId === reportedUserId).length;

    // Auto-banir se atingir 3 reports
    let autoBanned = false;
    if (reportCount >= 3) {
      this.bannedUsers.add(reportedUserId);
      autoBanned = true;
    }

    return { reportCount, autoBanned };
  }

  isUserBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  getUserReports(userId: string): ReportEntry[] {
    return this.reports.filter(r => r.reportedUserId === userId);
  }

  getAllReports(): ReportEntry[] {
    return [...this.reports];
  }

  banUser(userId: string): void {
    this.bannedUsers.add(userId);
  }

  unbanUser(userId: string): void {
    this.bannedUsers.delete(userId);
  }

  clearReports(): void {
    this.reports = [];
    this.bannedUsers.clear();
  }
}
