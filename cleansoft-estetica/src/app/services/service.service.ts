import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Service, ServiceCategory, AdditionalService, ServiceSearchParams, ServiceWithTotal } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private services: Service[] = [
    {
      id: 1,
      name: 'Lavagem Simples',
      description: 'Lavagem externa do veículo com água e sabão',
      category: ServiceCategory.SIMPLE,
      basePrice: 25.00,
      isActive: true,
      additionalServices: [],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 2,
      name: 'Lavagem Detalhada',
      description: 'Lavagem completa interna e externa com aspirador',
      category: ServiceCategory.DETAILED,
      basePrice: 45.00,
      isActive: true,
      additionalServices: [],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 3,
      name: 'Lavagem Técnica',
      description: 'Lavagem com produtos especiais e cera',
      category: ServiceCategory.TECHNICAL,
      basePrice: 80.00,
      isActive: true,
      additionalServices: [],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 4,
      name: 'Polimento',
      description: 'Polimento da pintura do veículo',
      category: ServiceCategory.TECHNICAL,
      basePrice: 120.00,
      isActive: true,
      additionalServices: [],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 5,
      name: 'Higienização de Ar Condicionado',
      description: 'Limpeza e desinfecção do sistema de ar condicionado',
      category: ServiceCategory.TECHNICAL,
      basePrice: 60.00,
      isActive: true,
      additionalServices: [],
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    }
  ];

  private additionalServices: AdditionalService[] = [
    {
      id: 1,
      serviceId: 1,
      name: 'Aspirador',
      description: 'Aspiração completa do interior',
      additionalPrice: 10.00,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 2,
      serviceId: 1,
      name: 'Limpador de Pneus',
      description: 'Aplicação de produto para pneus',
      additionalPrice: 8.00,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 3,
      serviceId: 1,
      name: 'Cera de Proteção',
      description: 'Aplicação de cera protetora',
      additionalPrice: 15.00,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 4,
      serviceId: 1,
      name: 'Perfume',
      description: 'Aplicação de perfume no interior',
      additionalPrice: 5.00,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 5,
      serviceId: 1,
      name: 'Proteção de Pintura',
      description: 'Aplicação de selante protetor',
      additionalPrice: 25.00,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    }
  ];

  private servicesSubject = new BehaviorSubject<Service[]>(this.services);
  private additionalServicesSubject = new BehaviorSubject<AdditionalService[]>(this.additionalServices);

  constructor() {}

  // Obter todos os serviços
  getServices(): Observable<Service[]> {
    return this.servicesSubject.asObservable();
  }

  // Obter serviço por ID
  getServiceById(id: number): Observable<Service | undefined> {
    const service = this.services.find(s => s.id === id);
    return of(service);
  }

  // Buscar serviços com filtros
  searchServices(params: ServiceSearchParams): Observable<Service[]> {
    let filteredServices = [...this.services];

    if (params.name) {
      filteredServices = filteredServices.filter(s => 
        s.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }

    if (params.category) {
      filteredServices = filteredServices.filter(s => s.category === params.category);
    }

    if (params.isActive !== undefined) {
      filteredServices = filteredServices.filter(s => s.isActive === params.isActive);
    }

    return of(filteredServices);
  }

  // Criar novo serviço
  createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service> {
    const newService: Service = {
      ...service,
      id: this.getNextId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.services.push(newService);
    this.servicesSubject.next([...this.services]);
    return of(newService);
  }

  // Atualizar serviço
  updateService(id: number, updates: Partial<Service>): Observable<Service | null> {
    const index = this.services.findIndex(s => s.id === id);
    if (index === -1) {
      return of(null);
    }

    this.services[index] = {
      ...this.services[index],
      ...updates,
      updatedAt: new Date()
    };

    this.servicesSubject.next([...this.services]);
    return of(this.services[index]);
  }

  // Desativar serviço
  deactivateService(id: number): Observable<boolean> {
    const service = this.services.find(s => s.id === id);
    if (!service) {
      return of(false);
    }

    service.isActive = false;
    service.updatedAt = new Date();
    this.servicesSubject.next([...this.services]);
    return of(true);
  }

  // Ativar serviço
  activateService(id: number): Observable<boolean> {
    const service = this.services.find(s => s.id === id);
    if (!service) {
      return of(false);
    }

    service.isActive = true;
    service.updatedAt = new Date();
    this.servicesSubject.next([...this.services]);
    return of(true);
  }

  // Verificar se nome já existe
  isNameUnique(name: string, excludeId?: number): Observable<boolean> {
    const existingService = this.services.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && 
      s.id !== excludeId
    );
    return of(!existingService);
  }

  // Obter próximo ID disponível
  private getNextId(): number {
    const maxId = Math.max(...this.services.map(s => s.id));
    return maxId + 1;
  }

  // Obter estatísticas dos serviços
  getServiceStats(): Observable<{
    total: number;
    active: number;
    inactive: number;
    byCategory: { category: ServiceCategory; count: number }[];
    totalRevenue: number;
    averagePrice: number;
  }> {
    const total = this.services.length;
    const active = this.services.filter(s => s.isActive).length;
    const inactive = total - active;

    // Estatísticas por categoria
    const categoryStats = this.services.reduce((acc, service) => {
      const existing = acc.find(c => c.category === service.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ category: service.category, count: 1 });
      }
      return acc;
    }, [] as { category: ServiceCategory; count: number }[]);

    // Estatísticas de preço
    const totalRevenue = this.services
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.basePrice, 0);
    
    const averagePrice = active > 0 ? totalRevenue / active : 0;

    // Ordenar por contagem
    categoryStats.sort((a, b) => b.count - a.count);

    return of({ 
      total, 
      active, 
      inactive, 
      byCategory: categoryStats, 
      totalRevenue, 
      averagePrice 
    });
  }

  // Obter categorias disponíveis
  getAvailableCategories(): Observable<ServiceCategory[]> {
    return of(Object.values(ServiceCategory));
  }

  // Obter serviços adicionais
  getAdditionalServices(): Observable<AdditionalService[]> {
    return this.additionalServicesSubject.asObservable();
  }

  // Obter serviço adicional por ID
  getAdditionalServiceById(id: number): Observable<AdditionalService | undefined> {
    const additionalService = this.additionalServices.find(as => as.id === id);
    return of(additionalService);
  }

  // Criar serviço adicional
  createAdditionalService(additionalService: Omit<AdditionalService, 'id' | 'createdAt' | 'updatedAt'>): Observable<AdditionalService> {
    const newAdditionalService: AdditionalService = {
      ...additionalService,
      id: this.getNextAdditionalServiceId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.additionalServices.push(newAdditionalService);
    this.additionalServicesSubject.next([...this.additionalServices]);
    return of(newAdditionalService);
  }

  // Atualizar serviço adicional
  updateAdditionalService(id: number, updates: Partial<AdditionalService>): Observable<AdditionalService | null> {
    const index = this.additionalServices.findIndex(as => as.id === id);
    if (index === -1) {
      return of(null);
    }

    this.additionalServices[index] = {
      ...this.additionalServices[index],
      ...updates
    };

    this.additionalServicesSubject.next([...this.additionalServices]);
    return of(this.additionalServices[index]);
  }

  // Obter próximo ID para serviço adicional
  private getNextAdditionalServiceId(): number {
    const maxId = Math.max(...this.additionalServices.map(as => as.id));
    return maxId + 1;
  }

  // Calcular preço total do serviço com adicionais
  calculateServiceTotal(service: Service): number {
    let total = service.basePrice;
    
    if (service.additionalServices && service.additionalServices.length > 0) {
      service.additionalServices.forEach(additionalService => {
        if (additionalService.isActive) {
          total += additionalService.additionalPrice;
        }
      });
    }
    
    return total;
  }

  // Obter serviços com preço total
  getServicesWithTotal(): Observable<ServiceWithTotal[]> {
    const servicesWithTotal = this.services.map(service => ({
      service,
      totalPrice: this.calculateServiceTotal(service),
      additionalServices: service.additionalServices || []
    }));
    
    return of(servicesWithTotal);
  }
}
