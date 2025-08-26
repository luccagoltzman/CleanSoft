import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import {
  CustomerReport,
  ServiceReport,
  ProductReport,
  StockReportData,
  FinancialReportData,
  GeneralReport,
  ReportSearchParams,
  ExportFormat,
  ReportConfig
} from '../../models';
import { Subject, takeUntil } from 'rxjs';
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
  activeTab: 'general' | 'customers' | 'services' | 'products' | 'stock' | 'financial' = 'general';


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
    private api: ApiService
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
    this.generateGeneralReport();
    this.loadServices()
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
      this.generateGeneralReport();
    } else if (this.activeTab === 'customers') {
      this.generateCustomerReport();
    } else if (this.activeTab === 'services') {
      this.loadServices();
    } else if (this.activeTab === 'products') {
      this.loadSales();
    } else if (this.activeTab === 'stock') {
      this.generateStockReport();
    } else if (this.activeTab === 'financial') {
      this.generateFinancialReport();
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
        },
        error: (error) => {
          console.error('Erro ao gerar relatório geral:', error);
          this.isLoading = false;
        }
      });
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
    this.api.getAll('services', { isActive: 'eq.true' }, ['services_with_addons!left(serviceIdOddons(*))'])
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
    const totalRevenue = filteredServices.reduce((sum, s) => sum + s.basePrice, 0);
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


  generateFinancialReport() {
    this.isLoading = true;
    const params = this.getReportParams();

    this.reportService.generateFinancialReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.financialReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório financeiro:', error);
          this.isLoading = false;
        }
      });
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
              alert(`Relatório exportado com sucesso: ${filename}`);
            },
            error: (error) => {
              console.error('Erro ao exportar relatório:', error);
              alert('Erro ao exportar relatório');
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
