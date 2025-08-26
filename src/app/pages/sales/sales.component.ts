import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { Sale, SaleItem, PaymentMethod, PaymentStatus, Customer, Vehicle, Product, Service } from '../../models';
import { Subject, takeUntil, combineLatest, forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
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

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedSales: Sale[] = [];

  constructor(
    private saleService: SaleService,
    private api: ApiService,
    private fb: FormBuilder,
    private paginationService: PaginationService
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
    this.loadSales();
    // this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSales() {

    this.api.getAll('sales', undefined, ['sale_items(*)']).subscribe((sales: any[]) => {
      const formattedSales = sales.map(sale => ({
        ...sale,
        items: sale.sale_items,
      })).map(sale => {
        delete sale.sale_items;
        return sale;
      });
      this.sales = formattedSales;
      console.log('Vendas com items renomeados:', formattedSales);
      this.applyFilters();
    });


  }

  loadCustomers() {
    this.api.getAll('clients')
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers;
      });
  }

  loadVehicles() {
    this.api.getByColumn('vehicles', 'customerId', this.saleForm.get('customerId')?.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(vehicles => {
        this.vehicles = vehicles;
      });
  }

  loadProducts() {
    this.api.getAll('products')
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
      });
  }



  loadStats() {
    this.saleService.getSalesReport()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
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
    this.updatePaginatedSales();
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

  // Métodos de paginação
  updatePaginatedSales() {
    this.paginatedSales = this.paginationService.paginate(
      this.filteredSales,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedSales();
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
        created_at: new Date()
      };

      const saveItems = (saleId: number) => {
        const saleItemsData = this.items.value.map((item: any) => ({
          saleId: saleId,
          productId: item.type === 'product' ? item.productId : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          notes: item.notes
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
    this.saleService.cancelSale(sale.id).subscribe(() => {
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
      item.patchValue({ serviceId: '' });
    } else {
      item.patchValue({ productId: '' });
    }
  }

  onProductChange(index: number) {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    const product = this.products.find(p => p.id === productId);

    if (product) {
      item.patchValue({ unitPrice: product.salePrice });
    }
  }

  onServiceChange(index: number) {
    const item = this.items.at(index);
    const serviceId = item.get('serviceId')?.value;
    const service = this.services.find(s => s.id === serviceId);

    if (service) {
      item.patchValue({ unitPrice: service.basePrice });
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
