import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, ScanLog } from './types';
import {
  loadTickets,
  saveTickets,
  loadLogs,
  saveLogs,
  verifyAndScanTicket,
  resetDatabase,
} from './db';
import { playSuccessSound, playWarningSound, playErrorSound } from './utils/audio';

// Components
import StatsGrid from './components/StatsGrid';
import Scanner from './components/Scanner';
import TicketList from './components/TicketList';
import TicketDetailModal from './components/TicketDetailModal';
import ScanLogPanel from './components/ScanLogPanel';

// Icons
import { ShieldCheck, Info, CheckCircle, AlertTriangle, XCircle, UserPlus, QrCode } from 'lucide-react';

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // App Notification Toast
  const [toast, setToast] = useState<{
    message: string;
    result: ScanLog['result'];
  } | null>(null);

  // Load database on mount
  useEffect(() => {
    setTickets(loadTickets());
    setLogs(loadLogs());
  }, []);

  // Sync state helper
  const syncWithDatabase = () => {
    setTickets(loadTickets());
    setLogs(loadLogs());
  };

  // Toast Helper
  const showToast = (message: string, result: ScanLog['result']) => {
    setToast({ message, result });
    // Auto-clear toast after 5 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  };

  // Handle Scan Outcome (from camera scanner or manual entry)
  const handleScanCompleted = (result: ScanLog['result'], ticket?: Ticket, message?: string) => {
    syncWithDatabase();
    
    // Update selected ticket details if it is currently open in modal view
    if (selectedTicket && ticket && selectedTicket.code === ticket.code) {
      setSelectedTicket(ticket);
    }

    if (message) {
      showToast(message, result);
    }
  };

  // Quick check-in from table (bypassing webcam scanning or full modal pass)
  const handleQuickCheckIn = (code: string) => {
    const response = verifyAndScanTicket(code);
    
    if (response.result === 'Verified') {
      playSuccessSound();
    } else if (response.result === 'Already Attended') {
      playWarningSound();
    } else {
      playErrorSound();
    }

    syncWithDatabase();
    showToast(response.message, response.result);

    // Sync selected ticket details modal if open
    if (selectedTicket && selectedTicket.code === code.trim().toUpperCase() && response.ticket) {
      setSelectedTicket(response.ticket);
    }
  };

  // Reset check-in status back to Unscanned
  const handleResetStatus = (code: string) => {
    const dbTickets = loadTickets();
    const idx = dbTickets.findIndex(t => t.code === code);
    if (idx !== -1) {
      dbTickets[idx].status = 'Unscanned';
      dbTickets[idx].attendedAt = null;
      saveTickets(dbTickets);
      syncWithDatabase();
      
      // Update selected ticket details if modal is open
      if (selectedTicket && selectedTicket.code === code) {
        setSelectedTicket(dbTickets[idx]);
      }
      
      showToast(`Ticket status for ${code} reset to Unscanned.`, 'Verified');
    }
  };

  // Perform bulk actions on multiple tickets at once
  const handleBatchAction = (codes: string[], action: 'Attended' | 'Unscanned') => {
    const dbTickets = loadTickets();
    let updatedCount = 0;
    
    codes.forEach(code => {
      const idx = dbTickets.findIndex(t => t.code === code);
      if (idx !== -1) {
        const ticket = dbTickets[idx];
        if (ticket.status !== action) {
          ticket.status = action;
          ticket.attendedAt = action === 'Attended' ? new Date().toISOString() : null;
          updatedCount++;
          
          // Also update selected ticket modal state if currently open
          if (selectedTicket && selectedTicket.code === code) {
            setSelectedTicket({ ...ticket });
          }
        }
      }
    });

    if (updatedCount > 0) {
      saveTickets(dbTickets);
      syncWithDatabase();
      showToast(`Successfully updated ${updatedCount} ticket(s) to ${action}.`, 'Verified');
      playSuccessSound();
    }
  };

  // Issue completely new ticket
  const handleAddNewTicket = () => {
    const dbTickets = loadTickets();
    let newCode = '';
    let unique = false;
    
    // Generate unique code BGI-XXXXXX
    while (!unique) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      newCode = `BGI-${rand}`;
      unique = !dbTickets.some(t => t.code === newCode);
    }

    const newTicket: Ticket = {
      code: newCode,
      status: 'Unscanned',
      attendedAt: null,
      name: '',
      email: '',
      type: 'General',
      registeredAt: null,
      notes: ''
    };

    dbTickets.unshift(newTicket);
    saveTickets(dbTickets);
    syncWithDatabase();

    // Instantly open details modal to let user register credentials
    setSelectedTicket(newTicket);
    showToast(`New ticket ${newCode} generated successfully. Fill in details to register.`, 'Verified');
  };

  // Save updated ticket details from modal
  const handleSaveTicket = (updatedTicket: Ticket) => {
    syncWithDatabase();
    setSelectedTicket(updatedTicket);
  };

  // Reset entire database to initial mock registry
  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to reset the entire database? All custom registrations and check-ins will be erased.")) {
      const initial = resetDatabase();
      setTickets(initial);
      setLogs([]);
      setSelectedTicket(null);
      showToast("Database successfully restored to original state (72 tickets imported).", 'Verified');
    }
  };

  // Import custom tickets from CSV
  const handleImportCSV = (imported: Ticket[]) => {
    saveTickets(imported);
    syncWithDatabase();
    showToast(`Successfully imported ${imported.length} tickets to the event database!`, 'Verified');
    playSuccessSound();
  };

  // Clear live activity logs
  const handleClearLogs = () => {
    localStorage.removeItem('ticket_verification_system_logs');
    setLogs([]);
  };

  const unscanned = tickets.filter(t => t.status === 'Unscanned');
  const attended = tickets.filter(t => t.status === 'Attended');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 antialiased selection:bg-indigo-500/30 selection:text-white">
      
      {/* GLOBAL TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full pointer-events-none space-y-2">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="pointer-events-auto bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-4 flex items-start space-x-3"
            >
              <div className="shrink-0">
                {toast.result === 'Verified' ? (
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg block border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                ) : toast.result === 'Already Attended' ? (
                  <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg block border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg block border border-rose-500/20">
                    <XCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-bold uppercase tracking-wide ${
                  toast.result === 'Verified' ? 'text-emerald-400' : toast.result === 'Already Attended' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {toast.result === 'Verified' 
                    ? 'Scan verified' 
                    : toast.result === 'Already Attended' 
                    ? 'Duplicate scan' 
                    : 'System Alert'}
                </p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HEADER BAR */}
      <header className="bg-slate-900/40 border-b border-slate-800 py-4 px-6 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 relative group">
              <QrCode className="w-5.5 h-5.5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-display uppercase">
                  Verify<span className="text-indigo-400">Flow</span>
                </h1>
                <span className="px-1.5 py-0.5 bg-slate-800 text-[9px] text-slate-400 font-mono rounded-md border border-slate-700/50 uppercase tracking-widest font-bold">
                  v3.0
                </span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">
                Event Verification & DB Registry
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6 font-mono text-xs">
            {/* Issue Ticket Navigation Button */}
            <button
              onClick={handleAddNewTicket}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Issue Ticket</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* STATS TILES GRID */}
        <StatsGrid tickets={tickets} />

        {/* TOP SECTION: SCANNER AND RECENT ACTIVITIES SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* SCANNER CORE (LEFT ON LG SCREEN) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[460px] sm:h-[500px]">
            <Scanner
              onScanCompleted={handleScanCompleted}
              unscannedTickets={unscanned}
              attendedTickets={attended}
            />
          </div>

          {/* RECENT ACTIVITIES (RIGHT ON LG SCREEN) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[400px] sm:h-[500px]">
            <ScanLogPanel
              logs={logs}
              onClear={handleClearLogs}
              className="h-full"
            />
          </div>

        </div>

        {/* BOTTOM SECTION: REGISTRANT DATABASE FULL WIDTH */}
        <div className="w-full flex flex-col min-h-[450px] sm:min-h-[500px]">
          <TicketList
            tickets={tickets}
            onSelectTicket={setSelectedTicket}
            onQuickCheckIn={handleQuickCheckIn}
            onAddNewTicket={handleAddNewTicket}
            onResetAll={handleResetAll}
            onBatchAction={handleBatchAction}
            onImportCSV={handleImportCSV}
          />
        </div>

      </main>

      {/* FOOTER ACCORDING TO COMPANY BRANDING */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 mt-auto py-6 px-6 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="px-2 py-0.5 bg-slate-900 text-slate-400 font-bold border border-slate-800 rounded font-mono text-[10px]">
              PROD_READY
            </span>
            <span>
              &copy; {new Date().getFullYear()}{" "}
              <a
                href="https://cftechlab.tech"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold underline decoration-indigo-500/30 underline-offset-4"
              >
                CF Tech Lab
              </a>
              . All Rights Reserved.
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-[11px]">
            <span className="hidden md:inline">SYSTEM PIPELINE SECURED</span>
            <span className="hidden md:inline">|</span>
            <span>
              PRODUCT BY{" "}
              <a
                href="https://cftechlab.tech"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors font-bold"
              >
                CFTECHLAB.TECH
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* TICKET DETAILS MODAL overlay */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onSave={handleSaveTicket}
            onCheckIn={handleQuickCheckIn}
            onResetStatus={handleResetStatus}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

