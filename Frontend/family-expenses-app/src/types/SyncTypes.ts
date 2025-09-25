export interface SyncResult {
  success: boolean;
  message: string;
  errors?: any[];
}

export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  familyId: string;
  lastModified: string | Date;
  isDeleted?: boolean;
  syncId?: string;
}

export interface ExpenseDto {
  id: string;
  description: string;
  amount: number;
  date: string | Date;
  categoryId: string;
  familyMemberId: string;
  notes?: string;
  lastModified: string | Date;
  isDeleted?: boolean;
  syncId?: string;
}

export interface BudgetDto {
  id: string;
  name: string;
  amount: number;
  startDate: string | Date;
  endDate: string | Date;
  categoryId: string;
  familyId: string;
  lastModified: string | Date;
  isDeleted?: boolean;
  syncId?: string;
}

export interface ConflictDto {
  entityType: string;
  entityId: string;
  conflictType: string;
  serverVersion?: any;
  clientVersion?: any;
}

export interface SyncResponse {
  serverTimestamp: string;
  expenses: ExpenseDto[];
  categories: CategoryDto[];
  budgets: BudgetDto[];
  conflicts: ConflictDto[];
}