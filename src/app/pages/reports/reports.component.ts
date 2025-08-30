import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { ToastrService } from 'ngx-toastr';
import {
  CustomerReport,
  ServiceReport,
  ProductReport,
  StockReportData,
  FinancialReportData,
  GeneralReport,
  ReportSearchParams,
  ExportFormat,
  ReportConfig,
  Customer
} from '../../models';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, OnDestroy {
  // Estado da interface
  activeTab: 'general' | 'customers' | 'services' | 'products' | 'stock' | 'financial' = 'customers';


  services: any[] = []
  sales: any[] = []
  products: any[] = []

  // Filtros
  reportForm: FormGroup;
  periodOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  // Relatórios
  generalReport: GeneralReport | null = null;
  customerReport: CustomerReport | null = null;
  serviceReport: ServiceReport | null = null;
  productReport: ProductReport | null = null;
  stockReport: StockReportData | null = null;
  financialReport: FinancialReportData | null = null;

  // Configurações de exportação
  exportForm: FormGroup;
  exportFormats: { value: ExportFormat; label: string }[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];

  // Estado de carregamento
  isLoading = false;
  lastGenerated: Date | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastrService
  ) {
    this.reportForm = this.fb.group({
      period: ['monthly', Validators.required],
      startDate: [''],
      endDate: ['']
    });

    this.exportForm = this.fb.group({
      format: ['pdf', Validators.required],
      includeCharts: [true],
      includeTables: [true],
      includeSummary: [true],
      chartType: ['bar'],
      pageSize: ['A4'],
      orientation: ['portrait']
    });
  }

  ngOnInit() {
    this.loadCustomers()
    this.generateGeneralReport();
    this.loadServices();
    this.loadSales();
    // this.loadFinancialReport(); // desativvo por hora
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navegação entre abas
  setActiveTab(tab: string) {
    if (tab === 'general' || tab === 'customers' || tab === 'services' ||
      tab === 'products' || tab === 'stock' || tab === 'financial') {
      this.activeTab = tab as 'general' | 'customers' | 'services' | 'products' | 'stock' | 'financial';
      this.generateReport();
    }
  }

  // Geração de relatórios
  generateReport() {
    if (this.activeTab === 'general') {
      // this.generateGeneralReport();
    } else if (this.activeTab === 'customers') {
      // this.generateCustomerReport();
    } else if (this.activeTab === 'services') {

    } else if (this.activeTab === 'products') {
    } else if (this.activeTab === 'stock') {
    } else if (this.activeTab === 'financial') {
      // this.generateFinancialReport();
    }
  }

  generateGeneralReport() {
    this.isLoading = true;
    const params = this.getReportParams();

    this.reportService.generateGeneralReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.generalReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
          // this.toast.success('Relatório geral gerado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao gerar relatório geral:', error);
          this.isLoading = false;
          // this.toast.error('Erro ao gerar relatório geral.');
        }
      });
  }


  loadCustomers() {
    this.isLoading = true;

    this.api.getAll('clients', undefined, ['sales(*)', 'services(*)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers: any[]) => {
          this.customerReport = this.buildCustomerReport(customers);
          this.lastGenerated = new Date();
          this.isLoading = false;
          // this.toast.success('Relatório de clientes gerado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao gerar relatório de clientes:', error);
          this.isLoading = false;
          this.toast.error('Erro ao gerar relatório de clientes.');
        }
      });
  }

  private buildCustomerReport(customers: any[]): CustomerReport {
    const params = this.getReportParams();
    const period = params.period as 'daily' | 'weekly' | 'monthly' | 'yearly';
    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const now = new Date();

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;
    const newCustomers = customers.filter(c => new Date(c.created_at) >= startDate).length;

    const topCustomers = customers
      .map(c => {
        const paidSales = c.sales.filter((s: any) => s.paymentStatus === 'paid');
        const paidServices = c.services.filter((s: any) => s.paymentStatus === 'paid');
        const allPaid = [...paidSales, ...paidServices];

        const totalPurchases = allPaid.length;
        const totalRevenue = allPaid.reduce((sum: number, s: any) => sum + Number(s.total ?? s.basePrice ?? 0), 0);

        const lastPurchase = allPaid.length
          ? new Date(Math.max(...allPaid.map((s: any) => new Date(s.createdAt).getTime())))
          : null;

        return {
          customerId: c.id,
          customer: c,
          totalPurchases,
          totalRevenue,
          lastPurchase
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const delinquentCustomers: {
      customerId: number;
      customer: Customer;
      overdueAmount: number;
      overdueItems: { type: 'Venda' | 'Serviço'; amount: number; dueDate: Date; daysOverdue: number }[];
    }[] = customers
      .map(c => {
        const now = new Date();

        const overdueSales = c.sales
          .filter((s: any) => s.paymentStatus === 'pending' && s.dueDate && new Date(s.dueDate) < now)
          .map((s: { total: any; dueDate: string | number | Date; }) => ({
            type: 'Venda' as const,
            amount: Number(s.total),
            dueDate: new Date(s.dueDate),
            daysOverdue: Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          }));

        const overdueServices = c.services
          .filter((s: any) => s.paymentStatus === 'pending' && s.dueDate && new Date(s.dueDate) < now)
          .map((s: { basePrice: any; dueDate: string | number | Date; }) => ({
            type: 'Serviço' as const,
            amount: Number(s.basePrice),
            dueDate: new Date(s.dueDate),
            daysOverdue: Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          }));

        const overdueItems = [...overdueSales, ...overdueServices];
        if (overdueItems.length === 0) return null; // descarta clientes sem itens em atraso

        const overdueAmount = overdueItems.reduce((sum, i) => sum + i.amount, 0);

        return {
          customerId: c.id,
          customer: c,
          overdueAmount,
          overdueItems
        };
      })
      .filter(c => c !== null) as {
        customerId: number;
        customer: Customer;
        overdueAmount: number;
        overdueItems: { type: 'Venda' | 'Serviço'; amount: number; dueDate: Date; daysOverdue: number }[];
      }[];


    const customersByPeriod = this.groupCustomersByPeriod(customers, period);


    console.log(delinquentCustomers)
    return {
      period,
      startDate,
      endDate,
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      topCustomers,
      delinquentCustomers,
      customersByPeriod
    };
  }

  private groupCustomersByPeriod(customers: any[], period: string) {
    const groups: Record<string, { newCustomers: number; activeCustomers: number }> = {};

    customers.forEach(c => {
      const date = new Date(c.created_at);
      let key = '';

      switch (period) {
        case 'daily':
          key = date.toISOString().slice(0, 10);
          break;
        case 'weekly':
          const week = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }

      if (!groups[key]) {
        groups[key] = { newCustomers: 0, activeCustomers: 0 };
      }

      groups[key].newCustomers++;
      if (c.isActive) groups[key].activeCustomers++;
    });

    return Object.keys(groups).map(periodKey => ({
      period: periodKey,
      newCustomers: groups[periodKey].newCustomers,
      activeCustomers: groups[periodKey].activeCustomers
    }));
  }


  generateCustomerReport() {
    this.isLoading = true;
    const params = this.getReportParams();

    this.reportService.generateCustomerReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.customerReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório de clientes:', error);
          this.isLoading = false;
        }
      });
  }


  loadServices() {
    this.api.getAll('services', undefined, ['services_with_addons!left(serviceIdOddons(*))'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;

        this.serviceReport = this.generateServiceReport()
      });
  }


  loadSales() {
    this.api.getAll('sales', undefined, ['sale_items(*)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(sales => {
        this.sales = sales;
        this.loadProducts()

      });
  }


  loadProducts() {
    this.api.getAll('products', { isActive: 'eq.true' })
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
        this.productReport = this.generateProductReport()
        this.stockReport = this.generateStockReport()
      });
  }

  generateServiceReport(): ServiceReport {
    const params = this.getReportParams();
    const period = params.period as 'daily' | 'weekly' | 'monthly' | 'yearly';
    const startDate = params.startDate;
    const endDate = params.endDate;

    const filteredServices = this.services.filter(s => {
      const created = new Date(s.created_at);
      if (startDate && endDate) {
        return created >= startDate && created <= endDate;
      }
      return true;
    });


    console.log('Filtered Services:', filteredServices);
    // Total Services
    const totalServices = filteredServices.length;
    const totalRevenue = filteredServices
      .filter(s => s.paymentStatus === 'paid')
      .reduce((sum, s) => {
        const addonsRevenue = s.services_with_addons?.reduce(
          (a: any, b: { serviceIdOddons: { additionalPrice: any; }; }) => a + (b.serviceIdOddons?.additionalPrice || 0),
          0
        ) || 0;
        return sum + (s.basePrice || 0) + addonsRevenue;
      }, 0);


    console.log('Total Services:', totalServices);
    console.log('Total Revenue:', totalRevenue);
    const averageTicket = totalServices ? totalRevenue / totalServices : 0;

    // Top Services
    const topServicesMap = new Map<number, { service: any, quantity: number, revenue: number }>();
    filteredServices.forEach(s => {
      if (!topServicesMap.has(s.id)) {
        topServicesMap.set(s.id, { service: s, quantity: 1, revenue: s.basePrice });
      } else {
        const entry = topServicesMap.get(s.id)!;
        entry.quantity += 1;
        entry.revenue += s.basePrice;
      }
    });
    const topServices = Array.from(topServicesMap.values())
      .map((v, idx) => ({
        serviceId: v.service.id,
        service: v.service,
        quantity: v.quantity,
        revenue: v.revenue,
        averagePrice: v.revenue / v.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity);

    // Services by category
    const servicesByCategoryMap = new Map<string, { quantity: number, revenue: number }>();
    filteredServices.forEach(s => {
      if (!servicesByCategoryMap.has(s.category)) {
        servicesByCategoryMap.set(s.category, { quantity: 1, revenue: s.basePrice });
      } else {
        const entry = servicesByCategoryMap.get(s.category)!;
        entry.quantity += 1;
        entry.revenue += s.basePrice;
      }
    });
    const servicesByCategory = Array.from(servicesByCategoryMap.entries()).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      revenue: data.revenue
    }));

    // Services by period
    const servicesByPeriodMap = new Map<string, { quantity: number, revenue: number }>();
    filteredServices.forEach(s => {
      let key = '';
      const date = new Date(s.created_at);
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const oneJan = new Date(date.getFullYear(), 0, 1);
          const week = Math.ceil((((date.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
          key = `Week ${week} ${date.getFullYear()}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
      }

      if (!servicesByPeriodMap.has(key)) {
        servicesByPeriodMap.set(key, { quantity: 1, revenue: s.basePrice });
      } else {
        const entry = servicesByPeriodMap.get(key)!;
        entry.quantity += 1;
        entry.revenue += s.basePrice;
      }
    });
    const servicesByPeriod = Array.from(servicesByPeriodMap.entries()).map(([period, data]) => ({
      period,
      quantity: data.quantity,
      revenue: data.revenue
    }));

    console.log(totalServices)
    return {
      period,
      startDate,
      endDate,
      totalServices,
      totalRevenue,
      averageTicket,
      topServices,
      servicesByCategory,
      servicesByPeriod
    };
  }

  generateProductReport(): ProductReport {
    const params = this.getReportParams();
    const period = params.period;
    const startDate = params.startDate;
    const endDate = params.endDate;

    const filteredSales = this.sales.filter(s => {
      const created = new Date(s.createdAt);
      if (startDate && endDate) {
        return created >= startDate && created <= endDate;
      }
      return true;
    });


    console.log(filteredSales)
    let totalProducts = 0;
    let totalRevenue = 0;

    const topProductsMap = new Map<number, { product: any; quantity: number; revenue: number }>();
    const productsByCategoryMap = new Map<string, { quantity: number; revenue: number }>();
    const productsByPeriodMap = new Map<string, { quantity: number; revenue: number }>();

    filteredSales.forEach(sale => {
      sale.sale_items.forEach((item: any) => {
        const product = this.products.find(p => p.id == item.productId);
        if (!product) return;

        const quantity = item.quantity;
        const revenue = item.unitPrice * quantity;

        totalProducts += quantity;
        totalRevenue += revenue;

        // Top products
        if (!topProductsMap.has(product.id)) {
          topProductsMap.set(product.id, { product, quantity, revenue });
        } else {
          const entry = topProductsMap.get(product.id)!;
          entry.quantity += quantity;
          entry.revenue += revenue;
        }

        // Products by category
        const cat = product.category;
        if (!productsByCategoryMap.has(cat)) {
          productsByCategoryMap.set(cat, { quantity, revenue });
        } else {
          const entry = productsByCategoryMap.get(cat)!;
          entry.quantity += quantity;
          entry.revenue += revenue;
        }

        // Products by period
        const date = new Date(sale.createdAt);
        let key = '';
        switch (period) {
          case 'daily':
            key = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const oneJan = new Date(date.getFullYear(), 0, 1);
            const week = Math.ceil((((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7));
            key = `Week ${week} ${date.getFullYear()}`;
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            break;
          case 'yearly':
            key = `${date.getFullYear()}`;
            break;
        }

        if (!productsByPeriodMap.has(key)) {
          productsByPeriodMap.set(key, { quantity, revenue });
        } else {
          const entry = productsByPeriodMap.get(key)!;
          entry.quantity += quantity;
          entry.revenue += revenue;
        }
      });
    });

    const averagePrice = totalProducts ? totalRevenue / totalProducts : 0;

    const topProducts = Array.from(topProductsMap.entries())
      .map(([productId, data]) => ({
        productId,
        product: data.product,
        quantity: data.quantity,
        revenue: data.revenue,
        averagePrice: data.revenue / data.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const productsByCategory = Array.from(productsByCategoryMap.entries())
      .map(([category, data]) => ({ category, quantity: data.quantity, revenue: data.revenue }));

    const productsByPeriod = Array.from(productsByPeriodMap.entries())
      .map(([periodKey, data]) => ({ period: periodKey, quantity: data.quantity, revenue: data.revenue }));

    return {
      period,
      startDate,
      endDate,
      totalProducts,
      totalRevenue,
      averagePrice,
      topProducts,
      productsByCategory,
      productsByPeriod
    };
  }


  generateStockReport(): StockReportData {
    const currentStock: StockReportData['currentStock'] = [];
    const outOfStock: StockReportData['outOfStock'] = [];
    const lowStock: StockReportData['lowStock'] = [];
    const stockMovements: StockReportData['stockMovements'] = [];
    let totalValue = 0;

    this.products.forEach(product => {
      const { currentStock: qty, minStock, salePrice } = product;

      totalValue += qty * salePrice;

      let status: 'normal' | 'low' | 'out_of_stock' | 'overstock' = 'normal';
      if (qty === 0) status = 'out_of_stock';
      else if (qty <= minStock) status = 'low';
      else if (qty > minStock * 5) status = 'overstock';

      currentStock.push({
        productId: product.id,
        product,
        currentStock: qty,
        minStock,
        maxStock: minStock * 5,
        status
      });

      if (status === 'out_of_stock') {
        const lastStockDate = new Date(product.updated_at);
        const daysOutOfStock = Math.floor((new Date().getTime() - lastStockDate.getTime()) / (1000 * 60 * 60 * 24));
        outOfStock.push({
          productId: product.id,
          product,
          lastStockDate,
          daysOutOfStock
        });
      }

      if (status === 'low') {
        const daysToOutOfStock = Math.ceil(qty / (minStock / 7)); // exemplo aproximado
        lowStock.push({
          productId: product.id,
          product,
          currentStock: qty,
          minStock,
          daysToOutOfStock,
          status: 'low'
        });
      }
    });

    const totalProducts = this.products.length;
    const normalStock = currentStock.filter(c => c.status === 'normal').length;
    const lowStockCount = lowStock.length;
    const outOfStockCount = outOfStock.length;
    const overstock = currentStock.filter(c => c.status === 'overstock').length;

    return {
      currentStock,
      outOfStock,
      lowStock,
      stockMovements,
      stockSummary: {
        totalProducts,
        normalStock,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        overstock,
        totalValue
      }
    };
  }

  loadFinancialReport() {
    this.isLoading = true;

    forkJoin({
      payables: this.api.getAll('accounts_payable'),
      receivables: this.api.getAll('accounts_receivable'),
      movements: this.api.getAll('cash_movements')
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ payables, receivables, movements }) => {
          console.log('populando campos de financial')
          this.populateFinancialReport(payables, receivables, movements);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }


  populateFinancialReport(payables: any[], receivables: any[], movements: any[]) {
    const today = new Date();

    const totalPayable = payables.reduce((acc, item) => acc + item.amount, 0);
    const totalPayablePaid = payables.filter(p => p.status === 'paid').reduce((acc, item) => acc + item.amount, 0);
    const totalPayablePending = payables.filter(p => p.status === 'pending').reduce((acc, item) => acc + item.amount, 0);
    const totalPayableOverdue = payables.filter(p => p.status === 'pending' && new Date(p.dueDate) < today).reduce((acc, item) => acc + item.amount, 0);
    const overduePayableCount = payables.filter(p => p.status === 'pending' && new Date(p.dueDate) < today).length;

    const totalReceivable = receivables.reduce((acc, item) => acc + item.amount, 0);
    const totalReceivablePaid = receivables.filter(r => r.status === 'paid').reduce((acc, item) => acc + item.amount, 0);
    const totalReceivablePending = receivables.filter(r => r.status === 'pending').reduce((acc, item) => acc + item.amount, 0);
    const totalReceivableOverdue = receivables.filter(r => r.status === 'pending' && new Date(r.dueDate) < today).reduce((acc, item) => acc + item.amount, 0);
    const overdueReceivableCount = receivables.filter(r => r.status === 'pending' && new Date(r.dueDate) < today).length;

    const totalIncome = movements.filter(m => m.type === 'income').reduce((acc, item) => acc + item.amount, 0);
    const totalExpense = movements.filter(m => m.type === 'expense').reduce((acc, item) => acc + item.amount, 0);
    const openingBalance = 0;
    const closingBalance = openingBalance + totalIncome - totalExpense;
    const netCashFlow = totalIncome - totalExpense;

    const dailyCashFlow = movements.reduce((acc: any[], mov) => {
      const date = new Date(mov.date).toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);

      if (existing) {
        if (mov.type === 'income') {
          existing.income += mov.amount;
        } else {
          existing.expense += mov.amount;
        }
        existing.balance = existing.income - existing.expense;
      } else {
        acc.push({
          date,
          income: mov.type === 'income' ? mov.amount : 0,
          expense: mov.type === 'expense' ? mov.amount : 0,
          balance: mov.type === 'income' ? mov.amount : -mov.amount
        });
      }
      return acc;
    }, []);

    this.financialReport = {
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(),
      cashFlow: {
        openingBalance,
        totalIncome,
        totalExpense,
        closingBalance,
        netCashFlow
      },
      accountsPayable: {
        total: totalPayable,
        paid: totalPayablePaid,
        pending: totalPayablePending,
        overdue: overduePayableCount,
        overdueAmount: totalPayableOverdue
      },
      accountsReceivable: {
        total: totalReceivable,
        received: totalReceivablePaid,
        pending: totalReceivablePending,
        overdue: overdueReceivableCount,
        overdueAmount: totalReceivableOverdue
      },
      incomeByCategory: movements
        .filter(m => m.type === 'income')
        .reduce((acc: any, mov) => {
          acc[mov.category] = (acc[mov.category] || 0) + mov.amount;
          return acc;
        }, {}),
      expenseByCategory: movements
        .filter(m => m.type === 'expense')
        .reduce((acc: any, mov) => {
          acc[mov.category] = (acc[mov.category] || 0) + mov.amount;
          return acc;
        }, {}),
      dailyCashFlow
    } as FinancialReportData;
  }


  // Exportação
  exportReport() {
    if (this.exportForm.valid) {
      const config: ReportConfig = this.exportForm.value;
      let reportData: any = null;
      let reportName = '';

      switch (this.activeTab) {
        case 'general':
          reportData = this.generalReport;
          reportName = 'Relatório Geral';
          break;
        case 'customers':
          reportData = this.customerReport;
          reportName = 'Relatório de Clientes';
          break;
        case 'services':
          reportData = this.serviceReport;
          reportName = 'Relatório de Serviços';
          break;
        case 'products':
          reportData = this.productReport;
          reportName = 'Relatório de Produtos';
          break;
        case 'stock':
          reportData = this.stockReport;
          reportName = 'Relatório de Estoque';
          break;
        case 'financial':
          reportData = this.financialReport;
          reportName = 'Relatório Financeiro';
          break;
      }

      if (reportData) {
        this.reportService.exportReport(reportData, config.format, config)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (filename) => {
              console.log(`Relatório exportado: ${filename}`);
              // Aqui você implementaria o download real do arquivo
              // this.toast.success(`Relatório exportado com sucesso: ${filename}`);
            },
            error: (error) => {
              console.error('Erro ao exportar relatório:', error);
              this.toast.error('Erro ao exportar relatório');
            }
          });
      }
    }
  }

  // Métodos auxiliares
  private getReportParams(): ReportSearchParams {
    const formValue = this.reportForm.value;
    return {
      period: formValue.period,
      startDate: formValue.startDate ? new Date(formValue.startDate) : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate) : undefined
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'normal': return 'success';
      case 'low': return 'warning';
      case 'out_of_stock': return 'danger';
      case 'overstock': return 'info';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'normal': return 'Normal';
      case 'low': return 'Baixo';
      case 'out_of_stock': return 'Sem Estoque';
      case 'overstock': return 'Excesso';
      default: return status;
    }
  }

  onPeriodChange() {
    this.generateReport();
  }

  onDateChange() {
    this.generateReport();
  }
}
