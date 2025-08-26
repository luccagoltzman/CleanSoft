import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import {
  AccountPayable,
  AccountReceivable,
  CashMovement,
  CashMovementCategory,
  PaymentMethod,
  CashFlow,
  CashFlowReport,
  FinancialReport,
  FinancialSearchParams
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private accountsPayable: AccountPayable[] = [
    {
      id: 1,
      supplierId: 1,
      description: 'Compra de produtos de limpeza',
      amount: 1500.00,
      dueDate: new Date('2024-02-15'),
      status: 'pending',
      notes: 'Produtos para estoque',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 1
    },
    {
      id: 2,
      supplierId: 2,
      description: 'Compra de equipamentos',
      amount: 2500.00,
      dueDate: new Date('2024-02-20'),
      status: 'pending',
      notes: 'Aspiradores e compressores',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 1
    }
  ];

  private accountsReceivable: AccountReceivable[] = [
    {
      id: 1,
      customerId: 1,
      saleId: 1,
      description: 'Venda de serviços - Cliente João Silva',
      amount: 80.00,
      dueDate: new Date('2024-02-10'),
      status: 'paid',
      paymentDate: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      notes: 'Lavagem completa',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 1
    },
    {
      id: 2,
      customerId: 2,
      saleId: 2,
      description: 'Venda de produtos - Cliente Maria Santos',
      amount: 120.00,
      dueDate: new Date('2024-02-15'),
      status: 'pending',
      notes: 'Produtos de limpeza',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 1
    }
  ];

  private cashMovements: CashMovement[] = [
    {
      id: 1,
      type: 'income',
      category: CashMovementCategory.SALES,
      description: 'Receita de vendas',
      amount: 200.00,
      date: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      reference: 'Vendas do dia',
      notes: 'Receita total das vendas',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 1
    },
    {
      id: 2,
      type: 'expense',
      category: CashMovementCategory.OPERATIONAL_EXPENSES,
      description: 'Despesas operacionais',
      amount: 50.00,
      date: new Date('2024-01-15'),
      paymentMethod: PaymentMethod.CASH,
      notes: 'Água, energia e outros',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 1
    }
  ];

  private accountsPayableSubject = new BehaviorSubject<AccountPayable[]>(this.accountsPayable);
  private accountsReceivableSubject = new BehaviorSubject<AccountReceivable[]>(this.accountsReceivable);
  private cashMovementsSubject = new BehaviorSubject<CashMovement[]>(this.cashMovements);

  constructor() { }

  // Métodos para Contas a Pagar
  getAccountsPayable(): Observable<AccountPayable[]> {
    return this.accountsPayableSubject.asObservable();
  }

  getAccountPayableById(id: number): Observable<AccountPayable | undefined> {
    const account = this.accountsPayable.find(a => a.id === id);
    return of(account);
  }

  createAccountPayable(account: Omit<AccountPayable, 'id' | 'createdAt' | 'updatedAt'>): Observable<AccountPayable> {
    const newAccount: AccountPayable = {
      ...account,
      id: this.getNextPayableId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.accountsPayable.push(newAccount);
    this.accountsPayableSubject.next([...this.accountsPayable]);
    return of(newAccount);
  }

  updateAccountPayable(id: number, updates: Partial<AccountPayable>): Observable<AccountPayable | null> {
    const index = this.accountsPayable.findIndex(a => a.id === id);
    if (index === -1) {
      return of(null);
    }

    this.accountsPayable[index] = {
      ...this.accountsPayable[index],
      ...updates,
      updatedAt: new Date()
    };

    this.accountsPayableSubject.next([...this.accountsPayable]);
    return of(this.accountsPayable[index]);
  }

  payAccountPayable(id: number, paymentDate: Date, paymentMethod: PaymentMethod): Observable<boolean> {
    const account = this.accountsPayable.find(a => a.id === id);
    if (!account || account.status !== 'pending') {
      return of(false);
    }

    account.status = 'paid';
    account.paymentDate = paymentDate;
    account.paymentMethod = paymentMethod;
    account.updatedAt = new Date();

    // Registrar movimentação de caixa
    const movement: CashMovement = {
      id: this.getNextMovementId(),
      type: 'expense',
      category: CashMovementCategory.ACCOUNT_PAYABLE_PAYMENTS,
      description: `Pagamento: ${account.description}`,
      amount: account.amount,
      date: paymentDate,
      paymentMethod,
      reference: `AP-${account.id}`,
      notes: `Pagamento da conta a pagar #${account.id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1
    };

    this.cashMovements.push(movement);
    this.cashMovementsSubject.next([...this.cashMovements]);
    this.accountsPayableSubject.next([...this.accountsPayable]);

    return of(true);
  }

  // Métodos para Contas a Receber
  getAccountsReceivable(): Observable<AccountReceivable[]> {
    return this.accountsReceivableSubject.asObservable();
  }

  getAccountReceivableById(id: number): Observable<AccountReceivable | undefined> {
    const account = this.accountsReceivable.find(a => a.id === id);
    return of(account);
  }

  createAccountReceivable(account: Omit<AccountReceivable, 'id' | 'createdAt' | 'updatedAt'>): Observable<AccountReceivable> {
    const newAccount: AccountReceivable = {
      ...account,
      id: this.getNextReceivableId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.accountsReceivable.push(newAccount);
    this.accountsReceivableSubject.next([...this.accountsReceivable]);
    return of(newAccount);
  }

  updateAccountReceivable(id: number, updates: Partial<AccountReceivable>): Observable<AccountReceivable | null> {
    const index = this.accountsReceivable.findIndex(a => a.id === id);
    if (index === -1) {
      return of(null);
    }

    this.accountsReceivable[index] = {
      ...this.accountsReceivable[index],
      ...updates,
      updatedAt: new Date()
    };

    this.accountsReceivableSubject.next([...this.accountsReceivable]);
    return of(this.accountsReceivable[index]);
  }

  receiveAccountReceivable(id: number, paymentDate: Date, paymentMethod: PaymentMethod): Observable<boolean> {
    const account = this.accountsReceivable.find(a => a.id === id);
    if (!account || account.status !== 'pending') {
      return of(false);
    }

    account.status = 'paid';
    account.paymentDate = paymentDate;
    account.paymentMethod = paymentMethod;
    account.updatedAt = new Date();

    // Registrar movimentação de caixa
    const movement: CashMovement = {
      id: this.getNextMovementId(),
      type: 'income',
      category: CashMovementCategory.ACCOUNT_RECEIVABLE_PAYMENTS,
      description: `Recebimento: ${account.description}`,
      amount: account.amount,
      date: paymentDate,
      paymentMethod,
      reference: `AR-${account.id}`,
      notes: `Recebimento da conta a receber #${account.id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1
    };

    this.cashMovements.push(movement);
    this.cashMovementsSubject.next([...this.cashMovements]);
    this.accountsReceivableSubject.next([...this.accountsReceivable]);

    return of(true);
  }

  // Métodos para Movimentações de Caixa
  getCashMovements(): Observable<CashMovement[]> {
    return this.cashMovementsSubject.asObservable();
  }

  createCashMovement(movement: Omit<CashMovement, 'id' | 'createdAt' | 'updatedAt'>): Observable<CashMovement> {
    const newMovement: CashMovement = {
      ...movement,
      id: this.getNextMovementId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.cashMovements.push(newMovement);
    this.cashMovementsSubject.next([...this.cashMovements]);
    return of(newMovement);
  }

  // Métodos para Relatórios
  getFinancialReport(accountsPayable: AccountPayable[], accountsReceivable: AccountReceivable[], cashMovements: CashMovement[], period: 'daily' | 'weekly' | 'monthly', startDate: any, endDate: any): Observable<FinancialReport> {

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const payables = accountsPayable.filter(a => {
      const createdAt = new Date(a.createdAt).getTime();
      return createdAt >= startDate.getTime() && createdAt <= endDate.getTime();
    });

    const receivables = accountsReceivable.filter(a => {
      const createdAt = new Date(a.createdAt).getTime();
      return createdAt >= startDate.getTime() && createdAt <= endDate.getTime();
    });

    const movements = cashMovements.filter(m => {
      const date = new Date(m.date).getTime();
      return date >= startDate.getTime() && date <= endDate.getTime();
    });

    const totalPayables = payables.reduce((sum, a) => sum + a.amount, 0);
    const paidPayables = payables.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0);
    const pendingPayables = payables.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0);
    const overduePayables = payables.filter(a =>
      a.status === 'pending' && a.dueDate < new Date()
    ).reduce((sum, a) => sum + a.amount, 0);

    const totalReceivables = receivables.reduce((sum, a) => sum + a.amount, 0);
    const paidReceivables = receivables.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0);
    const pendingReceivables = receivables.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0);
    const overdueReceivables = receivables.filter(a =>
      a.status === 'pending' && a.dueDate < new Date()
    ).reduce((sum, a) => sum + a.amount, 0);

    const totalIncome = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);

    const incomeByCategory: { [key in CashMovementCategory]?: number } = {};
    const expenseByCategory: { [key in CashMovementCategory]?: number } = {};

    movements.forEach(movement => {
      if (movement.type === 'income') {
        incomeByCategory[movement.category] = (incomeByCategory[movement.category] || 0) + movement.amount;
      } else {
        expenseByCategory[movement.category] = (expenseByCategory[movement.category] || 0) + movement.amount;
      }
    });

    return of({
      period,
      startDate,
      endDate,
      totalPayables,
      paidPayables,
      pendingPayables,
      overduePayables,
      totalReceivables,
      paidReceivables,
      pendingReceivables,
      overdueReceivables,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory
    });
  }

  getCashFlowReport(accountsPayable: AccountPayable[], accountsReceivable: AccountReceivable[], cashMovements: CashMovement[], period: 'daily' | 'weekly' | 'monthly', startDate: Date, endDate: Date): Observable<CashFlowReport> {
    const movements = cashMovements.filter(m =>
      m.date >= startDate && m.date <= endDate
    );

    const totalIncome = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const totalExpense = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);

    // Agrupar movimentos por data
    const movementsByDate = new Map<string, CashMovement[]>();
    movements.forEach(movement => {
      const dateKey = movement.date.toISOString().split('T')[0];
      if (!movementsByDate.has(dateKey)) {
        movementsByDate.set(dateKey, []);
      }
      movementsByDate.get(dateKey)!.push(movement);
    });

    const cashFlows: CashFlow[] = [];
    let currentBalance = 0; // Saldo inicial

    // Ordenar datas e calcular fluxo
    const sortedDates = Array.from(movementsByDate.keys()).sort();
    sortedDates.forEach(date => {
      const dayMovements = movementsByDate.get(date)!;
      const dayIncome = dayMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
      const dayExpense = dayMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);

      const openingBalance = currentBalance;
      currentBalance += dayIncome - dayExpense;

      cashFlows.push({
        date,
        openingBalance,
        income: dayIncome,
        expense: dayExpense,
        closingBalance: currentBalance,
        movements: dayMovements
      });
    });

    const categoryBreakdown: { [key in CashMovementCategory]: number } = {
      [CashMovementCategory.SALES]: 0,
      [CashMovementCategory.SERVICE_PAYMENTS]: 0,
      [CashMovementCategory.ACCOUNT_RECEIVABLE_PAYMENTS]: 0,
      [CashMovementCategory.OTHER_INCOME]: 0,
      [CashMovementCategory.SUPPLIER_PAYMENTS]: 0,
      [CashMovementCategory.ACCOUNT_PAYABLE_PAYMENTS]: 0,
      [CashMovementCategory.OPERATIONAL_EXPENSES]: 0,
      [CashMovementCategory.SALARY_PAYMENTS]: 0,
      [CashMovementCategory.OTHER_EXPENSES]: 0
    };

    movements.forEach(movement => {
      categoryBreakdown[movement.category] += movement.amount;
    });

    return of({
      period,
      startDate,
      endDate,
      openingBalance: 0, // Saldo inicial do período
      totalIncome,
      totalExpense,
      closingBalance: currentBalance,
      cashFlows,
      categoryBreakdown
    });
  }

  // Métodos auxiliares
  private getNextPayableId(): number {
    const maxId = Math.max(...this.accountsPayable.map(a => a.id));
    return maxId + 1;
  }

  private getNextReceivableId(): number {
    const maxId = Math.max(...this.accountsReceivable.map(a => a.id));
    return maxId + 1;
  }

  private getNextMovementId(): number {
    const maxId = Math.max(...this.cashMovements.map(m => m.id));
    return maxId + 1;
  }

  // Busca e filtros
  searchFinancial(params: FinancialSearchParams): Observable<{
    payables?: AccountPayable[];
    receivables?: AccountReceivable[];
    movements?: CashMovement[];
  }> {
    let result: any = {};

    if (params.type === 'payable' || !params.type) {
      let filtered = [...this.accountsPayable];

      if (params.status) {
        filtered = filtered.filter(a => a.status === params.status);
      }
      if (params.supplierId) {
        filtered = filtered.filter(a => a.supplierId === params.supplierId);
      }
      if (params.startDate) {
        filtered = filtered.filter(a => a.createdAt >= params.startDate!);
      }
      if (params.endDate) {
        filtered = filtered.filter(a => a.createdAt <= params.endDate!);
      }
      if (params.minAmount) {
        filtered = filtered.filter(a => a.amount >= params.minAmount!);
      }
      if (params.maxAmount) {
        filtered = filtered.filter(a => a.amount <= params.maxAmount!);
      }

      result.payables = filtered;
    }

    if (params.type === 'receivable' || !params.type) {
      let filtered = [...this.accountsReceivable];

      if (params.status) {
        filtered = filtered.filter(a => a.status === params.status);
      }
      if (params.customerId) {
        filtered = filtered.filter(a => a.customerId === params.customerId);
      }
      if (params.startDate) {
        filtered = filtered.filter(a => a.createdAt >= params.startDate!);
      }
      if (params.endDate) {
        filtered = filtered.filter(a => a.createdAt <= params.endDate!);
      }
      if (params.minAmount) {
        filtered = filtered.filter(a => a.amount >= params.minAmount!);
      }
      if (params.maxAmount) {
        filtered = filtered.filter(a => a.amount <= params.maxAmount!);
      }

      result.receivables = filtered;
    }

    if (params.type === 'movement' || !params.type) {
      let filtered = [...this.cashMovements];

      if (params.category) {
        filtered = filtered.filter(m => m.category === params.category);
      }
      if (params.startDate) {
        filtered = filtered.filter(m => m.date >= params.startDate!);
      }
      if (params.endDate) {
        filtered = filtered.filter(m => m.date <= params.endDate!);
      }
      if (params.minAmount) {
        filtered = filtered.filter(m => m.amount >= params.minAmount!);
      }
      if (params.maxAmount) {
        filtered = filtered.filter(m => m.amount <= params.maxAmount!);
      }

      result.movements = filtered;
    }

    return of(result);
  }
}
