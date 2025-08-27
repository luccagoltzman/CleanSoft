import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SkeletonConfig {
  type: 'text' | 'title' | 'avatar' | 'button' | 'card' | 'table-row' | 'table-cell' | 'stat-card';
  width?: string;
  height?: string;
  borderRadius?: string;
  margin?: string;
}

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-item"
      [class]="'skeleton-' + config.type"
      [style.width]="config.width"
      [style.height]="config.height"
      [style.border-radius]="config.borderRadius"
      [style.margin]="config.margin"
    ></div>
  `,
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() config: SkeletonConfig = { type: 'text' };
}
