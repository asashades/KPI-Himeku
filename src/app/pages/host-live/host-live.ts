import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HostService } from '../../services/host.service';
import { Host, LiveSession } from '../../models';
import { CardComponent } from '../../shared/card/card';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-host-live',
  imports: [CommonModule, FormsModule, CardComponent, ProgressBarComponent],
  templateUrl: './host-live.html',
  styleUrl: './host-live.css',
  standalone: true
})
export class HostLiveComponent implements OnInit {
  hosts: Host[] = [];
  currentMonth: string = '';
  departmentColor: string = '#8B5CF6';
  
  // Form data
  selectedHostId: string = '';
  sessionDate: string = '';
  startTime: string = '';
  endTime: string = '';
  
  // Stats
  totalSessions: number = 0;
  averageHours: number = 0;
  
  // Alert
  showSuccessAlert: boolean = false;
  
  // Leaderboard
  leaderboard: Array<{ 
    host: Host; 
    totalMinutes: number; 
    totalHours: number; 
    percentage: number;
    rank: number;
  }> = [];

  constructor(private hostService: HostService) {}

  ngOnInit(): void {
    this.initializeMonth();
    this.loadHosts();
    this.loadStats();
    this.loadLeaderboard();
    this.setDefaultDate();
  }

  private initializeMonth(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.currentMonth = `${year}-${month}`;
  }

  private setDefaultDate(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.sessionDate = `${year}-${month}-${day}`;
  }

  loadHosts(): void {
    this.hosts = this.hostService.getHosts();
  }

  loadStats(): void {
    const allSessions = this.hostService.getAllSessions();
    const monthSessions = allSessions.filter(s => s.date.startsWith(this.currentMonth));
    this.totalSessions = monthSessions.length;
    
    if (this.hosts.length > 0) {
      const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);
      this.averageHours = Math.round((totalMinutes / 60 / this.hosts.length) * 10) / 10;
    } else {
      this.averageHours = 0;
    }
  }

  loadLeaderboard(): void {
    const leaderboardData = this.hostService.getLeaderboard(this.currentMonth);
    this.leaderboard = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  getHostStats(host: Host): { totalHours: number; totalMinutes: number; percentage: number } {
    const stats = this.hostService.getMonthlyStats(host.id, this.currentMonth);
    const totalMinutes = stats.totalHours * 60 + stats.totalMinutes;
    const targetMinutes = host.targetHours * 60;
    const percentage = targetMinutes > 0 ? (totalMinutes / targetMinutes) * 100 : 0;
    
    return {
      totalHours: stats.totalHours,
      totalMinutes: stats.totalMinutes,
      percentage: Math.round(percentage * 10) / 10
    };
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  formatHours(hours: number, minutes: number): string {
    if (hours === 0 && minutes === 0) {
      return '0h';
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  getRankBadge(rank: number): string {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getFormattedTotalHours(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return this.formatHours(hours, minutes);
  }

  getMonthLabel(): string {
    const date = new Date(this.currentMonth + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calculateDuration(): string {
    if (!this.startTime || !this.endTime) {
      return '';
    }

    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    if (durationMinutes <= 0) {
      return 'Invalid';
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return this.formatHours(hours, minutes);
  }

  isFormValid(): boolean {
    if (!this.selectedHostId || !this.sessionDate || !this.startTime || !this.endTime) {
      return false;
    }

    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    return durationMinutes > 0;
  }

  addSession(): void {
    if (!this.isFormValid()) {
      return;
    }

    const session: LiveSession = {
      id: '',
      hostId: this.selectedHostId,
      date: this.sessionDate,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: 0
    };

    this.hostService.addLiveSession(session);
    
    // Show success alert
    this.showSuccessAlert = true;
    setTimeout(() => {
      this.showSuccessAlert = false;
    }, 3000);

    // Reset form
    this.selectedHostId = '';
    this.startTime = '';
    this.endTime = '';
    this.setDefaultDate();

    // Reload data
    this.loadStats();
    this.loadLeaderboard();
  }
}
