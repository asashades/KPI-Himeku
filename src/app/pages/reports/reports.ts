import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/card/card';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, CardComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  standalone: true
})
export class ReportsComponent {

}
