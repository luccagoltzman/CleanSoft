import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, Supplier, StockMovementReason } from '../../models';
import {  Subject, takeUntil, timer } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../shared/services/pagination.service';
import { StatsSkeletonComponent } from '../../shared/components';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, StatsSkeletonComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  suppliers: Supplier[] = [];
  selectedProduct: Product | null = null;
  selectedSupplier: Supplier | null = null;
  isEditing = false;
  isCreating = false;
  showForm = false;
  showSupplierForm = false;
  showStockMovementForm = false;
  searchTerm = '';
  categoryFilter = '';
  supplierFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stockFilter: 'all' | 'low' | 'out' = 'all';

  productForm: FormGroup;
  supplierForm: FormGroup;
  stockMovementForm: FormGroup;

  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    averageValue: number;
  } = {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalValue: 0,
      averageValue: 0
    };

  availableCategories: string[] = [];
  availableUnits: string[] = [];
  stockMovementReasons = Object.values(StockMovementReason);
  isLoading = false;

  private destroy$ = new Subject<void>();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  paginatedProducts: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private paginationService: PaginationService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      category: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      unit: ['', Validators.required],
      costPrice: ['', [Validators.required, Validators.min(0)]],
      salePrice: ['', [Validators.required, Validators.min(0)]],
      currentStock: ['', [Validators.required, Validators.min(0)]],
      minStock: ['', [Validators.required, Validators.min(0)]],
      supplierId: ['', Validators.required]
    });

    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      document: ['', [Validators.required, Validators.minLength(11)]],
      contact: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.stockMovementForm = this.fb.group({
      productId: ['', Validators.required],
      type: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.loadSuppliers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts() {
    this.isLoading = true;
    this.api.getAll('products')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.applyFilters();
          this.loadStats();
          this.loadAvailableCategories();
          this.loadAvailableUnits();
          // Adiciona delay mínimo de 1.5 segundos para mostrar o skeleton
          timer(1500).subscribe(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Erro ao carregar produtos:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadSuppliers() {
    this.api.getAll('suppliers')
      .pipe(takeUntil(this.destroy$))
      .subscribe(suppliers => {
        this.suppliers = suppliers;
      });
  }

  loadStats() {
    if (!this.products || this.products.length === 0) {
      this.stats = {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0,
        averageValue: 0
      };
      return;
    }

    const totalProducts = this.products.length;
    const activeProducts = this.products.filter(p => p.isActive).length;
    const lowStockProducts = this.products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;
    const outOfStockProducts = this.products.filter(p => p.currentStock === 0).length;
    const totalValue = this.products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const averageValue = totalProducts ? totalValue / totalProducts : 0;

    this.stats = {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      averageValue
    };
  }

  loadAvailableCategories() {

    const categories = [...new Set(this.products.map(p => p.category))];
    this.availableCategories = categories;
    console.log(categories);

  }

  loadAvailableUnits() {
    this.availableUnits = [...new Set(this.products.map(p => p.unit))];;
  }

  applyFilters() {
    let filtered = [...this.products];

    // Filtro por termo de busca
    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (this.categoryFilter) {
      filtered = filtered.filter(p => p.category === this.categoryFilter);
    }

    // Filtro por fornecedor
    if (this.supplierFilter) {
      filtered = filtered.filter(p => p.supplierId === parseInt(this.supplierFilter));
    }

    // Filtro por status
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(p => p.isActive === isActive);
    }

    // Filtro por estoque
    if (this.stockFilter === 'low') {
      filtered = filtered.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    } else if (this.stockFilter === 'out') {
      filtered = filtered.filter(p => p.currentStock === 0);
    }

    this.filteredProducts = filtered;
    this.updatePaginatedProducts();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onCategoryFilterChange() {
    this.applyFilters();
  }

  onSupplierFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onStockFilterChange() {
    this.applyFilters();
  }

  // Métodos de paginação
  updatePaginatedProducts() {
    this.paginatedProducts = this.paginationService.paginate(
      this.filteredProducts,
      this.currentPage,
      this.pageSize
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedProducts();
  }

  createProduct() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedProduct = null;
    this.productForm.reset();
    this.showForm = true;
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.isCreating = false;
    this.selectedProduct = product;

    this.productForm.patchValue({
      category: product.category,
      name: product.name,
      description: product.description,
      sku: product.sku,
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      currentStock: product.currentStock,
      minStock: product.minStock,
      supplierId: product.supplierId
    });

    this.showForm = true;
  }

  viewProduct(product: Product) {
    this.selectedProduct = product;
    this.showForm = false;
  }

  saveProduct() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;

      if (this.isCreating) {
        this.api.create('products', {
          ...formValue,
          isActive: true
        }).subscribe(() => {
          this.closeForm();
          this.loadProducts();
          this.loadStats();
          this.toast.success('Produto criado com sucesso!');
        }, error => {
          this.toast.error('Erro ao criar produto:', error);
        });
      } else if (this.isEditing && this.selectedProduct) {
        this.api.update('products', this.selectedProduct.id, formValue).subscribe(() => {
          this.closeForm();
          this.loadProducts();
          this.loadStats();
          this.toast.success('Produto atualizado com sucesso!');
        }, error => {
          this.toast.error('Erro ao atualizar produto:', error);
        });
      }
    }
  }

  closeForm() {
    this.showForm = false;
    this.isCreating = false;
    this.isEditing = false;
    this.selectedProduct = null;
    this.productForm.reset();
  }

  createSupplier() {
    this.showSupplierForm = true;
    this.supplierForm.reset();
  }

  saveSupplier() {
    if (this.supplierForm.valid) {
      const formValue = this.supplierForm.value;

      this.api.create('suppliers', {
        ...formValue,
        isActive: true
      }).subscribe(() => {
        this.closeSupplierForm();
        this.loadSuppliers();
        this.toast.success('Fornecedor criado com sucesso!');
      }, error => {
        this.toast.error('Erro ao criar fornecedor:', error);
      });
    }
  }

  closeSupplierForm() {
    this.showSupplierForm = false;
    this.supplierForm.reset();
  }

  createStockMovement() {
    this.showStockMovementForm = true;
    this.stockMovementForm.reset();
  }

  saveStockMovement() {
    if (this.stockMovementForm.valid) {
      const formValue = this.stockMovementForm.value;

      this.api.create('cash_movements', {
        ...formValue
      }).subscribe(() => {
        this.closeStockMovementForm();
        this.loadProducts();
        this.loadStats();
        this.toast.success('Movimento de estoque criado com sucesso!');
      }, error => {
        this.toast.error('Erro ao criar movimento de estoque:', error);
      });
    }
  }

  closeStockMovementForm() {
    this.showStockMovementForm = false;
    this.stockMovementForm.reset();
  }

  deactivateProduct(product: Product) {
    // this.productService.deactivateProduct(product.id).subscribe(() => {
    //   this.loadProducts();
    //   this.loadStats();
    // });
  }

  activateProduct(product: Product) {
    // this.productService.activateProduct(product.id).subscribe(() => {
    //   this.loadProducts();
    //   this.loadStats();
    // });
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'N/A';
  }

  getStockStatusClass(product: Product): string {
    if (product.currentStock === 0) return 'out-of-stock';
    if (product.currentStock <= product.minStock) return 'low-stock';
    return 'normal-stock';
  }

  getStockStatusText(product: Product): string {
    if (product.currentStock === 0) return 'Sem Estoque';
    if (product.currentStock <= product.minStock) return 'Estoque Baixo';
    return 'Normal';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getReasonText(reason: StockMovementReason): string {
    switch (reason) {
      case StockMovementReason.PURCHASE: return 'Compra';
      case StockMovementReason.SALE: return 'Venda';
      case StockMovementReason.ADJUSTMENT: return 'Ajuste';
      case StockMovementReason.SERVICE_USE: return 'Uso em Serviço';
      case StockMovementReason.RETURN: return 'Retorno';
      default: return reason;
    }
  }

  getMovementTypeText(type: 'entry' | 'exit'): string {
    return type === 'entry' ? 'Entrada' : 'Saída';
  }

  getMovementTypeClass(type: 'entry' | 'exit'): string {
    return type === 'entry' ? 'entry' : 'exit';
  }
}
