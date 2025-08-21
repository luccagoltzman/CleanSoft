export interface Supplier {
  id: number;
  name: string;
  document: string; // CPF ou CNPJ
  contact: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  category: string;
  name: string;
  description: string;
  sku: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: number;
  productId: number;
  type: 'entry' | 'exit';
  quantity: number;
  reason: StockMovementReason;
  unitPrice: number;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export enum StockMovementReason {
  PURCHASE = 'purchase',
  SALE = 'sale',
  SERVICE_USE = 'service_use',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return'
}

export interface ProductSearchParams {
  name?: string;
  category?: string;
  sku?: string;
  supplierId?: number;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface StockReport {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  averageValue: number;
  lowStockProductsList: Product[];
  outOfStockProductsList: Product[];
}
