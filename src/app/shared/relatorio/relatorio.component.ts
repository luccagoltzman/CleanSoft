import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio.component.html',
  styleUrls: ['./relatorio.component.scss']
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

  constructor(private api: ApiService) {}

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
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar vendas:', err);
        this.isLoading = false;
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
    this.filteredData = this.data.filter(s =>
      (!this.filter.customerId || s.customer_id === this.filter.customerId) &&
      (!this.filter.paymentStatus || s.paymentStatus === this.filter.paymentStatus) &&
      (this.filter.customerNames.length === 0 || this.filter.customerNames.includes(s.customer_name))
    );
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
    const rows = this.filteredData.map(s => [
      s.customer_name,
      s.phone,
      s.total,
      new Date(s.createdAt).toLocaleDateString(),
      s.paymentStatus
    ]);

    doc.text('Relatório de Vendas por Cliente', 14, 16);
    autoTable(doc, {
      head: [['Cliente', 'Telefone', 'Total', 'Data da Venda', 'Status']],
      body: rows,
      startY: 20
    });
    doc.save('relatorio.pdf');
  }

  closeModal() {
    this.showModal = false;
  }
}
