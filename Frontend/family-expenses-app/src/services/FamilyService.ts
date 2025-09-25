import { db, LocalFamily, CachedRemoteFamily } from '../db/database';
import { Family } from '../types/Family';

const API_BASE_URL = 'http://localhost:5272/api';

export class FamilyService {
  private static inflightFamilies?: Promise<Array<{ id: string; name: string }>>;

  static async getCurrentFamily(): Promise<Family | null> {
    const family = await db.families.toCollection().first();
    return family ? this.toFamily(family) : null;
  }

  static async getRemoteFamilyId(): Promise<string | null> {
    const local = await db.families.toCollection().first();
    return local?.remoteId ?? null;
  }

  static async ensureRemoteFamily(): Promise<string | null> {
    const local = await db.families.toCollection().first();
    if (!local) return null;
    if (local.remoteId) {
      // ensure status reflects remote binding
      await db.families.update(local.id!, { syncStatus: 'synced', lastModified: new Date() });
      return local.remoteId;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/families`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: local.name })
      });
      if (!res.ok) throw new Error(`Create family failed ${res.status}`);
      const serverFamily = await res.json();
      await db.families.update(local.id!, { remoteId: serverFamily.id, syncStatus: 'synced', lastModified: new Date() });
      return serverFamily.id as string;
    } catch (e) {
      // offline or server error: stay pending
      return null;
    }
  }

  static async ensureDefaultFamily(): Promise<Family> {
    const existingFamily = await this.getCurrentFamily();
    
    if (existingFamily) {
      // try to ensure remote id if missing
      const rid = await this.ensureRemoteFamily();
      if (rid) {
        const local = await db.families.toCollection().first();
        if (local) await db.families.update(local.id!, { syncStatus: 'synced', lastModified: new Date() });
      }
      return existingFamily;
    }

    const newFamily: LocalFamily = {
      name: 'My Family',
      lastModified: new Date(),
      syncStatus: 'pending'
    };
    
    const id = await db.families.add(newFamily);
    // after creating local, attempt to create remote
    const rid = await this.ensureRemoteFamily();
    if (rid) {
      await db.families.update(id, { syncStatus: 'synced', lastModified: new Date() });
    }
    return {
      ...newFamily,
      id: Number(id)
    };
  }

  static async updateFamily(family: Family): Promise<void> {
    if (!family.id) {
      throw new Error('Cannot update family without an ID');
    }

    const local = await db.families.get(family.id);
    const localFamily: LocalFamily = {
      id: family.id,
      name: family.name,
      remoteId: local?.remoteId, // preserve remoteId
      syncStatus: family.syncStatus,
      lastModified: new Date()
    };

    await db.families.put(localFamily);
  }

  static async getLocalFamilies(): Promise<Array<{ id: string; name: string }>> {
    const cached: CachedRemoteFamily[] = await db.remoteFamilies.toArray();
    return cached.map(c => ({ id: c.id, name: c.name }));
  }

  static async fetchRemoteFamilies(): Promise<Array<{ id: string; name: string }>> {
    if (!this.inflightFamilies) {
      this.inflightFamilies = (async () => {
        const res = await fetch(`${API_BASE_URL}/families`);
        if (!res.ok) throw new Error(`Failed to fetch families: ${res.status}`);
        const list = await res.json();
        const mapped = (list as any[]).map(f => ({ id: String(f.id), name: String(f.name || '') }));
        // refresh cache: simple replace
        await db.transaction('rw', db.remoteFamilies, async () => {
          await db.remoteFamilies.clear();
          await db.remoteFamilies.bulkPut(mapped.map(m => ({ id: m.id, name: m.name })));
        });
        return mapped;
      })().finally(() => {
        this.inflightFamilies = undefined;
      });
    }
    return this.inflightFamilies;
  }

  static async setCurrentRemoteFamily(remoteId: string, name?: string): Promise<void> {
    const local = await db.families.toCollection().first();
    if (local) {
      await db.families.update(local.id!, {
        remoteId,
        name: name ?? local.name,
        syncStatus: remoteId ? 'synced' : 'pending',
        lastModified: new Date(),
      });
    } else {
      const newLocal: LocalFamily = {
        name: name ?? 'My Family',
        remoteId,
        syncStatus: remoteId ? 'synced' : 'pending',
        lastModified: new Date(),
      };
      await db.families.add(newLocal);
    }
  }

  private static toFamily(local: LocalFamily): Family {
    return {
      id: local.id ? Number(local.id) : undefined,
      name: local.name,
      lastModified: local.lastModified,
      syncStatus: local.syncStatus
    };
  }
}