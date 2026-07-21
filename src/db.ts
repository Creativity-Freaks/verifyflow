import { User, Event, Ticket, ScanLog } from './types';
import { db } from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';

export const INITIAL_TICKET_CODES = [
  "BGI-118139", "BGI-786392", "BGI-888388", "BGI-649172", "BGI-140249", "BGI-929692", "BGI-597686", "BGI-877123",
  "BGI-679018", "BGI-595170", "BGI-560883", "BGI-448747", "BGI-402459", "BGI-511136", "BGI-330429", "BGI-260081",
  "BGI-523311", "BGI-812291", "BGI-849610", "BGI-285336", "BGI-706350", "BGI-583175", "BGI-958080", "BGI-220434",
  "BGI-295686", "BGI-357960", "BGI-213584", "BGI-654456", "BGI-589361", "BGI-861139", "BGI-757406", "BGI-364683",
  "BGI-399998", "BGI-355979", "BGI-657040", "BGI-558407", "BGI-829604", "BGI-927333", "BGI-673451", "BGI-415879",
  "BGI-705552", "BGI-107397", "BGI-817325", "BGI-352460", "BGI-221589", "BGI-517205", "BGI-795406", "BGI-572207",
  "BGI-173317", "BGI-880758", "BGI-697345", "BGI-346361", "BGI-450416", "BGI-403311", "BGI-641644", "BGI-239479",
  "BGI-986557", "BGI-241701", "BGI-794388", "BGI-903858", "BGI-671272", "BGI-278230", "BGI-634874", "BGI-266636",
  "BGI-290257", "BGI-713308", "BGI-973925", "BGI-747201", "BGI-859220", "BGI-177147", "BGI-418349", "BGI-928421"
];

