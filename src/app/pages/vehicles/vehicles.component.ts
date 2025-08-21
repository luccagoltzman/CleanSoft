import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Vehicle, Customer } from '../../models';
import { Subject, takeUntil, combineLatest, of, Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  availableBrands: string[] = [
    'Honda',
    'Toyota',
    'Ford',
    'Chevrolet',
    'Volkswagen',
    'Nissan',
    'Hyundai'
  ];

  brandModels = [
    { brand: 'Honda', model: 'Civic' },
    { brand: 'Honda', model: 'Accord' },
    { brand: 'Honda', model: 'HR-V' },
    { brand: 'Honda', model: 'Fit' },

    { brand: 'Toyota', model: 'Corolla' },
    { brand: 'Toyota', model: 'Camry' },
    { brand: 'Toyota', model: 'Yaris' },
    { brand: 'Toyota', model: 'RAV4' },

    { brand: 'Ford', model: 'Mustang' },
    { brand: 'Ford', model: 'Fiesta' },
    { brand: 'Ford', model: 'EcoSport' },
    { brand: 'Ford', model: 'Focus' },

    { brand: 'Chevrolet', model: 'Onix' },
    { brand: 'Chevrolet', model: 'Cruze' },
    { brand: 'Chevrolet', model: 'Tracker' },
    { brand: 'Chevrolet', model: 'S10' },

    { brand: 'Volkswagen', model: 'Golf' },
    { brand: 'Volkswagen', model: 'Polo' },
    { brand: 'Volkswagen', model: 'T-Cross' },
    { brand: 'Volkswagen', model: 'Virtus' },

    { brand: 'Nissan', model: 'Sentra' },
    { brand: 'Nissan', model: 'Altima' },
    { brand: 'Nissan', model: 'Kicks' },
    { brand: 'Nissan', model: 'Versa' },

    { brand: 'Hyundai', model: 'HB20' },
    { brand: 'Hyundai', model: 'Creta' },
    { brand: 'Hyundai', model: 'Tucson' },
    { brand: 'Hyundai', model: 'Elantra' }
  ];


  availableModels: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.vehicleForm = this.fb.group({
      customerId: ['', Validators.required],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}$/)]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      color: ['', Validators.required],
      observations: ['']
    });
  }

  ngOnInit() {
    this.loadVehicles();
    this.loadCustomers();

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicles() {
    this.api.getAll('vehicles')
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicles => {
        this.vehicles = vehicles;
        this.applyFilters();
        this.loadStats();
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


  getModelsByBrand(brand: string): Observable<string[]> {
    const models = [...new Set(
      this.brandModels
        .filter(v => v.brand?.toLowerCase() === brand.toLowerCase())
        .map(v => v.model)
        .filter(m => m) // remove modelos null ou undefined
    )];
    return of(models.sort());
  }

  onBrandChange() {
    const brand = this.vehicleForm.get('brand')?.value;
    if (brand) {
      this.getModelsByBrand(brand)
        .pipe(takeUntil(this.destroy$))
        .subscribe(models => {
          this.availableModels = models;
          this.vehicleForm.get('model')?.setValue('');
        });
    } else {
      this.availableModels = [];
      this.vehicleForm.get('model')?.setValue('');
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
    this.getModelsByBrand(vehicle.brand)
      .pipe(takeUntil(this.destroy$))
      .subscribe(models => {
        this.availableModels = models;

        this.vehicleForm.patchValue({
          customerId: vehicle.customerId,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          observations: vehicle.observations
        });
      });

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
        this.api.create('vehicles', {
          ...formValue,
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadVehicles();
          this.loadStats();
        });
      } else if (this.isEditing && this.selectedVehicle) {
        this.api.update('vehicles', this.selectedVehicle.id, formValue)
          .subscribe(() => {
            this.closeForm();
            this.loadVehicles();
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
      });
    } else {
      this.api.update('vehicles', vehicle.id, { isActive: true }).subscribe(() => {
        this.loadVehicles();
        this.loadStats();
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
