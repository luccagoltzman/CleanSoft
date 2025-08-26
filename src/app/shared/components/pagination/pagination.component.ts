import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-container" *ngIf="totalPages > 1">
      <button 
        class="pagination-button" 
        [disabled]="currentPage === 1"
        (click)="onPageChange(currentPage - 1)">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="pagination-pages">
        <button 
          *ngFor="let page of visiblePages" 
          class="pagination-button" 
          [class.active]="page === currentPage"
          (click)="onPageChange(page)">
          {{ page }}
        </button>
      </div>

      <button 
        class="pagination-button" 
        [disabled]="currentPage === totalPages"
        (click)="onPageChange(currentPage + 1)">
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <div class="pagination-info">
        {{ startIndex + 1 }}-{{ endIndex }} de {{ totalItems }}
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .pagination-button {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      background-color: white;
      color: #4a5568;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-button:hover:not(:disabled) {
      background-color: #f7fafc;
    }

    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-button.active {
      background-color: #4299e1;
      color: white;
      border-color: #4299e1;
    }

    .pagination-pages {
      display: flex;
      gap: 0.25rem;
    }

    .pagination-info {
      margin-left: 1rem;
      color: #4a5568;
      font-size: 0.875rem;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