const DEFAULT_ATTENDEES = [
  { name: "Liam Smith", email: "liam.smith@example.com", type: "VIP" },
  { name: "Olivia Johnson", email: "olivia.j@example.com", type: "General" },
  { name: "Noah Williams", email: "noah.w@example.com", type: "General" },
  { name: "Emma Brown", email: "emma.b@example.com", type: "VIP" },
  { name: "Oliver Jones", email: "oliver.jones@example.com", type: "General" },
  { name: "Ava Garcia", email: "ava.garcia@example.com", type: "General" },
  { name: "Elijah Miller", email: "elijah.m@example.com", type: "VIP" },
  { name: "Charlotte Davis", email: "charlotte.d@example.com", type: "General" },
  { name: "William Rodriguez", email: "william.r@example.com", type: "General" },
  { name: "Sophia Martinez", email: "sophia.m@example.com", type: "VIP" },
  { name: "James Hernandez", email: "james.h@example.com", type: "General" },
  { name: "Amelia Lopez", email: "amelia.l@example.com", type: "General" },
  { name: "Benjamin Gonzalez", email: "ben.g@example.com", type: "Staff" },
  { name: "Isabella Wilson", email: "isabella.w@example.com", type: "General" },
  { name: "Lucas Anderson", email: "lucas.a@example.com", type: "General" },
  { name: "Mia Thomas", email: "mia.t@example.com", type: "General" },
  { name: "Henry Taylor", email: "henry.t@example.com", type: "General" },
  { name: "Evelyn Moore", email: "evelyn.m@example.com", type: "General" },
  { name: "Alexander Jackson", email: "alex.j@example.com", type: "Press" },
  { name: "Harper Martin", email: "harper.m@example.com", type: "General" },
  { name: "Mason Lee", email: "mason.lee@example.com", type: "General" },
  { name: "Camila Perez", email: "camila.p@example.com", type: "VIP" },
  { name: "Michael Thompson", email: "michael.t@example.com", type: "General" },
  { name: "Gianna White", email: "gianna.w@example.com", type: "General" },
  { name: "Ethan Harris", email: "ethan.h@example.com", type: "General" },
  { name: "Abigail Sanchez", email: "abigail.s@example.com", type: "General" },
  { name: "Daniel Clark", email: "daniel.c@example.com", type: "Staff" },
  { name: "Luna Ramirez", email: "luna.r@example.com", type: "General" },
  { name: "Jacob Lewis", email: "jacob.l@example.com", type: "General" },
  { name: "Ella Robinson", email: "ella.r@example.com", type: "General" },
  { name: "Logan Walker", email: "logan.w@example.com", type: "VIP" },
  { name: "Elizabeth Young", email: "elizabeth.y@example.com", type: "General" },
  { name: "Jackson Allen", email: "jackson.a@example.com", type: "General" },
  { name: "Sofia King", email: "sofia.k@example.com", type: "General" },
  { name: "Sebastian Wright", email: "sebastian.w@example.com", type: "General" },
  { name: "Avery Scott", email: "avery.s@example.com", type: "General" },
  { name: "Jack Torres", email: "jack.t@example.com", type: "General" },
  { name: "Scarlett Nguyen", email: "scarlett.n@example.com", type: "VIP" },
  { name: "Aiden Hill", email: "aiden.h@example.com", type: "Press" },
  { name: "Madison Flores", email: "madison.f@example.com", type: "General" },
  { name: "Owen Green", email: "owen.g@example.com", type: "General" },
  { name: "Layla Adams", email: "layla.a@example.com", type: "General" },
  { name: "Samuel Nelson", email: "samuel.n@example.com", type: "VIP" },
  { name: "Penelope Baker", email: "penelope.b@example.com", type: "General" },
  { name: "Matthew Hall", email: "matthew.h@example.com", type: "General" },
  { name: "Aria Rivera", email: "aria.r@example.com", type: "General" },
  { name: "Joseph Campbell", email: "joseph.c@example.com", type: "General" },
  { name: "Chloe Mitchell", email: "chloe.m@example.com", type: "General" },
  { name: "Carter Roberts", email: "carter.r@example.com", type: "General" },
  { name: "Grace Roberts", email: "grace.r@example.com", type: "VIP" },
  { name: "Wyatt Gomez", email: "wyatt.g@example.com", type: "General" },
  { name: "Nora Phillips", email: "nora.p@example.com", type: "General" },
  { name: "Jayden Evans", email: "jayden.e@example.com", type: "General" },
  { name: "Lily Turner", email: "lily.t@example.com", type: "General" },
  { name: "John Diaz", email: "john.d@example.com", type: "VIP" },
  { name: "Eleanor Cruz", email: "eleanor.c@example.com", type: "General" },
  { name: "Luke Parker", email: "luke.p@example.com", type: "General" },
  { name: "Hannah Gomez", email: "hannah.g@example.com", type: "General" },
  { name: "Dylan Edwards", email: "dylan.e@example.com", type: "General" },
  { name: "Lillian Collins", email: "lillian.c@example.com", type: "General" },
  { name: "Gabriel Stewart", email: "gabriel.s@example.com", type: "VIP" },
  { name: "Addison Morris", email: "addison.m@example.com", type: "General" },
  { name: "Isaac Rogers", email: "isaac.r@example.com", type: "Staff" },
  { name: "Aubrey Reed", email: "aubrey.r@example.com", type: "General" },
  { name: "Anthony Cook", email: "anthony.c@example.com", type: "General" },
  { name: "Ellie Morgan", email: "ellie.m@example.com", type: "General" },
  { name: "Grayson Bell", email: "grayson.b@example.com", type: "General" },
  { name: "Stella Murphy", email: "stella.m@example.com", type: "VIP" },
  { name: "Christopher Bailey", email: "chris.b@example.com", type: "General" },
  { name: "Natalie Cooper", email: "natalie.c@example.com", type: "General" },
  { name: "Joshua Richardson", email: "joshua.r@example.com", type: "General" },
  { name: "Zoe Cox", email: "zoe.cox@example.com", type: "VIP" }
];

