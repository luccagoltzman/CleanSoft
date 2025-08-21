import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../services/vehicle.service';
import { CustomerService } from '../../services/customer.service';
import { Vehicle, VehicleSearchParams, Customer } from '../../models';
import { Subject, takeUntil, combineLatest } from 'rxjs';

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
  availableBrands: string[] = [];
  availableModels: string[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private vehicleService: VehicleService,
    private customerService: CustomerService,
    private fb: FormBuilder
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
    this.loadStats();
    this.loadAvailableBrands();
    
    // Observar mudanças nos veículos
    this.vehicleService.getVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicles => {
        this.vehicles = vehicles;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicles() {
    this.vehicleService.getVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicles => {
        this.vehicles = vehicles;
        this.applyFilters();
      });
  }

  loadCustomers() {
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers.filter(c => c.isActive);
      });
  }

  loadStats() {
    this.vehicleService.getVehicleStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  loadAvailableBrands() {
    this.vehicleService.getAvailableBrands()
      .pipe(takeUntil(this.destroy$))
      .subscribe(brands => {
        this.availableBrands = brands;
      });
  }

  onBrandChange() {
    const brand = this.vehicleForm.get('brand')?.value;
    if (brand) {
      this.vehicleService.getModelsByBrand(brand)
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
    this.vehicleService.getModelsByBrand(vehicle.brand)
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
        this.vehicleService.createVehicle({
          ...formValue,
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadVehicles();
          this.loadStats();
        });
      } else if (this.isEditing && this.selectedVehicle) {
        this.vehicleService.updateVehicle(this.selectedVehicle.id, formValue)
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
      this.vehicleService.deactivateVehicle(vehicle.id).subscribe(() => {
        this.loadVehicles();
        this.loadStats();
      });
    } else {
      this.vehicleService.activateVehicle(vehicle.id).subscribe(() => {
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
