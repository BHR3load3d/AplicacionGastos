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

  constructor() {
    super('FamilyExpensesDB');
    
    // bump schema version to 3 to add families.remoteId
    this.version(3).stores({
      categories: 'id, name, syncStatus, lastModified, syncId, familyId',
      expenses: '++id, categoryId, date, syncStatus, lastModified',
      families: '++id, remoteId, name, syncStatus, lastModified'
    });
  }
}

export const db = new AppDatabase();