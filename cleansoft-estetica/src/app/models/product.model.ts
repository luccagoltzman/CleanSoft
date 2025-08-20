export interface Product {
  id: number;
  category: string;
  name: string;
  description: string;
  sku: string;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  supplier?: Supplier;
}

export interface Supplier {
  id: number;
  name: string;
  document: string; // CPF ou CNPJ
  documentType: 'CPF' | 'CNPJ';
  contact: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: number;
  productId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: StockMovementReason;
  reference?: string; // ID da venda, compra, etc.
  notes?: string;
  createdAt: Date;
  createdBy: number; // ID do usuário
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
  isActive?: boolean;
  lowStock?: boolean;
}

export interface StockReport {
  products: Product[];
  lowStockProducts: Product[];
  totalProducts: number;
  totalValue: number;
}
