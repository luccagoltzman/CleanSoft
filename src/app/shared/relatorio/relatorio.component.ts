import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ApiService } from '../../services/api.service';
import { SkeletonComponent, StatsSkeletonComponent, TableSkeletonComponent } from '../components';
import { timer } from 'rxjs';

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, TableSkeletonComponent],
  templateUrl: './relatorio.component.html',
  styleUrls: ['./relatorio.component.css']
})
export class RelatorioComponent {
  showModal = false;
  reportType: string = '';
  data: any[] = [];          // todas as vendas
  filteredData: any[] = [];  // vendas filtradas
  filter: any = {};
  isLoading = false;

  customerSearch: string = '';
  customerSuggestions: any[] = [];
  
  // Estatísticas do relatório
  reportStats = {
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topCustomer: '',
    topCustomerRevenue: 0
  };

  // Novos filtros para relatório de vendas
  dateRangeFilter = {
    startDate: '',
    endDate: ''
  };
  
  paymentMethodFilter = '';
  minValueFilter = '';
  maxValueFilter = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  openModal(type: string) {
    this.reportType = type;
    this.showModal = true;
    this.loadSales();
  }

  loadSales() {
    this.isLoading = true;
    this.api.getAll('sales_with_customer').subscribe({
      next: (sales: any[]) => {
        this.data = sales;
        this.initFilter();
        this.applyFilter();
        // Adiciona delay mínimo de 1.5 segundos para mostrar o skeleton
        timer(1500).subscribe(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Erro ao carregar vendas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initFilter() {
    this.filter = {
      customerId: null,
      paymentStatus: '',
      customerNames: [] // array para autocomplete
    };
    this.customerSearch = '';
    this.customerSuggestions = [];
  }

  applyFilter() {
    let filtered = [...this.data];
    
    // Filtro por cliente
    if (this.filter.customerId) {
      filtered = filtered.filter(s => s.customer_id === this.filter.customerId);
    }
    
    // Filtro por status
    if (this.filter.paymentStatus) {
      filtered = filtered.filter(s => s.paymentStatus === this.filter.paymentStatus);
    }
    
    // Filtro por nomes de clientes
    if (this.filter.customerNames.length > 0) {
      filtered = filtered.filter(s => this.filter.customerNames.includes(s.customer_name));
    }
    
    // Filtro por data
    if (this.dateRangeFilter.startDate) {
      const startDate = new Date(this.dateRangeFilter.startDate);
      filtered = filtered.filter(s => new Date(s.createdAt) >= startDate);
    }
    
    if (this.dateRangeFilter.endDate) {
      const endDate = new Date(this.dateRangeFilter.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(s => new Date(s.createdAt) <= endDate);
    }
    
    // Filtro por método de pagamento
    if (this.paymentMethodFilter) {
      filtered = filtered.filter(s => s.paymentMethod === this.paymentMethodFilter);
    }
    
    // Filtro por valor mínimo
    if (this.minValueFilter) {
      filtered = filtered.filter(s => s.total >= parseFloat(this.minValueFilter));
    }
    
    // Filtro por valor máximo
    if (this.maxValueFilter) {
      filtered = filtered.filter(s => s.total <= parseFloat(this.maxValueFilter));
    }

    this.filteredData = filtered;
    this.calculateReportStats();
  }

  updateCustomerSuggestions() {
    const search = this.customerSearch.toLowerCase();
    this.customerSuggestions = Array.from(
      new Set(
        this.data
          .map(s => s.customer_name)
          .filter(name => name.toLowerCase().includes(search))
      )
    );
  }

  selectCustomer(name: string) {
    if (!this.filter.customerNames.includes(name)) {
      this.filter.customerNames.push(name);
    }
    this.customerSearch = '';
    this.customerSuggestions = [];
    this.applyFilter();
  }

  removeCustomer(name: string) {
    this.filter.customerNames = this.filter.customerNames.filter((n: string) => n !== name);
    this.applyFilter();
  }

  exportCSV() {
    const exportData = this.filteredData.map(s => ({
      Cliente: s.customer_name,
      Telefone: s.phone,
      Total: s.total,
      'Data da Venda': new Date(s.createdAt).toLocaleDateString(),
      Status: s.paymentStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, 'relatorio.csv');
  }

  exportPDF() {
    const doc = new jsPDF();
    
    // Configurações de cores e estilos usando a paleta CleanSoft
    const primaryColor = [33, 150, 243]; // var(--primary-500) #2196f3
    const primaryDarkColor = [25, 118, 210]; // var(--primary-700) #1976d2
    const secondaryColor = [118, 75, 162]; // var(--primary-600) #1e88e5
    const successColor = [76, 175, 80]; // var(--success-500) #4caf50
    const warningColor = [255, 152, 0]; // var(--warning-500) #ff9800
    const errorColor = [244, 67, 54]; // var(--error-500) #f44336
    const textColor = [97, 97, 97]; // var(--neutral-600) #616161
    const lightBgColor = [250, 250, 250]; // var(--neutral-50) #fafafa
    const borderColor = [224, 224, 224]; // var(--neutral-300) #e0e0e0
    
    // Cabeçalho do relatório
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Vendas', 105, 25, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 35, { align: 'center' });
    
    // Estatísticas do relatório
    let yPosition = 60;
    
    // Box de estatísticas
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.rect(10, yPosition - 10, 190, 35, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, yPosition - 10, 190, 35, 'S');
    
    // Estatísticas em grid
    const stats = [
      { label: 'Total de Vendas', value: this.reportStats.totalSales.toString() },
      { label: 'Receita Total', value: `R$ ${this.reportStats.totalRevenue.toFixed(2)}` },
      { label: 'Ticket Médio', value: `R$ ${this.reportStats.averageTicket.toFixed(2)}` }
    ];
    
    stats.forEach((stat, index) => {
      const x = 15 + (index * 63);
      
      // Valor
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, x, yPosition);
      
      // Label
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, x, yPosition + 8);
    });
    
    yPosition += 50;
    
    // Informações do cliente top
    if (this.reportStats.topCustomer) {
      doc.setFillColor(232, 244, 253); // var(--primary-50) #e3f2fd
      doc.rect(10, yPosition - 10, 190, 25, 'F');
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, yPosition - 10, 190, 25, 'S');
      
      doc.setTextColor(primaryDarkColor[0], primaryDarkColor[1], primaryDarkColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente com Maior Receita', 15, yPosition);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${this.reportStats.topCustomer} - R$ ${this.reportStats.topCustomerRevenue.toFixed(2)}`, 15, yPosition + 12);
      
      yPosition += 40;
    }
    
    // Filtros aplicados
    const activeFilters = [];
    if (this.dateRangeFilter.startDate) activeFilters.push(`Data início: ${this.dateRangeFilter.startDate}`);
    if (this.dateRangeFilter.endDate) activeFilters.push(`Data fim: ${this.dateRangeFilter.endDate}`);
    if (this.paymentMethodFilter) activeFilters.push(`Método: ${this.getPaymentMethodText(this.paymentMethodFilter)}`);
    if (this.minValueFilter) activeFilters.push(`Valor mínimo: R$ ${this.minValueFilter}`);
    if (this.maxValueFilter) activeFilters.push(`Valor máximo: R$ ${this.maxValueFilter}`);
    
    if (activeFilters.length > 0) {
      doc.setFillColor(255, 248, 225); // var(--warning-50) #fff8e1
      doc.rect(10, yPosition - 10, 190, 20, 'F');
      doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.rect(10, yPosition - 10, 190, 20, 'S');
      
      doc.setTextColor(133, 100, 4); // var(--warning-700) #f57c00
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros Aplicados:', 15, yPosition);
      
      doc.setTextColor(133, 100, 4);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(activeFilters.join(' | '), 15, yPosition + 8);
      
      yPosition += 35;
    }
    
    // Tabela de vendas
    if (this.filteredData.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, yPosition - 5, 190, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente', 15, yPosition);
      doc.text('Telefone', 60, yPosition);
      doc.text('Total', 100, yPosition);
      doc.text('Data', 130, yPosition);
      doc.text('Status', 160, yPosition);
      doc.text('Método', 180, yPosition);
      
      yPosition += 15;
      
      // Dados da tabela
      this.filteredData.forEach((sale, index) => {
        const rowY = yPosition + (index * 8);
        
        // Linha zebrada
        if (index % 2 === 0) {
          doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
          doc.rect(10, rowY - 3, 190, 8, 'F');
        }
        
        // Dados
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        doc.text(sale.customer_name || 'N/A', 15, rowY);
        doc.text(sale.phone || 'N/A', 60, rowY);
        doc.text(`R$ ${(sale.total || 0).toFixed(2)}`, 100, rowY);
        doc.text(new Date(sale.createdAt).toLocaleDateString('pt-BR'), 130, rowY);
        
        // Status com cor
        const status = this.getPaymentStatusText(sale.paymentStatus);
        if (sale.paymentStatus === 'paid') {
          doc.setTextColor(successColor[0], successColor[1], successColor[2]);
        } else if (sale.paymentStatus === 'pending') {
          doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
        } else if (sale.paymentStatus === 'cancelled') {
          doc.setTextColor(errorColor[0], errorColor[1], errorColor[2]);
        }
        doc.text(status, 160, rowY);
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(this.getPaymentMethodText(sale.paymentMethod), 180, rowY);
      });
      
      yPosition += (this.filteredData.length * 8) + 20;
    }
    
    // Rodapé
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.rect(0, yPosition, 210, 20, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(0, yPosition, 210, 20, 'S');
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de registros: ${this.filteredData.length}`, 15, yPosition + 12);
    doc.text('CleanSoft - Sistema de Gestão', 105, yPosition + 12, { align: 'center' });
    
    // Salvar o PDF
    doc.save(`relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  closeModal() {
    this.showModal = false;
  }

  onFilterChange() {
    this.applyFilter();
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'bank_transfer': return 'Transferência';
      case 'check': return 'Cheque';
      case 'installment': return 'Parcelado';
      default: return method;
    }
  }

  calculateReportStats() {
    if (this.filteredData.length === 0) {
      this.reportStats = {
        totalSales: 0,
        totalRevenue: 0,
        averageTicket: 0,
        topCustomer: '',
        topCustomerRevenue: 0
      };
      return;
    }

    const totalSales = this.filteredData.length;
    const totalRevenue = this.filteredData.reduce((sum, s) => sum + (s.total || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Encontrar cliente com maior receita
    const customerRevenue: { [key: string]: number } = {};
    this.filteredData.forEach(sale => {
      const customerName = sale.customer_name;
      customerRevenue[customerName] = (customerRevenue[customerName] || 0) + (sale.total || 0);
    });

    let topCustomer = '';
    let topCustomerRevenue = 0;
    Object.entries(customerRevenue).forEach(([name, revenue]) => {
      if (revenue > topCustomerRevenue) {
        topCustomer = name;
        topCustomerRevenue = revenue;
      }
    });

    this.reportStats = {
      totalSales,
      totalRevenue,
      averageTicket,
      topCustomer,
      topCustomerRevenue
    };
  }
}
