import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
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
} from '../models';
import { CustomerService } from './customer.service';
import { VehicleService } from './vehicle.service';
import { ServiceService } from './service.service';
import { ProductService } from './product.service';
import { SaleService } from './sale.service';
import { FinancialService } from './financial.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private serviceService: ServiceService,
    private productService: ProductService,
    private saleService: SaleService,
    private financialService: FinancialService
  ) {}

  // Relatório de Clientes (RF33)
  generateCustomerReport(params: ReportSearchParams): Observable<CustomerReport> {
    const { period, startDate, endDate } = params;
    
    return combineLatest([
      this.customerService.getCustomers(),
      this.saleService.getSales()
    ]).pipe(
      map(([customers, sales]) => {
        const start = startDate || this.getStartDate(period);
        const end = endDate || new Date();
        
        // Filtrar vendas pelo período
        const periodSales = sales.filter(s => 
          s.date >= start && s.date <= end
        );

        // Calcular estatísticas
        const totalCustomers = customers.length;
        const newCustomers = customers.filter(c => 
          c.createdAt >= start && c.createdAt <= end
        ).length;
        
        const activeCustomers = customers.filter(c => 
          periodSales.some(s => s.customerId === c.id)
        ).length;

        // Top clientes por receita
        const customerRevenue = new Map<number, { purchases: number; revenue: number; lastPurchase: Date }>();
        
        periodSales.forEach(sale => {
          const existing = customerRevenue.get(sale.customerId) || { purchases: 0, revenue: 0, lastPurchase: new Date(0) };
          existing.purchases++;
          existing.revenue += sale.total;
          if (sale.date > existing.lastPurchase) {
            existing.lastPurchase = sale.date;
          }
          customerRevenue.set(sale.customerId, existing);
        });

        const topCustomers = Array.from(customerRevenue.entries())
          .map(([customerId, data]) => {
            const customer = customers.find(c => c.id === customerId);
            return {
              customerId,
              customer: customer!,
              totalPurchases: data.purchases,
              totalRevenue: data.revenue,
              lastPurchase: data.lastPurchase
            };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        // Clientes inadimplentes (simulado)
        const delinquentCustomers = customers.slice(0, 5).map(c => ({
          customerId: c.id,
          customer: c,
          overdueAmount: Math.random() * 500,
          daysOverdue: Math.floor(Math.random() * 30) + 1,
          lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }));

        // Clientes por período
        const customersByPeriod = this.generatePeriodData(period, start, end, (date) => {
          const periodStart = this.getPeriodStart(date, period);
          const periodEnd = this.getPeriodEnd(date, period);
          return {
            period: this.formatPeriod(date, period),
            newCustomers: customers.filter(c => 
              c.createdAt >= periodStart && c.createdAt <= periodEnd
            ).length,
            activeCustomers: customers.filter(c => 
              periodSales.some(s => s.customerId === c.id && s.date >= periodStart && s.date <= periodEnd)
            ).length
          };
        });

        return {
          period,
          startDate: start,
          endDate: end,
          totalCustomers,
          newCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers,
          topCustomers,
          delinquentCustomers,
          customersByPeriod
        };
      })
    );
  }

  // Relatório de Serviços (RF34)
  generateServiceReport(params: ReportSearchParams): Observable<ServiceReport> {
    const { period, startDate, endDate } = params;
    
    return combineLatest([
      this.serviceService.getServices(),
      this.saleService.getSales()
    ]).pipe(
      map(([services, sales]) => {
        const start = startDate || this.getStartDate(period);
        const end = endDate || new Date();
        
        // Filtrar vendas pelo período
        const periodSales = sales.filter(s => 
          s.date >= start && s.date <= end
        );

        // Calcular estatísticas
        const totalServices = services.length;
        let totalRevenue = 0;
        let totalQuantity = 0;

        // Contar serviços vendidos
        const serviceStats = new Map<number, { quantity: number; revenue: number }>();
        
        periodSales.forEach(sale => {
          sale.items.forEach(item => {
            if (item.type === 'service' && item.serviceId) {
              const existing = serviceStats.get(item.serviceId) || { quantity: 0, revenue: 0 };
              existing.quantity += item.quantity;
              existing.revenue += item.totalPrice;
              serviceStats.set(item.serviceId, existing);
              
              totalRevenue += item.totalPrice;
              totalQuantity += item.quantity;
            }
          });
        });

        const averageTicket = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

        // Top serviços
        const topServices = Array.from(serviceStats.entries())
          .map(([serviceId, stats]) => {
            const service = services.find(s => s.id === serviceId);
            return {
              serviceId,
              service: service!,
              quantity: stats.quantity,
              revenue: stats.revenue,
              averagePrice: stats.quantity > 0 ? stats.revenue / stats.quantity : 0
            };
          })
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        // Serviços por categoria
        const servicesByCategory = services.reduce((acc, service) => {
          const category = service.category;
          const existing = acc.find(c => c.category === category);
          if (existing) {
            const stats = serviceStats.get(service.id);
            if (stats) {
              existing.quantity += stats.quantity;
              existing.revenue += stats.revenue;
            }
          } else {
            const stats = serviceStats.get(service.id) || { quantity: 0, revenue: 0 };
            acc.push({
              category,
              quantity: stats.quantity,
              revenue: stats.revenue
            });
          }
          return acc;
        }, [] as { category: string; quantity: number; revenue: number }[]);

        // Serviços por período
        const servicesByPeriod = this.generatePeriodData(period, start, end, (date) => {
          const periodStart = this.getPeriodStart(date, period);
          const periodEnd = this.getPeriodEnd(date, period);
          const periodSales = sales.filter(s => 
            s.date >= periodStart && s.date <= periodEnd
          );
          
          let quantity = 0;
          let revenue = 0;
          
          periodSales.forEach(sale => {
            sale.items.forEach(item => {
              if (item.type === 'service') {
                quantity += item.quantity;
                revenue += item.totalPrice;
              }
            });
          });

          return {
            period: this.formatPeriod(date, period),
            quantity,
            revenue
          };
        });

        return {
          period,
          startDate: start,
          endDate: end,
          totalServices,
          totalRevenue,
          averageTicket,
          topServices,
          servicesByCategory,
          servicesByPeriod
        };
      })
    );
  }

  // Relatório de Produtos (RF35)
  generateProductReport(params: ReportSearchParams): Observable<ProductReport> {
    const { period, startDate, endDate } = params;
    
    return combineLatest([
      this.productService.getProducts(),
      this.saleService.getSales()
    ]).pipe(
      map(([products, sales]) => {
        const start = startDate || this.getStartDate(period);
        const end = endDate || new Date();
        
        // Filtrar vendas pelo período
        const periodSales = sales.filter(s => 
          s.date >= start && s.date <= end
        );

        // Calcular estatísticas
        const totalProducts = products.length;
        let totalRevenue = 0;
        let totalQuantity = 0;

        // Contar produtos vendidos
        const productStats = new Map<number, { quantity: number; revenue: number }>();
        
        periodSales.forEach(sale => {
          sale.items.forEach(item => {
            if (item.type === 'product' && item.productId) {
              const existing = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
              existing.quantity += item.quantity;
              existing.revenue += item.totalPrice;
              productStats.set(item.productId, existing);
              
              totalRevenue += item.totalPrice;
              totalQuantity += item.quantity;
            }
          });
        });

        const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

        // Top produtos
        const topProducts = Array.from(productStats.entries())
          .map(([productId, stats]) => {
            const product = products.find(p => p.id === productId);
            return {
              productId,
              product: product!,
              quantity: stats.quantity,
              revenue: stats.revenue,
              averagePrice: stats.quantity > 0 ? stats.revenue / stats.quantity : 0
            };
          })
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        // Produtos por categoria
        const productsByCategory = products.reduce((acc, product) => {
          const category = product.category;
          const existing = acc.find(c => c.category === category);
          if (existing) {
            const stats = productStats.get(product.id);
            if (stats) {
              existing.quantity += stats.quantity;
              existing.revenue += stats.revenue;
            }
          } else {
            const stats = productStats.get(product.id) || { quantity: 0, revenue: 0 };
            acc.push({
              category,
              quantity: stats.quantity,
              revenue: stats.revenue
            });
          }
          return acc;
        }, [] as { category: string; quantity: number; revenue: number }[]);

        // Produtos por período
        const productsByPeriod = this.generatePeriodData(period, start, end, (date) => {
          const periodStart = this.getPeriodStart(date, period);
          const periodEnd = this.getPeriodEnd(date, period);
          const periodSales = sales.filter(s => 
            s.date >= periodStart && s.date <= periodEnd
          );
          
          let quantity = 0;
          let revenue = 0;
          
          periodSales.forEach(sale => {
            sale.items.forEach(item => {
              if (item.type === 'product') {
                quantity += item.quantity;
                revenue += item.totalPrice;
              }
            });
          });

          return {
            period: this.formatPeriod(date, period),
            quantity,
            revenue
          };
        });

        return {
          period,
          startDate: start,
          endDate: end,
          totalProducts,
          totalRevenue,
          averagePrice,
          topProducts,
          productsByCategory,
          productsByPeriod
        };
      })
    );
  }

  // Relatório de Estoque (RF36)
  generateStockReport(): Observable<StockReportData> {
    return this.productService.getProducts().pipe(
      map(products => {
        const currentStock = products.map(product => {
          let status: 'normal' | 'low' | 'out_of_stock' | 'overstock' = 'normal';
          
          if (product.currentStock === 0) {
            status = 'out_of_stock';
          } else if (product.currentStock <= product.minStock) {
            status = 'low';
          } else if (product.currentStock > product.minStock * 2) {
            status = 'overstock';
          }

          return {
            productId: product.id,
            product,
            currentStock: product.currentStock,
            minStock: product.minStock,
            maxStock: product.minStock * 2, // Simulado
            status
          };
        });

        const outOfStock = products.filter(product => product.currentStock === 0).map(product => ({
          productId: product.id,
          product,
          lastStockDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Simulado
          daysOutOfStock: Math.floor(Math.random() * 30) + 1 // Simulado
        }));

        const lowStock = products.filter(product => 
          product.currentStock > 0 && product.currentStock <= product.minStock
        ).map(product => ({
          productId: product.id,
          product,
          currentStock: product.currentStock,
          minStock: product.minStock,
          daysToOutOfStock: Math.floor(Math.random() * 7) + 1, // Simulado
          status: 'low' as const
        }));

        // Simular movimentações de estoque
        const stockMovements = products.slice(0, 10).map(product => ({
          productId: product.id,
          product,
          type: Math.random() > 0.5 ? 'entry' : 'exit' as 'entry' | 'exit',
          quantity: Math.floor(Math.random() * 50) + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          reason: Math.random() > 0.5 ? 'Compra' : 'Venda'
        }));

        const stockSummary = {
          totalProducts: products.length,
          normalStock: currentStock.filter(item => item.status === 'normal').length,
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          overstock: currentStock.filter(item => item.status === 'overstock').length,
          totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
        };

        return {
          currentStock,
          outOfStock,
          lowStock,
          stockMovements,
          stockSummary
        };
      })
    );
  }

  // Relatório Financeiro (RF37)
  generateFinancialReport(params: ReportSearchParams): Observable<FinancialReportData> {
    const { period, startDate, endDate } = params;
    
    return combineLatest([
      this.financialService.getAccountsPayable(),
      this.financialService.getAccountsReceivable(),
      this.financialService.getCashMovements()
    ]).pipe(
      map(([payables, receivables, movements]) => {
        const start = startDate || this.getStartDate(period);
        const end = endDate || new Date();
        
        // Filtrar movimentos pelo período
        const periodMovements = movements.filter(m => 
          m.date >= start && m.date <= end
        );

        // Calcular fluxo de caixa
        const totalIncome = periodMovements
          .filter(m => m.type === 'income')
          .reduce((sum, m) => sum + m.amount, 0);
        
        const totalExpense = periodMovements
          .filter(m => m.type === 'expense')
          .reduce((sum, m) => sum + m.amount, 0);

        const netCashFlow = totalIncome - totalExpense;

        // Contas a pagar
        const accountsPayable = {
          total: payables.reduce((sum, p) => sum + p.amount, 0),
          paid: payables.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
          pending: payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
          overdue: payables.filter(p => p.status === 'pending' && p.dueDate < new Date()).reduce((sum, p) => sum + p.amount, 0),
          overdueAmount: payables.filter(p => p.status === 'pending' && p.dueDate < new Date()).reduce((sum, p) => sum + p.amount, 0)
        };

        // Contas a receber
        const accountsReceivable = {
          total: receivables.reduce((sum, r) => sum + r.amount, 0),
          received: receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
          pending: receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
          overdue: receivables.filter(r => r.status === 'pending' && r.dueDate < new Date()).reduce((sum, r) => sum + r.amount, 0),
          overdueAmount: receivables.filter(r => r.status === 'pending' && r.dueDate < new Date()).reduce((sum, r) => sum + r.amount, 0)
        };

        // Receitas e despesas por categoria
        const incomeByCategory: { [key: string]: number } = {};
        const expenseByCategory: { [key: string]: number } = {};

        periodMovements.forEach(movement => {
          if (movement.type === 'income') {
            incomeByCategory[movement.category] = (incomeByCategory[movement.category] || 0) + movement.amount;
          } else {
            expenseByCategory[movement.category] = (expenseByCategory[movement.category] || 0) + movement.amount;
          }
        });

        // Fluxo de caixa diário
        const dailyCashFlow = this.generatePeriodData(period, start, end, (date) => {
          const periodStart = this.getPeriodStart(date, period);
          const periodEnd = this.getPeriodEnd(date, period);
          const periodMovements = movements.filter(m => 
            m.date >= periodStart && m.date <= periodEnd
          );
          
          const income = periodMovements
            .filter(m => m.type === 'income')
            .reduce((sum, m) => sum + m.amount, 0);
          
          const expense = periodMovements
            .filter(m => m.type === 'expense')
            .reduce((sum, m) => sum + m.amount, 0);

          return {
            date: this.formatPeriod(date, period),
            income,
            expense,
            balance: income - expense
          };
        });

        return {
          period,
          startDate: start,
          endDate: end,
          cashFlow: {
            openingBalance: 0, // Simulado
            totalIncome,
            totalExpense,
            closingBalance: netCashFlow,
            netCashFlow
          },
          accountsPayable,
          accountsReceivable,
          incomeByCategory,
          expenseByCategory,
          dailyCashFlow
        };
      })
    );
  }

  // Relatório Geral
  generateGeneralReport(params: ReportSearchParams): Observable<GeneralReport> {
    return combineLatest([
      this.generateCustomerReport(params),
      this.generateServiceReport(params),
      this.generateProductReport(params),
      this.saleService.getSales()
    ]).pipe(
      map(([customerReport, serviceReport, productReport, sales]) => {
        const { period, startDate, endDate } = params;
        const start = startDate || this.getStartDate(period);
        const end = endDate || new Date();
        
        // Filtrar vendas pelo período
        const periodSales = sales.filter(s => 
          s.date >= start && s.date <= end
        );

        const summary = {
          totalSales: periodSales.length,
          totalRevenue: periodSales.reduce((sum, s) => sum + s.total, 0),
          totalCustomers: customerReport.totalCustomers,
          totalServices: serviceReport.totalServices,
          totalProducts: productReport.totalProducts,
          averageTicket: periodSales.length > 0 ? periodSales.reduce((sum, s) => sum + s.total, 0) / periodSales.length : 0
        };

        // Calcular tendências (simulado)
        const trends = {
          salesGrowth: Math.random() * 20 - 10, // -10% a +10%
          revenueGrowth: Math.random() * 20 - 10,
          customerGrowth: Math.random() * 15 - 5,
          serviceGrowth: Math.random() * 25 - 10
        };

        return {
          period,
          startDate: start,
          endDate: end,
          summary,
          trends,
          topPerformers: {
            topCustomers: customerReport.topCustomers,
            topServices: serviceReport.topServices,
            topProducts: productReport.topProducts
          }
        };
      })
    );
  }

  // Exportação de relatórios (RF38)
  exportReport(report: any, format: ExportFormat, config: ReportConfig): Observable<string> {
    // Simular exportação
    return of(`relatorio_${new Date().toISOString().split('T')[0]}.${format}`);
  }

  // Métodos auxiliares
  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      case 'yearly':
        return new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private getPeriodStart(date: Date, period: string): Date {
    const newDate = new Date(date);
    switch (period) {
      case 'daily':
        newDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() - newDate.getDay());
        newDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        newDate.setDate(1);
        newDate.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        newDate.setMonth(0, 1);
        newDate.setHours(0, 0, 0, 0);
        break;
    }
    return newDate;
  }

  private getPeriodEnd(date: Date, period: string): Date {
    const newDate = new Date(date);
    switch (period) {
      case 'daily':
        newDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 6);
        newDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1, 0);
        newDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        newDate.setMonth(11, 31);
        newDate.setHours(23, 59, 59, 999);
        break;
    }
    return newDate;
  }

  private formatPeriod(date: Date, period: string): string {
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('pt-BR');
      case 'weekly':
        const weekStart = this.getPeriodStart(date, 'weekly');
        const weekEnd = this.getPeriodEnd(date, 'weekly');
        return `${weekStart.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`;
      case 'monthly':
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('pt-BR');
    }
  }

  private generatePeriodData<T>(
    period: string, 
    start: Date, 
    end: Date, 
    generator: (date: Date) => T
  ): T[] {
    const data: T[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      data.push(generator(current));
      
      switch (period) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }
    
    return data;
  }
}
