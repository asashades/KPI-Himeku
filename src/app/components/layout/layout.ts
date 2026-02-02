import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  standalone: true
})
export class LayoutComponent {
  menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/host-live', icon: 'tv', label: 'Host Live' },
    { path: '/warehouse', icon: 'inventory_2', label: 'Warehouse' },
    { path: '/crewstore', icon: 'store', label: 'Crewstore' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
    { path: '/reports', icon: 'bar_chart', label: 'Reports' }
  ];
}
