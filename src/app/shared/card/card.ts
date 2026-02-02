import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css',
  standalone: true
})
export class CardComponent {
  @Input() color: string = '#3B82F6';
  @Input() title: string = '';
  @Input() icon: string = '';
}
