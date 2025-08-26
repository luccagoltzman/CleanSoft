import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';
import {
  AccountPayable,
  AccountReceivable,
  CashMovement,
  CashMovementCategory,
  PaymentMethod,
  FinancialReport,
  CashFlowReport,
  FinancialSearchParams
} from '../../models';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './financial.component.html',
  styleUrl: './financial.component.css'
})
export class FinancialComponent implements OnInit, OnDestroy {
  // Dados
  accountsPayable: AccountPayable[] = [];
  accountsReceivable: AccountReceivable[] = [];
  cashMovements: CashMovement[] = [];
  customers: any[] = [];
  suppliers: any[] = [];

  // Estado da interface
  activeTab: 'overview' | 'payables' | 'receivables' | 'movements' | 'reports' = 'overview';
  selectedAccount: AccountPayable | AccountReceivable | null = null;
  selectedMovement: CashMovement | null = null;
  showForm = false;
  isEditing = false;
  isCreating = false;

  // Filtros
  searchTerm = '';
  statusFilter = 'all';
  categoryFilter = 'all';
  startDateFilter = '';
  endDateFilter = '';
  minAmountFilter = '';
  maxAmountFilter = '';

  // Formulários
  accountForm: FormGroup;
  movementForm: FormGroup;

  // Relatórios
  financialReport: FinancialReport | null = null;
  cashFlowReport: CashFlowReport | null = null;
  reportPeriod: 'daily' | 'weekly' | 'monthly' = 'monthly';

  // Estatísticas
  stats = {
    totalPayables: 0,
    pendingPayables: 0,
    overduePayables: 0,
    totalReceivables: 0,
    pendingReceivables: 0,
    overdueReceivables: 0,
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0
  };

  // Enums para template
  cashMovementCategories = Object.values(CashMovementCategory);
  paymentMethods = Object.values(PaymentMethod);

  private destroy$ = new Subject<void>();

