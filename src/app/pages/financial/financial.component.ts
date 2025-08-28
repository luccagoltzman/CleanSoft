import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';
import { ToastrService } from 'ngx-toastr';
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
import { forkJoin, Subject, takeUntil, timer, of } from 'rxjs';
import { catchError, take, map } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { SaleService } from '../../services/sale.service';
import { ServiceService } from '../../services/service.service';
import { StatsSkeletonComponent } from '../../shared/components/skeleton/stats-skeleton.component';
import { Sale, Service, PaymentStatus } from '../../models';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatsSkeletonComponent],
  templateUrl: './financial.component.html',
  styleUrl: './financial.component.css'
})
export class FinancialComponent implements OnInit, OnDestroy {
  // Dados
  accountsPayable: AccountPayable[] = [];
  accountsReceivable: AccountReceivable[] = [];
  cashMovements: CashMovement[] = [];
  sales: Sale[] = [];
  services: Service[] = [];
  customers: any[] = [];
  suppliers: any[] = [];

  // Estado da interface
  activeTab: 'overview' | 'payables' | 'receivables' | 'movements' | 'reports' = 'overview';
  selectedAccount: AccountPayable | AccountReceivable | null = null;
  selectedMovement: CashMovement | null = null;
  showForm = false;
  isLoading = true;  // Inicia como true para mostrar skeleton
  isEditing = false;
  isCreating = false;
  
  // Overlay de detalhes
  showDetailsOverlay = false;
  selectedCardDetails: any = null;
  selectedCardType: string = '';

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
  today = new Date();

  // Enums para template
  cashMovementCategories = Object.values(CashMovementCategory);
  paymentMethods = Object.values(PaymentMethod);

  private destroy$ = new Subject<void>();

