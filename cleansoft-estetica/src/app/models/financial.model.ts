import { Customer } from './customer.model';
import { Supplier } from './product.model';
import { Sale } from './sale.model';
import { PaymentMethod } from './common.model';

export interface AccountPayable {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  description: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface AccountReceivable {
  id: number;
  customerId: number;
  customer?: Customer;
  saleId?: number;
  sale?: Sale;
  description: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface CashMovement {
  id: number;
  type: 'income' | 'expense';
  category: CashMovementCategory;
  description: string;
  amount: number;
  date: Date;
  paymentMethod?: PaymentMethod;
  reference?: string; // Referência para contas pagas/recebidas
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export enum CashMovementCategory {
  // Receitas
  SALES = 'sales',
  SERVICE_PAYMENTS = 'service_payments',
  ACCOUNT_RECEIVABLE_PAYMENTS = 'account_receivable_payments',
  OTHER_INCOME = 'other_income',
  
  // Despesas
  SUPPLIER_PAYMENTS = 'supplier_payments',
  ACCOUNT_PAYABLE_PAYMENTS = 'account_payable_payments',
  OPERATIONAL_EXPENSES = 'operational_expenses',
  SALARY_PAYMENTS = 'salary_payments',
  OTHER_EXPENSES = 'other_expenses'
}

export interface CashFlow {
  date: string;
  openingBalance: number;
  income: number;
  expense: number;
  closingBalance: number;
  movements: CashMovement[];
}

export interface CashFlowReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  cashFlows: CashFlow[];
  categoryBreakdown: {
    [key in CashMovementCategory]: number;
  };
}

export interface FinancialReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalPayables: number;
  paidPayables: number;
  pendingPayables: number;
  overduePayables: number;
  totalReceivables: number;
  paidReceivables: number;
  pendingReceivables: number;
  overdueReceivables: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  incomeByCategory: { [key in CashMovementCategory]?: number };
  expenseByCategory: { [key in CashMovementCategory]?: number };
}

export interface FinancialSearchParams {
  type?: 'payable' | 'receivable' | 'movement';
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category?: CashMovementCategory;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  customerId?: number;
  supplierId?: number;
  createdBy?: number;
}