export function getInitialTickets(eventId: string): Ticket[] {
  if (eventId === 'event_1') {
    return INITIAL_TICKET_CODES.map((code, index) => {
      const isRegistered = index < 58;
      const defaultData = DEFAULT_ATTENDEES[index] || { name: "", email: "", type: "General" };
      const isAttended = index === 5 || index === 12 || index === 28;
      const attendedTime = isAttended ? new Date(Date.now() - (60 - index) * 60 * 1000).toISOString() : null;

      return {
        code,
        status: isAttended ? 'Attended' : 'Unscanned',
        attendedAt: attendedTime,
        name: isRegistered ? defaultData.name : "",
        email: isRegistered ? defaultData.email : "",
        type: defaultData.type as Ticket['type'],
        registeredAt: isRegistered ? new Date(Date.now() - 5 * 24 * 3600 * 1000 - index * 3600 * 1000).toISOString() : null,
        notes: isRegistered ? "Pre-registered" : "",
        eventId
      };
    });
  }

  if (eventId === 'event_2') {
    const subsetCodes = ["FLOW-801272", "FLOW-129481", "FLOW-509218", "FLOW-301293", "FLOW-401928", "FLOW-602931", "FLOW-111100", "FLOW-222333", "FLOW-592813", "FLOW-808291", "FLOW-991203", "FLOW-776122"];
    const subsetAttendees = [
      { name: "Alen Turing", email: "alan.turing@expo.org", type: "VIP" },
      { name: "Grace Hopper", email: "grace.h@expo.org", type: "VIP" },
      { name: "Ada Lovelace", email: "ada.l@expo.org", type: "General" },
      { name: "Tim Berners-Lee", email: "tim.bl@expo.org", type: "General" },
      { name: "Linus Torvalds", email: "linus@expo.org", type: "Staff" },
      { name: "Steve Wozniak", email: "woz@expo.org", type: "Press" },
      { name: "Margaret Hamilton", email: "margaret@expo.org", type: "VIP" },
      { name: "Ken Thompson", email: "ken@expo.org", type: "General" },
      { name: "Dennis Ritchie", email: "dennis@expo.org", type: "General" },
      { name: "", email: "", type: "General" },
      { name: "", email: "", type: "General" },
      { name: "", email: "", type: "General" },
    ];

    return subsetCodes.map((code, index) => {
      const attendee = subsetAttendees[index];
      const isRegistered = !!attendee.name;
      const isAttended = index === 0 || index === 4;
      const attendedTime = isAttended ? new Date(Date.now() - 2 * 3600 * 1000).toISOString() : null;

      return {
        code,
        status: isAttended ? 'Attended' : 'Unscanned',
        attendedAt: attendedTime,
        name: attendee.name,
        email: attendee.email,
        type: attendee.type as Ticket['type'],
        registeredAt: isRegistered ? new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() : null,
        notes: isRegistered ? "Pre-registered" : "",
        eventId
      };
    });
  }

  return [];
}

const USERS_STORAGE_KEY = 'verifyflow_users';
const EVENTS_STORAGE_KEY = 'verifyflow_events';
const TICKETS_STORAGE_KEY = 'verifyflow_tickets_all';
const LOGS_STORAGE_KEY = 'verifyflow_logs_all';

// Helper to seed local storage default items if needed
function seedLocalStorage() {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    const defaultUsers: User[] = [
      { id: 'demo_user', email: 'demo@cftechlab.tech', name: 'Demo Organizer', password: 'password' }
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(EVENTS_STORAGE_KEY)) {
    const defaultEvents: Event[] = [
      {
        id: 'event_1',
        title: 'AI Build Summit 2026',
        date: '2026-08-15',
        time: '09:00 AM',
        venue: 'CF Tech Lab Auditorium, Dhaka',
        description: 'The premier global summit bringing together AI builders, product pioneers, designers, and systems architects to demonstrate real-world integrations, multi-agent orchestrations, and production systems.',
        organizerId: 'demo_user',
        bannerColor: 'indigo',
        privacy: 'public'
      },
      {
        id: 'event_2',
        title: 'VerifyFlow Global Tech Expo 2026',
        date: '2026-11-20',
        time: '10:00 AM',
        venue: 'Metropolitan Convention Hall, Terminal 4',
        description: 'Experience high-fidelity live biometric verification, advanced dynamic QR technology, custom digital asset issuance, and next-generation contactless gateway pipelines.',
        organizerId: 'demo_user',
        bannerColor: 'fuchsia',
        privacy: 'public'
      }
    ];
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(defaultEvents));
  }

  if (!localStorage.getItem(TICKETS_STORAGE_KEY)) {
    const tickets1 = getInitialTickets('event_1');
    const tickets2 = getInitialTickets('event_2');
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify([...tickets1, ...tickets2]));
  }

  if (!localStorage.getItem(LOGS_STORAGE_KEY)) {
    const initialLogs: ScanLog[] = [
      {
        id: 'log_seed_1',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        code: 'BGI-929692',
        result: 'Verified',
        name: 'Ava Garcia',
        eventId: 'event_1'
      },
      {
        id: 'log_seed_2',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        code: 'BGI-402459',
        result: 'Verified',
        name: 'Benjamin Gonzalez',
        eventId: 'event_1'
      }
    ];
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(initialLogs));
  }
}

