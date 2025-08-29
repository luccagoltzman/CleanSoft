export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  document: string; // CPF ou CNPJ
  documentType: 'CPF' | 'CNPJ';
  observations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vehicles: Vehicle[];
}

export interface Vehicle {
  id: number;
  customerId: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  observations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Campos adicionais da API
  brandCode?: string;
  modelCode?: string;
  fipeCode?: string;
  fipeValue?: string;
  fuel?: string;
}

export interface CustomerSearchParams {
  name?: string;
  phone?: string;
  document?: string;
  isActive?: boolean;
}

export interface VehicleSearchParams {
  licensePlate?: string;
  customerId?: number;
  brand?: string;
  model?: string;
  isActive?: boolean;
}
