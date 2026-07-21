export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Stored securely in simulator
  logoUrl?: string; // Optional custom organizer logo
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  organizerId: string;
  bannerColor?: string; // Tailwind color name like 'indigo', 'emerald', 'rose', 'fuchsia', 'amber'
  bannerUrl?: string; // Optional custom banner or picture image
  privacy?: 'public' | 'private'; // Publicly listed or private accessible only via direct link/hash
}

export interface Ticket {
  code: string;
  status: 'Unscanned' | 'Attended';
  attendedAt: string | null;
  name: string;
  email: string;
  type: 'VIP' | 'General' | 'Staff' | 'Press';
  registeredAt: string | null;
  notes?: string;
  eventId?: string; // Associated event
}

export interface ScanLog {
  id: string;
  timestamp: string;
  code: string;
  result: 'Verified' | 'Already Attended' | 'Invalid Ticket';
  name?: string;
  eventId?: string; // Associated event
}
