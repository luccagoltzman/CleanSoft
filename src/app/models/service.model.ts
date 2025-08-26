export interface Service {
  paymentMethod: any;
  paymentStatus: any;
  dueDate: any;
  id: number;
  name: string;
  description: string;
  category: ServiceCategory;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  customerId: number;
  vehicleId: number;
  services_with_addons?: any[];
}

export enum ServiceCategory {
  SIMPLE = 'simple',
  DETAILED = 'detailed',
  TECHNICAL = 'technical'
}

export interface AdditionalService {
  id: number;
  serviceId: number;
  name: string;
  description: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceSearchParams {
  name?: string;
  category?: ServiceCategory;
  isActive?: boolean;
}

export interface ServiceWithTotal {
  service: Service;
  totalPrice: number;
  additionalServices: AdditionalService[];
}
