export interface Ban {
  id: string;
  bannedUserId: string;
  bannedByUserId: string;
  reason: string;
  bannedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  groupId?: string; // Para banimentos específicos de grupo
  reports?: string[]; // IDs dos usuários que reportaram
}

export enum BanReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  VIOLATION_TERMS = 'violation_terms',
  MULTIPLE_REPORTS = 'multiple_reports',
  ADMIN_DECISION = 'admin_decision'
}

export enum BanType {
  GLOBAL = 'global',      // Banimento global do sistema
  GROUP = 'group'         // Banimento apenas do grupo
}
