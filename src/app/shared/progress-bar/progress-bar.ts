import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  imports: [CommonModule],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
  standalone: true
})
export class ProgressBarComponent {
  @Input() progress: number = 0;
  @Input() color: string = '#3B82F6';
  @Input() height: string = '8px';

  get percentage(): number {
    return Math.min(Math.max(this.progress, 0), 100);
  }
}
