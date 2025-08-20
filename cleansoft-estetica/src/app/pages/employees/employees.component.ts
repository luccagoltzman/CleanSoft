import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee, EmployeeSearchParams, EmployeeReport } from '../../models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder
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
    this.loadStats();
    this.loadAvailablePositions();
    
    // Observar mudanças nos funcionários
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees() {
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.applyFilters();
      });
  }

  loadStats() {
    this.employeeService.getEmployeeStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  loadAvailablePositions() {
    this.employeeService.getAvailablePositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(positions => {
        this.availablePositions = positions;
      });
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
      admissionDate: this.formatDateForInput(employee.admissionDate)
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
        this.employeeService.createEmployee({
          ...formValue,
          dismissalDate: null,
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadEmployees();
          this.loadStats();
        });
      } else if (this.isEditing && this.selectedEmployee) {
        this.employeeService.updateEmployee(this.selectedEmployee.id, formValue)
          .subscribe(() => {
            this.closeForm();
            this.loadEmployees();
            this.loadStats();
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
    this.dismissalForm.reset({
      dismissalDate: this.formatDateForInput(new Date())
    });
    this.showDismissalForm = true;
  }

  dismissEmployee() {
    if (this.dismissalForm.valid && this.selectedEmployee) {
      const dismissalDate = new Date(this.dismissalForm.get('dismissalDate')?.value);
      
      this.employeeService.deactivateEmployee(this.selectedEmployee.id, dismissalDate)
        .subscribe(() => {
          this.closeDismissalForm();
          this.loadEmployees();
          this.loadStats();
        });
    }
  }

  closeDismissalForm() {
    this.showDismissalForm = false;
    this.selectedEmployee = null;
    this.dismissalForm.reset();
  }

  activateEmployee(employee: Employee) {
    this.employeeService.activateEmployee(employee.id).subscribe(() => {
      this.loadEmployees();
      this.loadStats();
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
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
    return this.employeeService.calculateServiceTime(
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
}
