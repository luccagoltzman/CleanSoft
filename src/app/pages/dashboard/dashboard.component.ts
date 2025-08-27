import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { Customer, Sale, Service, Product, Vehicle } from '../../models';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [ApiService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private customers: Customer[] = [];
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

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
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
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
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
}