  constructor(
    private financialService: FinancialService,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.accountForm = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      dueDate: ['', Validators.required],
      notes: [''],
      customerId: [''],
      supplierId: [''],
      saleId: ['']
    });

    this.movementForm = this.fb.group({
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      paymentMethod: [''],
      reference: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadCustomers();
    this.loadSuppliers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    forkJoin({
      payables: this.api.getAll('accounts_payable'),
      receivables: this.api.getAll('accounts_receivable'),
      movements: this.api.getAll('cash_movements')
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ payables, receivables, movements }) => {
        this.accountsPayable = payables.filter((item: any) => item.type === 'payables');
        this.accountsReceivable = receivables.filter((item: any) => item.type === 'receivables');
        this.cashMovements = movements;

        this.updateStats();
        this.loadReports();
      });
  }


  loadCustomers() {
    this.api.getAll('clients')
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers;
      });
  }

  loadSuppliers() {
    this.api.getAll('suppliers')
      .pipe(takeUntil(this.destroy$))
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  loadReports() {
    const endDate = new Date();
    const startDate = new Date();

    if (this.reportPeriod === 'daily') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (this.reportPeriod === 'weekly') {
      startDate.setDate(endDate.getDate() - 30);
    } else {
      startDate.setMonth(endDate.getMonth() - 12);
    }

    this.financialService.getFinancialReport(this.accountsPayable, this.accountsReceivable, this.cashMovements, this.reportPeriod, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(report => {
        this.financialReport = report;
      });

    this.financialService.getCashFlowReport(this.accountsPayable, this.accountsReceivable, this.cashMovements, this.reportPeriod, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(report => {
        this.cashFlowReport = report;
      });


    console.log(this.financialReport);
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString('pt-BR');
  }

  updateStats() {
    this.stats.totalPayables = this.accountsPayable.reduce((sum, a) => sum + a.amount, 0);
    this.stats.pendingPayables = this.accountsPayable
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);
    this.stats.overduePayables = this.accountsPayable
      .filter(a => a.status === 'pending' && a.dueDate < new Date())
      .reduce((sum, a) => sum + a.amount, 0);

    this.stats.totalReceivables = this.accountsReceivable.reduce((sum, a) => sum + a.amount, 0);
    this.stats.pendingReceivables = this.accountsReceivable
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);
    this.stats.overdueReceivables = this.accountsReceivable
      .filter(a => a.status === 'pending' && a.dueDate < new Date())
      .reduce((sum, a) => sum + a.amount, 0);

    this.stats.totalIncome = this.cashMovements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);
    this.stats.totalExpense = this.cashMovements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);
    this.stats.netCashFlow = this.stats.totalIncome - this.stats.totalExpense;
  }

  // Navegação entre abas
  setActiveTab(tab: 'overview' | 'payables' | 'receivables' | 'movements' | 'reports') {
    this.activeTab = tab;
  }

  // Contas a Pagar
  createAccountPayable() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedAccount = null;
    this.accountForm.reset({
      type: 'payable'
    });
    this.showForm = true;
  }

  editAccountPayable(account: AccountPayable) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedAccount = account;
    this.accountForm.patchValue({
      description: account.description,
      amount: account.amount,
      dueDate: (account.dueDate),
      notes: account.notes,
      supplierId: account.supplierId
    });
    this.showForm = true;
  }

  payAccountPayable(account: AccountPayable) {
    if (account.status !== 'pending') return;

    const body = {
      paymentDate: new Date(),
      status: 'paid',
    }
    this.api.update('accounts_payable', account.id, body)
      .subscribe(success => {
        if (success) {
          this.loadData();
          this.loadReports();
        }
      });
  }

  // Contas a Receber
  createAccountReceivable() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedAccount = null;
    this.accountForm.reset({
      type: 'receivable'
    });
    this.showForm = true;
  }

  editAccountReceivable(account: AccountReceivable) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedAccount = account;
    this.accountForm.patchValue({
      description: account.description,
      amount: account.amount,
      dueDate: (account.dueDate),
      notes: account.notes,
      customerId: account.customerId,
      saleId: account.saleId
    });
    this.showForm = true;
  }

  receiveAccountReceivable(account: AccountReceivable) {
    if (account.status !== 'pending') return;
    const body = {
      paymentDate: new Date(),
      status: 'paid',
    }
    this.api.update('accounts_receivable', account.id, body)
      .subscribe(success => {
        if (success) {
          this.loadData();
          this.loadReports();
        }
      });

  }

  // Movimentações de Caixa
  createCashMovement() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedMovement = null;
    this.movementForm.reset({
      type: 'expense',
      date: new Date()
    });
    this.showForm = true;
  }

  editCashMovement(movement: CashMovement) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedMovement = movement;
    this.movementForm.patchValue({
      type: movement.type,
      category: movement.category,
      description: movement.description,
      amount: movement.amount,
      date: (movement.date),
      paymentMethod: movement.paymentMethod,
      reference: movement.reference,
      notes: movement.notes
    });
    this.showForm = true;
  }

  // Salvamento
  saveAccount() {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;

      if (this.activeTab === 'payables') {
        const accountData = {
          supplierId: formValue.supplierId,
          description: formValue.description,
          amount: formValue.amount,
          dueDate: new Date(formValue.dueDate),
          status: 'pending' as const,
          notes: formValue.notes,
          createdBy: 1,
          type: 'payables',
        };

        if (this.isCreating) {
          this.api.create('accounts_payable', accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
          });
        } else if (this.isEditing && this.selectedAccount) {
          this.api.update('accounts_payable', this.selectedAccount.id, accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
          });
        }
      } else if (this.activeTab === 'receivables') {
        const accountData = {
          customerId: formValue.customerId,
          description: formValue.description,
          amount: formValue.amount,
          dueDate: new Date(formValue.dueDate),
          status: 'pending' as const,
          notes: formValue.notes,
          createdBy: 1,
          type: 'receivables',
        };

        if (this.isCreating) {
          this.api.create('accounts_receivable', accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
          });
        } else if (this.isEditing && this.selectedAccount) {
          this.api.update('accounts_receivable', this.selectedAccount.id, accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
          });
        }
      }
    }
  }

  saveMovement() {
    if (this.movementForm.valid) {
      const formValue = this.movementForm.value;

      const movementData = {
        type: formValue.type,
        category: formValue.category,
        description: formValue.description,
        amount: formValue.amount,
        date: new Date(formValue.date),
        paymentMethod: formValue.paymentMethod || undefined,
        reference: formValue.reference || undefined,
        notes: formValue.notes,
        createdBy: 1
      };

      if (this.isCreating) {
        this.api.create('cash_movements', movementData).subscribe(() => {
          this.closeForm();
          this.loadData();
          this.loadReports();
        });
      } else if (this.isEditing && this.selectedMovement) {
        // Atualizar movimentação (implementar se necessário)
        this.closeForm();
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedAccount = null;
    this.selectedMovement = null;
    this.accountForm.reset();
    this.movementForm.reset();
  }

  // Filtros
  applyFilters() {
    const params: FinancialSearchParams = {
      type: this.activeTab === 'payables' ? 'payable' :
        this.activeTab === 'receivables' ? 'receivable' :
          this.activeTab === 'movements' ? 'movement' : undefined,
      status: this.statusFilter !== 'all' ? this.statusFilter as any : undefined,
      category: this.categoryFilter !== 'all' ? this.categoryFilter as any : undefined,
      startDate: this.startDateFilter ? new Date(this.startDateFilter) : undefined,
      endDate: this.endDateFilter ? new Date(this.endDateFilter) : undefined,
      minAmount: this.minAmountFilter ? parseFloat(this.minAmountFilter) : undefined,
      maxAmount: this.maxAmountFilter ? parseFloat(this.maxAmountFilter) : undefined
    };

    this.financialService.searchFinancial(params).subscribe(result => {
      if (result.payables) this.accountsPayable = result.payables;
      if (result.receivables) this.accountsReceivable = result.receivables;
      if (result.movements) this.cashMovements = result.movements;
      this.updateStats();
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.categoryFilter = 'all';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.minAmountFilter = '';
    this.maxAmountFilter = '';
    this.loadData();
  }

  // Métodos auxiliares
  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      case 'cancelled': return 'secondary';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  getMovementTypeClass(type: string): string {
    return type === 'income' ? 'success' : 'danger';
  }

  getMovementTypeText(type: string): string {
    return type === 'income' ? 'Receita' : 'Despesa';
  }

  getCategoryText(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'sales': 'Vendas',
      'service_payments': 'Pagamentos de Serviços',
      'account_receivable_payments': 'Recebimentos',
      'other_income': 'Outras Receitas',
      'supplier_payments': 'Pagamentos a Fornecedores',
      'account_payable_payments': 'Pagamentos',
      'operational_expenses': 'Despesas Operacionais',
      'salary_payments': 'Pagamentos de Salários',
      'other_expenses': 'Outras Despesas'
    };
    return categoryMap[category] || category;
  }

  getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência Bancária',
      'check': 'Cheque',
      'installment': 'Parcelado'
    };
    return methodMap[method] || method;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }


  isOverdue(date: Date): boolean {
    return date < new Date();
  }

  // Relatórios
  onReportPeriodChange() {
    this.loadReports();
  }

  exportReport() {
    // Implementar exportação para PDF/Excel
    console.log('Exportando relatório...');
  }
}
