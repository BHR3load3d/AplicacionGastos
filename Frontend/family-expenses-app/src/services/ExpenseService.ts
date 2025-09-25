import { db } from '../db/database';
import type { Expense, ExpenseFormData } from '../types/Expense';

export class ExpenseService {
  private static toExpense(localExpense: any): Expense {
    const { syncStatus, lastModified, ...expense } = localExpense;
    // Convert date to Date instance
    return {
      ...expense,
      date: new Date(expense.date),
    } as Expense;
  }

  static async getAll(): Promise<Expense[]> {
    const expenses = await db.expenses.toArray();
    return expenses.map(ExpenseService.toExpense);
  }

  static async add(expenseData: ExpenseFormData): Promise<Expense> {
    const { id: _ignored, ...expenseDataWithoutId } = expenseData;
    const newExpense = {
      ...expenseDataWithoutId,
      syncStatus: 'pending' as const,
      lastModified: new Date(),
    };

    const id = await db.expenses.add(newExpense);
    return { ...expenseDataWithoutId, id: id as number } as Expense;
  }

  static async update(id: number, expenseData: ExpenseFormData): Promise<void> {
    const updateData = {
      ...expenseData,
      syncStatus: 'pending' as const,
      lastModified: new Date(),
    };

    await db.expenses.update(id, updateData);
  }

  static async delete(id: number): Promise<void> {
    await db.expenses.delete(id);
  }

  static async getById(id: number): Promise<Expense | undefined> {
    const expense = await db.expenses.get(id);
    return expense ? ExpenseService.toExpense(expense) : undefined;
  }

  static async getByCategory(categoryId: string): Promise<Expense[]> {
    const expenses = await db.expenses
      .where('categoryId')
      .equals(categoryId)
      .toArray();
    return expenses.map(ExpenseService.toExpense);
  }

  static async getPendingSync(): Promise<any[]> {
    return await db.expenses
      .where('syncStatus')
      .equals('pending')
      .toArray();
  }
}