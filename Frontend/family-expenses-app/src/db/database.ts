import Dexie, { Table } from 'dexie';
import { BaseCategory } from '../types/Category';

export interface LocalExpense {
  id?: number;
  // reference Category string id (GUID)
  categoryId: string;
  amount: number;
  date: Date;
  description: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
}

export interface LocalFamily {
  id?: number;
  name: string;
  // GUID of the family on the server
  remoteId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
}

export interface CachedRemoteFamily {
  id: string; // remote GUID
  name: string;
}

export interface LocalCategory extends BaseCategory {
  id?: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: Date;
  syncId?: string;
  familyId?: string;
  syncError?: string;
}

export class AppDatabase extends Dexie {
  categories!: Table<LocalCategory>;
  expenses!: Table<LocalExpense>;
  families!: Table<LocalFamily>;
  remoteFamilies!: Table<CachedRemoteFamily>;

  constructor() {
    super('FamilyExpensesDB');
    
    // v3 existing
    this.version(3).stores({
      categories: 'id, name, syncStatus, lastModified, syncId, familyId',
      expenses: '++id, categoryId, date, syncStatus, lastModified',
      families: '++id, remoteId, name, syncStatus, lastModified'
    });

    // v4: add remoteFamilies cache
    this.version(4).stores({
      remoteFamilies: 'id, name'
    });
  }
}

export const db = new AppDatabase();