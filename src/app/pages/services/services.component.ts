import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service, ServiceCategory, AdditionalService, ServiceSearchParams, Customer, PaymentMethod, PaymentStatus, Vehicle } from '../../models';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  filteredServices: Service[] = [];
  selectedService: Service | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  showAdditionalServiceForm = false;
  searchTerm = '';
  categoryFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  vehicles: Vehicle[] = [];

  serviceForm: FormGroup;
  additionalServiceForm: FormGroup;
  stats: {
    total: number;
    completed: number;
    canceled: number;
    byCategory: { category: ServiceCategory; count: number }[];
    totalRevenue: number;
    averagePrice: number;
  } = {
      total: 0,
      completed: 0,
      canceled: 0,
      byCategory: [],
      totalRevenue: 0,
      averagePrice: 0
    };


  availableCategories: ServiceCategory[] = [];
  additionalServices: AdditionalService[] = [];
  selectedAdditionalServices: number[] = [];
  customers: Customer[] = [];
  paymentMethods = Object.values(PaymentMethod);
  paymentStatuses = Object.values(PaymentStatus);
  private destroy$ = new Subject<void>();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedServices: Service[] = [];

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private paginationService: PaginationService,
    private toast: ToastrService
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      customerId: ['', Validators.required],
      category: ['', Validators.required],
      basePrice: ['', [Validators.required, Validators.min(0)]],
      vehicleId: [''],
      dueDate: [''],
      paymentMethod: ['', Validators.required],
      paymentStatus: [PaymentStatus.PENDING, Validators.required],

    });

    this.additionalServiceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      additionalPrice: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadServices();
    this.loadAvailableCategories();
    this.loadAdditionalServices();
    this.loadCustomers();

  }

  getCustomerNameById(customerId: number): string {
    const customer = this.customers.find(c => c.id == customerId);
    return customer ? customer.name : 'Cliente não encontrado';
  }

  loadCustomers() {
    this.api.getAll('clients')
      .pipe(takeUntil(this.destroy$))
      .subscribe((customers: any[]) => {
        this.customers = customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          document: customer.document,
          documentType: customer.documentType,
          observations: customer.observations,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          vehicles: []
        }));
      });
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadServices() {
    this.api.getAll('services', undefined, ['services_with_addons!left(serviceIdOddons(*))'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.applyFilters();
        this.updateStats(services);
      });
  }

  updateStats(services: Service[]) {
    this.stats.total = services.length;

    this.stats.completed = services.filter(s => s.paymentStatus === 'paid').length;
    this.stats.canceled = services.filter(s => s.paymentStatus === 'refunded').length;

    this.stats.totalRevenue = services
      .filter(s => s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + (s.basePrice || 0) +
        (s.services_with_addons?.reduce((a, b) => a + (b.serviceIdOddons?.additionalPrice || 0), 0) || 0), 0);

    this.stats.averagePrice = this.stats.total > 0 ? this.stats.totalRevenue / this.stats.total : 0;
  }


  loadAvailableCategories() {
    this.availableCategories = (Object.values(ServiceCategory));
    return this.availableCategories;

  }

  loadAdditionalServices() {
    this.api.getAll('service_addons')
      .pipe(takeUntil(this.destroy$))
      .subscribe(additionalServices => {
        this.additionalServices = additionalServices;
      });
  }

  applyFilters() {
    let filtered = [...this.services];

    // Filtro por termo de busca
    if (this.searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (this.categoryFilter) {
      filtered = filtered.filter(s => s.category === this.categoryFilter);
    }

    // Filtro por status
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(s => s.isActive === isActive);
    }

    this.filteredServices = filtered;
    this.updatePaginatedServices();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onCategoryFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Métodos de paginação
  updatePaginatedServices() {
    this.paginatedServices = this.paginationService.paginate(
      this.filteredServices,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedServices();
  }

  createService() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedService = null;
    this.serviceForm.reset();
    this.selectedAdditionalServices = [];
    this.showForm = true;
  }

  editService(service: Service) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedService = service;

    this.selectedAdditionalServices = (service.services_with_addons || [])
      .map((item: any) => item.serviceIdOddons.id);

    this.serviceForm.patchValue({
      name: service.name,
      description: service.description,
      customerId: service.customerId,
      category: service.category,
      basePrice: service.basePrice,
      vehicleId: service.vehicleId,
      dueDate: service.dueDate,
      paymentMethod: service.paymentMethod,
      paymentStatus: service.paymentStatus,
      additionalServices: this.selectedAdditionalServices
    });

    this.serviceForm.get('customerId')?.disable();

    this.loadVehiclesByCustomerId();

    console.log('Serviço selecionado para edição:', service);
    console.log('Addons selecionados:', this.selectedAdditionalServices);

    this.showForm = true;
  }


  viewService(service: Service) {
    this.selectedService = service;
    this.showForm = false;
  }

  saveService() {
    if (!this.serviceForm.valid) {
      // Loga campos inválidos
      Object.keys(this.serviceForm.controls).forEach(field => {
        const control = this.serviceForm.get(field);
        if (control && control.invalid) {
          console.log(`Campo inválido: ${field}`, control.errors);
        }
      });
      this.toast.error('Existem campos inválidos no formulário.');
      return;
    }

    const formValue = this.serviceForm.value;
    this.toast.info('Salvando serviço...', '', { disableTimeOut: true, toastClass: 'ngx-toastr loading-toast' });

    if (this.isCreating) {
      this.api.create('services', { ...formValue }).subscribe({
        next: (services: any[]) => {
          const service = services[0];

          const addons = this.selectedAdditionalServices.map((addonId: any) => ({
            serviceID: service.id,
            serviceIdOddons: addonId
          }));

          this.api.create('services_with_addons', addons).subscribe({
            next: (res: any) => {
              console.log('Addons criados:', res);
              this.toast.clear();
              this.toast.success('Serviço criado com sucesso!');
              this.closeForm();
              this.loadServices();
            },
            error: () => {
              this.toast.clear();
              this.toast.error('Erro ao criar addons.');
            }
          });
        },
        error: () => {
          this.toast.clear();
          this.toast.error('Erro ao criar o serviço.');
        }
      });

    } else if (this.isEditing && this.selectedService) {
      this.api.update('services', this.selectedService.id, formValue).subscribe({
        next: () => {
          this.api.deleteByColumn('services_with_addons', 'serviceID', this.selectedService!.id).subscribe({
            next: () => {
              const addons = this.selectedAdditionalServices.map((addonId: any) => ({
                serviceID: this.selectedService!.id,
                serviceIdOddons: addonId
              }));

              this.api.create('services_with_addons', addons).subscribe({
                next: (res: any) => {
                  console.log('Addons criados:', res);
                  this.toast.clear();
                  this.toast.success('Serviço atualizado com sucesso!');
                  this.closeForm();
                  this.loadServices();
                },
                error: () => {
                  this.toast.clear();
                  this.toast.error('Erro ao criar addons.');
                }
              });
            },
            error: () => {
              this.toast.clear();
              this.toast.error('Erro ao remover addons antigos.');
            }
          });
        },
        error: () => {
          this.toast.clear();
          this.toast.error('Erro ao atualizar o serviço.');
        }
      });
    }
  }



  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedService = null;
    this.serviceForm.reset();
    this.selectedAdditionalServices = [];
  }

  createAdditionalService() {
    this.showAdditionalServiceForm = true;
    this.additionalServiceForm.reset();
  }

  saveAdditionalService() {
    if (this.additionalServiceForm.valid) {
      const formValue = this.additionalServiceForm.value;

      this.api.create('service_addons', {
        ...formValue,
        isActive: true
      }).subscribe(() => {
        this.closeAdditionalServiceForm();
        this.loadAdditionalServices();
      });
    }
  }

  closeAdditionalServiceForm() {
    this.showAdditionalServiceForm = false;
    this.additionalServiceForm.reset();
  }

  toggleAdditionalService(additionalServiceId: number) {
    const index = this.selectedAdditionalServices.indexOf(additionalServiceId);
    if (index > -1) {
      this.selectedAdditionalServices.splice(index, 1);
    } else {
      this.selectedAdditionalServices.push(additionalServiceId);
    }
  }

  isAdditionalServiceSelected(additionalServiceId: number): boolean {
    return this.selectedAdditionalServices.includes(additionalServiceId);
  }

  deactivateService(service: Service) {
    this.api.update('service', service.id, { paymentStatus: 'Cancelado' }).subscribe(() => {
      this.loadServices();
    });
  }

  activateService(service: Service) {
    this.api.update('service', service.id, { paymentStatus: '' }).subscribe(() => {
      this.loadServices();
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getCategoryText(category: ServiceCategory): string {
    switch (category) {
      case ServiceCategory.SIMPLE: return 'Simples';
      case ServiceCategory.DETAILED: return 'Detalhada';
      case ServiceCategory.TECHNICAL: return 'Técnica';
      default: return category;
    }
  }

  getCategoryBadgeClass(category: ServiceCategory): string {
    switch (category) {
      case ServiceCategory.SIMPLE: return 'simple';
      case ServiceCategory.DETAILED: return 'detailed';
      case ServiceCategory.TECHNICAL: return 'technical';
      default: return 'default';
    }
  }


  getAdditionalServicesText(service: Service): string {

    if (!service.services_with_addons || service.services_with_addons.length === 0) {
      return 'Nenhum adicional';
    }

    const additionalNames = service.services_with_addons
      .map(additional => {
        return additional.serviceIdOddons?.name || additional.name || '';
      })
      .filter(name => name)
      .join(', ');

    return additionalNames || 'Nenhum adicional';
  }


  calculateServiceTotal(service: Service): number {
    let total = service.basePrice;

    if (service.services_with_addons && service.services_with_addons.length > 0) {
      service.services_with_addons.forEach(additional => {
        if (additional.isActive) {
          total += additional.additionalPrice;
        }
      });
    }

    return total;
  }

  getPaymentMethodText(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH: return 'Dinheiro';
      case PaymentMethod.CREDIT_CARD: return 'Cartão de Crédito';
      case PaymentMethod.DEBIT_CARD: return 'Cartão de Débito';
      case PaymentMethod.PIX: return 'PIX';
      case PaymentMethod.BANK_TRANSFER: return 'Transferência Bancária';
      case PaymentMethod.CHECK: return 'Cheque';
      case PaymentMethod.INSTALLMENT: return 'Parcelado';
      default: return method;
    }
  }

  getPaymentStatusText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'Pago';
      case PaymentStatus.PENDING: return 'Pendente';
      case PaymentStatus.CANCELLED: return 'Cancelado';
      case PaymentStatus.REFUNDED: return 'Reembolsado';
      default: return status;
    }
  }
  getPaymentStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'paid';
      case PaymentStatus.PENDING: return 'pending';
      case PaymentStatus.CANCELLED: return 'cancelled';
      case PaymentStatus.REFUNDED: return 'refunded';
      default: return '';
    }
  }


  loadVehiclesByCustomerId() {
    this.api.getByColumn('vehicles', 'customerId', this.serviceForm.get('customerId')?.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe((vehicles: any[]) => {
        this.vehicles = vehicles.map(vehicle => ({
          id: vehicle.id,
          customerId: vehicle.customerId,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          observations: vehicle.observations,
          isActive: vehicle.isActive,
          createdAt: vehicle.createdAt ? new Date(vehicle.createdAt) : new Date(),
          updatedAt: vehicle.updatedAt ? new Date(vehicle.updatedAt) : new Date()
        }));
      });
  }
  onCustomerChange() {
    this.serviceForm.patchValue({ vehicleId: '' });
    this.loadVehiclesByCustomerId();
  }
}