  constructor(
    private financialService: FinancialService,
    private api: ApiService,
    private saleService: SaleService,
    private serviceService: ServiceService,
    private fb: FormBuilder,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef
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
    this.isLoading = true;
    forkJoin({
      payables: this.api.getAll('accounts_payable').pipe(
        catchError(error => of([]))
      ),
      receivables: this.api.getAll('accounts_receivable').pipe(
        catchError(error => of([]))
      ),
      movements: this.api.getAll('cash_movements').pipe(
        catchError(error => of([]))
      ),
      sales: this.api.getAll('sales', undefined, ['sale_items(*)']).pipe(
        map((sales: any[]) => sales.map(sale => ({
          id: sale.id,
          customerId: sale.customerId,
          vehicleId: sale.vehicleId,
          subtotal: sale.subtotal || 0,
          discount: sale.discount || 0,
          total: sale.total || 0,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          notes: sale.notes,
          date: sale.date ? new Date(sale.date) : new Date(),
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
          createdBy: sale.createdBy || 1,
          dueDate: sale.dueDate,
          items: sale.sale_items ? sale.sale_items.map((item: any) => ({
            id: item.id,
            saleId: item.saleId,
            type: item.type,
            productId: item.productId,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            discount: item.discount || 0,
            notes: item.notes
          })) : []
        }))),
        catchError(error => of([]))
      ),
      services: this.serviceService.getServices().pipe(
        take(1),
        catchError(error => of([]))
      )
    })
      .subscribe({
        next: ({ payables, receivables, movements, sales, services }) => {

          
          this.accountsPayable = payables.filter((item: any) => item.type === 'payables');
          this.accountsReceivable = receivables.filter((item: any) => item.type === 'receivables');
          this.cashMovements = movements;
          this.sales = sales;
          this.services = services;

          this.updateStats();
          
          // Define loading como false após processar os dados
          this.isLoading = false;
          
          // Força a detecção de mudanças
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          
          // Carrega relatórios em background
          setTimeout(() => {
            this.loadReports();
          }, 100);
        },
        error: (error) => {
          console.error('Erro ao carregar dados financeiros:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toast.error('Erro ao carregar dados financeiros');
        }
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
    try {
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
        .subscribe({
          next: (report) => {
            this.financialReport = report;
          },
          error: (error) => {
            console.error('Erro ao carregar relatório financeiro:', error);
          }
        });

      this.financialService.getCashFlowReport(this.accountsPayable, this.accountsReceivable, this.cashMovements, this.reportPeriod, startDate, endDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (report) => {
            this.cashFlowReport = report;
          },
          error: (error) => {
            console.error('Erro ao carregar relatório de fluxo de caixa:', error);
          }
        });
    } catch (error) {
      console.error('Erro no loadReports:', error);
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString('pt-BR');
  }

  updateStats() {
    const today = new Date();

    // Contas a Pagar
    this.stats.pendingPayables = this.accountsPayable
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    this.stats.overduePayables = this.accountsPayable
      .filter(a => a.status === 'pending' && new Date(a.dueDate) < today)
      .reduce((sum, a) => sum + a.amount, 0);

    // Contas a Receber
    this.stats.pendingReceivables = this.accountsReceivable
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    this.stats.overdueReceivables = this.accountsReceivable
      .filter(r => r.status === 'pending' && new Date(r.dueDate) < today)
      .reduce((sum, r) => sum + r.amount, 0);

    // Fluxo de Caixa - incluindo vendas e serviços
    const paidReceivables = this.accountsReceivable
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    const paidPayables = this.accountsPayable
      .filter(a => a.status === 'paid')
      .reduce((sum, a) => sum + a.amount, 0);

    const incomeFromMovements = this.cashMovements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);

    const expenseFromMovements = this.cashMovements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);

    // Receitas de vendas pagas
    const incomeFromSales = this.sales
      .filter(s => s.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, s) => sum + s.total, 0);

    // Receitas de serviços (assumindo que serviços têm paymentStatus e basePrice)
    const incomeFromServices = this.services
      .filter(s => s.paymentStatus === PaymentStatus.PAID && s.basePrice)
      .reduce((sum, s) => sum + s.basePrice, 0);

    // Total de receitas incluindo vendas e serviços
    this.stats.totalIncome = paidReceivables + incomeFromMovements + incomeFromSales + incomeFromServices;
    this.stats.totalExpense = paidPayables + expenseFromMovements;
    this.stats.netCashFlow = this.stats.totalIncome - this.stats.totalExpense;

    // Total geral apenas para referência (opcional)
    this.stats.totalPayables = this.stats.pendingPayables;
    this.stats.totalReceivables = this.stats.pendingReceivables;
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
          this.toast.success('Conta a Pagar paga com sucesso!');
        } else {
          this.toast.error('Erro ao pagar conta a pagar.');
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
          this.toast.success('Conta a Receber recebida com sucesso!');
        } else {
          this.toast.error('Erro ao receber conta a receber.');
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
            this.toast.success('Conta a Pagar criada com sucesso!');
          }, error => {
            this.toast.error('Erro ao criar conta a pagar.');
            console.error(error);
          });
        } else if (this.isEditing && this.selectedAccount) {
          this.api.update('accounts_payable', this.selectedAccount.id, accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
            this.toast.success('Conta a Pagar atualizada com sucesso!');
          }, error => {
            this.toast.error('Erro ao atualizar conta a pagar.');
            console.error(error);
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
            this.toast.success('Conta a Receber criada com sucesso!');
          }, error => {
            this.toast.error('Erro ao criar conta a receber.');
            console.error(error);
          });
        } else if (this.isEditing && this.selectedAccount) {
          this.api.update('accounts_receivable', this.selectedAccount.id, accountData).subscribe(() => {
            this.closeForm();
            this.loadData();
            this.loadReports();
            this.toast.success('Conta a Receber atualizada com sucesso!');
          }, error => {
            this.toast.error('Erro ao atualizar conta a receber.');
            console.error(error);
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
          this.toast.success('Movimentação de Caixa criada com sucesso!');
        }, error => {
          this.toast.error('Erro ao criar movimentação de caixa.');
          console.error(error);
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


 isOverdue(dueDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0,0,0,0); // zera hora, minuto, segundo, ms

  const due = new Date(dueDate);
  due.setHours(0,0,0,0);

  return due < today;
}


  // Relatórios
  onReportPeriodChange() {
    this.loadReports();
  }

  exportReport() {
    // Implementar exportação para PDF/Excel
    console.log('Exportando relatório...');
  }

  getUpcomingPayables(limit: number = 5, daysAhead: number = 7) {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + daysAhead);

    return this.accountsPayable
      .filter(a => a.status === 'pending' && new Date(a.dueDate) <= maxDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, limit);
  }

  // Métodos para o overlay de detalhes
  openCardDetails(cardType: string) {
    this.selectedCardType = cardType;
    this.selectedCardDetails = this.getCardDetails(cardType);
    this.showDetailsOverlay = true;
  }

  closeDetailsOverlay() {
    this.showDetailsOverlay = false;
    this.selectedCardDetails = null;
    this.selectedCardType = '';
  }

  getCardDetails(cardType: string) {
    const today = new Date();
    
    switch (cardType) {
      case 'pending-payables':
        const pendingPayables = this.accountsPayable.filter(a => a.status === 'pending');
        return {
          title: 'Contas a Pagar - Total Pendente',
          totalValue: this.stats.pendingPayables,
          items: pendingPayables.map(account => ({
            description: account.description,
            amount: account.amount,
            dueDate: account.dueDate,
            supplier: account.supplierId,
            isOverdue: this.isOverdue(account.dueDate)
          })),
          summary: {
            totalCount: pendingPayables.length,
            overdueCount: pendingPayables.filter(a => this.isOverdue(a.dueDate)).length,
            thisMonthCount: pendingPayables.filter(a => {
              const dueDate = new Date(a.dueDate);
              return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
            }).length
          }
        };

      case 'overdue-payables':
        const overduePayables = this.accountsPayable.filter(a => a.status === 'pending' && this.isOverdue(a.dueDate));
        return {
          title: 'Contas a Pagar - Vencidas',
          totalValue: this.stats.overduePayables,
          items: overduePayables.map(account => ({
            description: account.description,
            amount: account.amount,
            dueDate: account.dueDate,
            supplier: account.supplierId,
            isOverdue: true,
            daysOverdue: Math.floor((today.getTime() - new Date(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          })),
          summary: {
            totalCount: overduePayables.length,
            averageDaysOverdue: overduePayables.length > 0 ? 
              Math.round(overduePayables.reduce((sum, a) => {
                const daysOverdue = Math.floor((today.getTime() - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return sum + daysOverdue;
              }, 0) / overduePayables.length) : 0
          }
        };

      case 'pending-receivables':
        const pendingReceivables = this.accountsReceivable.filter(r => r.status === 'pending');
        return {
          title: 'Contas a Receber - Total Pendente',
          totalValue: this.stats.pendingReceivables,
          items: pendingReceivables.map(account => ({
            description: account.description,
            amount: account.amount,
            dueDate: account.dueDate,
            customer: account.customerId,
            isOverdue: this.isOverdue(account.dueDate)
          })),
          summary: {
            totalCount: pendingReceivables.length,
            overdueCount: pendingReceivables.filter(r => this.isOverdue(r.dueDate)).length,
            thisMonthCount: pendingReceivables.filter(r => {
              const dueDate = new Date(r.dueDate);
              return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
            }).length
          }
        };

      case 'overdue-receivables':
        const overdueReceivables = this.accountsReceivable.filter(r => r.status === 'pending' && this.isOverdue(r.dueDate));
        return {
          title: 'Contas a Receber - Vencidas',
          totalValue: this.stats.overdueReceivables,
          items: overdueReceivables.map(account => ({
            description: account.description,
            amount: account.amount,
            dueDate: account.dueDate,
            customer: account.customerId,
            isOverdue: true,
            daysOverdue: Math.floor((today.getTime() - new Date(account.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          })),
          summary: {
            totalCount: overdueReceivables.length,
            averageDaysOverdue: overdueReceivables.length > 0 ? 
              Math.round(overdueReceivables.reduce((sum, r) => {
                const daysOverdue = Math.floor((today.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return sum + daysOverdue;
              }, 0) / overdueReceivables.length) : 0
          }
        };

      case 'total-income':
        const incomeMovements = this.cashMovements.filter(m => m.type === 'income');
        const paidReceivables = this.accountsReceivable.filter(r => r.status === 'paid');
        const paidSales = this.sales.filter(s => s.paymentStatus === PaymentStatus.PAID);
        const paidServices = this.services.filter(s => s.paymentStatus === PaymentStatus.PAID && s.basePrice);
        
        return {
          title: 'Receitas Totais',
          totalValue: this.stats.totalIncome,
          items: [
            ...incomeMovements.map(movement => ({
              description: movement.description,
              amount: movement.amount,
              date: movement.date,
              category: this.getCategoryText(movement.category),
              type: 'Movimentação de Caixa'
            })),
            ...paidReceivables.map(account => ({
              description: account.description,
              amount: account.amount,
              date: account.dueDate,
              customer: account.customerId,
              type: 'Conta Recebida'
            })),
            ...paidSales.map(sale => ({
              description: `Venda #${sale.id} - ${sale.customer?.name || 'Cliente ' + sale.customerId}`,
              amount: sale.total,
              date: sale.date,
              customer: sale.customer?.name || sale.customerId,
              type: 'Venda',
              paymentMethod: this.getPaymentMethodText(sale.paymentMethod)
            })),
            ...paidServices.map(service => ({
              description: service.name,
              amount: service.basePrice,
              date: service.scheduledDate || service.updatedAt,
              customer: service.customerId,
              type: 'Serviço',
              category: service.category
            }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          summary: {
            movementsCount: incomeMovements.length,
            receivablesCount: paidReceivables.length,
            salesCount: paidSales.length,
            servicesCount: paidServices.length,
            movementsTotal: incomeMovements.reduce((sum, m) => sum + m.amount, 0),
            receivablesTotal: paidReceivables.reduce((sum, r) => sum + r.amount, 0),
            salesTotal: paidSales.reduce((sum, s) => sum + s.total, 0),
            servicesTotal: paidServices.reduce((sum, s) => sum + s.basePrice, 0)
          }
        };

      case 'total-expense':
        const expenseMovements = this.cashMovements.filter(m => m.type === 'expense');
        const paidPayables = this.accountsPayable.filter(a => a.status === 'paid');
        return {
          title: 'Despesas Totais',
          totalValue: this.stats.totalExpense,
          items: [
            ...expenseMovements.map(movement => ({
              description: movement.description,
              amount: movement.amount,
              date: movement.date,
              category: this.getCategoryText(movement.category),
              type: 'Movimentação de Caixa'
            })),
            ...paidPayables.map(account => ({
              description: account.description,
              amount: account.amount,
              date: account.dueDate,
              supplier: account.supplierId,
              type: 'Conta Paga'
            }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          summary: {
            movementsCount: expenseMovements.length,
            payablesCount: paidPayables.length,
            movementsTotal: expenseMovements.reduce((sum, m) => sum + m.amount, 0),
            payablesTotal: paidPayables.reduce((sum, a) => sum + a.amount, 0)
          }
        };

      case 'net-cash-flow':
        const incomeFromSales = this.sales
          .filter(s => s.paymentStatus === PaymentStatus.PAID)
          .reduce((sum, s) => sum + s.total, 0);
        
        const incomeFromServices = this.services
          .filter(s => s.paymentStatus === PaymentStatus.PAID && s.basePrice)
          .reduce((sum, s) => sum + s.basePrice, 0);

        return {
          title: 'Fluxo de Caixa Líquido',
          totalValue: this.stats.netCashFlow,
          items: [
            {
              description: 'Movimentações de Receita',
              amount: this.cashMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0),
              type: 'Movimentação',
              isPositive: true
            },
            {
              description: 'Contas Recebidas',
              amount: this.accountsReceivable.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
              type: 'Conta Recebida',
              isPositive: true
            },
            {
              description: 'Vendas Realizadas',
              amount: incomeFromSales,
              type: 'Venda',
              isPositive: true
            },
            {
              description: 'Serviços Prestados',
              amount: incomeFromServices,
              type: 'Serviço',
              isPositive: true
            },
            {
              description: 'Total de Despesas',
              amount: this.stats.totalExpense,
              type: 'Despesa',
              isPositive: false
            }
          ],
          summary: {
            isPositive: this.stats.netCashFlow >= 0,
            margin: this.stats.totalIncome > 0 ? ((this.stats.netCashFlow / this.stats.totalIncome) * 100) : 0,
            salesCount: this.sales.filter(s => s.paymentStatus === PaymentStatus.PAID).length,
            servicesCount: this.services.filter(s => s.paymentStatus === PaymentStatus.PAID).length
          }
        };

      default:
        return null;
    }
  }


}
