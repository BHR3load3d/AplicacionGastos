export interface BaseCategory {
  name: string;
  description?: string;
  familyId?: string;
  syncId?: string;
  lastModified?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  syncError?: string;
}

export interface Category extends BaseCategory {
  id: string;
}

export interface CategoryFormData extends BaseCategory {
  id?: string;
}