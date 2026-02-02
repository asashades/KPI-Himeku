import { Component } from '@angular/core';
import { LayoutComponent } from './components/layout/layout';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class AppComponent {
  title = 'KPI & Checklist Tracker';
}
