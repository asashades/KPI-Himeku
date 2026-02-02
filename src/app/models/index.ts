export interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Host {
  id: string;
  name: string;
  photo?: string;
  targetHours: number;
  liveSessions: LiveSession[];
}

export interface LiveSession {
  id: string;
  hostId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // dalam menit
}

export interface ChecklistTemplate {
  id: string;
  departmentId: string;
  name: string;
  type: 'opening' | 'closing' | 'daily';
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'checkbox' | 'text' | 'select' | 'time' | 'radio';
  options?: string[];
  required: boolean;
}

export interface ChecklistSubmission {
  id: string;
  templateId: string;
  date: string;
  submittedBy: string;
  submittedAt: string;
  responses: ChecklistResponse[];
  additionalNotes?: string;
  scheduleInfo?: ScheduleInfo;
}

export interface ChecklistResponse {
  itemId: string;
  value: boolean | string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  departmentId: string;
}

export interface ScheduleInfo {
  shiftPagi?: string;
  shiftSiang?: string;
  shiftStok?: string;
}
