import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../models';
import { of, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit, OnDestroy {

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  showDismissalForm = false;
  searchTerm = '';
  positionFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  employeeForm: FormGroup;
  dismissalForm: FormGroup;
  stats: {
    total: number;
    active: number;
    inactive: number;
    byPosition: { position: string; count: number }[];
    totalSalary: number;
    averageSalary: number;
  } = {
      total: 0,
      active: 0,
      inactive: 0,
      byPosition: [],
      totalSalary: 0,
      averageSalary: 0
    };
  availablePositions: string[] = [];

  private destroy$ = new Subject<void>();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedEmployees: Employee[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private paginationService: PaginationService
  ) {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      position: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      salary: ['', [Validators.required, Validators.min(0)]],
      admissionDate: ['', Validators.required]
    });

    this.dismissalForm = this.fb.group({
      dismissalDate: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadAvailablePositions();
    this.loadStats()
  }

  loadStats() {
    const employees = this.employees;

    console.log(employees);
    const total = employees.length;
    const activeEmployees = employees.filter(e => e.isActive);
    const inactiveEmployees = employees.filter(e => !e.isActive);



    const totalSalary = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const averageSalary = total > 0 ? totalSalary / total : 0;

    this.stats = {
      total,
      active: activeEmployees.length,
      inactive: inactiveEmployees.length,
      byPosition: [],
      totalSalary,
      averageSalary
    };

    console.log(this.stats);

    // Atualiza cargos disponíveis
    this.availablePositions = [...new Set(employees.map(e => e.position))].sort();
    this.availablePositions.push('Novo Cargo');
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees() {
    this.apiService.getAll('employees')
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        console.log(employees);
        this.loadStats()
        this.applyFilters();
      });
  }

  // loadStats() {
  //   this.employeeService.getEmployeeStats()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(stats => {
  //       this.stats = stats;
  //     });
  // }

  loadAvailablePositions() {

    const positions = [...new Set(this.employees.map(e => e.position))];
    console.log(positions);
    positions.push('Novo Cargo');
    return of(positions.sort());


  }

  applyFilters() {
    let filtered = [...this.employees];

    // Filtro por termo de busca
    if (this.searchTerm) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.cpf.includes(this.searchTerm) ||
        e.position.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por cargo
    if (this.positionFilter) {
      filtered = filtered.filter(e => e.position === this.positionFilter);
    }

    // Filtro por status
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(e => e.isActive === isActive);
    }

    this.filteredEmployees = filtered;
    this.updatePaginatedEmployees();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onPositionFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Métodos de paginação
  updatePaginatedEmployees() {
    this.paginatedEmployees = this.paginationService.paginate(
      this.filteredEmployees,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedEmployees();
  }

  createEmployee() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedEmployee = null;
    this.employeeForm.reset();
    this.showForm = true;
  }

  editEmployee(employee: Employee) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedEmployee = employee;

    this.employeeForm.patchValue({
      name: employee.name,
      cpf: employee.cpf,
      position: employee.position,
      phone: employee.phone,
      salary: employee.salary,
      admissionDate: employee.admissionDate
    });

    this.showForm = true;
  }

  viewEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    this.showForm = false;
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;

      if (this.isCreating) {

        console.log('Creating employee...');

        console.log('formValue:', formValue);

        this.apiService.create('employees', {
          ...formValue,
          dismissalDate: null,
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadEmployees();
          // this.loadStats();
        });
      } else if (this.isEditing && this.selectedEmployee) {
        this.apiService.update('employees', this.selectedEmployee.id, formValue)
          .subscribe(() => {
            this.closeForm();
            this.loadEmployees();
            // this.loadStats();
          });
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedEmployee = null;
    this.employeeForm.reset();
  }

  showDismissalModal(employee: Employee) {
    this.selectedEmployee = employee;
    
    this.apiService.update('employees', employee.id, {
      isActive: false, dismissalDate: new Date()
    }).subscribe(() => {
      this.loadEmployees();
      this.loadStats();
    });
  }

  dismissEmployee() {
    if (this.dismissalForm.valid && this.selectedEmployee) {
      const dismissalDate = new Date(this.dismissalForm.get('dismissalDate')?.value);

      // this.employeeService.deactivateEmployee(this.selectedEmployee.id, dismissalDate)
      //   .subscribe(() => {
      //     this.closeDismissalForm();
      //     this.loadEmployees();
      //     this.loadStats();
      //   });
    }
  }

  closeDismissalForm() {
    this.showDismissalForm = false;
    this.selectedEmployee = null;
    this.dismissalForm.reset();
  }

  activateEmployee(employee: Employee) {
    // this.employeeService.activateEmployee(employee.id).subscribe(() => {
    //   this.loadEmployees();
    //   this.loadStats();
    // });
  }



  formatDate(date: Date): string {
    if (!date) return '';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatPhone(phone: string): string {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  }

  getServiceTime(employee: Employee): string {
    return this.calculateServiceTime(
      employee.admissionDate,
      employee.dismissalDate
    );
  }

  getPositions(): string[] {
    return [
      'Lavador',
      'Atendente',
      'Técnico',
      'Gerente',
      'Supervisor',
      'Auxiliar'
    ];
  }

  getStatusBadgeClass(employee: Employee): string {
    return employee.isActive ? 'active' : 'inactive';
  }

  getStatusText(employee: Employee): string {
    return employee.isActive ? 'Ativo' : 'Inativo';
  }

  calculateServiceTime(admissionDate: any, dismissalDate?: any): string {
    if (!admissionDate) return 'Data de admissão inválida';

    const startDate = new Date(admissionDate);
    if (isNaN(startDate.getTime())) return 'Data de admissão inválida';

    const endDate = dismissalDate ? new Date(dismissalDate) : new Date();
    if (dismissalDate && isNaN(endDate.getTime())) return 'Data de demissão inválida';

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
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
