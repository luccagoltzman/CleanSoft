import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { Service, ServiceCategory, AdditionalService, ServiceSearchParams } from '../../models';
import { Subject, takeUntil } from 'rxjs';

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
    private serviceService: ServiceService,
    private fb: FormBuilder
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      basePrice: ['', [Validators.required, Validators.min(0)]],
      additionalServices: [[]]
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
    
    // Observar mudanças nos serviços
    this.serviceService.getServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadServices() {
    this.serviceService.getServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.applyFilters();
      });
  }

  loadStats() {
    this.serviceService.getServiceStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  loadAvailableCategories() {
    this.serviceService.getAvailableCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.availableCategories = categories;
      });
  }

  loadAdditionalServices() {
    this.serviceService.getAdditionalServices()
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
    
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      additionalServices: service.additionalServices || []
    });
    
    this.selectedAdditionalServices = [];
    this.showForm = true;
  }

  viewService(service: Service) {
    this.selectedService = service;
    this.showForm = false;
  }

  saveService() {
    if (this.serviceForm.valid) {
      const formValue = this.serviceForm.value;
      
      if (this.isCreating) {
        this.serviceService.createService({
          ...formValue,
          additionalServices: [],
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadServices();
          this.loadStats();
        });
      } else if (this.isEditing && this.selectedService) {
        this.serviceService.updateService(this.selectedService.id, {
          ...formValue,
          additionalServices: []
        }).subscribe(() => {
          this.closeForm();
          this.loadServices();
          this.loadStats();
        });
      }
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
      
      this.serviceService.createAdditionalService({
        ...formValue,
        serviceId: 1, // Por enquanto, associando ao primeiro serviço
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
    this.serviceService.deactivateService(service.id).subscribe(() => {
      this.loadServices();
      this.loadStats();
    });
  }

  activateService(service: Service) {
    this.serviceService.activateService(service.id).subscribe(() => {
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
    if (!service.additionalServices || service.additionalServices.length === 0) {
      return 'Nenhum';
    }
    
    const additionalNames = service.additionalServices
      .map(additional => additional.name)
      .join(', ');
    
    return additionalNames || 'Nenhum';
  }

  calculateServiceTotal(service: Service): number {
    let total = service.basePrice;
    
    if (service.additionalServices && service.additionalServices.length > 0) {
      service.additionalServices.forEach(additional => {
        if (additional.isActive) {
          total += additional.additionalPrice;
        }
      });
    }
    
    return total;
  }
}
