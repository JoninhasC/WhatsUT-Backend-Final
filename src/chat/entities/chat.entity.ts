export class Chat {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  chatType: 'private' | 'group' | 'text' | 'file';
  targetId: string;
  isArquivo?: boolean;
}
