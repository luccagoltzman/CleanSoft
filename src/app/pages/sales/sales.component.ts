import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { Sale, SaleItem, PaymentMethod, PaymentStatus, Customer, Vehicle, Product, Service } from '../../models';
import { Subject, takeUntil, combineLatest, forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements OnInit, OnDestroy {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  products: Product[] = [];
  services: Service[] = [];
  selectedSale: Sale | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  searchTerm = '';
  customerFilter = '';
  statusFilter: 'all' | 'paid' | 'pending' | 'cancelled' = 'all';
  methodFilter: 'all' | 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'check' | 'installment' = 'all';
  startDateFilter = '';
  endDateFilter = '';

  saleForm: FormGroup;

  stats: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    paidSales: number;
    pendingSales: number;
    cancelledSales: number;
  } = {
      totalSales: 0,
      totalRevenue: 0,
      averageTicket: 0,
      paidSales: 0,
      pendingSales: 0,
      cancelledSales: 0
    };

  paymentMethods = Object.values(PaymentMethod);
  paymentStatuses = Object.values(PaymentStatus);

  private destroy$ = new Subject<void>();

  constructor(
    private saleService: SaleService,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.saleForm = this.fb.group({
      customerId: ['', Validators.required],
      vehicleId: [''],
      items: this.fb.array([]),
      discount: [0, [Validators.min(0)]],
      paymentMethod: ['', Validators.required],
      paymentStatus: [PaymentStatus.PENDING, Validators.required],
      notes: [''],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.loadCustomers();
    this.loadProducts();
    this.loadServices();
    this.loadSales();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSales() {
    this.api.getAll('sales', undefined, ['sale_items(*)']).subscribe((sales: any[]) => {
      const formattedSales = sales.map(sale => ({
        id: sale.id,
        customerId: sale.customerId,
        vehicleId: sale.vehicleId,
        subtotal: sale.subtotal || 0,
        discount: sale.discount || 0,
        total: sale.total || 0,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        notes: sale.notes,
        date: sale.date ? new Date(sale.date) : new Date(),
        createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
        updatedAt: sale.updatedAt ? new Date(sale.updatedAt) : new Date(),
        createdBy: sale.createdBy || 1, // Valor padrão se não existir
        items: sale.sale_items ? sale.sale_items.map((item: any) => ({
          id: item.id,
          saleId: item.saleId,
          type: item.type,
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          discount: item.discount || 0,
          notes: item.notes
        })) : []
      }));
      
      this.sales = formattedSales;''
      console.log('Vendas formatadas:', formattedSales);
      this.applyFilters();
      this.loadStats(); // Carrega as estatísticas após carregar as vendas
    });
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
          createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
          updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
          vehicles: []
        }));
      });
  }

  loadVehicles() {
    this.api.getByColumn('vehicles', 'customerId', this.saleForm.get('customerId')?.value)
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

  loadProducts() {
    this.api.getAll('products')
      .pipe(takeUntil(this.destroy$))
      .subscribe((products: any[]) => {
        this.products = products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku || '',
          unit: product.unit || 'un',
          costPrice: product.costPrice || 0,
          salePrice: product.salePrice || 0,
          currentStock: product.currentStock || product.stock || 0,
          minStock: product.minStock || 0,
          category: product.category || '',
          brand: product.brand || '',
          isActive: product.isActive !== undefined ? product.isActive : true,
          supplierId: product.supplierId || 1,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
          updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date()
        }));
      });
  }

  loadServices() {
    this.api.getAll('services')
      .pipe(takeUntil(this.destroy$))
      .subscribe((services: any[]) => {
        this.services = services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          basePrice: service.basePrice || 0,
          isActive: service.isActive !== undefined ? service.isActive : true,
          createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
          updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date()
        }));
      });
  }



  loadStats() {
    // Calcula estatísticas baseadas nos dados carregados
    const totalSales = this.sales.length;
    const totalRevenue = this.sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const paidSales = this.sales.filter(s => s.paymentStatus === 'paid').length;
    const pendingSales = this.sales.filter(s => s.paymentStatus === 'pending').length;
    const cancelledSales = this.sales.filter(s => s.paymentStatus === 'cancelled').length;

    this.stats = {
      totalSales,
      totalRevenue,
      averageTicket,
      paidSales,
      pendingSales,
      cancelledSales
    };
  }

  applyFilters() {
    let filtered = [...this.sales];

    // Filtro por termo de busca
    if (this.searchTerm) {
      filtered = filtered.filter(s => {
        const customer = this.customers.find(c => c.id === s.customerId);
        return customer?.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          customer?.phone.includes(this.searchTerm) ||
          s.notes?.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
    }

    // Filtro por cliente
    if (this.customerFilter) {
      filtered = filtered.filter(s => s.customerId === parseInt(this.customerFilter));
    }

    // Filtro por status
    if (this.statusFilter !== 'all') {
      const status = this.statusFilter === 'paid' ? PaymentStatus.PAID :
        this.statusFilter === 'pending' ? PaymentStatus.PENDING :
          PaymentStatus.CANCELLED;
      filtered = filtered.filter(s => s.paymentStatus === status);
    }

    // Filtro por método de pagamento
    if (this.methodFilter !== 'all') {
      const method = this.methodFilter as PaymentMethod;
      filtered = filtered.filter(s => s.paymentMethod === method);
    }

    // Filtro por data
    if (this.startDateFilter) {
      const startDate = new Date(this.startDateFilter);
      filtered = filtered.filter(s => s.date >= startDate);
    }

    if (this.endDateFilter) {
      const endDate = new Date(this.endDateFilter);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(s => s.date <= endDate);
    }

    this.filteredSales = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onCustomerFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onMethodFilterChange() {
    this.applyFilters();
  }

  onDateFilterChange() {
    this.applyFilters();
  }

  createSale() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedSale = null;
    this.saleForm.reset({
      paymentStatus: PaymentStatus.PENDING,
      date: new Date()
    });
    this.clearItems();
    this.addItem();
    this.showForm = true;
  }

  editSale(sale: Sale) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedSale = sale;

    this.clearItems();
    sale.items.forEach(item => this.addItem(item));

    this.saleForm.patchValue({
      customerId: sale.customerId,
      vehicleId: sale.vehicleId,
      discount: sale.discount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      notes: sale.notes,
      date: sale.date
    });

    this.showForm = true;
  }

  viewSale(sale: Sale) {
    this.selectedSale = sale;
    this.showForm = false;
  }

  saveSale() {
    console.log(this.saleForm.valid && this.items.length > 0);

    if (this.saleForm.valid && this.items.length > 0) {
      const formValue = this.saleForm.value;

      const saleData = {
        customerId: formValue.customerId,
        vehicleId: formValue.vehicleId,
        total: this.calculateSaleTotal(),
        discount: formValue.discount || 0,
        paymentMethod: formValue.paymentMethod,
        paymentStatus: formValue.paymentStatus || 'pending',
        notes: formValue.notes || ''
      };

      const saveItems = (saleId: number) => {
        const saleItemsData = this.items.value.map((item: any) => ({
          saleId: saleId,
          productId: item.type === 'product' ? item.productId : undefined,
          serviceId: item.type === 'service' ? item.serviceId : undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          notes: item.notes || ''
        }));

        return forkJoin(
          saleItemsData.map((itemData: any) => this.api.create('sale_items', itemData))
        );
      };

      if (this.isCreating) {
        this.api.create('sales', saleData).subscribe((sale: any) => {
          saveItems(sale[0].id).subscribe(() => {
            console.log('Venda e itens criados:', sale);
            this.closeForm();
            this.loadSales();
            this.loadStats();
          });
        });
      } else if (this.isEditing && this.selectedSale) {
        this.api.update('sales', this.selectedSale.id, saleData).subscribe(() => {
          this.api.deleteByColumn('sale_items', 'saleId', this.selectedSale!.id).subscribe(() => {
            saveItems(this.selectedSale!.id).subscribe(() => {
              console.log('Venda atualizada e itens substituídos');
              this.closeForm();
              this.loadSales();
              this.loadStats();
            });
          });
        });
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedSale = null;
    this.saleForm.reset();
    this.clearItems();
  }

  cancelSale(sale: Sale) {
    const updateData = {
      paymentStatus: 'cancelled'
    };
    
    this.api.update('sales', sale.id, updateData).subscribe(() => {
      this.loadSales();
      this.loadStats();
    });
  }

  // Getters para FormArray
  get items() {
    return this.saleForm.get('items') as FormArray;
  }

  addItem(item?: SaleItem) {
    const itemForm = this.fb.group({
      type: [item?.type || 'product', Validators.required],
      productId: [item?.productId || ''],
      serviceId: [item?.serviceId || ''],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      discount: [item?.discount || 0, [Validators.min(0)]],
      notes: [item?.notes || '']
    });

    this.items.push(itemForm);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  clearItems() {
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
  }

  // Métodos auxiliares
  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : 'N/A';
  }

  getVehicleInfo(vehicleId: number): string {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model}` : 'N/A';
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'N/A';
  }

  getServiceName(serviceId: number): string {
    const service = this.services.find(s => s.id === serviceId);
    return service ? service.name : 'N/A';
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }


  // Métodos para cálculo de totais
  calculateItemTotal(item: any): number {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal - (item.discount || 0);
  }

  calculateSaleSubtotal(): number {
    return this.items.value.reduce((sum: number, item: any) => {
      return sum + this.calculateItemTotal(item);
    }, 0);
  }

  calculateSaleTotal(): number {
    const subtotal = this.calculateSaleSubtotal();
    const discount = this.saleForm.get('discount')?.value || 0;
    return subtotal - discount;
  }

  // Métodos para seleção de produtos/serviços
  onItemTypeChange(index: number) {
    const item = this.items.at(index);
    const type = item.get('type')?.value;

    if (type === 'product') {
      item.patchValue({ 
        serviceId: '', 
        unitPrice: 0
      });
    } else {
      item.patchValue({ 
        productId: '', 
        unitPrice: 0
      });
    }
  }

  onProductChange(index: number) {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    
    if (productId) {
      const product = this.products.find(p => p.id === productId);
      if (product) {
        item.patchValue({ unitPrice: product.salePrice });
      } else {
        item.patchValue({ unitPrice: 0 });
      }
    } else {
      item.patchValue({ unitPrice: 0 });
    }
  }

  onServiceChange(index: number) {
    const item = this.items.at(index);
    const serviceId = item.get('serviceId')?.value;
    
    if (serviceId) {
      const service = this.services.find(s => s.id === serviceId);
      if (service) {
        item.patchValue({ unitPrice: service.basePrice });
      } else {
        item.patchValue({ unitPrice: 0 });
      }
    } else {
      item.patchValue({ unitPrice: 0 });
    }
  }

  // Filtros para veículos por cliente
  getVehiclesByCustomer(customerId: number): Vehicle[] {
    return this.vehicles.filter(v => v.customerId === customerId);
  }

  onCustomerChange() {
    this.saleForm.patchValue({ vehicleId: '' });
    this.loadVehicles();
  }
}
