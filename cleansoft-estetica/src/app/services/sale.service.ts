import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Sale, SaleItem, PaymentMethod, PaymentStatus, SaleSearchParams, SaleReport, Customer, Vehicle, Product, Service } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private sales: Sale[] = [
    {
      id: 1,
      customerId: 1,
      vehicleId: 1,
      items: [
        {
          id: 1,
          saleId: 1,
          type: 'product',
          productId: 1,
          serviceId: undefined,
          quantity: 2,
          unitPrice: 25.00,
          totalPrice: 50.00,
          discount: 0,
          notes: 'Shampoo automotivo'
        }
      ],
      subtotal: 50.00,
      discount: 0,
      total: 50.00,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      notes: 'Lavagem completa',
      date: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 1
    },
    {
      id: 2,
      customerId: 2,
      vehicleId: 2,
      items: [
        {
          id: 2,
          saleId: 2,
          type: 'service',
          productId: undefined,
          serviceId: 1,
          quantity: 1,
          unitPrice: 80.00,
          totalPrice: 80.00,
          discount: 10.00,
          notes: 'Lavagem detalhada'
        }
      ],
      subtotal: 80.00,
      discount: 10.00,
      total: 70.00,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentStatus: PaymentStatus.PAID,
      notes: 'Desconto de cliente fiel',
      date: new Date('2024-01-16'),
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 1
    }
  ];

  private salesSubject = new BehaviorSubject<Sale[]>(this.sales);

  constructor() {}

  // Métodos para Vendas
  getSales(): Observable<Sale[]> {
    return this.salesSubject.asObservable();
  }

  getSaleById(id: number): Observable<Sale | undefined> {
    const sale = this.sales.find(s => s.id === id);
    return of(sale);
  }

  searchSales(params: SaleSearchParams): Observable<Sale[]> {
    let filteredSales = [...this.sales];

    if (params.customerId) {
      filteredSales = filteredSales.filter(s => s.customerId === params.customerId);
    }

    if (params.vehicleId) {
      filteredSales = filteredSales.filter(s => s.vehicleId === params.vehicleId);
    }

    if (params.paymentStatus) {
      filteredSales = filteredSales.filter(s => s.paymentStatus === params.paymentStatus);
    }

    if (params.paymentMethod) {
      filteredSales = filteredSales.filter(s => s.paymentMethod === params.paymentMethod);
    }

    if (params.startDate) {
      filteredSales = filteredSales.filter(s => s.date >= params.startDate!);
    }

    if (params.endDate) {
      filteredSales = filteredSales.filter(s => s.date <= params.endDate!);
    }

    if (params.minTotal) {
      filteredSales = filteredSales.filter(s => s.total >= params.minTotal!);
    }

    if (params.maxTotal) {
      filteredSales = filteredSales.filter(s => s.total <= params.maxTotal!);
    }

    return of(filteredSales);
  }

  createSale(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Observable<Sale> {
    const newSale: Sale = {
      ...sale,
      id: this.getNextSaleId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sales.push(newSale);
    this.salesSubject.next([...this.sales]);
    return of(newSale);
  }

  updateSale(id: number, updates: Partial<Sale>): Observable<Sale | null> {
    const index = this.sales.findIndex(s => s.id === id);
    if (index === -1) {
      return of(null);
    }

    this.sales[index] = {
      ...this.sales[index],
      ...updates,
      updatedAt: new Date()
    };

    this.salesSubject.next([...this.sales]);
    return of(this.sales[index]);
  }

  cancelSale(id: number): Observable<boolean> {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) {
      return of(false);
    }

    // Só pode cancelar vendas não pagas
    if (sale.paymentStatus === PaymentStatus.PAID) {
      return of(false);
    }

    sale.paymentStatus = PaymentStatus.CANCELLED;
    sale.updatedAt = new Date();
    this.salesSubject.next([...this.sales]);
    return of(true);
  }

  // Métodos para Relatórios
  getSalesReport(): Observable<SaleReport> {
    const totalSales = this.sales.length;
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.total, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const paidSales = this.sales.filter(s => s.paymentStatus === PaymentStatus.PAID);
    const pendingSales = this.sales.filter(s => s.paymentStatus === PaymentStatus.PENDING);
    const cancelledSales = this.sales.filter(s => s.paymentStatus === PaymentStatus.CANCELLED);

    const paymentMethodStats = this.getPaymentMethodStats();
    const dailyStats = this.getDailyStats();
    const topProducts = this.getTopProducts();
    const topServices = this.getTopServices();

    return of({
      totalSales,
      totalRevenue,
      averageTicket,
      paidSales: paidSales.length,
      pendingSales: pendingSales.length,
      cancelledSales: cancelledSales.length,
      paymentMethodStats,
      dailyStats,
      topProducts,
      topServices
    });
  }

  // Métodos auxiliares
  private getNextSaleId(): number {
    const maxId = Math.max(...this.sales.map(s => s.id));
    return maxId + 1;
  }

  private getPaymentMethodStats() {
    const stats: { [key in PaymentMethod]: number } = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CREDIT_CARD]: 0,
      [PaymentMethod.DEBIT_CARD]: 0,
      [PaymentMethod.PIX]: 0,
      [PaymentMethod.INSTALLMENT]: 0
    };

    this.sales.forEach(sale => {
      if (sale.paymentStatus === PaymentStatus.PAID) {
        stats[sale.paymentMethod]++;
      }
    });

    return stats;
  }

  private getDailyStats() {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySales = this.sales.filter(s => 
        s.date.toISOString().split('T')[0] === date
      );
      
      return {
        date,
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + s.total, 0)
      };
    }).reverse();
  }

  private getTopProducts() {
    const productSales: { [key: number]: number } = {};
    
    this.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === 'product' && item.productId) {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(productSales)
      .map(([productId, quantity]) => ({ productId: parseInt(productId), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  private getTopServices() {
    const serviceSales: { [key: number]: number } = {};
    
    this.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === 'service' && item.serviceId) {
          serviceSales[item.serviceId] = (serviceSales[item.serviceId] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(serviceSales)
      .map(([serviceId, quantity]) => ({ serviceId: parseInt(serviceId), quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  // Métodos para cálculo de preços
  calculateItemTotal(item: Omit<SaleItem, 'id' | 'totalPrice'>): number {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal - (item.discount || 0);
  }

  calculateSaleTotal(items: Omit<SaleItem, 'id' | 'totalPrice'>[], discount: number = 0): { subtotal: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
    const total = subtotal - discount;
    return { subtotal, total };
  }
}
