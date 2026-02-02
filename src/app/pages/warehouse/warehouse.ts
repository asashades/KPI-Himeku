import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/card/card';

@Component({
  selector: 'app-warehouse',
  imports: [CommonModule, CardComponent],
  templateUrl: './warehouse.html',
  styleUrl: './warehouse.css',
  standalone: true
})
export class WarehouseComponent {

}
