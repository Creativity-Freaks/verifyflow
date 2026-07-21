import { Ticket, ScanLog } from './types';

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

export function getInitialTickets(): Ticket[] {
  return INITIAL_TICKET_CODES.map((code, index) => {
    // 58 tickets are fully pre-registered, 14 tickets (at the end) are unregistered to allow claim/registration flow
    const isRegistered = index < 58;
    const defaultData = DEFAULT_ATTENDEES[index] || { name: "", email: "", type: "General" };

    // Let's make 3 tickets pre-attended to demonstrate the already scanned state
    // Let's choose indexes 5, 12, 28
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
      notes: isRegistered ? "Pre-registered" : ""
    };
  });
}

const STORAGE_KEY = 'ticket_verification_system_db';
const LOGS_STORAGE_KEY = 'ticket_verification_system_logs';

export function loadTickets(): Ticket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load tickets from localStorage", e);
  }
  const initial = getInitialTickets();
  saveTickets(initial);
  return initial;
}

export function saveTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error("Failed to save tickets to localStorage", e);
  }
}

export function loadLogs(): ScanLog[] {
  try {
    const data = localStorage.getItem(LOGS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load scan logs", e);
  }
  return [];
}

export function saveLogs(logs: ScanLog[]): void {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save scan logs", e);
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOGS_STORAGE_KEY);
}

export function addScanLog(code: string, result: ScanLog['result'], name?: string): ScanLog {
  const logs = loadLogs();
  const newLog: ScanLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    code,
    result,
    name
  };
  logs.unshift(newLog); // Put most recent at top
  saveLogs(logs.slice(0, 100)); // Keep last 100 logs
  return newLog;
}

export function verifyAndScanTicket(code: string): {
  result: ScanLog['result'];
  ticket?: Ticket;
  message: string;
} {
  const tickets = loadTickets();
  const trimmedCode = code.trim().toUpperCase();
  const ticketIndex = tickets.findIndex(t => t.code === trimmedCode);

  if (ticketIndex === -1) {
    addScanLog(trimmedCode, 'Invalid Ticket');
    return {
      result: 'Invalid Ticket',
      message: 'Invalid Ticket: The code does not exist in our system.'
    };
  }

  const ticket = tickets[ticketIndex];

  if (ticket.status === 'Attended') {
    addScanLog(trimmedCode, 'Already Attended', ticket.name);
    return {
      result: 'Already Attended',
      ticket,
      message: `Already Attended: This ticket was scanned on ${ticket.attendedAt ? new Date(ticket.attendedAt).toLocaleTimeString() : 'unknown time'}.`
    };
  }

  // Update to Attended
  ticket.status = 'Attended';
  ticket.attendedAt = new Date().toISOString();
  tickets[ticketIndex] = ticket;
  saveTickets(tickets);

  addScanLog(trimmedCode, 'Verified', ticket.name);

  return {
    result: 'Verified',
    ticket,
    message: ticket.name 
      ? `Verified: Welcome, ${ticket.name}! (${ticket.type} Access)`
      : `Verified: Ticket approved! (No Attendee Registered Yet)`
  };
}

export function registerAttendee(
  code: string, 
  data: { name: string; email: string; type: Ticket['type']; notes?: string }
): Ticket {
  const tickets = loadTickets();
  const trimmedCode = code.trim().toUpperCase();
  const ticketIndex = tickets.findIndex(t => t.code === trimmedCode);

  if (ticketIndex === -1) {
    throw new Error("Ticket code not found in database.");
  }

  const updatedTicket: Ticket = {
    ...tickets[ticketIndex],
    name: data.name,
    email: data.email,
    type: data.type,
    notes: data.notes || "",
    registeredAt: tickets[ticketIndex].registeredAt || new Date().toISOString()
  };

  tickets[ticketIndex] = updatedTicket;
  saveTickets(tickets);
  return updatedTicket;
}

export function resetDatabase(): Ticket[] {
  const initial = getInitialTickets();
  saveTickets(initial);
  clearLogs();
  return initial;
}
