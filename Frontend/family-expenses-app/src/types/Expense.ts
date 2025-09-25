export interface BaseExpense {
  // category now references Category by string GUID
  categoryId: string;
  amount: number;
  date: Date;
  description: string;
}

export interface Expense extends BaseExpense {
  // local expenses keep numeric autoincrement id
  id: number;
}

export interface ExpenseFormData extends BaseExpense {
  id?: number;
}