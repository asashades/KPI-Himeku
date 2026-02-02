import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { StaffService } from '../../services/staff.service';
import { ChecklistService } from '../../services/checklist.service';
import { Department, Staff, ChecklistTemplate, ChecklistItem } from '../../models';
import { CardComponent } from '../../shared/card/card';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  standalone: true
})
export class SettingsComponent implements OnInit {
  activeTab: 'staff' | 'department' | 'template' = 'staff';
  
  // Staff Management
  staffList: Staff[] = [];
  staffGrouped: { [key: string]: Staff[] } = {};
  departments: Department[] = [];
  staffForm: FormGroup;
  editingStaff: Staff | null = null;
  showStaffForm = false;

  // Department Management
  departmentList: Department[] = [];
  departmentForm: FormGroup;
  editingDepartment: Department | null = null;
  showDepartmentForm = false;

  // Template Management
  selectedDepartmentId = '';
  templateList: ChecklistTemplate[] = [];
  templateForm: FormGroup;
  editingTemplate: ChecklistTemplate | null = null;
  showTemplateForm = false;
  editingTemplateItems: ChecklistItem[] = [];
  newItemForm: FormGroup;
  showItemForm = false;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private staffService: StaffService,
    private checklistService: ChecklistService
  ) {
    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      departmentId: ['', Validators.required]
    });

    this.departmentForm = this.fb.group({
      name: ['', Validators.required],
      color: ['#3B82F6', Validators.required],
      icon: ['folder', Validators.required]
    });

    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      type: ['daily', Validators.required]
    });

    this.newItemForm = this.fb.group({
      label: ['', Validators.required],
      type: ['checkbox', Validators.required],
      required: [false],
      options: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadStaff();
  }

  // Tab Management
  switchTab(tab: 'staff' | 'department' | 'template'): void {
    this.activeTab = tab;
    this.resetForms();
    if (tab === 'template' && this.departments.length > 0 && !this.selectedDepartmentId) {
      this.selectedDepartmentId = this.departments[0].id;
      this.loadTemplates();
    }
  }

  resetForms(): void {
    this.showStaffForm = false;
    this.showDepartmentForm = false;
    this.showTemplateForm = false;
    this.showItemForm = false;
    this.editingStaff = null;
    this.editingDepartment = null;
    this.editingTemplate = null;
    this.staffForm.reset();
    this.departmentForm.reset({ color: '#3B82F6', icon: 'folder' });
    this.templateForm.reset({ type: 'daily' });
    this.newItemForm.reset({ type: 'checkbox', required: false });
  }

  // Staff Management Methods
  loadStaff(): void {
    this.staffList = this.staffService.getStaff();
    this.groupStaffByDepartment();
  }

  loadDepartments(): void {
    this.departments = this.departmentService.getDepartments();
    this.departmentList = this.departments;
  }

  groupStaffByDepartment(): void {
    this.staffGrouped = {};
    this.staffList.forEach(staff => {
      if (!this.staffGrouped[staff.departmentId]) {
        this.staffGrouped[staff.departmentId] = [];
      }
      this.staffGrouped[staff.departmentId].push(staff);
    });
  }

  getDepartmentName(departmentId: string): string {
    const dept = this.departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown';
  }

  getDepartment(departmentId: string): Department | undefined {
    return this.departments.find(d => d.id === departmentId);
  }

  showAddStaffForm(): void {
    this.editingStaff = null;
    this.staffForm.reset();
    this.showStaffForm = true;
  }

  editStaff(staff: Staff): void {
    this.editingStaff = staff;
    this.staffForm.patchValue({
      name: staff.name,
      departmentId: staff.departmentId
    });
    this.showStaffForm = true;
  }

  saveStaff(): void {
    if (this.staffForm.valid) {
      const staffData: Staff = {
        id: this.editingStaff?.id || '',
        name: this.staffForm.value.name,
        departmentId: this.staffForm.value.departmentId
      };

      if (this.editingStaff) {
        this.staffService.updateStaff(staffData);
        alert('Staff berhasil diperbarui!');
      } else {
        this.staffService.addStaff(staffData);
        alert('Staff berhasil ditambahkan!');
      }

      this.loadStaff();
      this.showStaffForm = false;
      this.staffForm.reset();
      this.editingStaff = null;
    }
  }

  deleteStaff(staff: Staff): void {
    if (confirm(`Apakah Anda yakin ingin menghapus ${staff.name}?`)) {
      this.staffService.deleteStaff(staff.id);
      this.loadStaff();
      alert('Staff berhasil dihapus!');
    }
  }

  cancelStaffEdit(): void {
    this.showStaffForm = false;
    this.staffForm.reset();
    this.editingStaff = null;
  }

  // Department Management Methods
  showAddDepartmentForm(): void {
    this.editingDepartment = null;
    this.departmentForm.reset({ color: '#3B82F6', icon: 'folder' });
    this.showDepartmentForm = true;
  }

  editDepartment(dept: Department): void {
    this.editingDepartment = dept;
    this.departmentForm.patchValue({
      name: dept.name,
      color: dept.color,
      icon: dept.icon
    });
    this.showDepartmentForm = true;
  }

  saveDepartment(): void {
    if (this.departmentForm.valid) {
      const deptData: Department = {
        id: this.editingDepartment?.id || '',
        name: this.departmentForm.value.name,
        color: this.departmentForm.value.color,
        icon: this.departmentForm.value.icon
      };

      if (this.editingDepartment) {
        this.departmentService.updateDepartment(deptData);
        alert('Departemen berhasil diperbarui!');
      } else {
        this.departmentService.addDepartment(deptData);
        alert('Departemen berhasil ditambahkan!');
      }

      this.loadDepartments();
      this.loadStaff();
      this.showDepartmentForm = false;
      this.departmentForm.reset({ color: '#3B82F6', icon: 'folder' });
      this.editingDepartment = null;
    }
  }

  deleteDepartment(dept: Department): void {
    const staffInDept = this.staffService.getStaff(dept.id);
    const templatesInDept = this.checklistService.getTemplates(dept.id);

    if (staffInDept.length > 0 || templatesInDept.length > 0) {
      alert('Tidak dapat menghapus departemen yang masih memiliki staff atau template!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus departemen ${dept.name}?`)) {
      this.departmentService.deleteDepartment(dept.id);
      this.loadDepartments();
      alert('Departemen berhasil dihapus!');
    }
  }

  cancelDepartmentEdit(): void {
    this.showDepartmentForm = false;
    this.departmentForm.reset({ color: '#3B82F6', icon: 'folder' });
    this.editingDepartment = null;
  }

  // Template Management Methods
  onDepartmentChange(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    if (this.selectedDepartmentId) {
      this.templateList = this.checklistService.getTemplates(this.selectedDepartmentId);
    } else {
      this.templateList = [];
    }
  }

  showAddTemplateForm(): void {
    if (!this.selectedDepartmentId) {
      alert('Pilih departemen terlebih dahulu!');
      return;
    }
    this.editingTemplate = null;
    this.editingTemplateItems = [];
    this.templateForm.reset({ type: 'daily' });
    this.showTemplateForm = true;
  }

  editTemplate(template: ChecklistTemplate): void {
    this.editingTemplate = template;
    this.editingTemplateItems = [...template.items];
    this.templateForm.patchValue({
      name: template.name,
      type: template.type
    });
    this.showTemplateForm = true;
  }

  saveTemplate(): void {
    if (this.templateForm.valid && this.editingTemplateItems.length > 0) {
      const templateData: ChecklistTemplate = {
        id: this.editingTemplate?.id || '',
        departmentId: this.selectedDepartmentId,
        name: this.templateForm.value.name,
        type: this.templateForm.value.type,
        items: this.editingTemplateItems
      };

      this.checklistService.saveTemplate(templateData);
      
      if (this.editingTemplate) {
        alert('Template berhasil diperbarui!');
      } else {
        alert('Template berhasil ditambahkan!');
      }

      this.loadTemplates();
      this.cancelTemplateEdit();
    } else if (this.editingTemplateItems.length === 0) {
      alert('Template harus memiliki minimal satu item!');
    }
  }

  deleteTemplate(template: ChecklistTemplate): void {
    if (confirm(`Apakah Anda yakin ingin menghapus template ${template.name}?`)) {
      this.checklistService.deleteTemplate(template.id);
      this.loadTemplates();
      alert('Template berhasil dihapus!');
    }
  }

  cancelTemplateEdit(): void {
    this.showTemplateForm = false;
    this.showItemForm = false;
    this.templateForm.reset({ type: 'daily' });
    this.newItemForm.reset({ type: 'checkbox', required: false });
    this.editingTemplate = null;
    this.editingTemplateItems = [];
  }

  // Template Item Management
  showAddItemForm(): void {
    this.newItemForm.reset({ type: 'checkbox', required: false });
    this.showItemForm = true;
  }

  addItemToTemplate(): void {
    if (this.newItemForm.valid) {
      const itemType = this.newItemForm.value.type;
      const optionsStr = this.newItemForm.value.options?.trim() || '';
      
      const newItem: ChecklistItem = {
        id: `item-${Date.now()}`,
        label: this.newItemForm.value.label,
        type: itemType,
        required: this.newItemForm.value.required
      };

      if ((itemType === 'select' || itemType === 'radio') && optionsStr.length > 0) {
        newItem.options = optionsStr.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt);
      }

      this.editingTemplateItems.push(newItem);
      this.showItemForm = false;
      this.newItemForm.reset({ type: 'checkbox', required: false });
    }
  }

  removeItemFromTemplate(index: number): void {
    if (confirm('Hapus item ini dari template?')) {
      this.editingTemplateItems.splice(index, 1);
    }
  }

  cancelItemEdit(): void {
    this.showItemForm = false;
    this.newItemForm.reset({ type: 'checkbox', required: false });
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'opening': 'Opening',
      'closing': 'Closing',
      'daily': 'Daily',
      'checkbox': 'Checkbox',
      'text': 'Text',
      'select': 'Select',
      'time': 'Time',
      'radio': 'Radio'
    };
    return labels[type] || type;
  }
}
