import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1>Gestão Financeira</h1>
      <p>Página em desenvolvimento...</p>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      text-align: center;
    }
    h1 {
      color: var(--primary-color);
      margin-bottom: 20px;
    }
  `]
})
export class FinancialComponent {}
