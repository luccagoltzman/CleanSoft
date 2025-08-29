import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Vehicle, Customer } from '../../models';
import { Subject, takeUntil, combineLatest, of, Observable, timer } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { VehicleApiService, VehicleBrand, VehicleModel } from '../../services/vehicle-api.service';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';
import { StatsSkeletonComponent } from '../../shared/components';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, StatsSkeletonComponent],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.css'
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  customers: Customer[] = [];
  selectedVehicle: Vehicle | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  isLoading = false;
  searchTerm = '';
  brandFilter = '';
  customerFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  vehicleForm: FormGroup;
  stats: {
    total: number;
    active: number;
    inactive: number;
    byBrand: { brand: string; count: number }[];
    byYear: { year: number; count: number }[];
  } = { total: 0, active: 0, inactive: 0, byBrand: [], byYear: [] };
  availableBrands: VehicleBrand[] = [];
  isLoadingBrands = false;
  isLoadingModels = false;

  selectedBrandCode = '';
  selectedModelCode = '';


  availableModels: VehicleModel[] = [];

  private destroy$ = new Subject<void>();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedVehicles: Vehicle[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private vehicleApi: VehicleApiService,
    private paginationService: PaginationService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.vehicleForm = this.fb.group({
      customerId: ['', Validators.required],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}$/)]],
      brand: ['', Validators.required],
      brandCode: [''],
      model: ['', Validators.required],
      modelCode: [''],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      color: ['', Validators.required],
      observations: ['']
    });
  }

  ngOnInit() {
    this.loadVehicles();
    this.loadCustomers();
    this.loadBrands();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicles() {
    this.isLoading = true;
    this.api.getAll('vehicles')
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicles => {
        this.vehicles = vehicles;
        this.applyFilters();
        this.loadStats();
        // Adiciona delay mínimo de 1.5 segundos para mostrar o skeleton
        timer(1500).subscribe(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      });
  }

  loadCustomers() {
    this.api.getAll('clients', { isActive: 'eq.true' })
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers
      });
  }

  loadStats() {
    const vehicles = this.vehicles || [];

    this.stats.total = vehicles.length;
    this.stats.active = vehicles.filter(v => v.isActive).length;
    this.stats.inactive = vehicles.filter(v => !v.isActive).length;

    const brandMap: { [brand: string]: number } = {};
    vehicles.forEach(v => {
      const brand = v.brand || 'Unknown';
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    this.stats.byBrand = Object.keys(brandMap).map(brand => ({
      brand,
      count: brandMap[brand]
    }));

    // Estatísticas por ano
    const yearMap: { [year: number]: number } = {};
    vehicles.forEach(v => {
      const year = v.year || 0;
      yearMap[year] = (yearMap[year] || 0) + 1;
    });
    this.stats.byYear = Object.keys(yearMap).map(year => ({
      year: Number(year),
      count: yearMap[Number(year)]
    })).sort((a, b) => b.year - a.year);
  }


  loadBrands() {
    this.isLoadingBrands = true;
    this.vehicleApi.getBrands()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (brands) => {
          this.availableBrands = brands;
          this.isLoadingBrands = false;
          this.cdr.detectChanges();
          console.log(`${brands.length} marcas carregadas da API FIPE`);
        },
        error: (error) => {
          console.error('Erro ao carregar marcas da API FIPE:', error);
          this.isLoadingBrands = false;
          this.availableBrands = [];
          this.toast.error('Não foi possível carregar as marcas. Verifique sua conexão com a internet.', 'Erro API FIPE');
        }
      });
  }

  getModelsByBrand(brandCode: string): Observable<VehicleModel[]> {
    return this.vehicleApi.getModelsByBrand(brandCode);
  }

  onBrandChange() {
    const selectedBrand = this.vehicleForm.get('brand')?.value;
    
    if (selectedBrand) {
      // Encontrar o código da marca selecionada
      const brand = this.availableBrands.find(b => b.name === selectedBrand);
      
      if (brand) {
        this.selectedBrandCode = brand.code || brand.id;
        this.vehicleForm.get('brandCode')?.setValue(this.selectedBrandCode);
        
        this.isLoadingModels = true;
        this.getModelsByBrand(this.selectedBrandCode)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (models) => {
              this.availableModels = models;
              this.vehicleForm.get('model')?.setValue('');
              this.vehicleForm.get('modelCode')?.setValue('');
              this.isLoadingModels = false;
              this.cdr.detectChanges();
              console.log(`${models.length} modelos carregados da API FIPE para marca ${selectedBrand}`);
            },
            error: (error) => {
              console.error('Erro ao carregar modelos da API FIPE:', error);
              this.availableModels = [];
              this.isLoadingModels = false;
              this.toast.error('Não foi possível carregar os modelos. Verifique sua conexão com a internet.', 'Erro API FIPE');
            }
          });
      }
    } else {
      this.availableModels = [];
      this.selectedBrandCode = '';
      this.vehicleForm.get('model')?.setValue('');
      this.vehicleForm.get('brandCode')?.setValue('');
      this.vehicleForm.get('modelCode')?.setValue('');
    }
  }

  onModelChange() {
    const selectedModel = this.vehicleForm.get('model')?.value;
    
    if (selectedModel) {
      const model = this.availableModels.find(m => m.name === selectedModel);
      if (model) {
        this.selectedModelCode = model.code || model.id;
        this.vehicleForm.get('modelCode')?.setValue(this.selectedModelCode);
      }
    } else {
      this.selectedModelCode = '';
      this.vehicleForm.get('modelCode')?.setValue('');
    }
  }


  applyFilters() {
    let filtered = [...this.vehicles];

    // Filtro por termo de busca
    if (this.searchTerm) {
      filtered = filtered.filter(v =>
        v.licensePlate.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.color.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por marca
    if (this.brandFilter) {
      filtered = filtered.filter(v => v.brand === this.brandFilter);
    }

    // Filtro por cliente
    if (this.customerFilter) {
      filtered = filtered.filter(v => v.customerId === parseInt(this.customerFilter));
    }

    // Filtro por status
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(v => v.isActive === isActive);
    }

    this.filteredVehicles = filtered;
    this.updatePaginatedVehicles();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onBrandFilterChange() {
    this.applyFilters();
  }

  onCustomerFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Métodos de paginação
  updatePaginatedVehicles() {
    this.paginatedVehicles = this.paginationService.paginate(
      this.filteredVehicles,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedVehicles();
  }

  createVehicle() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedVehicle = null;
    this.vehicleForm.reset();
    this.availableModels = [];
    this.showForm = true;
  }

  editVehicle(vehicle: Vehicle) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedVehicle = vehicle;

    // Carregar modelos da marca selecionada
            // Buscar a marca pelo nome
        const brand = this.availableBrands.find(b => b.name === vehicle.brand);
        if (brand) {
          this.selectedBrandCode = brand.code || brand.id;
          
          this.getModelsByBrand(this.selectedBrandCode)
            .pipe(takeUntil(this.destroy$))
            .subscribe(models => {
              this.availableModels = models;
              
              const model = models.find(m => m.name === vehicle.model);
              this.selectedModelCode = model ? (model.code || model.id) : '';

              this.vehicleForm.patchValue({
                customerId: vehicle.customerId,
                licensePlate: vehicle.licensePlate,
                brand: vehicle.brand,
                brandCode: this.selectedBrandCode,
                model: vehicle.model,
                modelCode: this.selectedModelCode,
                year: vehicle.year,
                color: vehicle.color,
                observations: vehicle.observations
              });
            });
        } else {
          // Se não encontrar a marca na API, usar dados existentes
          this.vehicleForm.patchValue({
            customerId: vehicle.customerId,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            brandCode: vehicle.brandCode || '',
            model: vehicle.model,
            modelCode: vehicle.modelCode || '',
            year: vehicle.year,
            color: vehicle.color,
            observations: vehicle.observations
          });
        }

    this.showForm = true;
  }

  viewVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.showForm = false;
  }

  saveVehicle() {
    if (this.vehicleForm.valid) {
      const formValue = this.vehicleForm.value;

      if (this.isCreating) {
        const vehicleData = {
          ...formValue,
          isActive: true,
          // Remover campos auxiliares antes de salvar
          brandCode: undefined,
          modelCode: undefined
        };
        
        // Limpar campos auxiliares
        delete vehicleData.brandCode;
        delete vehicleData.modelCode;
        
        this.api.create('vehicles', vehicleData).subscribe(() => {
          this.closeForm();
          this.loadVehicles();
          this.loadStats();
          this.toast.success('Veículo criado com sucesso!');
        }, (error) => {
          this.toast.error('Erro ao criar veículo:', error);
        });
      } else if (this.isEditing && this.selectedVehicle) {
        const vehicleData = { ...formValue };
        
        // Remover campos auxiliares antes de salvar
        delete vehicleData.brandCode;
        delete vehicleData.modelCode;
        
        this.api.update('vehicles', this.selectedVehicle.id, vehicleData)
          .subscribe(() => {
            this.closeForm();
            this.loadVehicles();
            this.toast.success('Veículo atualizado com sucesso!');
          }, (error) => {
            this.toast.error('Erro ao atualizar veículo:', error);
          });
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedVehicle = null;
    this.vehicleForm.reset();
    this.availableModels = [];
  }

  toggleVehicleStatus(vehicle: Vehicle) {
    if (vehicle.isActive) {
      this.api.update('vehicles', vehicle.id, { isActive: false }).subscribe(() => {
        this.loadVehicles();
        this.loadStats();
        this.toast.success('Veículo inativado com sucesso!');
      }, (error) => {
        this.toast.error('Erro ao inativar veículo:', error);
      });
    } else {
      this.api.update('vehicles', vehicle.id, { isActive: true }).subscribe(() => {
        this.loadVehicles();
        this.loadStats();
        this.toast.success('Veículo ativado com sucesso!');
      }, (error) => {
        this.toast.error('Erro ao ativar veículo:', error);
      });
    }
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Cliente não encontrado';
  }

  formatLicensePlate(plate: string): string {
    return plate.toUpperCase();
  }

  getYearRange(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  }

  getColors(): string[] {
    return [
      'Branco', 'Preto', 'Prata', 'Cinza', 'Azul', 'Vermelho',
      'Verde', 'Amarelo', 'Laranja', 'Rosa', 'Roxo', 'Marrom'
    ];
  }
}
