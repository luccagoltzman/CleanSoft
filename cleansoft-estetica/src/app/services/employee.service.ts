import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Employee, EmployeeSearchParams, EmployeeReport } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employees: Employee[] = [
    {
      id: 1,
      name: 'Carlos Silva',
      cpf: '123.456.789-00',
      position: 'Lavador',
      phone: '(11) 99999-9999',
      salary: 1500.00,
      admissionDate: new Date('2023-01-15'),
      dismissalDate: undefined,
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 2,
      name: 'Ana Santos',
      cpf: '987.654.321-00',
      position: 'Atendente',
      phone: '(11) 88888-8888',
      salary: 1800.00,
      admissionDate: new Date('2023-03-20'),
      dismissalDate: undefined,
      isActive: true,
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date('2023-03-20')
    },
    {
      id: 3,
      name: 'Roberto Oliveira',
      cpf: '456.789.123-00',
      position: 'Técnico',
      phone: '(11) 77777-7777',
      salary: 2200.00,
      admissionDate: new Date('2023-06-10'),
      dismissalDate: undefined,
      isActive: true,
      createdAt: new Date('2023-06-10'),
      updatedAt: new Date('2023-06-10')
    },
    {
      id: 4,
      name: 'Maria Costa',
      cpf: '789.123.456-00',
      position: 'Lavador',
      phone: '(11) 66666-6666',
      salary: 1500.00,
      admissionDate: new Date('2023-02-01'),
      dismissalDate: new Date('2024-01-31'),
      isActive: false,
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2024-01-31')
    },
    {
      id: 5,
      name: 'João Pereira',
      cpf: '321.654.987-00',
      position: 'Técnico',
      phone: '(11) 55555-5555',
      salary: 2200.00,
      admissionDate: new Date('2023-04-15'),
      dismissalDate: undefined,
      isActive: true,
      createdAt: new Date('2023-04-15'),
      updatedAt: new Date('2023-04-15')
    }
  ];

  private employeesSubject = new BehaviorSubject<Employee[]>(this.employees);

  constructor() {}

  // Obter todos os funcionários
  getEmployees(): Observable<Employee[]> {
    return this.employeesSubject.asObservable();
  }

  // Obter funcionário por ID
  getEmployeeById(id: number): Observable<Employee | undefined> {
    const employee = this.employees.find(e => e.id === id);
    return of(employee);
  }

  // Buscar funcionários com filtros
  searchEmployees(params: EmployeeSearchParams): Observable<Employee[]> {
    let filteredEmployees = [...this.employees];

    if (params.name) {
      filteredEmployees = filteredEmployees.filter(e => 
        e.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }

    if (params.cpf) {
      filteredEmployees = filteredEmployees.filter(e => 
        e.cpf.includes(params.cpf!)
      );
    }

    if (params.position) {
      filteredEmployees = filteredEmployees.filter(e => 
        e.position.toLowerCase().includes(params.position!.toLowerCase())
      );
    }

    if (params.isActive !== undefined) {
      filteredEmployees = filteredEmployees.filter(e => e.isActive === params.isActive);
    }

    return of(filteredEmployees);
  }

  // Criar novo funcionário
  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Observable<Employee> {
    const newEmployee: Employee = {
      ...employee,
      id: this.getNextId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.employees.push(newEmployee);
    this.employeesSubject.next([...this.employees]);
    return of(newEmployee);
  }

  // Atualizar funcionário
  updateEmployee(id: number, updates: Partial<Employee>): Observable<Employee | null> {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) {
      return of(null);
    }

    this.employees[index] = {
      ...this.employees[index],
      ...updates,
      updatedAt: new Date()
    };

    this.employeesSubject.next([...this.employees]);
    return of(this.employees[index]);
  }

  // Desativar funcionário
  deactivateEmployee(id: number, dismissalDate: Date): Observable<boolean> {
    const employee = this.employees.find(e => e.id === id);
    if (!employee) {
      return of(false);
    }

    employee.isActive = false;
    employee.dismissalDate = dismissalDate;
    employee.updatedAt = new Date();
    this.employeesSubject.next([...this.employees]);
    return of(true);
  }

  // Ativar funcionário
  activateEmployee(id: number): Observable<boolean> {
    const employee = this.employees.find(e => e.id === id);
    if (!employee) {
      return of(false);
    }

    employee.isActive = true;
    employee.dismissalDate = undefined; // Changed from null to undefined
    employee.updatedAt = new Date();
    this.employeesSubject.next([...this.employees]);
    return of(true);
  }

  // Verificar se CPF já existe
  isCpfUnique(cpf: string, excludeId?: number): Observable<boolean> {
    const existingEmployee = this.employees.find(e => 
      e.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '') && 
      e.id !== excludeId
    );
    return of(!existingEmployee);
  }

  // Obter próximo ID disponível
  private getNextId(): number {
    const maxId = Math.max(...this.employees.map(e => e.id));
    return maxId + 1;
  }

  // Obter estatísticas dos funcionários
  getEmployeeStats(): Observable<{
    total: number;
    active: number;
    inactive: number;
    byPosition: { position: string; count: number }[];
    totalSalary: number;
    averageSalary: number;
  }> {
    const total = this.employees.length;
    const active = this.employees.filter(e => e.isActive).length;
    const inactive = total - active;

    // Estatísticas por cargo
    const positionStats = this.employees.reduce((acc, employee) => {
      const existing = acc.find(p => p.position === employee.position);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ position: employee.position, count: 1 });
      }
      return acc;
    }, [] as { position: string; count: number }[]);

    // Estatísticas salariais
    const totalSalary = this.employees
      .filter(e => e.isActive)
      .reduce((sum, e) => sum + e.salary, 0);
    
    const averageSalary = active > 0 ? totalSalary / active : 0;

    // Ordenar por contagem
    positionStats.sort((a, b) => b.count - a.count);

    return of({ 
      total, 
      active, 
      inactive, 
      byPosition: positionStats, 
      totalSalary, 
      averageSalary 
    });
  }

  // Obter cargos disponíveis
  getAvailablePositions(): Observable<string[]> {
    const positions = [...new Set(this.employees.map(e => e.position))];
    return of(positions.sort());
  }

  // Gerar relatório de funcionários
  generateEmployeeReport(): Observable<EmployeeReport> {
    const activeEmployees = this.employees.filter(e => e.isActive);
    const inactiveEmployees = this.employees.filter(e => !e.isActive);

    return of({
      activeEmployees,
      inactiveEmployees,
      totalActive: activeEmployees.length,
      totalInactive: inactiveEmployees.length
    });
  }

  // Calcular tempo de serviço
  calculateServiceTime(admissionDate: Date, dismissalDate?: Date): string {
    const endDate = dismissalDate || new Date();
    const diffTime = Math.abs(endDate.getTime() - admissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let result = '';
    if (years > 0) result += `${years} ano${years > 1 ? 's' : ''} `;
    if (months > 0) result += `${months} mes${months > 1 ? 'es' : ''} `;
    if (days > 0) result += `${days} dia${days > 1 ? 's' : ''}`;
    
    return result.trim() || 'Menos de 1 dia';
  }
}
