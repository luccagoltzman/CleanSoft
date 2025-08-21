import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Product, Supplier, StockMovement, StockMovementReason, ProductSearchParams, StockReport } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: 1,
      category: 'Limpeza',
      name: 'Shampoo Automotivo',
      description: 'Shampoo especial para lavagem de veículos',
      sku: 'SHA001',
      unit: 'Litro',
      costPrice: 15.00,
      salePrice: 25.00,
      currentStock: 50,
      minStock: 10,
      isActive: true,
      supplierId: 1,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 2,
      category: 'Limpeza',
      name: 'Cera de Proteção',
      description: 'Cera para proteção da pintura do veículo',
      sku: 'CERA001',
      unit: 'Unidade',
      costPrice: 8.00,
      salePrice: 15.00,
      currentStock: 30,
      minStock: 5,
      isActive: true,
      supplierId: 1,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 3,
      category: 'Limpeza',
      name: 'Limpador de Pneus',
      description: 'Produto para limpeza e brilho dos pneus',
      sku: 'PNEU001',
      unit: 'Litro',
      costPrice: 12.00,
      salePrice: 20.00,
      currentStock: 25,
      minStock: 8,
      isActive: true,
      supplierId: 2,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 4,
      category: 'Acessórios',
      name: 'Perfume Automotivo',
      description: 'Perfume para interior do veículo',
      sku: 'PERF001',
      unit: 'Unidade',
      costPrice: 5.00,
      salePrice: 12.00,
      currentStock: 40,
      minStock: 15,
      isActive: true,
      supplierId: 2,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 5,
      category: 'Proteção',
      name: 'Selante de Pintura',
      description: 'Selante para proteção da pintura',
      sku: 'SEL001',
      unit: 'Unidade',
      costPrice: 18.00,
      salePrice: 35.00,
      currentStock: 15,
      minStock: 3,
      isActive: true,
      supplierId: 1,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    }
  ];

  private suppliers: Supplier[] = [
    {
      id: 1,
      name: 'Distribuidora ABC Ltda',
      document: '12.345.678/0001-90',
      contact: 'João Silva',
      phone: '(11) 3333-4444',
      email: 'contato@abc.com.br',
      address: 'Rua das Indústrias, 123 - São Paulo/SP',
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    },
    {
      id: 2,
      name: 'Fornecedor XYZ',
      document: '98.765.432/0001-10',
      contact: 'Maria Santos',
      phone: '(11) 5555-6666',
      email: 'vendas@xyz.com.br',
      address: 'Av. Comercial, 456 - São Paulo/SP',
      isActive: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    }
  ];

  private stockMovements: StockMovement[] = [
    {
      id: 1,
      productId: 1,
      type: 'entry',
      quantity: 100,
      reason: StockMovementReason.PURCHASE,
      unitPrice: 15.00,
      notes: 'Compra inicial',
      date: new Date('2023-01-15'),
      createdAt: new Date('2023-01-15')
    },
    {
      id: 2,
      productId: 1,
      type: 'exit',
      quantity: 50,
      reason: StockMovementReason.SALE,
      unitPrice: 25.00,
      notes: 'Vendas realizadas',
      date: new Date('2023-02-01'),
      createdAt: new Date('2023-02-01')
    }
  ];

  private productsSubject = new BehaviorSubject<Product[]>(this.products);
  private suppliersSubject = new BehaviorSubject<Supplier[]>(this.suppliers);
  private stockMovementsSubject = new BehaviorSubject<StockMovement[]>(this.stockMovements);

  constructor() {}

  // Métodos para Produtos
  getProducts(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  getProductById(id: number): Observable<Product | undefined> {
    const product = this.products.find(p => p.id === id);
    return of(product);
  }

  searchProducts(params: ProductSearchParams): Observable<Product[]> {
    let filteredProducts = [...this.products];

    if (params.name) {
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }

    if (params.category) {
      filteredProducts = filteredProducts.filter(p => p.category === params.category);
    }

    if (params.supplierId) {
      filteredProducts = filteredProducts.filter(p => p.supplierId === params.supplierId);
    }

    if (params.isActive !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.isActive === params.isActive);
    }

    if (params.lowStock) {
      filteredProducts = filteredProducts.filter(p => p.currentStock <= p.minStock);
    }

    return of(filteredProducts);
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    const newProduct: Product = {
      ...product,
      id: this.getNextProductId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.push(newProduct);
    this.productsSubject.next([...this.products]);
    return of(newProduct);
  }

  updateProduct(id: number, updates: Partial<Product>): Observable<Product | null> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return of(null);
    }

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date()
    };

    this.productsSubject.next([...this.products]);
    return of(this.products[index]);
  }

  deactivateProduct(id: number): Observable<boolean> {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      return of(false);
    }

    product.isActive = false;
    product.updatedAt = new Date();
    this.productsSubject.next([...this.products]);
    return of(true);
  }

  activateProduct(id: number): Observable<boolean> {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      return of(false);
    }

    product.isActive = true;
    product.updatedAt = new Date();
    this.productsSubject.next([...this.products]);
    return of(true);
  }

  isSkuUnique(sku: string, excludeId?: number): Observable<boolean> {
    const existingProduct = this.products.find(p =>
      p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId
    );
    return of(!existingProduct);
  }

  // Métodos para Fornecedores
  getSuppliers(): Observable<Supplier[]> {
    return this.suppliersSubject.asObservable();
  }

  getSupplierById(id: number): Observable<Supplier | undefined> {
    const supplier = this.suppliers.find(s => s.id === id);
    return of(supplier);
  }

  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Observable<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: this.getNextSupplierId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.suppliers.push(newSupplier);
    this.suppliersSubject.next([...this.suppliers]);
    return of(newSupplier);
  }

  updateSupplier(id: number, updates: Partial<Supplier>): Observable<Supplier | null> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return of(null);
    }

    this.suppliers[index] = {
      ...this.suppliers[index],
      ...updates,
      updatedAt: new Date()
    };

    this.suppliersSubject.next([...this.suppliers]);
    return of(this.suppliers[index]);
  }

  // Métodos para Estoque
  getStockMovements(): Observable<StockMovement[]> {
    return this.stockMovementsSubject.asObservable();
  }

  createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Observable<StockMovement> {
    const newMovement: StockMovement = {
      ...movement,
      id: this.getNextMovementId(),
      createdAt: new Date()
    };

    // Atualizar estoque do produto
    const product = this.products.find(p => p.id === movement.productId);
    if (product) {
      if (movement.type === 'entry') {
        product.currentStock += movement.quantity;
      } else {
        product.currentStock -= movement.quantity;
      }
      product.updatedAt = new Date();
      this.productsSubject.next([...this.products]);
    }

    this.stockMovements.push(newMovement);
    this.stockMovementsSubject.next([...this.stockMovements]);
    return of(newMovement);
  }

  getStockReport(): Observable<StockReport> {
    const totalProducts = this.products.length;
    const activeProducts = this.products.filter(p => p.isActive).length;
    const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStock);
    const outOfStockProducts = this.products.filter(p => p.currentStock === 0);

    const totalValue = this.products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const averageValue = totalProducts > 0 ? totalValue / totalProducts : 0;

    return of({
      totalProducts,
      activeProducts,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalValue,
      averageValue,
      lowStockProductsList: lowStockProducts,
      outOfStockProductsList: outOfStockProducts
    });
  }

  getAvailableCategories(): Observable<string[]> {
    const categories = [...new Set(this.products.map(p => p.category))];
    return of(categories);
  }

  getAvailableUnits(): Observable<string[]> {
    const units = [...new Set(this.products.map(p => p.unit))];
    return of(units);
  }

  // Métodos privados
  private getNextProductId(): number {
    const maxId = Math.max(...this.products.map(p => p.id));
    return maxId + 1;
  }

  private getNextSupplierId(): number {
    const maxId = Math.max(...this.suppliers.map(s => s.id));
    return maxId + 1;
  }

  private getNextMovementId(): number {
    const maxId = Math.max(...this.stockMovements.map(m => m.id));
    return maxId + 1;
  }
}
