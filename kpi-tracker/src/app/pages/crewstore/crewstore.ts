import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../shared/card/card';
import { ChecklistService } from '../../services/checklist.service';
import { StaffService } from '../../services/staff.service';
import { ChecklistTemplate, ChecklistSubmission, ChecklistResponse, Staff, ScheduleInfo } from '../../models';

@Component({
  selector: 'app-crewstore',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './crewstore.html',
  styleUrl: './crewstore.css',
  standalone: true
})
export class Crewstore implements OnInit {
  activeTab: 'opening' | 'closing' = 'opening';
  
  // Opening checklist data
  openingDate: string = '';
  openingTime: string = '';
  sweepFloor: boolean = false;
  mopFloor: boolean = false;
  cleanGlass: boolean = false;
  checkCashier: boolean = false;
  faucetStatus: string = '';
  openingNotes: string = '';
  
  // Closing checklist data
  closingDate: string = '';
  closingTime: string = '';
  closeCashier: boolean = false;
  checkStock: boolean = false;
  cleanStore: boolean = false;
  lockDoor: boolean = false;
  closingNotes: string = '';
  shiftPagi: string = '';
  shiftSiang: string = '';
  shiftStok: string = '';
  
  // Templates and submissions
  openingTemplate?: ChecklistTemplate;
  closingTemplate?: ChecklistTemplate;
  openingHistory: ChecklistSubmission[] = [];
  closingHistory: ChecklistSubmission[] = [];
  
  // Staff list
  staffList: Staff[] = [];

  constructor(
    private checklistService: ChecklistService,
    private staffService: StaffService
  ) {}

  ngOnInit(): void {
    this.setDefaultDate();
    this.loadTemplates();
    this.loadStaff();
    this.loadHistory();
  }

  setDefaultDate(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.openingDate = `${year}-${month}-${day}`;
    this.closingDate = `${year}-${month}-${day}`;
  }

  loadTemplates(): void {
    this.openingTemplate = this.checklistService.getTemplateById('crewstore-opening');
    this.closingTemplate = this.checklistService.getTemplateById('crewstore-closing');
  }

  loadStaff(): void {
    this.staffList = this.staffService.getStaff('3');
  }

  loadHistory(): void {
    const allSubmissions = this.checklistService.getSubmissions('3');
    this.openingHistory = allSubmissions.filter(s => s.templateId === 'crewstore-opening');
    this.closingHistory = allSubmissions.filter(s => s.templateId === 'crewstore-closing');
  }

  switchTab(tab: 'opening' | 'closing'): void {
    this.activeTab = tab;
  }

  saveOpeningChecklist(): void {
    if (!this.openingTemplate) return;

    const responses: ChecklistResponse[] = [
      { itemId: 'opening-time', value: this.openingTime },
      { itemId: 'sweep-floor', value: this.sweepFloor },
      { itemId: 'mop-floor', value: this.mopFloor },
      { itemId: 'clean-glass', value: this.cleanGlass },
      { itemId: 'check-cashier', value: this.checkCashier },
      { itemId: 'faucet-status', value: this.faucetStatus }
    ];

    const submission: ChecklistSubmission = {
      id: '',
      templateId: this.openingTemplate.id,
      date: this.openingDate,
      submittedBy: 'Current User',
      submittedAt: '',
      responses: responses,
      additionalNotes: this.openingNotes
    };

    this.checklistService.submitChecklist(submission);
    alert('Opening checklist saved successfully!');
    this.resetOpeningForm();
    this.loadHistory();
  }

  saveClosingChecklist(): void {
    if (!this.closingTemplate) return;

    const responses: ChecklistResponse[] = [
      { itemId: 'closing-time', value: this.closingTime },
      { itemId: 'close-cashier', value: this.closeCashier },
      { itemId: 'check-stock', value: this.checkStock },
      { itemId: 'clean-store', value: this.cleanStore },
      { itemId: 'lock-door', value: this.lockDoor }
    ];

    const scheduleInfo: ScheduleInfo = {
      shiftPagi: this.shiftPagi,
      shiftSiang: this.shiftSiang,
      shiftStok: this.shiftStok
    };

    const submission: ChecklistSubmission = {
      id: '',
      templateId: this.closingTemplate.id,
      date: this.closingDate,
      submittedBy: 'Current User',
      submittedAt: '',
      responses: responses,
      additionalNotes: this.closingNotes,
      scheduleInfo: scheduleInfo
    };

    this.checklistService.submitChecklist(submission);
    alert('Closing checklist saved successfully!');
    this.resetClosingForm();
    this.loadHistory();
  }

  resetOpeningForm(): void {
    this.setDefaultDate();
    this.openingTime = '';
    this.sweepFloor = false;
    this.mopFloor = false;
    this.cleanGlass = false;
    this.checkCashier = false;
    this.faucetStatus = '';
    this.openingNotes = '';
  }

  resetClosingForm(): void {
    this.setDefaultDate();
    this.closingTime = '';
    this.closeCashier = false;
    this.checkStock = false;
    this.cleanStore = false;
    this.lockDoor = false;
    this.closingNotes = '';
    this.shiftPagi = '';
    this.shiftSiang = '';
    this.shiftStok = '';
  }

  getResponseValue(submission: ChecklistSubmission, itemId: string): any {
    const response = submission.responses.find(r => r.itemId === itemId);
    return response ? response.value : '';
  }

  getStaffName(staffId: string): string {
    const staff = this.staffList.find(s => s.id === staffId);
    return staff ? staff.name : staffId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
