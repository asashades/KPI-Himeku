import { Injectable } from '@angular/core';
import { Host, LiveSession } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class HostService {
  private readonly HOSTS_KEY = 'hosts';
  private readonly SESSIONS_KEY = 'live_sessions';

  constructor(private storageService: StorageService) {
    this.initializeDefaultHosts();
  }

  private initializeDefaultHosts(): void {
    const existing = this.getHosts();
    if (!existing || existing.length === 0) {
      const defaultHosts: Host[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          targetHours: 160,
          liveSessions: []
        },
        {
          id: '2',
          name: 'Michael Chen',
          targetHours: 140,
          liveSessions: []
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          targetHours: 150,
          liveSessions: []
        },
        {
          id: '4',
          name: 'David Kim',
          targetHours: 120,
          liveSessions: []
        },
        {
          id: '5',
          name: 'Jessica Wang',
          targetHours: 180,
          liveSessions: []
        }
      ];
      this.storageService.saveData(this.HOSTS_KEY, defaultHosts);
    }
  }

  getHosts(): Host[] {
    return this.storageService.getData<Host[]>(this.HOSTS_KEY) || [];
  }

  getHostById(id: string): Host | undefined {
    const hosts = this.getHosts();
    return hosts.find(h => h.id === id);
  }

  addHost(host: Host): void {
    const hosts = this.getHosts();
    host.id = Date.now().toString();
    host.liveSessions = [];
    hosts.push(host);
    this.storageService.saveData(this.HOSTS_KEY, hosts);
  }

  updateHost(host: Host): void {
    const hosts = this.getHosts();
    const index = hosts.findIndex(h => h.id === host.id);
    if (index !== -1) {
      hosts[index] = host;
      this.storageService.saveData(this.HOSTS_KEY, hosts);
    }
  }

  deleteHost(id: string): void {
    let hosts = this.getHosts();
    hosts = hosts.filter(h => h.id !== id);
    this.storageService.saveData(this.HOSTS_KEY, hosts);
    
    // Also delete sessions for this host
    let sessions = this.getAllSessions();
    sessions = sessions.filter(s => s.hostId !== id);
    this.storageService.saveData(this.SESSIONS_KEY, sessions);
  }

  addLiveSession(session: LiveSession): void {
    const sessions = this.getAllSessions();
    session.id = `session-${Date.now()}`;
    
    // Calculate duration
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    session.duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    sessions.push(session);
    this.storageService.saveData(this.SESSIONS_KEY, sessions);
  }

  getAllSessions(): LiveSession[] {
    return this.storageService.getData<LiveSession[]>(this.SESSIONS_KEY) || [];
  }

  getSessionsByHost(hostId: string): LiveSession[] {
    const sessions = this.getAllSessions();
    return sessions.filter(s => s.hostId === hostId);
  }

  getMonthlyStats(hostId: string, month: string): { totalHours: number; totalMinutes: number; sessions: LiveSession[] } {
    const sessions = this.getSessionsByHost(hostId);
    const monthSessions = sessions.filter(s => s.date.startsWith(month));
    
    const totalMinutes = monthSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    return {
      totalHours,
      totalMinutes: remainingMinutes,
      sessions: monthSessions
    };
  }

  getLeaderboard(month: string): Array<{ host: Host; totalMinutes: number; totalHours: number; percentage: number }> {
    const hosts = this.getHosts();
    const leaderboard = hosts.map(host => {
      const stats = this.getMonthlyStats(host.id, month);
      const totalMinutes = stats.totalHours * 60 + stats.totalMinutes;
      const targetMinutes = host.targetHours * 60;
      const percentage = targetMinutes > 0 ? (totalMinutes / targetMinutes) * 100 : 0;
      
      return {
        host,
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        percentage: Math.round(percentage * 10) / 10
      };
    });
    
    return leaderboard.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  deleteSession(id: string): void {
    let sessions = this.getAllSessions();
    sessions = sessions.filter(s => s.id !== id);
    this.storageService.saveData(this.SESSIONS_KEY, sessions);
  }
}
