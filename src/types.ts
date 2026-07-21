export interface Ticket {
  code: string;
  status: 'Unscanned' | 'Attended';
  attendedAt: string | null;
  name: string;
  email: string;
  type: 'VIP' | 'General' | 'Staff' | 'Press';
  registeredAt: string | null;
  notes?: string;
}

export interface ScanLog {
  id: string;
  timestamp: string;
  code: string;
  result: 'Verified' | 'Already Attended' | 'Invalid Ticket';
  name?: string;
}
