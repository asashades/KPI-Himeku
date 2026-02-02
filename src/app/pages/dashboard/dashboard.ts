import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge';
import { DepartmentService } from '../../services/department.service';
import { HostService } from '../../services/host.service';
import { ChecklistService } from '../../services/checklist.service';
import { Department } from '../../models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, CardComponent, ProgressBarComponent, StatusBadgeComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true
})
export class DashboardComponent implements OnInit {
  departments: Department[] = [];
  hostLiveProgress = 0;
  hostLiveHours = 0;
  hostLiveTarget = 0;
  warehouseChecklists = 0;
  crewstoreOpeningStatus: 'complete' | 'pending' | 'incomplete' = 'pending';
  crewstoreClosingStatus: 'complete' | 'pending' | 'incomplete' = 'pending';
  totalTasksCompleted = 0;
  completionRate = 0;

  constructor(
    private departmentService: DepartmentService,
    private hostService: HostService,
    private checklistService: ChecklistService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.departments = this.departmentService.getDepartments();
    
    // Host Live stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const leaderboard = this.hostService.getLeaderboard(currentMonth);
    const totalMinutes = leaderboard.reduce((sum, item) => sum + item.totalMinutes, 0);
    const totalTarget = leaderboard.reduce((sum, item) => sum + (item.host.targetHours * 60), 0);
    this.hostLiveHours = Math.floor(totalMinutes / 60);
    this.hostLiveTarget = Math.floor(totalTarget / 60);
    this.hostLiveProgress = totalTarget > 0 ? (totalMinutes / totalTarget) * 100 : 0;

    // Checklist stats
    const today = new Date().toISOString().slice(0, 10);
    const crewstoreDept = this.departments.find(d => d.name === 'Crewstore');
    
    if (crewstoreDept) {
      const submissions = this.checklistService.getSubmissions(crewstoreDept.id, today);
      const openingSubmission = submissions.find(s => s.templateId === 'crewstore-opening');
      const closingSubmission = submissions.find(s => s.templateId === 'crewstore-closing');
      
      this.crewstoreOpeningStatus = openingSubmission ? 'complete' : 'pending';
      this.crewstoreClosingStatus = closingSubmission ? 'complete' : 'pending';
      this.warehouseChecklists = submissions.length;
    }

    // Overall stats
    const allSubmissions = this.checklistService.getSubmissions();
    this.totalTasksCompleted = allSubmissions.length;
    this.completionRate = this.totalTasksCompleted > 0 ? 85 : 0; // Simplified calculation
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  get currentDay(): number {
    return new Date().getDate();
  }

  get currentMonthYear(): string {
    return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
}
