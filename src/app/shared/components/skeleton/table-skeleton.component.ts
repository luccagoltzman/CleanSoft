import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="table-skeleton">
      <!-- Cabeçalho da tabela -->
      <div class="table-header-skeleton">
        <div class="table-row-skeleton header-row">
          <div class="table-cell-skeleton" *ngFor="let header of headers">
            <app-skeleton [config]="{ type: 'title', width: '100%', height: '20px' }"></app-skeleton>
          </div>
        </div>
      </div>
      
      <!-- Linhas da tabela -->
      <div class="table-body-skeleton">
        <div class="table-row-skeleton" *ngFor="let row of getRowsArray(); trackBy: trackByIndex">
          <div class="table-cell-skeleton" *ngFor="let cell of getCellsArray(); trackBy: trackByIndex">
            <app-skeleton [config]="getCellSkeletonConfig(cell)"></app-skeleton>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./table-skeleton.component.css']
})
export class TableSkeletonComponent {
  @Input() headers: string[] = [];
  @Input() rows: number = 5;
  @Input() cells: number = 6;

  trackByIndex(index: number): number {
    return index;
  }

  getRowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  getCellsArray(): number[] {
    return Array.from({ length: this.cells }, (_, i) => i);
  }

  getCellSkeletonConfig(cellIndex: number) {
    // Diferentes tipos de skeleton para diferentes tipos de dados
    const configs: any[] = [
      { type: 'text' as const, width: '100%', height: '16px' }, // Nome/Texto
      { type: 'text' as const, width: '80%', height: '16px' },  // Telefone
      { type: 'text' as const, width: '60%', height: '16px' },  // Valor
      { type: 'text' as const, width: '70%', height: '16px' },  // Data
      { type: 'button' as const, width: '80px', height: '24px' }, // Status
      { type: 'text' as const, width: '90%', height: '16px' }   // Método
    ];
    
    return configs[cellIndex] || { type: 'text' as const, width: '100%', height: '16px' };
  }
}
