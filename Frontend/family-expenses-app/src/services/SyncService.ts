import { db, LocalExpense } from '../db/database';
import { SyncResult, SyncResponse, CategoryDto, ExpenseDto } from '../types/SyncTypes';
import { FamilyService } from './FamilyService';

const API_BASE_URL = 'http://localhost:5272/api';
const SYNC_TS_KEY = 'fe:lastSyncTimestamp';

function getLastSyncTimestamp(): string {
  const ts = localStorage.getItem(SYNC_TS_KEY);
  return ts || new Date(0).toISOString();
}

function setLastSyncTimestamp(iso: string) {
  localStorage.setItem(SYNC_TS_KEY, iso);
}

export class SyncService {
  private static async syncCategories(): Promise<SyncResult> {
    try {
      const pendingCategories = await db.categories
        .where('syncStatus')
        .equals('pending')
        .toArray();

      // NOTE: Do not return early when there are no pending items.
      // We still need to pull server-side changes on initial load or when there are differences.

      // Get the remote family GUID
      let remoteFamilyId = await FamilyService.getRemoteFamilyId();
      if (!remoteFamilyId) {
        remoteFamilyId = await FamilyService.ensureRemoteFamily();
      }
      if (!remoteFamilyId) {
        return { success: false, message: 'No remote family configured' };
      }

      const categoriesPayload: CategoryDto[] = pendingCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? '',
        familyId: c.familyId || remoteFamilyId,
        lastModified: (c.lastModified instanceof Date ? c.lastModified : new Date(c.lastModified)).toISOString(),
        isDeleted: false,
        syncId: c.syncId || undefined,
      }));

      const response = await fetch(`${API_BASE_URL}/sync/${remoteFamilyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: categoriesPayload, // may be empty
          expenses: [],
          budgets: [],
          lastSyncTimestamp: getLastSyncTimestamp(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SyncResponse = await response.json();

      // Upsert all categories from server into local DB and mark as synced
      await Promise.all(
        result.categories.map(async (c) => {
          await db.categories.put({
            id: c.id,
            name: c.name,
            description: c.description || '',
            familyId: c.familyId,
            syncStatus: 'synced',
            lastModified: new Date(c.lastModified),
            syncError: undefined,
          } as any);
        })
      );

      // Mark previously pending ones that were accepted as synced
      const returnedIds = new Set(result.categories.map(c => c.id));
      const toUpdate = pendingCategories.filter(c => c.id && returnedIds.has(c.id));
      await Promise.all(
        toUpdate.map(async (c) => db.categories.update(c.id!, { syncStatus: 'synced', lastModified: new Date() }))
      );

      // Save server timestamp for next incremental sync
      if (result.serverTimestamp) setLastSyncTimestamp(result.serverTimestamp);

      return {
        success: true,
        message: `Pulled ${result.categories.length} categories from server, pushed ${toUpdate.length} pending items`,
      };
    } catch (error) {
      console.error('Error syncing categories:', error);
      return {
        success: false,
        message: 'Failed to sync categories',
        errors: [error],
      };
    }
  }

  private static async syncExpenses(): Promise<SyncResult> {
    try {
      const pendingExpenses = await db.expenses
        .where('syncStatus')
        .equals('pending')
        .toArray();

      // Get the remote family GUID
      let remoteFamilyId = await FamilyService.getRemoteFamilyId();
      if (!remoteFamilyId) {
        remoteFamilyId = await FamilyService.ensureRemoteFamily();
      }
      if (!remoteFamilyId) {
        return { success: false, message: 'No remote family configured' };
      }

      const expensesPayload: ExpenseDto[] = pendingExpenses.map((e) => ({
        id: crypto.randomUUID(),
        description: e.description,
        amount: e.amount,
        date: (e.date instanceof Date ? e.date : new Date(e.date)).toISOString(),
        categoryId: String(e.categoryId),
        familyMemberId: '', // optional/unknown for now
        notes: undefined,
        lastModified: (e.lastModified instanceof Date ? e.lastModified : new Date(e.lastModified)).toISOString(),
        isDeleted: false,
        syncId: undefined,
      }));

      const response = await fetch(`${API_BASE_URL}/sync/${remoteFamilyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: [],
          expenses: expensesPayload,
          budgets: [],
          lastSyncTimestamp: getLastSyncTimestamp(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SyncResponse = await response.json();

      // Mark all local pending expenses as synced after successful response (basic strategy)
      await Promise.all(
        pendingExpenses.map((e: LocalExpense) =>
          db.expenses.update(e.id!, { syncStatus: 'synced', lastModified: new Date() })
        )
      );

      // Save server timestamp for next incremental sync
      if (result.serverTimestamp) setLastSyncTimestamp(result.serverTimestamp);

      return {
        success: true,
        message: `Synced ${pendingExpenses.length} expenses`,
      };
    } catch (error) {
      console.error('Error syncing expenses:', error);
      return {
        success: false,
        message: 'Failed to sync expenses',
        errors: [error],
      };
    }
  }

  static async syncAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    // Sync categories first as expenses depend on them
    const categoriesResult = await this.syncCategories();
    results.push(categoriesResult);

    if (categoriesResult.success) {
      const expensesResult = await this.syncExpenses();
      results.push(expensesResult);
    }

    return results;
  }

  static async startPeriodicSync(intervalMinutes: number = 5): Promise<void> {
    const syncInterval = intervalMinutes * 60 * 1000;
    
    const performSync = async () => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        console.log('Device is offline, skipping sync');
        return;
      }

      const results = await this.syncAll();
      console.log('Sync results:', results);
    };

    // Initial sync
    await performSync();

    // Set up periodic sync
    setInterval(performSync, syncInterval);
  }
}