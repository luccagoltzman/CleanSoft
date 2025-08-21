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
    private fb: FormBuilder
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
      this.generateServiceReport();
    } else if (this.activeTab === 'products') {
      this.generateProductReport();
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

  generateServiceReport() {
    this.isLoading = true;
    const params = this.getReportParams();
    
    this.reportService.generateServiceReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.serviceReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório de serviços:', error);
          this.isLoading = false;
        }
      });
  }

  generateProductReport() {
    this.isLoading = true;
    const params = this.getReportParams();
    
    this.reportService.generateProductReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.productReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório de produtos:', error);
          this.isLoading = false;
        }
      });
  }

  generateStockReport() {
    this.isLoading = true;
    
    this.reportService.generateStockReport()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.stockReport = report;
          this.lastGenerated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao gerar relatório de estoque:', error);
          this.isLoading = false;
        }
      });
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
