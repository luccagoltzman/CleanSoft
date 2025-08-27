import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-stats-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="stats-skeleton">
      <div class="stat-item-skeleton" *ngFor="let stat of getStatsArray(); trackBy: trackByIndex">
        <div class="stat-icon-skeleton">
          <app-skeleton [config]="{ type: 'avatar', width: '50px', height: '50px' }"></app-skeleton>
        </div>
        <div class="stat-content-skeleton">
          <div class="stat-value-skeleton">
            <app-skeleton [config]="{ type: 'title', width: '80%', height: '32px' }"></app-skeleton>
          </div>
          <div class="stat-label-skeleton">
            <app-skeleton [config]="{ type: 'text', width: '60%', height: '16px' }"></app-skeleton>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./stats-skeleton.component.css']
})
export class StatsSkeletonComponent {
  @Input() statsCount: number = 3;

  trackByIndex(index: number): number {
    return index;
  }

  getStatsArray(): number[] {
    return Array.from({ length: this.statsCount }, (_, i) => i);
  }
}
