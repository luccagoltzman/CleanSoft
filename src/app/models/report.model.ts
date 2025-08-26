import { Customer } from './customer.model';
import { Vehicle } from './customer.model';
import { Employee } from './employee.model';
import { Service } from './service.model';
import { Product } from './product.model';
import { Sale } from './sale.model';
import { CashMovementCategory } from './financial.model';

// Relatórios de Clientes (RF33)
export interface CustomerReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  topCustomers: {
    customerId: number;
    customer: Customer;
    totalPurchases: number;
    totalRevenue: number;
    lastPurchase: Date;
  }[];
  delinquentCustomers: {
    customerId: number;
    customer: Customer;
    overdueAmount: number;
    daysOverdue: number;
    lastPayment: Date;
  }[];
  customersByPeriod: {
    period: string;
    newCustomers: number;
    activeCustomers: number;
  }[];
}

// Relatórios de Serviços (RF34)
export interface ServiceReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  totalServices: number;
  totalRevenue: number;
  averageTicket: number;
  topServices: {
    serviceId: number;
    service: Service;
    quantity: number;
    revenue: number;
    averagePrice: number;
  }[];
  servicesByCategory: {
    category: string;
    quantity: number;
    revenue: number;
  }[];
  servicesByPeriod: {
    period: string;
    quantity: number;
    revenue: number;
  }[];
}

// Relatórios de Produtos (RF35)
export interface ProductReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  totalProducts: number;
  totalRevenue: number;
  averagePrice: number;
  topProducts: {
    productId: number;
    product: Product;
    quantity: number;
    revenue: number;
    averagePrice: number;
  }[];
  productsByCategory: {
    category: string;
    quantity: number;
    revenue: number;
  }[];
  productsByPeriod: {
    period: string;
    quantity: number;
    revenue: number;
  }[];
}

// Relatórios de Estoque (RF36)
export interface StockReportData {
  currentStock: {
    productId: number;
    product: Product;
    currentStock: number;
    minStock: number;
    maxStock: number;
    status: 'normal' | 'low' | 'out_of_stock' | 'overstock';
  }[];
  outOfStock: {
    productId: number;
    product: Product;
    lastStockDate: Date;
    daysOutOfStock: number;
  }[];
  lowStock: {
    productId: number;
    product: Product;
    currentStock: number;
    minStock: number;
    daysToOutOfStock: number;
    status: 'low';
  }[];
  stockMovements: {
    productId: number;
    product: Product;
    type: 'entry' | 'exit';
    quantity: number;
    date: Date;
    reason: string;
  }[];
  stockSummary: {
    totalProducts: number;
    normalStock: number;
    lowStock: number;
    outOfStock: number;
    overstock: number;
    totalValue: number;
  };
}

// Relatórios Financeiros (RF37)
export interface FinancialReportData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  cashFlow: {
    openingBalance: number;
    totalIncome: number;
    totalExpense: number;
    closingBalance: number;
    netCashFlow: number;
  };
  accountsPayable: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    overdueAmount: number;
  };
  accountsReceivable: {
    total: number;
    received: number;
    pending: number;
    overdue: number;
    overdueAmount: number;
  };
  incomeByCategory: {
    [key in CashMovementCategory]?: number;
  };
  expenseByCategory: {
    [key in CashMovementCategory]?: number;
  };
  dailyCashFlow: {
    date: string;
    income: number;
    expense: number;
    balance: number;
  }[];
}

// Relatórios Gerais
export interface GeneralReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalCustomers: number;
    totalServices: number;
    totalProducts: number;
    averageTicket: number;
  };
  trends: {
    salesGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
    serviceGrowth: number;
  };
  topPerformers: {
    topCustomers: CustomerReport['topCustomers'];
    topServices: ServiceReport['topServices'];
    topProducts: ProductReport['topProducts'];
  };
}

// Parâmetros de busca para relatórios
export interface ReportSearchParams {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
  customerId?: number;
  serviceId?: number;
  productId?: number;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
}

// Tipos de exportação
export type ExportFormat = 'pdf' | 'excel' | 'csv';

// Configurações de relatório
export interface ReportConfig {
  includeCharts: boolean;
  includeTables: boolean;
  includeSummary: boolean;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  format: ExportFormat;
}
