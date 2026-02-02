import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
  standalone: true
})
export class StatusBadgeComponent {
  @Input() status: 'complete' | 'pending' | 'incomplete' = 'pending';
  @Input() label: string = '';

  get statusConfig() {
    const configs = {
      complete: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-100', text: 'Complete' },
      pending: { icon: 'schedule', color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'Pending' },
      incomplete: { icon: 'cancel', color: 'text-red-500', bg: 'bg-red-100', text: 'Incomplete' }
    };
    return configs[this.status];
  }
}
