import { db, LocalCategory } from '../db/database';
import { Category, CategoryFormData } from '../types/Category';
import { FamilyService } from './FamilyService';

const API_BASE_URL = 'http://localhost:5272/api';

export class CategoryService {
  private static toCategory(localCategory: LocalCategory): Category {
    const { syncStatus, lastModified, syncId, familyId, syncError, ...category } = localCategory as any;
    return category as Category;
  }

  static async getAll(): Promise<Category[]> {
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
      const remoteFamilyId = await FamilyService.getRemoteFamilyId();

      if (isOnline && remoteFamilyId) {
        const res = await fetch(`${API_BASE_URL}/categories?familyId=${encodeURIComponent(remoteFamilyId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const remote = (await res.json()) as Array<{ id: string; name: string; description?: string; familyId: string; lastModified?: string }>;

        // Upsert into local DB and mark as synced
        await Promise.all(
          remote.map(async (c) =>
            db.categories.put({
              id: c.id,
              name: c.name,
              description: c.description ?? '',
              familyId: c.familyId,
              syncStatus: 'synced',
              lastModified: c.lastModified ? new Date(c.lastModified) : new Date(),
            } as any)
          )
        );

        // Return from remote (mapped as Category)
        return remote.map((c) => ({ id: c.id, name: c.name, description: c.description }) as Category);
      }
    } catch (e) {
      // Swallow and fallback to local
      console.warn('CategoryService.getAll remote fetch failed, using local cache', e);
    }

    const categories = await db.categories.toArray();
    return categories.map(CategoryService.toCategory);
  }

  static async add(categoryData: CategoryFormData): Promise<Category> {
    const { id: _ignored, ...categoryDataWithoutId } = categoryData;
    // ensure we have a remote family id
    let familyId = await FamilyService.getRemoteFamilyId();
    if (!familyId) {
      familyId = await FamilyService.ensureRemoteFamily();
    }
    if (!familyId) {
      throw new Error('No remote family configured. Please try again when online.');
    }

    const id = crypto.randomUUID();
    const newCategory: LocalCategory = {
      id,
      ...categoryDataWithoutId,
      familyId,
      syncStatus: 'pending',
      lastModified: new Date(),
    };

    await db.categories.put(newCategory);
    return { ...categoryDataWithoutId, id } as Category;
  }

  static async update(id: string, categoryData: CategoryFormData): Promise<void> {
    const updateData: Partial<LocalCategory> = {
      ...categoryData,
      syncStatus: 'pending',
      lastModified: new Date(),
    };

    await db.categories.update(id, updateData);
  }

  static async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  }

  static async getById(id: string): Promise<Category | undefined> {
    const category = await db.categories.get(id);
    return category ? CategoryService.toCategory(category) : undefined;
  }

  static async getPendingSync(): Promise<LocalCategory[]> {
    return await db.categories
      .where('syncStatus')
      .equals('pending')
      .toArray();
  }

  static async markAsSynced(id: string): Promise<void> {
    await db.categories.update(id, {
      syncStatus: 'synced',
      lastModified: new Date(),
    });
  }

  static async markAsError(id: string): Promise<void> {
    await db.categories.update(id, {
      syncStatus: 'error',
      lastModified: new Date(),
    });
  }
}