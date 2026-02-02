import { Injectable } from '@angular/core';
import { Department } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly STORAGE_KEY = 'departments';

  constructor(private storageService: StorageService) {
    this.initializeDefaultDepartments();
  }

  private initializeDefaultDepartments(): void {
    const existing = this.getDepartments();
    if (!existing || existing.length === 0) {
      const defaultDepartments: Department[] = [
        {
          id: '1',
          name: 'Host Live',
          color: '#8B5CF6',
          icon: 'tv'
        },
        {
          id: '2',
          name: 'Warehouse',
          color: '#F59E0B',
          icon: 'inventory_2'
        },
        {
          id: '3',
          name: 'Crewstore',
          color: '#10B981',
          icon: 'store'
        }
      ];
      this.storageService.saveData(this.STORAGE_KEY, defaultDepartments);
    }
  }

  getDepartments(): Department[] {
    return this.storageService.getData<Department[]>(this.STORAGE_KEY) || [];
  }

  getDepartmentById(id: string): Department | undefined {
    const departments = this.getDepartments();
    return departments.find(dept => dept.id === id);
  }

  addDepartment(dept: Department): void {
    const departments = this.getDepartments();
    dept.id = Date.now().toString();
    departments.push(dept);
    this.storageService.saveData(this.STORAGE_KEY, departments);
  }

  updateDepartment(dept: Department): void {
    const departments = this.getDepartments();
    const index = departments.findIndex(d => d.id === dept.id);
    if (index !== -1) {
      departments[index] = dept;
      this.storageService.saveData(this.STORAGE_KEY, departments);
    }
  }

  deleteDepartment(id: string): void {
    let departments = this.getDepartments();
    departments = departments.filter(d => d.id !== id);
    this.storageService.saveData(this.STORAGE_KEY, departments);
  }
}
