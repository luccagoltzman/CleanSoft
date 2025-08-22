import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Service, ServiceCategory, AdditionalService, ServiceSearchParams } from '../../models';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  serviceForm: FormGroup;
  additionalServiceForm: FormGroup;
  stats: {
    total: number;
    active: number;
    inactive: number;
    byCategory: { category: ServiceCategory; count: number }[];
    totalRevenue: number;
    averagePrice: number;
  } = {
      total: 0,
      active: 0,
      inactive: 0,
      byCategory: [],
      totalRevenue: 0,
      averagePrice: 0
    };
  availableCategories: ServiceCategory[] = [];
  additionalServices: AdditionalService[] = [];
  selectedAdditionalServices: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      basePrice: ['', [Validators.required, Validators.min(0)]],
    });

    this.additionalServiceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      additionalPrice: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadServices();
    this.loadStats();
    this.loadAvailableCategories();
    this.loadAdditionalServices();


  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadServices() {
    this.api.getAll('services', { isActive: 'eq.true' }, ['services_with_addons!left(serviceIdOddons(*))'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.applyFilters();
      });
  }

  loadStats() {
    // this.serviceService.getServiceStats()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(stats => {
    //     this.stats = stats;
    //   });
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

    // Extrai os IDs dos addons
    this.selectedAdditionalServices = (service.services_with_addons || [])
      .map((item: any) => item.serviceIdOddons.id);

    // Preenche o form
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      additionalServices: this.selectedAdditionalServices // IDs já extraídos
    });

    console.log('Serviço selecionado para edição:', service);
    console.log('Addons selecionados:', this.selectedAdditionalServices);

    this.showForm = true;
  }


  viewService(service: Service) {
    this.selectedService = service;
    this.showForm = false;
  }


  saveService() {
    if (!this.serviceForm.valid) return;

    const formValue = this.serviceForm.value;

    if (this.isCreating) {
      console.log('Criando serviço:', formValue);

      this.api.create('services', { ...formValue, isActive: true }).subscribe((services: any[]) => {
        const service = services[0];

        const addons = this.selectedAdditionalServices.map((addonId: any) => ({
          serviceID: service.id,
          serviceIdOddons: addonId
        }));

        this.api.create('services_with_addons', addons).subscribe((res: any) => {
          console.log('Addons criados:', res);

          this.closeForm();
          this.loadServices();
          this.loadStats();
        });
      });
    } else if (this.isEditing && this.selectedService) {

      this.api.update('services', this.selectedService.id, formValue).subscribe((services: any[]) => {
        // Primeiro deleta os addons antigos
        this.api.deleteByColumn(`services_with_addons`, 'serviceID', this.selectedService!.id).subscribe(() => {
          const addons = this.selectedAdditionalServices.map((addonId: any) => ({
            serviceID: this.selectedService!.id,
            serviceIdOddons: addonId
          }));


          this.api.create('services_with_addons', addons).subscribe((res: any) => {
            console.log('Addons criados:', res);

            this.closeForm();
            this.loadServices();
            this.loadStats();
          });
        });
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
    this.api.update('service',service.id,{isActive: false}).subscribe(() => {
      this.loadServices();
      this.loadStats();
    });
  }

  activateService(service: Service) {
    this.api.update('service',service.id,{isActive: true}).subscribe(() => {
      this.loadServices();
      this.loadStats();
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

  getStatusBadgeClass(service: Service): string {
    return service.isActive ? 'active' : 'inactive';
  }

  getStatusText(service: Service): string {
    return service.isActive ? 'Ativo' : 'Inativo';
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
}
