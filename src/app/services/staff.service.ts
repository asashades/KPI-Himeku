import { Injectable } from '@angular/core';
import { Staff } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly STORAGE_KEY = 'staff';

  constructor(private storageService: StorageService) {
    this.initializeDefaultStaff();
  }

  private initializeDefaultStaff(): void {
    const existing = this.getStaff();
    if (!existing || existing.length === 0) {
      const defaultStaff: Staff[] = [
        // Host Live staff
        { id: '1', name: 'Sarah Johnson', departmentId: '1' },
        { id: '2', name: 'Michael Chen', departmentId: '1' },
        { id: '3', name: 'Emily Rodriguez', departmentId: '1' },
        // Warehouse staff
        { id: '4', name: 'David Kim', departmentId: '2' },
        { id: '5', name: 'Jessica Wang', departmentId: '2' },
        { id: '6', name: 'Robert Taylor', departmentId: '2' },
        // Crewstore staff
        { id: '7', name: 'Amanda Lee', departmentId: '3' },
        { id: '8', name: 'Christopher Brown', departmentId: '3' },
        { id: '9', name: 'Lisa Martinez', departmentId: '3' }
      ];
      this.storageService.saveData(this.STORAGE_KEY, defaultStaff);
    }
  }

  getStaff(departmentId?: string): Staff[] {
    let staff = this.storageService.getData<Staff[]>(this.STORAGE_KEY) || [];
    if (departmentId) {
      staff = staff.filter(s => s.departmentId === departmentId);
    }
    return staff;
  }

  getStaffById(id: string): Staff | undefined {
    const staff = this.getStaff();
    return staff.find(s => s.id === id);
  }

  addStaff(member: Staff): void {
    const staff = this.getStaff();
    member.id = Date.now().toString();
    staff.push(member);
    this.storageService.saveData(this.STORAGE_KEY, staff);
  }

  updateStaff(member: Staff): void {
    const staff = this.getStaff();
    const index = staff.findIndex(s => s.id === member.id);
    if (index !== -1) {
      staff[index] = member;
      this.storageService.saveData(this.STORAGE_KEY, staff);
    }
  }

  deleteStaff(id: string): void {
    let staff = this.getStaff();
    staff = staff.filter(s => s.id !== id);
    this.storageService.saveData(this.STORAGE_KEY, staff);
  }
}
