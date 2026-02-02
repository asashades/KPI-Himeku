import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { HostLiveComponent } from './pages/host-live/host-live';
import { WarehouseComponent } from './pages/warehouse/warehouse';
import { CrewstoreComponent } from './pages/crewstore/crewstore';
import { SettingsComponent } from './pages/settings/settings';
import { ReportsComponent } from './pages/reports/reports';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'host-live', component: HostLiveComponent },
  { path: 'warehouse', component: WarehouseComponent },
  { path: 'crewstore', component: CrewstoreComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: '/dashboard' }
];
