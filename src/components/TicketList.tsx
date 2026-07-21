import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Ticket } from '../types';
import { Search, Filter, ShieldCheck, HelpCircle, Eye, CheckCircle2, UserPlus, RefreshCw, X, Download, Upload, Mail, Send, AlertTriangle, Sparkles, Check } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onQuickCheckIn: (code: string) => void;
  onAddNewTicket: () => void;
  onResetAll: () => void;
  onBatchAction: (codes: string[], action: 'Attended' | 'Unscanned') => void;
  onImportCSV: (importedTickets: Ticket[]) => void;
}

type StatusFilter = 'all' | 'Attended' | 'Unscanned';
type TierFilter = 'all' | 'VIP' | 'General' | 'Staff' | 'Press';

export default function TicketList({
  tickets,
  onSelectTicket,
  onQuickCheckIn,
  onAddNewTicket,
  onResetAll,
  onBatchAction,
  onImportCSV,
}: TicketListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [sortBy, setSortBy] = useState<'code' | 'recent' | 'scanned'>('code');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Email Campaign State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState<'update' | 'venue' | 'reminder' | 'custom'>('update');
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentLogs, setSentLogs] = useState<string[]>([]);

  const templates = {
    update: {
      subject: "📢 Important: Event Schedule & Timing Update",
      body: "Hello {Name},\n\nPlease note that there has been a critical timing update for our upcoming event. Check-in operations will now begin 30 minutes earlier to ensure a swift, seamless contactless gate flow.\n\nYour Ticket Details:\n- Code: {Code}\n- Tier: {Type} Access\n\nPlease keep this QR/Code ready on your mobile device when arriving.\n\nWarm regards,\nEvent Operations"
    },
    venue: {
      subject: "📍 Event Entry Guide & Gate Instructions",
      body: "Hello {Name},\n\nWe are preparing for your arrival! To ensure smooth entry, please enter via the Main North Entrance and proceed to Gate 2. Parking is complimentary in Lot B.\n\nYour Access Credentials:\n- Code: {Code}\n- Access Level: {Type}\n\nSimply present your code or pass upon arrival.\n\nSafe travels,\nVenue Logistics Team"
    },
    reminder: {
      subject: "⏱️ Gentle Reminder: Your Event Ticket Access Pass",
      body: "Hello {Name},\n\nThis is a friendly reminder that the event starts soon! Make sure to keep your registered ticket details handy.\n\n- Pass Holder: {Name}\n- Code: {Code} ({Type} Pass)\n\nIf you have any questions or require support, reply to this message directly.\n\nWe look forward to seeing you there!\nOperations Command"
    },
    custom: {
      subject: "Event Announcement regarding {Code}",
      body: "Hello {Name},\n\n[Write your custom message here regarding your {Type} access ticket {Code}...]\n\nBest wishes,\nEvent Organizer"
    }
  };

  const openEmailCampaign = () => {
    setEmailTemplate('update');
    setEmailSubject(templates.update.subject);
    setEmailBody(templates.update.body);
    setSendingStatus('idle');
    setSendingProgress(0);
    setSentLogs([]);
    setShowEmailModal(true);
  };

  const handleTemplateChange = (type: 'update' | 'venue' | 'reminder' | 'custom') => {
    setEmailTemplate(type);
    setEmailSubject(templates[type].subject);
    setEmailBody(templates[type].body);
  };

  const handleSimulateSend = () => {
    const validTickets = tickets.filter(
      (t) => selectedCodes.includes(t.code) && t.name && t.email
    );

    if (validTickets.length === 0) {
      alert("None of the selected tickets are registered with a valid attendee name and email.");
      return;
    }

    setSendingStatus('sending');
    setSendingProgress(0);
    setSentLogs([]);

    let currentIndex = 0;

    const sendNext = () => {
      if (currentIndex >= validTickets.length) {
        setSendingStatus('success');
        return;
      }

      const currentTicket = validTickets[currentIndex];
      const personalizedBody = emailBody
        .replace(/{Name}/g, currentTicket.name || 'Attendee')
        .replace(/{Code}/g, currentTicket.code)
        .replace(/{Type}/g, currentTicket.type);

      const logMessage = `[${new Date().toLocaleTimeString()}] Sent to ${currentTicket.name} (${currentTicket.email}) for Pass ${currentTicket.code}`;
      
      setSentLogs((prev) => [...prev, logMessage]);
      setSendingProgress(currentIndex + 1);
      
      currentIndex++;
      setTimeout(sendNext, 450);
    };

    sendNext();
  };

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, tierFilter, sortBy]);

  // Reset selected rows on search, filter, sorting, or pagination change
  useEffect(() => {
    setSelectedCodes([]);
  }, [search, statusFilter, tierFilter, sortBy, currentPage]);

  // Filter and Search tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.code.toLowerCase().includes(search.toLowerCase()) ||
      ticket.name.toLowerCase().includes(search.toLowerCase()) ||
      ticket.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesTier = tierFilter === 'all' || ticket.type === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'recent') {
      const timeA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const timeB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return timeB - timeA; // Newest registered first
    }
    if (sortBy === 'scanned') {
      const timeA = a.attendedAt ? new Date(a.attendedAt).getTime() : 0;
      const timeB = b.attendedAt ? new Date(b.attendedAt).getTime() : 0;
      return timeB - timeA; // Most recently checked-in first
    }
    // Default: alphabetical ticket code
    return a.code.localeCompare(b.code);
  });

  // Export filtered/sorted database to CSV
  const handleExportCSV = () => {
    const headers = ['Ticket Code', 'Attendee Name', 'Email Address', 'Ticket Type', 'Status', 'Registered At', 'Checked In At', 'Notes'];
    
    const rows = sortedTickets.map(ticket => [
      ticket.code,
      ticket.name || '',
      ticket.email || '',
      ticket.type,
      ticket.status,
      ticket.registeredAt ? new Date(ticket.registeredAt).toLocaleString() : '',
      ticket.attendedAt ? new Date(ticket.attendedAt).toLocaleString() : '',
      ticket.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bgi_event_registrants_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVRow = (text: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImportCSVClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportCSVFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return;

      const headers = parseCSVRow(lines[0]);
      
      const imported: Ticket[] = [];
      const headerMap: { [key: string]: string } = {
        'ticket code': 'code',
        'code': 'code',
        'attendee name': 'name',
        'name': 'name',
        'email address': 'email',
        'email': 'email',
        'ticket type': 'type',
        'type': 'type',
        'status': 'status',
        'registered at': 'registeredAt',
        'checked in at': 'attendedAt',
        'attended at': 'attendedAt',
        'notes': 'notes'
      };

      const keyIndices: { [key: string]: number } = {};
      headers.forEach((h, index) => {
        const cleanHeader = h.toLowerCase().replace(/['"]/g, '').trim();
        const mappedKey = headerMap[cleanHeader];
        if (mappedKey) {
          keyIndices[mappedKey] = index;
        }
      });

      const hasCodeIdx = keyIndices['code'] !== undefined;

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        let code = '';
        if (hasCodeIdx) {
          code = row[keyIndices['code']].replace(/['"]/g, '').trim();
        } else if (row[0]) {
          code = row[0].replace(/['"]/g, '').trim();
        }

        if (!code) continue;

        let name = '';
        if (keyIndices['name'] !== undefined && row[keyIndices['name']]) {
          name = row[keyIndices['name']].replace(/['"]/g, '').trim();
        } else if (!hasCodeIdx && row[1]) {
          name = row[1].replace(/['"]/g, '').trim();
        }

        let email = '';
        if (keyIndices['email'] !== undefined && row[keyIndices['email']]) {
          email = row[keyIndices['email']].replace(/['"]/g, '').trim();
        } else if (!hasCodeIdx && row[2]) {
          email = row[2].replace(/['"]/g, '').trim();
        }

        let typeStr = 'General';
        if (keyIndices['type'] !== undefined && row[keyIndices['type']]) {
          typeStr = row[keyIndices['type']].replace(/['"]/g, '').trim();
        } else if (!hasCodeIdx && row[3]) {
          typeStr = row[3].replace(/['"]/g, '').trim();
        }
        let type: Ticket['type'] = 'General';
        const normType = typeStr.toLowerCase();
        if (normType.includes('vip')) type = 'VIP';
        else if (normType.includes('staff')) type = 'Staff';
        else if (normType.includes('press')) type = 'Press';

        let statusStr = 'Unscanned';
        if (keyIndices['status'] !== undefined && row[keyIndices['status']]) {
          statusStr = row[keyIndices['status']].replace(/['"]/g, '').trim();
        } else if (!hasCodeIdx && row[4]) {
          statusStr = row[4].replace(/['"]/g, '').trim();
        }
        const status: Ticket['status'] = (statusStr.toLowerCase().includes('attended') || statusStr.toLowerCase().includes('checked')) ? 'Attended' : 'Unscanned';

        let registeredAt = null;
        if (keyIndices['registeredAt'] !== undefined && row[keyIndices['registeredAt']]) {
          const val = row[keyIndices['registeredAt']].replace(/['"]/g, '').trim();
          registeredAt = val ? new Date(val).toISOString() : null;
        } else {
          registeredAt = new Date().toISOString();
        }

        let attendedAt = null;
        if (keyIndices['attendedAt'] !== undefined && row[keyIndices['attendedAt']]) {
          const val = row[keyIndices['attendedAt']].replace(/['"]/g, '').trim();
          attendedAt = val ? new Date(val).toISOString() : null;
        }

        let notes = '';
        if (keyIndices['notes'] !== undefined && row[keyIndices['notes']]) {
          notes = row[keyIndices['notes']].replace(/['"]/g, '').trim();
        }

        imported.push({
          code: code.toUpperCase(),
          name,
          email,
          type,
          status,
          registeredAt,
          attendedAt,
          notes
        });
      }

      if (imported.length > 0) {
        onImportCSV(imported);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const totalItems = sortedTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      
      {/* Header with quick controls */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/60">
        <div>
          <h3 className="font-bold text-white font-display text-base">Registrant Database</h3>
          <p className="text-xs text-slate-400">Search, manage credentials, and view digital ticket passes</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end items-center shrink-0 font-mono">
          <button
            onClick={handleImportCSVClick}
            className="px-3 py-1.5 border border-slate-800 bg-slate-950/40 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Upload CSV to update/replace database"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSVFile}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={handleExportCSV}
            disabled={totalItems === 0}
            className="px-3 py-1.5 border border-slate-800 bg-slate-950/40 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40 disabled:opacity-40 disabled:hover:text-emerald-400 disabled:hover:bg-slate-950/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Export filtered/sorted registrants to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onResetAll}
            className="px-3 py-1.5 border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-250 hover:bg-slate-800/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Resets database to initial 72 tickets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
          <button
            onClick={onAddNewTicket}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 transition-all uppercase tracking-wider cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Issue Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 border-b border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/20">
        
        {/* Search bar */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search code, attendee, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950 text-indigo-400 focus:bg-slate-950 focus:outline-none border border-slate-800 focus:border-indigo-500 rounded-lg text-xs font-mono transition-colors"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:bg-slate-900 focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Check-Ins</option>
            <option value="Unscanned">Unscanned / Pending</option>
            <option value="Attended">Checked In / Attended</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div className="md:col-span-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:bg-slate-900 focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="General">General Admission</option>
            <option value="VIP">VIP Access</option>
            <option value="Staff">Event Staff</option>
            <option value="Press">Press Media</option>
          </select>
        </div>

        {/* Sort By Selector */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:bg-slate-900 focus:border-indigo-500 cursor-pointer"
          >
            <option value="code">Sort by: Ticket Code</option>
            <option value="recent">Sort by: Registration Date</option>
            <option value="scanned">Sort by: Check-In Timestamp</option>
          </select>
        </div>

      </div>

      {/* BATCH ACTION BAR */}
      {selectedCodes.length > 0 && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-indigo-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>
              Selected <span className="text-white font-bold">{selectedCodes.length}</span> registrant(s)
            </span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onBatchAction(selectedCodes, 'Attended');
                setSelectedCodes([]);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono rounded-lg border border-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-95 text-[11px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Attended</span>
            </button>
            <button
              onClick={() => {
                onBatchAction(selectedCodes, 'Unscanned');
                setSelectedCodes([]);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono rounded-lg border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 text-[11px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Status</span>
            </button>
            <button
              type="button"
              onClick={openEmailCampaign}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono rounded-lg border border-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-95 text-[11px]"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-300" />
              <span>Notify Attendees</span>
            </button>
            <button
              onClick={() => setSelectedCodes([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-indigo-900/50 transition-colors"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto w-full bg-slate-950/10">
        {sortedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-16 px-4 text-center">
            <Search className="w-12 h-12 text-slate-700 opacity-50 mb-3" />
            <p className="font-semibold text-slate-400 text-sm">No matching tickets found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Try adjusting your query, clear the search text, or select another category filter.
            </p>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <div className="border-b border-slate-850">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left border-b border-slate-800 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedTickets.length > 0 && paginatedTickets.every(t => selectedCodes.includes(t.code))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageCodes = paginatedTickets.map(t => t.code);
                            setSelectedCodes(prev => Array.from(new Set([...prev, ...pageCodes])));
                          } else {
                            const pageCodes = paginatedTickets.map(t => t.code);
                            setSelectedCodes(prev => prev.filter(code => !pageCodes.includes(code)));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      Ticket Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      Attendee Credentials
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      Level Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      Check-In Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                  {paginatedTickets.map((ticket) => {
                    const isRegistered = ticket.name && ticket.email;
                    const isChecked = selectedCodes.includes(ticket.code);
                    return (
                      <tr
                        key={ticket.code}
                        className={`border-b border-slate-850/60 transition-colors group ${
                          isChecked ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-950/40'
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap w-10">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCodes(prev => [...prev, ticket.code]);
                              } else {
                                setSelectedCodes(prev => prev.filter(code => code !== ticket.code));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
                          />
                        </td>
                        {/* Ticket Code */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            onClick={() => onSelectTicket(ticket)}
                            className="font-mono font-bold text-xs text-indigo-400 group-hover:text-indigo-300 hover:underline cursor-pointer block text-left"
                          >
                            {ticket.code}
                          </button>
                        </td>

                        {/* Attendee details */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          {isRegistered ? (
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{ticket.name}</p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{ticket.email}</p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-semibold border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-450 animate-pulse" />
                              <span className="font-mono text-[9px] font-bold">READY TO SCAN</span>
                            </span>
                          )}
                        </td>

                        {/* Ticket Type */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              ticket.type === 'VIP'
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'
                                : ticket.type === 'Staff'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : ticket.type === 'Press'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {ticket.type}
                          </span>
                        </td>

                        {/* Check-In Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {ticket.status === 'Attended' ? (
                            <div className="flex flex-col items-start">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-mono font-bold border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>ATTENDED</span>
                              </span>
                              {ticket.attendedAt && (
                                <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                                  {new Date(ticket.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono font-bold border border-slate-700">
                              <HelpCircle className="w-3 h-3 text-slate-500" />
                              <span>UNSCANNED</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => onSelectTicket(ticket)}
                              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center"
                              title="View and Edit Ticket Pass"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {ticket.status === 'Unscanned' && (
                              <button
                                onClick={() => onQuickCheckIn(ticket.code)}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all flex items-center space-x-1 shadow-2xs"
                                title="Quick Check In without pass view"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Check In</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={safeCurrentPage === 1}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 rounded-md transition-all font-semibold"
          >
            Previous
          </button>
          <span>
            Page <span className="text-indigo-400 font-bold">{safeCurrentPage}</span> of <span className="text-slate-300 font-bold">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={safeCurrentPage === totalPages}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 rounded-md transition-all font-semibold"
          >
            Next
          </button>
        </div>
      )}

      {/* Footer statistics bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>
          Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} filtered ({tickets.length} total)
        </span>
        {filteredTickets.length !== tickets.length && (
          <button 
            onClick={() => { setSearch(''); setStatusFilter('all'); setTierFilter('all'); }}
            className="text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* SIMULATED BULK EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-left">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">Simulate Email Notification</h3>
                  <p className="text-[10px] font-mono text-slate-400">Campaign Manager & Attendee Auto-Notifier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (sendingStatus !== 'sending') {
                    setShowEmailModal(false);
                  }
                }}
                disabled={sendingStatus === 'sending'}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 text-left">
              
              {sendingStatus === 'idle' && (
                <>
                  {/* Step 1: Select Template */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase font-mono">1. Select Notification Template</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['update', 'venue', 'reminder', 'custom'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTemplateChange(t)}
                          className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-mono text-[10px] font-bold uppercase tracking-wider ${
                            emailTemplate === t
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Subject & Body Draft */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase font-mono">2. Subject Title</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
                        placeholder="e.g. Schedule Updates"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-400 uppercase font-mono">3. Message Body (Supports Placeholders)</label>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Placeholders: {"{Name}"}, {"{Code}"}, {"{Type}"}</span>
                      </div>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={6}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed resize-none"
                        placeholder="Draft email body..."
                      />
                    </div>
                  </div>

                  {/* Step 3: Recipient List Preview & Warnings */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase font-mono">4. Target Recipients ({selectedCodes.length})</label>
                      <span className="text-[9px] font-mono text-indigo-400">Ready to simulate</span>
                    </div>

                    {(() => {
                      const selectedTickets = tickets.filter(t => selectedCodes.includes(t.code));
                      const registrants = selectedTickets.filter(t => t.name && t.email);
                      const unregisteredCount = selectedTickets.length - registrants.length;

                      return (
                        <div className="space-y-2.5">
                          {unregisteredCount > 0 && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-mono text-amber-400 leading-normal">
                                Warning: <span className="text-white font-bold">{unregisteredCount}</span> selected tickets are unassigned (no name or email registered) and will be skipped during dispatch. Only <span className="text-white font-bold">{registrants.length}</span> will receive updates.
                              </p>
                            </div>
                          )}

                          <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/60 bg-slate-950/40">
                            {selectedTickets.map((t) => {
                              const valid = t.name && t.email;
                              return (
                                <div key={t.code} className="p-2 px-3 flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="text-slate-500 shrink-0">[{t.code}]</span>
                                    {valid ? (
                                      <span className="text-slate-300 truncate">{t.name} ({t.email})</span>
                                    ) : (
                                      <span className="text-slate-500 italic">No attendee registered</span>
                                    )}
                                  </div>
                                  <span>
                                    {valid ? (
                                      <span className="text-emerald-500 font-bold uppercase text-[9px] tracking-wider">Eligible</span>
                                    ) : (
                                      <span className="text-amber-500 font-bold uppercase text-[9px] tracking-wider">Skipped</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Sending / Processing View */}
              {sendingStatus === 'sending' && (
                <div className="space-y-6 py-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                      <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <Mail className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider animate-pulse">Sending Email Campaign...</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Processing dispatch {sendingProgress} of {tickets.filter(t => selectedCodes.includes(t.code) && t.name && t.email).length}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {(() => {
                    const totalToSend = tickets.filter(t => selectedCodes.includes(t.code) && t.name && t.email).length;
                    const percent = Math.round((sendingProgress / totalToSend) * 100) || 0;
                    return (
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Dispatch Active</span>
                          <span>{percent}% Complete</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sending Log Console */}
                  <div className="space-y-1.5 text-left max-w-lg mx-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Console Broadcast Logs</span>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-36 overflow-y-auto font-mono text-[10px] text-indigo-300 space-y-1">
                      {sentLogs.map((log, i) => (
                        <div key={i} className="flex items-start space-x-1">
                          <span className="text-slate-600 shrink-0">&gt;&gt;</span>
                          <span className="break-all">{log}</span>
                        </div>
                      ))}
                      {sentLogs.length === 0 && (
                        <div className="text-slate-600 italic">Initializing transport protocol...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Complete / Success View */}
              {sendingStatus === 'success' && (
                <div className="space-y-6 py-6 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 mb-2">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-black text-white font-mono uppercase tracking-wider">Campaign Dispatched!</h4>
                    <p className="text-xs text-slate-400 font-sans max-w-md leading-relaxed">
                      All personalized event updates have been successfully generated and delivered through our simulated email portal. Attendee profiles have been notified.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left font-mono text-xs space-y-2.5">
                    <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2">
                      <span>METRICS SUMMARY</span>
                      <span className="text-[10px] font-bold text-emerald-400">VERIFIED STATUS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Event Host:</span>
                      <span className="text-slate-200">System Command</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Notifications:</span>
                      <span className="text-slate-200 font-bold">{sendingProgress} Attendees</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Campaign Type:</span>
                      <span className="text-indigo-400 uppercase font-bold">{emailTemplate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subject:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{emailSubject}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2">
              {sendingStatus === 'idle' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateSend}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Notification Campaign</span>
                  </button>
                </>
              )}

              {sendingStatus === 'sending' && (
                <div className="text-[11px] font-mono text-slate-500 animate-pulse">
                  System executing dispatches... please stand by.
                </div>
              )}

              {sendingStatus === 'success' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedCodes([]);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Close Campaign Manager</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
