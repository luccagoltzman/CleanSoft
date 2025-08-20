import { Customer } from './customer.model';
import { Sale } from './sale.model';
import { Supplier } from './product.model';

export interface AccountPayable {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  description: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: AccountStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface AccountReceivable {
  id: number;
  customerId: number;
  customer?: Customer;
  saleId: number;
  sale?: Sale;
  description: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: AccountStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export interface CashMovement {
  id: number;
  type: 'IN' | 'OUT';
  amount: number;
  description: string;
  category: CashMovementCategory;
  reference?: string;
  notes?: string;
  createdAt: Date;
  createdBy: number;
}

export enum CashMovementCategory {
  SALE = 'sale',
  PURCHASE = 'purchase',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  EXPENSE = 'expense',
  ADJUSTMENT = 'adjustment'
}

export interface CashFlow {
  date: Date;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  movements: CashMovement[];
}

export interface FinancialReport {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  cashFlow: CashFlow[];
  totalPayable: number;
  totalReceivable: number;
  cashBalance: number;
  overdueAccounts: (AccountPayable | AccountReceivable)[];
}
