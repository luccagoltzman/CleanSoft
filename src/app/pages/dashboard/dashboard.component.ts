import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart', { static: false }) salesChartRef!: ElementRef;
  @ViewChild('servicesChart', { static: false }) servicesChartRef!: ElementRef;

  stats = {
    totalCustomers: 0,
    totalVehicles: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingServices: 0,
    lowStockProducts: 0
  };

  recentSales: any[] = [];
  lowStockProducts: any[] = [];
  birthdayCustomers: any[] = [];
  todayAppointments: number = 0;
  productsToRestock: number = 0;
  monthlyGoal: number = 20000;
  monthlyGoalPercentage: number = 0;

  private salesChart: Chart | null = null;
  private servicesChart: Chart | null = null;

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  loadDashboardData() {
    // Dados mockados para demonstração
    this.stats = {
      totalCustomers: 156,
      totalVehicles: 203,
      totalSales: 89,
      totalRevenue: 15420.50,
      pendingServices: 12,
      lowStockProducts: 8
    };

    this.recentSales = [
      {
        id: 1,
        customer: 'João Silva',
        vehicle: 'ABC-1234',
        total: 180.00,
        date: new Date(),
        status: 'Pago'
      },
      {
        id: 2,
        customer: 'Maria Santos',
        vehicle: 'XYZ-5678',
        total: 250.00,
        date: new Date(Date.now() - 86400000),
        status: 'Pago'
      },
      {
        id: 3,
        customer: 'Pedro Costa',
        vehicle: 'DEF-9012',
        total: 320.00,
        date: new Date(Date.now() - 172800000),
        status: 'Pago'
      }
    ];

    this.lowStockProducts = [
      {
        name: 'Shampoo Automotivo',
        currentStock: 5,
        minimumStock: 10
      },
      {
        name: 'Cera de Polimento',
        currentStock: 3,
        minimumStock: 8
      },
      {
        name: 'Desengraxante',
        currentStock: 2,
        minimumStock: 15
      }
    ];

    this.birthdayCustomers = [
      {
        name: 'João Silva',
        date: '15/12',
        age: 28
      },
      {
        name: 'Maria Santos',
        date: '18/12',
        age: 35
      },
      {
        name: 'Pedro Costa',
        date: '22/12',
        age: 42
      }
    ];

    // Novas métricas
    this.todayAppointments = 8;
    this.productsToRestock = this.stats.lowStockProducts;
    this.monthlyGoalPercentage = Math.round((this.stats.totalRevenue / this.monthlyGoal) * 100);

    // Atualizar gráficos se já estiverem inicializados
    if (this.salesChart) {
      this.updateSalesChart();
    }
    if (this.servicesChart) {
      this.updateServicesChart();
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStockLevel(current: number, minimum: number): string {
    const ratio = current / minimum;
    if (ratio <= 0.3) return 'critical';
    if (ratio <= 0.6) return 'low';
    return 'normal';
  }

  private initializeCharts() {
    this.initializeSalesChart();
    this.initializeServicesChart();
  }

  private initializeSalesChart() {
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Vendas (R$)',
          data: [1200, 1900, 1500, 2100, 1800, 2400, 2800],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    };

    this.salesChart = new Chart(ctx, config);
  }

  private initializeServicesChart() {
    const ctx = this.servicesChartRef.nativeElement.getContext('2d');
    
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Lavagem', 'Polimento', 'Higienização', 'Cristalização'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: [
            '#1976d2',
            '#2196f3',
            '#4caf50',
            '#ff9800'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        cutout: '70%'
      }
    };

    this.servicesChart = new Chart(ctx, config);
  }

  private updateSalesChart() {
    if (this.salesChart) {
      // Simular dados atualizados
      const newData = [
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000,
        Math.floor(Math.random() * 2000) + 1000
      ];
      
      this.salesChart.data.datasets[0].data = newData;
      this.salesChart.update();
    }
  }

  private updateServicesChart() {
    if (this.servicesChart) {
      // Simular dados atualizados
      const newData = [
        Math.floor(Math.random() * 50) + 30,
        Math.floor(Math.random() * 30) + 15,
        Math.floor(Math.random() * 25) + 10,
        Math.floor(Math.random() * 15) + 5
      ];
      
      this.servicesChart.data.datasets[0].data = newData;
      this.servicesChart.update();
    }
  }
}