try {
  seedLocalStorage();
} catch (e) {
  console.error("Local storage error during seeding", e);
}

// ASYNC FIRESTORE BATCH HELPERS
async function saveTicketsToFirestore(tickets: Ticket[]) {
  try {
    const chunks: Ticket[][] = [];
    for (let i = 0; i < tickets.length; i += 200) {
      chunks.push(tickets.slice(i, i + 200));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((t) => {
        if (!t.eventId) return;
        const ref = doc(db, 'tickets', `${t.eventId}_${t.code}`);
        batch.set(ref, t);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error("Firestore write tickets batch error", err);
  }
}

// SEED FIRESTORE FROM LOCAL IF EMPTY
export async function seedFirestoreIfNeeded() {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    if (eventsSnapshot.empty) {
      console.log("Firestore is empty, seeding from local storage...");
      
      // Seed users
      const users = loadUsers();
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), u);
      }

      // Seed events
      const events = loadEvents();
      for (const ev of events) {
        await setDoc(doc(db, 'events', ev.id), ev);
      }

      // Seed tickets
      const tickets = loadAllTicketsGlobal();
      await saveTicketsToFirestore(tickets);

      // Seed logs
      try {
        const data = localStorage.getItem(LOGS_STORAGE_KEY);
        const logs: ScanLog[] = data ? JSON.parse(data) : [];
        const batch = writeBatch(db);
        logs.forEach((log) => {
          batch.set(doc(db, 'scan_logs', log.id), log);
        });
        await batch.commit();
      } catch (err) {
        console.error("Error seeding scan logs:", err);
      }
      
      console.log("Firestore database seeding finished.");
    }
  } catch (err) {
    console.error("Error checking or seeding Firestore:", err);
  }
}

// USERS MANAGEMENT
export function loadUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  users.forEach(async (u) => {
    try {
      await setDoc(doc(db, 'users', u.id), u);
    } catch (err) {
      console.error("Firestore user write error", err);
    }
  });
}

