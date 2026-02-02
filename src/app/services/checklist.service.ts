import { Injectable } from '@angular/core';
import { ChecklistTemplate, ChecklistSubmission } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private readonly TEMPLATES_KEY = 'checklist_templates';
  private readonly SUBMISSIONS_KEY = 'checklist_submissions';

  constructor(private storageService: StorageService) {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const existing = this.getTemplates();
    if (!existing || existing.length === 0) {
      const defaultTemplates: ChecklistTemplate[] = [
        {
          id: 'crewstore-opening',
          departmentId: '3',
          name: 'Opening Checklist',
          type: 'opening',
          items: [
            {
              id: 'opening-time',
              label: 'Jam Buka Pintu',
              type: 'time',
              required: true
            },
            {
              id: 'sweep-floor',
              label: 'Nyapu lantai',
              type: 'checkbox',
              required: true
            },
            {
              id: 'mop-floor',
              label: 'Ngepel',
              type: 'checkbox',
              required: true
            },
            {
              id: 'clean-glass',
              label: 'Lap kaca',
              type: 'checkbox',
              required: false
            },
            {
              id: 'check-cashier',
              label: 'Cek kasir',
              type: 'checkbox',
              required: false
            },
            {
              id: 'faucet-status',
              label: 'Status Keran',
              type: 'radio',
              options: ['Nyala', 'Mati'],
              required: true
            }
          ]
        },
        {
          id: 'crewstore-closing',
          departmentId: '3',
          name: 'Closing Checklist',
          type: 'closing',
          items: [
            {
              id: 'closing-time',
              label: 'Jam Tutup',
              type: 'time',
              required: true
            },
            {
              id: 'close-cashier',
              label: 'Tutup kasir',
              type: 'checkbox',
              required: true
            },
            {
              id: 'check-stock',
              label: 'Cek stok',
              type: 'checkbox',
              required: true
            },
            {
              id: 'clean-store',
              label: 'Bersihkan toko',
              type: 'checkbox',
              required: true
            },
            {
              id: 'lock-door',
              label: 'Kunci pintu',
              type: 'checkbox',
              required: true
            }
          ]
        }
      ];
      this.storageService.saveData(this.TEMPLATES_KEY, defaultTemplates);
    }
  }

  getTemplates(departmentId?: string): ChecklistTemplate[] {
    const templates = this.storageService.getData<ChecklistTemplate[]>(this.TEMPLATES_KEY) || [];
    if (departmentId) {
      return templates.filter(t => t.departmentId === departmentId);
    }
    return templates;
  }

  getTemplateById(id: string): ChecklistTemplate | undefined {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id);
  }

  saveTemplate(template: ChecklistTemplate): void {
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index !== -1) {
      templates[index] = template;
    } else {
      template.id = `template-${Date.now()}`;
      templates.push(template);
    }
    
    this.storageService.saveData(this.TEMPLATES_KEY, templates);
  }

  deleteTemplate(id: string): void {
    let templates = this.getTemplates();
    templates = templates.filter(t => t.id !== id);
    this.storageService.saveData(this.TEMPLATES_KEY, templates);
  }

  submitChecklist(submission: ChecklistSubmission): void {
    const submissions = this.getSubmissions();
    submission.id = `submission-${Date.now()}`;
    submission.submittedAt = new Date().toISOString();
    submissions.push(submission);
    this.storageService.saveData(this.SUBMISSIONS_KEY, submissions);
  }

  getSubmissions(departmentId?: string, date?: string): ChecklistSubmission[] {
    let submissions = this.storageService.getData<ChecklistSubmission[]>(this.SUBMISSIONS_KEY) || [];
    
    if (departmentId) {
      const templates = this.getTemplates(departmentId);
      const templateIds = templates.map(t => t.id);
      submissions = submissions.filter(s => templateIds.includes(s.templateId));
    }
    
    if (date) {
      submissions = submissions.filter(s => s.date === date);
    }
    
    return submissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  deleteSubmission(id: string): void {
    let submissions = this.getSubmissions();
    submissions = submissions.filter(s => s.id !== id);
    this.storageService.saveData(this.SUBMISSIONS_KEY, submissions);
  }
}
