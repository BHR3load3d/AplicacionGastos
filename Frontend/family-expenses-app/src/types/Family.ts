export interface Family {
  id?: number;
  name: string;
  createdAt?: Date;
  lastModified: Date;
  syncId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  syncError?: string;
}