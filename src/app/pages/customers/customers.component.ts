import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer, CustomerSearchParams } from '../../models';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ModalComponent } from '../../shared/components';
import { ModalConfig } from '../../shared/components/modal/modal.types';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  searchTerm = '';
  documentTypeFilter: 'CPF' | 'CNPJ' | 'all' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  customerForm: FormGroup;
  stats = { total: 0, active: 0, inactive: 0, withVehicles: 0 };

  private destroy$ = new Subject<void>();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedCustomers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private paginationService: PaginationService
  ) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      email: ['', [Validators.required, Validators.email]],
      document: ['', [Validators.required]],
      documentType: ['CPF', Validators.required],
      observations: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
    // this.loadStats();


  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomers() {
    this.api.getAll('clients', { select: '*,vehicles(*)' })
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers;
        this.applyFilters();
        this.loadStats();
      });
  }

  loadStats() {
    const customers = this.customers || [];

    this.stats = {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      inactive: customers.filter(c => !c.isActive).length,
      withVehicles: customers.filter(c => c.vehicles && c.vehicles.length > 0).length
    };
  }



  applyFilters() {
    let filtered = [...this.customers];

    if (this.searchTerm) {
      console.log('term:', this.searchTerm);
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name?.toLowerCase() || '').includes(term) ||
        (c.phone || '').includes(this.searchTerm) ||
        (c.document || '').includes(this.searchTerm) ||
        (c.email?.toLowerCase() || '').includes(term)
      );
    }

    if (this.documentTypeFilter !== 'all') {
      filtered = filtered.filter(c => (c.documentType || '') === this.documentTypeFilter);
    }

    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(c => c.isActive === isActive);
    }

    this.filteredCustomers = filtered;
    this.updatePaginatedCustomers();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onDocumentTypeFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Métodos de paginação
  updatePaginatedCustomers() {
    this.paginatedCustomers = this.paginationService.paginate(
      this.filteredCustomers,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedCustomers();
  }

  createCustomer() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedCustomer = null;
    this.customerForm.reset({ documentType: 'CPF' });
    this.showForm = true;
  }

  editCustomer(customer: Customer) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedCustomer = customer;
    this.customerForm.patchValue({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      document: customer.document,
      documentType: customer.documentType,
      observations: customer.observations
    });
    this.showForm = true;
  }

  viewCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.showForm = false;
  }

  saveCustomer() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;

      if (this.isCreating) {
        this.api.create('clients', {
          ...formValue,
          isActive: true,
        }).subscribe(() => {
          this.closeForm();
          this.loadCustomers();
          this.loadStats();
        });
      } else if (this.isEditing && this.selectedCustomer) {
        this.api.update('clients', this.selectedCustomer.id, formValue)
          .subscribe(() => {
            this.closeForm();
            this.loadCustomers();
          });
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedCustomer = null;
    this.customerForm.reset();
  }

  toggleCustomerStatus(customer: Customer) {
    if (customer.isActive) {
      this.api.update('clients',customer.id,{isActive: false}).subscribe(() => {
        this.loadCustomers();
        this.loadStats();
      });
    } else {
      this.api.update('clients',customer.id,{isActive: true}).subscribe(() => {
        this.loadCustomers();
        this.loadStats();
      });
    }
  }

  getDocumentMask(): string {
    const documentType = this.customerForm.get('documentType')?.value;
    return documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00';
  }

  formatDocument(document: string, type: 'CPF' | 'CNPJ'): string {
    if (type === 'CPF') {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  }

  formatPhone(phone: string): string {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  }
}