// EVENTS MANAGEMENT
export function loadEvents(): Event[] {
  try {
    const data = localStorage.getItem(EVENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveEvents(events: Event[]): void {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  events.forEach(async (ev) => {
    try {
      await setDoc(doc(db, 'events', ev.id), ev);
    } catch (err) {
      console.error("Firestore event write error", err);
    }
  });
}

export function createEvent(eventData: Omit<Event, 'id'>): Event {
  const events = loadEvents();
  const newEvent: Event = {
    privacy: 'public',
    ...eventData,
    id: 'event_' + Math.random().toString(36).substr(2, 9)
  };
  events.push(newEvent);
  saveEvents(events);
  return newEvent;
}

// ALL TICKETS MANAGEMENT
export function loadAllTicketsGlobal(): Ticket[] {
  try {
    const data = localStorage.getItem(TICKETS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveAllTicketsGlobal(tickets: Ticket[]): void {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  saveTicketsToFirestore(tickets);
}

export function loadTicketsForEvent(eventId: string): Ticket[] {
  const all = loadAllTicketsGlobal();
  return all.filter(t => t.eventId === eventId);
}

export function saveTicketsForEvent(eventId: string, eventTickets: Ticket[]): void {
  const all = loadAllTicketsGlobal();
  const filtered = all.filter(t => t.eventId !== eventId);
  const sanitized = eventTickets.map(t => ({ ...t, eventId }));
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify([...filtered, ...sanitized]));
  saveTicketsToFirestore(sanitized);
}

// SCAN LOGS
export function loadLogsForEvent(eventId: string): ScanLog[] {
  try {
    const data = localStorage.getItem(LOGS_STORAGE_KEY);
    const allLogs: ScanLog[] = data ? JSON.parse(data) : [];
    return allLogs.filter(log => log.eventId === eventId);
  } catch (e) {
    return [];
  }
}

export function saveLogsForEvent(eventId: string, eventLogs: ScanLog[]): void {
  try {
    const data = localStorage.getItem(LOGS_STORAGE_KEY);
    const allLogs: ScanLog[] = data ? JSON.parse(data) : [];
    const filtered = allLogs.filter(log => log.eventId !== eventId);
    const sanitized = eventLogs.map(log => ({ ...log, eventId }));
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([...filtered, ...sanitized]));
    
    // Save batch to Firestore
    const batch = writeBatch(db);
    sanitized.forEach((log) => {
      batch.set(doc(db, 'scan_logs', log.id), log);
    });
    batch.commit().catch(err => console.error("Firestore batch logs error", err));
  } catch (e) {
    console.error(e);
  }
}

export function addScanLogForEvent(eventId: string, code: string, result: ScanLog['result'], name?: string): ScanLog {
  const logs = loadLogsForEvent(eventId);
  const newLog: ScanLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    code,
    result,
    name,
    eventId
  };
  logs.unshift(newLog);
  saveLogsForEvent(eventId, logs.slice(0, 100)); // limit last 100
  return newLog;
}

export function verifyAndScanTicketForEvent(eventId: string, code: string): {
  result: ScanLog['result'];
  ticket?: Ticket;
  message: string;
} {
  const tickets = loadTicketsForEvent(eventId);
  const trimmedCode = code.trim().toUpperCase();
  const ticketIndex = tickets.findIndex(t => t.code === trimmedCode);

  if (ticketIndex === -1) {
    addScanLogForEvent(eventId, trimmedCode, 'Invalid Ticket');
    return {
      result: 'Invalid Ticket',
      message: 'Invalid Ticket: The code does not exist in this event database.'
    };
  }

  const ticket = tickets[ticketIndex];

  if (ticket.status === 'Attended') {
    addScanLogForEvent(eventId, trimmedCode, 'Already Attended', ticket.name);
    return {
      result: 'Already Attended',
      ticket,
      message: `Already Attended: ${ticket.name || 'This ticket'} was scanned on ${ticket.attendedAt ? new Date(ticket.attendedAt).toLocaleTimeString() : 'unknown time'}.`
    };
  }

  ticket.status = 'Attended';
  ticket.attendedAt = new Date().toISOString();
  tickets[ticketIndex] = ticket;
  saveTicketsForEvent(eventId, tickets);

  addScanLogForEvent(eventId, trimmedCode, 'Verified', ticket.name);

  return {
    result: 'Verified',
    ticket,
    message: ticket.name 
      ? `Verified: Welcome, ${ticket.name}! (${ticket.type} Access)`
      : `Verified: Ticket approved! (No Attendee Registered Yet)`
  };
}

export function registerAttendeeForEvent(
  eventId: string,
  code: string, 
  data: { name: string; email: string; type: Ticket['type']; notes?: string }
): Ticket {
  const tickets = loadTicketsForEvent(eventId);
  const trimmedCode = code.trim().toUpperCase();
  const ticketIndex = tickets.findIndex(t => t.code === trimmedCode);

  let updatedTicket: Ticket;

  if (ticketIndex === -1) {
    updatedTicket = {
      code: trimmedCode,
      status: 'Unscanned',
      attendedAt: null,
      name: data.name,
      email: data.email,
      type: data.type,
      notes: data.notes || "",
      registeredAt: new Date().toISOString(),
      eventId
    };
    tickets.unshift(updatedTicket);
  } else {
    updatedTicket = {
      ...tickets[ticketIndex],
      name: data.name,
      email: data.email,
      type: data.type,
      notes: data.notes || "",
      registeredAt: tickets[ticketIndex].registeredAt || new Date().toISOString()
    };
    tickets[ticketIndex] = updatedTicket;
  }

  saveTicketsForEvent(eventId, tickets);
  return updatedTicket;
}

export function resetDatabaseForEvent(eventId: string): Ticket[] {
  const fresh = getInitialTickets(eventId);
  saveTicketsForEvent(eventId, fresh);
  saveLogsForEvent(eventId, []);
  return fresh;
}

// REALTIME FIRESTORE RECONCILIATION
export function syncFirestore(onUpdate: () => void): () => void {
  // 1. Listen to users
  const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
    const currentLocal = loadUsers();
    let updated = false;
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as User;
      const idx = currentLocal.findIndex(u => u.id === data.id);
      if (change.type === 'added' || change.type === 'modified') {
        if (idx === -1) {
          currentLocal.push(data);
          updated = true;
        } else if (JSON.stringify(currentLocal[idx]) !== JSON.stringify(data)) {
          currentLocal[idx] = data;
          updated = true;
        }
      } else if (change.type === 'removed') {
        if (idx !== -1) {
          currentLocal.splice(idx, 1);
          updated = true;
        }
      }
    });
    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentLocal));
      onUpdate();
    }
  });

  // 2. Listen to events
  const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
    const currentLocal = loadEvents();
    let updated = false;
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as Event;
      const idx = currentLocal.findIndex(e => e.id === data.id);
      if (change.type === 'added' || change.type === 'modified') {
        if (idx === -1) {
          currentLocal.push(data);
          updated = true;
        } else if (JSON.stringify(currentLocal[idx]) !== JSON.stringify(data)) {
          currentLocal[idx] = data;
          updated = true;
        }
      } else if (change.type === 'removed') {
        if (idx !== -1) {
          currentLocal.splice(idx, 1);
          updated = true;
        }
      }
    });
    if (updated) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(currentLocal));
      onUpdate();
    }
  });

  // 3. Listen to tickets
  const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
    const currentLocal = loadAllTicketsGlobal();
    let updated = false;
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as Ticket;
      const idx = currentLocal.findIndex(t => t.eventId === data.eventId && t.code === data.code);
      if (change.type === 'added' || change.type === 'modified') {
        if (idx === -1) {
          currentLocal.push(data);
          updated = true;
        } else if (JSON.stringify(currentLocal[idx]) !== JSON.stringify(data)) {
          currentLocal[idx] = data;
          updated = true;
        }
      } else if (change.type === 'removed') {
        if (idx !== -1) {
          currentLocal.splice(idx, 1);
          updated = true;
        }
      }
    });
    if (updated) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(currentLocal));
      onUpdate();
    }
  });

  // 4. Listen to scan_logs
  const unsubLogs = onSnapshot(collection(db, 'scan_logs'), (snapshot) => {
    try {
      const logData = localStorage.getItem(LOGS_STORAGE_KEY);
      const currentLocal: ScanLog[] = logData ? JSON.parse(logData) : [];
      let updated = false;
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as ScanLog;
        const idx = currentLocal.findIndex(l => l.id === data.id);
        if (change.type === 'added' || change.type === 'modified') {
          if (idx === -1) {
            currentLocal.push(data);
            updated = true;
          } else if (JSON.stringify(currentLocal[idx]) !== JSON.stringify(data)) {
            currentLocal[idx] = data;
            updated = true;
          }
        } else if (change.type === 'removed') {
          if (idx !== -1) {
            currentLocal.splice(idx, 1);
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(currentLocal));
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  });

  return () => {
    unsubUsers();
    unsubEvents();
    unsubTickets();
    unsubLogs();
  };
}
