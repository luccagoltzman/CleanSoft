import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, Subject, takeUntil, timer } from 'rxjs';
import { Customer, Sale, Service, Product, Vehicle, ServiceCategory } from '../../models';
import { ApiService } from '../../services/api.service';
import { StatsSkeletonComponent } from '../../shared/components';
import { Chart, registerables } from 'chart.js';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatsSkeletonComponent, FullCalendarModule],
  providers: [ApiService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  host: {
    'class': 'dashboard-container'
  }
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('salesChart') salesChartCanvas!: ElementRef;
  @ViewChild('servicesChart') servicesChartCanvas!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private customers: Customer[] = [];
  private salesChart: Chart<'line', number[], string> | undefined;
  private servicesChart: Chart<'doughnut', number[], string> | undefined;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: ptBrLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this)
  };

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
  isLoading = false;

  private isBrowser: boolean;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Aguarda o carregamento dos dados antes de inicializar os gráficos
      timer(100).pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (!this.salesChart) {
          this.initializeSalesChart();
        }
        if (!this.servicesChart) {
          this.initializeServicesChart();
        }
      });
    }
  }


  private initializeSalesChart() {
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const ctx = this.salesChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
          label: 'Vendas Mensais (R$)',
          data: new Array(12).fill(0),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Vendas por Mês',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          }
        }
      }
    });
  }

  private initializeServicesChart() {
    if (this.servicesChart) {
      this.servicesChart.destroy();
    }

    const ctx = this.servicesChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.servicesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [ServiceCategory.SIMPLE, ServiceCategory.DETAILED, ServiceCategory.TECHNICAL],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            '#4caf50',
            '#2196f3',
            '#ff9800'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Serviços por Categoria',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading = true;
    forkJoin({
      customers: this.api.getAll('clients', undefined, ['vehicles(*)']),
      sales: this.api.getAll('sales', undefined, ['sale_items(*)']),
      services: this.api.getAll('services'),
      products: this.api.getAll('products')
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: { 
        customers: Customer[],
        sales: Sale[],
        services: Service[],
        products: Product[]
      }) => {
        this.customers = data.customers;


        this.updateStats(data);
        this.updateRecentSales(data.sales);
        this.updateLowStockProducts(data.products);

        // Atualiza os gráficos e o calendário após o carregamento dos dados
        if (this.isBrowser) {
          this.updateSalesChart(data.sales);
          this.updateServicesChart(data.services);
        }
        this.updateCalendarEvents(data.services);
        
        // Adiciona delay mínimo de 1.5 segundos para mostrar o skeleton
        timer(1500).subscribe(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        // Aqui você pode adicionar uma notificação de erro para o usuário
      }
    });
  }

  private updateStats(data: { 
    customers: Customer[],
    sales: Sale[],
    services: Service[],
    products: Product[]
  }) {
    // Pega o ano da primeira venda (ou ano atual se não houver vendas)
    const saleYear = data.sales.length > 0 
      ? new Date(data.sales[0].createdAt).getFullYear()
      : new Date().getFullYear();
    
    // Usa o mesmo ano das vendas para comparação
    const currentDate = new Date();
    currentDate.setFullYear(saleYear);
    const firstDayOfMonth = new Date(saleYear, currentDate.getMonth(), 1);

    
    const monthSales = data.sales.filter((sale: Sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= firstDayOfMonth;
    });
    const totalRevenue = monthSales.reduce((acc: number, sale: Sale) => acc + sale.total, 0);
    const totalVehicles = data.customers.reduce((acc: number, customer: Customer) => acc + (customer.vehicles?.length || 0), 0);
    const pendingServices = data.services.filter((service: Service) => !service.isActive).length;
    const lowStockCount = data.products.filter((product: Product) => product.currentStock < product.minStock).length;

    this.stats = {
      totalCustomers: data.customers.length,
      totalVehicles: totalVehicles,
      totalSales: monthSales.length,
      totalRevenue: totalRevenue,
      pendingServices: pendingServices,
      lowStockProducts: lowStockCount
    };
  }

  private updateRecentSales(sales: Sale[]) {
    this.recentSales = sales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(sale => {
        const customer = this.customers.find((c: Customer) => c.id === sale.customerId);
        const vehicle = customer?.vehicles?.find((v: Vehicle) => v.id === sale.vehicleId);
        return {
          id: sale.id,
          customer: customer?.name || 'Cliente não informado',
          vehicle: vehicle?.licensePlate || 'Veículo não informado',
          total: sale.total,
          date: new Date(sale.date),
          status: sale.paymentStatus
        };
      });
  }

  private updateLowStockProducts(products: Product[]) {
    this.lowStockProducts = products
      .filter(product => product.currentStock < product.minStock)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        currentStock: product.currentStock,
        minimumStock: product.minStock
      }));
  }

  private updateSalesChart(sales: Sale[]) {
    if (!this.isBrowser) return;

    if (!this.salesChart) {
      this.initializeSalesChart();
    }


    // Se não há vendas, cria dados de exemplo para teste
    if (!sales || sales.length === 0) {
      const exampleData = [100, 150, 200, 120, 180, 90, 250, 300, 220, 160, 190, 280];
      if (this.salesChart) {
        this.salesChart.data.datasets[0].data = exampleData;
        this.salesChart.update();
      }
      return;
    }

    // Usa a mesma lógica de filtragem que já existe no updateStats
    const currentYear = new Date().getFullYear();

    // Agrupa vendas por mês
    const salesByMonth = new Array(12).fill(0);
    sales.forEach(sale => {
      // Tenta usar diferentes propriedades de data
      const saleDate = new Date(sale.date || sale.createdAt);
      if (!isNaN(saleDate.getTime()) && saleDate.getFullYear() === currentYear) {
        salesByMonth[saleDate.getMonth()] += sale.total || 0;
      }
    });


    if (this.salesChart) {
      this.salesChart.data.datasets[0].data = salesByMonth;
      this.salesChart.update(); // Permite animação para visualizar a mudança
    }
  }

  private updateServicesChart(services: Service[]) {
    if (!this.isBrowser) return;

    if (!this.servicesChart) {
      this.initializeServicesChart();
    }


    // Se não há serviços, cria dados de exemplo para teste
    if (!services || services.length === 0) {
      const exampleData = [5, 8, 3];
      if (this.servicesChart) {
        this.servicesChart.data.datasets[0].data = exampleData;
        this.servicesChart.update();
      }
      return;
    }

    // Conta todos os serviços por categoria (não apenas ativos)
    const categoryCounts = {
      [ServiceCategory.SIMPLE]: 0,
      [ServiceCategory.DETAILED]: 0,
      [ServiceCategory.TECHNICAL]: 0
    };

    services.forEach(service => {
      if (service.category in categoryCounts) {
        categoryCounts[service.category]++;
      } else {
        // Se a categoria não existe, adiciona ao contador de SIMPLE como fallback
        categoryCounts[ServiceCategory.SIMPLE]++;
      }
    });


    const dataArray = [
      categoryCounts[ServiceCategory.SIMPLE],
      categoryCounts[ServiceCategory.DETAILED],
      categoryCounts[ServiceCategory.TECHNICAL]
    ];


    if (this.servicesChart) {
      this.servicesChart.data.datasets[0].data = dataArray;
      this.servicesChart.update(); // Permite animação para visualizar a mudança
    }
  }

  private handleEventClick(info: any) {
    // Aqui você pode implementar a lógica para exibir detalhes do evento
  }

  private handleDateClick(info: any) {
    // Aqui você pode implementar a lógica para adicionar um novo evento
  }

  private updateCalendarEvents(services: Service[]) {
    // Usa a mesma lógica de filtragem que já existe no updateStats
    const pendingServices = services.filter(service => !service.isActive);
    
    const events = pendingServices.map(service => ({
      id: service.id.toString(),
      title: `${service.name} - ${service.category}`,
      start: service.dueDate || service.createdAt, // Usa createdAt como fallback
      end: service.dueDate || service.createdAt,
      backgroundColor: '#f44336', // Vermelho para serviços pendentes
      borderColor: '#f44336',
      allDay: true // Eventos de dia inteiro para melhor visualização
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    };
  }




}
