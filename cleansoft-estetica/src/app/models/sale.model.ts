import { Customer } from './customer.model';
import { Vehicle } from './customer.model';
import { Product } from './product.model';
import { Service } from './service.model';

export interface Sale {
  id: number;
  customerId: number;
  customer?: Customer;
  vehicleId?: number;
  vehicle?: Vehicle;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installments?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number; // ID do usuário
}

export interface SaleItem {
  id: number;
  saleId: number;
  type: 'product' | 'service';
  productId?: number;
  serviceId?: number;
  product?: Product;
  service?: Service;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  INSTALLMENT = 'installment'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface SaleSearchParams {
  customerId?: number;
  vehicleId?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  createdBy?: number;
}

export interface SaleReport {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesByPaymentMethod: { method: PaymentMethod; count: number; total: number }[];
  salesByPeriod: { period: string; count: number; total: number }[];
}
