import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Customer, CustomerSearchParams } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customers: Customer[] = [
    {
      id: 1,
      name: 'João Silva',
      phone: '(11) 99999-9999',
      email: 'joao.silva@email.com',
      document: '123.456.789-00',
      documentType: 'CPF',
      observations: 'Cliente preferencial',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      vehicles: [
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
        }
      ]
    },
    {
      id: 2,
      name: 'Maria Santos',
      phone: '(11) 88888-8888',
      email: 'maria.santos@email.com',
      document: '987.654.321-00',
      documentType: 'CPF',
      observations: 'Cliente desde 2023',
      isActive: true,
      createdAt: new Date('2023-06-20'),
      updatedAt: new Date('2023-06-20'),
      vehicles: [
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
        }
      ]
    },
    {
      id: 3,
      name: 'Empresa ABC Ltda',
      phone: '(11) 77777-7777',
      email: 'contato@empresaabc.com',
      document: '12.345.678/0001-90',
      documentType: 'CNPJ',
      observations: 'Empresa corporativa',
      isActive: true,
      createdAt: new Date('2023-03-10'),
      updatedAt: new Date('2023-03-10'),
      vehicles: [
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
        }
      ]
    }
  ];

  private customersSubject = new BehaviorSubject<Customer[]>(this.customers);

  constructor() {}

  // Obter todos os clientes
  getCustomers(): Observable<Customer[]> {
    return this.customersSubject.asObservable();
  }

  // Obter cliente por ID
  getCustomerById(id: number): Observable<Customer | undefined> {
    const customer = this.customers.find(c => c.id === id);
    return of(customer);
  }

  // Buscar clientes com filtros
  searchCustomers(params: CustomerSearchParams): Observable<Customer[]> {
    let filteredCustomers = [...this.customers];

    if (params.name) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }

    if (params.phone) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.phone.includes(params.phone!)
      );
    }

    if (params.document) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.document.includes(params.document!)
      );
    }

    if (params.isActive !== undefined) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.isActive === params.isActive
      );
    }

    return of(filteredCustomers);
  }

  // Criar novo cliente
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Observable<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: this.getNextId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.customers.push(newCustomer);
    this.customersSubject.next([...this.customers]);
    return of(newCustomer);
  }

  // Atualizar cliente
  updateCustomer(id: number, updates: Partial<Customer>): Observable<Customer | null> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) {
      return of(null);
    }

    this.customers[index] = {
      ...this.customers[index],
      ...updates,
      updatedAt: new Date()
    };

    this.customersSubject.next([...this.customers]);
    return of(this.customers[index]);
  }

  // Desativar cliente
  deactivateCustomer(id: number): Observable<boolean> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) {
      return of(false);
    }

    customer.isActive = false;
    customer.updatedAt = new Date();
    this.customersSubject.next([...this.customers]);
    return of(true);
  }

  // Ativar cliente
  activateCustomer(id: number): Observable<boolean> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) {
      return of(false);
    }

    customer.isActive = true;
    customer.updatedAt = new Date();
    this.customersSubject.next([...this.customers]);
    return of(true);
  }

  // Obter próximo ID disponível
  private getNextId(): number {
    const maxId = Math.max(...this.customers.map(c => c.id));
    return maxId + 1;
  }

  // Obter estatísticas dos clientes
  getCustomerStats(): Observable<{
    total: number;
    active: number;
    inactive: number;
    withVehicles: number;
  }> {
    const total = this.customers.length;
    const active = this.customers.filter(c => c.isActive).length;
    const inactive = total - active;
    const withVehicles = this.customers.filter(c => c.vehicles.length > 0).length;

    return of({ total, active, inactive, withVehicles });
  }
}
