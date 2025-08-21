import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Vehicle, VehicleSearchParams, Customer } from '../models';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private vehicles: Vehicle[] = [
    {
      id: 1,
      customerId: 1,
      licensePlate: 'ABC-1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Prata',
      observations: 'Veículo principal',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 2,
      customerId: 2,
      licensePlate: 'XYZ-5678',
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Preto',
      observations: 'Veículo para trabalho',
      isActive: true,
      createdAt: new Date('2023-06-20'),
      updatedAt: new Date('2023-06-20')
    },
    {
      id: 3,
      customerId: 3,
      licensePlate: 'DEF-9012',
      brand: 'Ford',
      model: 'Ranger',
      year: 2021,
      color: 'Branco',
      observations: 'Veículo da empresa',
      isActive: true,
      createdAt: new Date('2023-03-10'),
      updatedAt: new Date('2023-03-10')
    },
    {
      id: 4,
      customerId: 1,
      licensePlate: 'GHI-3456',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2018,
      color: 'Azul',
      observations: 'Veículo secundário',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: 5,
      customerId: 2,
      licensePlate: 'JKL-7890',
      brand: 'Volkswagen',
      model: 'Golf',
      year: 2022,
      color: 'Vermelho',
      observations: 'Veículo esportivo',
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ];

  private vehiclesSubject = new BehaviorSubject<Vehicle[]>(this.vehicles);

  constructor() {}

  // Obter todos os veículos
  getVehicles(): Observable<Vehicle[]> {
    return this.vehiclesSubject.asObservable();
  }

  // Obter veículo por ID
  getVehicleById(id: number): Observable<Vehicle | undefined> {
    const vehicle = this.vehicles.find(v => v.id === id);
    return of(vehicle);
  }

  // Obter veículos por cliente
  getVehiclesByCustomer(customerId: number): Observable<Vehicle[]> {
    const customerVehicles = this.vehicles.filter(v => v.customerId === customerId);
    return of(customerVehicles);
  }

  // Buscar veículos com filtros
  searchVehicles(params: VehicleSearchParams): Observable<Vehicle[]> {
    let filteredVehicles = [...this.vehicles];

    if (params.licensePlate) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.licensePlate.toLowerCase().includes(params.licensePlate!.toLowerCase())
      );
    }

    if (params.customerId) {
      filteredVehicles = filteredVehicles.filter(v => v.customerId === params.customerId);
    }

    if (params.brand) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.brand.toLowerCase().includes(params.brand!.toLowerCase())
      );
    }

    if (params.model) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.model.toLowerCase().includes(params.model!.toLowerCase())
      );
    }

    if (params.isActive !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => v.isActive === params.isActive);
    }

    return of(filteredVehicles);
  }

  // Criar novo veículo
  createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Observable<Vehicle> {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: this.getNextId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.vehicles.push(newVehicle);
    this.vehiclesSubject.next([...this.vehicles]);
    return of(newVehicle);
  }

  // Atualizar veículo
  updateVehicle(id: number, updates: Partial<Vehicle>): Observable<Vehicle | null> {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) {
      return of(null);
    }

    this.vehicles[index] = {
      ...this.vehicles[index],
      ...updates,
      updatedAt: new Date()
    };

    this.vehiclesSubject.next([...this.vehicles]);
    return of(this.vehicles[index]);
  }

  // Desativar veículo
  deactivateVehicle(id: number): Observable<boolean> {
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) {
      return of(false);
    }

    vehicle.isActive = false;
    vehicle.updatedAt = new Date();
    this.vehiclesSubject.next([...this.vehicles]);
    return of(true);
  }

  // Ativar veículo
  activateVehicle(id: number): Observable<boolean> {
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) {
      return of(false);
    }

    vehicle.isActive = true;
    vehicle.updatedAt = new Date();
    this.vehiclesSubject.next([...this.vehicles]);
    return of(true);
  }

  // Verificar se placa já existe
  isLicensePlateUnique(licensePlate: string, excludeId?: number): Observable<boolean> {
    const existingVehicle = this.vehicles.find(v => 
      v.licensePlate.toLowerCase() === licensePlate.toLowerCase() && 
      v.id !== excludeId
    );
    return of(!existingVehicle);
  }

  // Obter próximo ID disponível
  private getNextId(): number {
    const maxId = Math.max(...this.vehicles.map(v => v.id));
    return maxId + 1;
  }

  // Obter estatísticas dos veículos
  getVehicleStats(): Observable<{
    total: number;
    active: number;
    inactive: number;
    byBrand: { brand: string; count: number }[];
    byYear: { year: number; count: number }[];
  }> {
    const total = this.vehicles.length;
    const active = this.vehicles.filter(v => v.isActive).length;
    const inactive = total - active;

    // Estatísticas por marca
    const brandStats = this.vehicles.reduce((acc, vehicle) => {
      const existing = acc.find(b => b.brand === vehicle.brand);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ brand: vehicle.brand, count: 1 });
      }
      return acc;
    }, [] as { brand: string; count: number }[]);

    // Estatísticas por ano
    const yearStats = this.vehicles.reduce((acc, vehicle) => {
      const existing = acc.find(y => y.year === vehicle.year);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ year: vehicle.year, count: 1 });
      }
      return acc;
    }, [] as { year: number; count: number }[]);

    // Ordenar por contagem
    brandStats.sort((a, b) => b.count - a.count);
    yearStats.sort((a, b) => b.year - a.year);

    return of({ total, active, inactive, byBrand: brandStats, byYear: yearStats });
  }

  // Obter marcas disponíveis
  getAvailableBrands(): Observable<string[]> {
    const brands = [...new Set(this.vehicles.map(v => v.brand))];
    return of(brands.sort());
  }

  // Obter modelos por marca
  getModelsByBrand(brand: string): Observable<string[]> {
    const models = [...new Set(
      this.vehicles
        .filter(v => v.brand.toLowerCase() === brand.toLowerCase())
        .map(v => v.model)
    )];
    return of(models.sort());
  }
}
