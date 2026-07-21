import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, ScanLog, User, Event } from './types';
import {
  loadUsers,
  saveUsers,
  loadEvents,
  saveEvents,
  createEvent,
  loadTicketsForEvent,
  saveTicketsForEvent,
  loadLogsForEvent,
  saveLogsForEvent,
  verifyAndScanTicketForEvent,
  registerAttendeeForEvent,
  resetDatabaseForEvent,
  syncFirestore,
  seedFirestoreIfNeeded,
} from './db';
import { playSuccessSound, playWarningSound, playErrorSound } from './utils/audio';
import { compressImageFile } from './utils/image';

// Components
import StatsGrid from './components/StatsGrid';
import Scanner from './components/Scanner';
import TicketList from './components/TicketList';
import TicketDetailModal from './components/TicketDetailModal';
import ScanLogPanel from './components/ScanLogPanel';

// Icons
import { 
  ShieldCheck, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  UserPlus, 
  QrCode, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  LogOut, 
  Plus, 
  Eye, 
  Lock, 
  Globe,
  Share2,
  Copy,
  Check,
  Mail, 
  Download, 
  LayoutDashboard, 
  Users, 
  Sparkles,
  ClipboardList,
  Upload,
  Image as ImageIcon,
  Trash2,
  Building2
} from 'lucide-react';

export default function App() {
  // Navigation / Views: 'landing' | 'auth' | 'organizer_dashboard' | 'event_manager' | 'public_event'
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'organizer_dashboard' | 'event_manager' | 'public_event'>('landing');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLogoUrl, setAuthLogoUrl] = useState('');
  const [authError, setAuthError] = useState('');

  // Event List state
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventColor, setNewEventColor] = useState('indigo');
  const [newEventBannerUrl, setNewEventBannerUrl] = useState('');
  const [newEventPrivacy, setNewEventPrivacy] = useState<'public' | 'private'>('public');

  // Image Upload Handlers
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.85);
      setAuthLogoUrl(compressed);
    } catch (err) {
      alert('Could not process logo photo. Please select another image.');
    }
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 800, 0.85);
      setNewEventBannerUrl(compressed);
    } catch (err) {
      alert('Could not process banner photo. Please select another image.');
    }
  };

  // Active Workspace states (scoped to selectedEventId)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'scanner' | 'tickets' | 'stats'>('scanner');

  // Public Registrant Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regType, setRegType] = useState<Ticket['type']>('General');
  const [regSuccessTicket, setRegSuccessTicket] = useState<Ticket | null>(null);
  const [regError, setRegError] = useState('');

  // App Notification Toast
  const [toast, setToast] = useState<{
    message: string;
    result: ScanLog['result'];
  } | null>(null);

  // Load active user and events on mount
  useEffect(() => {
    const allEvents = loadEvents();
    setEvents(allEvents);

    const cachedUser = localStorage.getItem('verifyflow_active_user');
    let userLoggedIn = false;
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setCurrentUser(parsed);
        userLoggedIn = true;
      } catch (e) {
        localStorage.removeItem('verifyflow_active_user');
      }
    }

    if (userLoggedIn) {
      setCurrentView('organizer_dashboard');
    }
  }, []);

  // Seed and synchronize with Firebase Firestore in real-time
  useEffect(() => {
    seedFirestoreIfNeeded();

    const unsubscribe = syncFirestore(() => {
      setEvents(loadEvents());
      if (selectedEventId) {
        setTickets(loadTicketsForEvent(selectedEventId));
        setLogs(loadLogsForEvent(selectedEventId));
      }
    });

    return () => unsubscribe();
  }, [selectedEventId]);

  // Handle direct event link shares, even when loaded asynchronously from Firestore
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventParam = params.get('event');
    if (eventParam && events.length > 0) {
      const found = events.find(e => e.id === eventParam || e.id.toLowerCase() === eventParam.toLowerCase());
      if (found && selectedEventId !== found.id) {
        setSelectedEventId(found.id);
        setCurrentView('public_event');
      }
    }
  }, [events, selectedEventId]);

  // Reload events whenever dashboard loads
  useEffect(() => {
    if (currentView === 'organizer_dashboard' || currentView === 'landing') {
      setEvents(loadEvents());
    }
  }, [currentView]);

  // Sync tickets & logs when event manager opens
  useEffect(() => {
    if (selectedEventId && currentView === 'event_manager') {
      setTickets(loadTicketsForEvent(selectedEventId));
      setLogs(loadLogsForEvent(selectedEventId));
      setActiveMobileTab('scanner');
    }
  }, [selectedEventId, currentView]);

  // Toast Helper
  const showToast = (message: string, result: ScanLog['result']) => {
    setToast({ message, result });
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  };

  // Sync active event workspace
  const syncWithEventDatabase = () => {
    if (selectedEventId) {
      setTickets(loadTicketsForEvent(selectedEventId));
      setLogs(loadLogsForEvent(selectedEventId));
    }
  };

  // Sound and verification callback
  const handleScanCompleted = (result: ScanLog['result'], ticket?: Ticket, message?: string) => {
    syncWithEventDatabase();
    if (selectedTicket && ticket && selectedTicket.code === ticket.code) {
      setSelectedTicket(ticket);
    }
    if (message) {
      showToast(message, result);
    }
  };

  // Quick check-in from Table
  const handleQuickCheckIn = (code: string) => {
    if (!selectedEventId) return;
    const response = verifyAndScanTicketForEvent(selectedEventId, code);
    
    if (response.result === 'Verified') {
      playSuccessSound();
    } else if (response.result === 'Already Attended') {
      playWarningSound();
    } else {
      playErrorSound();
    }

    syncWithEventDatabase();
    showToast(response.message, response.result);

    if (selectedTicket && selectedTicket.code === code.trim().toUpperCase() && response.ticket) {
      setSelectedTicket(response.ticket);
    }
  };

  // Reset status back to Unscanned
  const handleResetStatus = (code: string) => {
    if (!selectedEventId) return;
    const dbTickets = loadTicketsForEvent(selectedEventId);
    const idx = dbTickets.findIndex(t => t.code === code);
    if (idx !== -1) {
      dbTickets[idx].status = 'Unscanned';
      dbTickets[idx].attendedAt = null;
      saveTicketsForEvent(selectedEventId, dbTickets);
      syncWithEventDatabase();
      
      if (selectedTicket && selectedTicket.code === code) {
        setSelectedTicket(dbTickets[idx]);
      }
      
      showToast(`Ticket status for ${code} reset to Unscanned.`, 'Verified');
    }
  };

  // Bulk actions
  const handleBatchAction = (codes: string[], action: 'Attended' | 'Unscanned') => {
    if (!selectedEventId) return;
    const dbTickets = loadTicketsForEvent(selectedEventId);
    let updatedCount = 0;
    
    codes.forEach(code => {
      const idx = dbTickets.findIndex(t => t.code === code);
      if (idx !== -1) {
        const ticket = dbTickets[idx];
        if (ticket.status !== action) {
          ticket.status = action;
          ticket.attendedAt = action === 'Attended' ? new Date().toISOString() : null;
          updatedCount++;
          
          if (selectedTicket && selectedTicket.code === code) {
            setSelectedTicket({ ...ticket });
          }
        }
      }
    });

    if (updatedCount > 0) {
      saveTicketsForEvent(selectedEventId, dbTickets);
      syncWithEventDatabase();
      showToast(`Successfully updated ${updatedCount} ticket(s) to ${action}.`, 'Verified');
      playSuccessSound();
    }
  };

  // Issue New Ticket
  const handleAddNewTicket = () => {
    if (!selectedEventId) return;
    const dbTickets = loadTicketsForEvent(selectedEventId);
    let newCode = '';
    let unique = false;
    
    // Generate unique code BGI-XXXXXX (or similar prefix)
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
      notes: '',
      eventId: selectedEventId
    };

    dbTickets.unshift(newTicket);
    saveTicketsForEvent(selectedEventId, dbTickets);
    syncWithEventDatabase();

    setSelectedTicket(newTicket);
    showToast(`New ticket ${newCode} generated. Fill in details below.`, 'Verified');
  };

  // Save Modal Changes
  const handleSaveTicket = (updatedTicket: Ticket) => {
    syncWithEventDatabase();
    setSelectedTicket(updatedTicket);
  };

  // Reset event database
  const handleResetAll = () => {
    if (!selectedEventId) return;
    if (window.confirm("Are you sure you want to reset this event's database? All custom registrations and check-ins will be erased.")) {
      const initial = resetDatabaseForEvent(selectedEventId);
      setTickets(initial);
      setLogs([]);
      setSelectedTicket(null);
      showToast("Database successfully restored to seed state.", 'Verified');
    }
  };

  // Import tickets
  const handleImportCSV = (imported: Ticket[]) => {
    if (!selectedEventId) return;
    saveTicketsForEvent(selectedEventId, imported);
    syncWithEventDatabase();
    showToast(`Successfully imported ${imported.length} tickets to the database!`, 'Verified');
    playSuccessSound();
  };

  // Clear Event Logs
  const handleClearLogs = () => {
    if (!selectedEventId) return;
    saveLogsForEvent(selectedEventId, []);
    setLogs([]);
  };

  // Auth Submit
  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail || !authPassword || (authMode === 'signup' && !authName)) {
      setAuthError('Please fill out all required credentials.');
      return;
    }

    const users = loadUsers();

    if (authMode === 'login') {
      const found = users.find(u => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword);
      if (found) {
        localStorage.setItem('verifyflow_active_user', JSON.stringify(found));
        setCurrentUser(found);
        setCurrentView('organizer_dashboard');
        setAuthPassword('');
        setAuthEmail('');
      } else {
        setAuthError('Invalid email or password. Try demo@cftechlab.tech / password');
      }
    } else {
      // Sign Up
      const exists = users.some(u => u.email.toLowerCase() === authEmail.toLowerCase());
      if (exists) {
        setAuthError('An account with this email already exists.');
        return;
      }

      const newUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email: authEmail,
        name: authName,
        password: authPassword,
        logoUrl: authLogoUrl || undefined
      };

      users.push(newUser);
      saveUsers(users);

      localStorage.setItem('verifyflow_active_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      setCurrentView('organizer_dashboard');
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthLogoUrl('');
    }
  };

  // Quick Demo Login helper
  const handleDemoLogin = () => {
    setAuthEmail('demo@cftechlab.tech');
    setAuthPassword('password');
    setAuthMode('login');
    // Set timeout to let state update, then login
    setTimeout(() => {
      const users = loadUsers();
      const found = users.find(u => u.email === 'demo@cftechlab.tech' && u.password === 'password');
      if (found) {
        localStorage.setItem('verifyflow_active_user', JSON.stringify(found));
        setCurrentUser(found);
        setCurrentView('organizer_dashboard');
      }
    }, 100);
  };

  // Create Event Submit
  const handleCreateEventSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!newEventTitle || !newEventDate || !newEventTime || !newEventVenue) {
      alert('Please fill out the event title, date, time, and venue.');
      return;
    }

    const added = createEvent({
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      venue: newEventVenue,
      description: newEventDesc || 'No custom details provided.',
      organizerId: currentUser.id,
      bannerColor: newEventColor,
      bannerUrl: newEventBannerUrl || undefined,
      privacy: newEventPrivacy
    });

    // Seed empty tickets array for this event
    saveTicketsForEvent(added.id, []);

    // Reset Form
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventVenue('');
    setNewEventDesc('');
    setNewEventColor('indigo');
    setNewEventBannerUrl('');
    setNewEventPrivacy('public');
    setShowCreateEventModal(false);

    // Refresh events
    setEvents(loadEvents());
    showToast(`Successfully created event "${added.title}"!`, 'Verified');
  };

  // Public Registrant Submit
  const handlePublicRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!selectedEventId) return;

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Please provide your name and email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(regEmail)) {
      setRegError('Please provide a valid email.');
      return;
    }

    try {
      // Generate unique registration code
      const currentEvTickets = loadTicketsForEvent(selectedEventId);
      let randCode = '';
      let unique = false;
      while (!unique) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        randCode = `REG-${rand}`;
        unique = !currentEvTickets.some(t => t.code === randCode);
      }

      const registered = registerAttendeeForEvent(selectedEventId, randCode, {
        name: regName.trim(),
        email: regEmail.trim(),
        type: regType,
        notes: 'Public self-registration'
      });

      setRegSuccessTicket(registered);
      setRegName('');
      setRegEmail('');
      setRegType('General');
      playSuccessSound();
    } catch (e: any) {
      setRegError(e.message || 'Failed to complete registration.');
    }
  };

  // Download pass from public page
  const downloadPublicPass = async (code: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VerifyFlow_EventPass_${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(qrUrl, '_blank');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('verifyflow_active_user');
    setCurrentUser(null);
    setSelectedEventId(null);
    setCurrentView('landing');
  };

  const unscanned = tickets.filter(t => t.status === 'Unscanned');
  const attended = tickets.filter(t => t.status === 'Attended');

  // Helpers for banner colors
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald': return 'from-emerald-600 via-emerald-700 to-teal-800 text-emerald-400 border-emerald-500/20';
      case 'rose': return 'from-rose-600 via-rose-700 to-pink-800 text-rose-400 border-rose-500/20';
      case 'fuchsia': return 'from-fuchsia-600 via-fuchsia-700 to-purple-800 text-fuchsia-400 border-fuchsia-500/20';
      case 'amber': return 'from-amber-500 via-amber-600 to-yellow-700 text-amber-400 border-amber-500/20';
      default: return 'from-indigo-600 via-indigo-700 to-violet-800 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 antialiased selection:bg-indigo-500/30 selection:text-white">
      
      {/* GLOBAL TOAST NOTIFICATION */}
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

      {/* DYNAMIC HEADER */}
      <header className="bg-slate-900/40 border-b border-slate-800 py-4 px-6 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => {
              if (currentUser) {
                setCurrentView('organizer_dashboard');
              } else {
                setCurrentView('landing');
              }
            }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 relative">
              <QrCode className="w-5.5 h-5.5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-display uppercase">
                  Verify<span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Flow</span>
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

          {/* Navigation Controls */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
                  {currentUser.logoUrl ? (
                    <img src={currentUser.logoUrl} alt={currentUser.name} className="w-5 h-5 rounded-md object-cover border border-slate-700" />
                  ) : (
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="hidden sm:inline text-xs font-mono text-slate-450 uppercase">
                    <strong className="text-slate-200">{currentUser.name}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentView('organizer_dashboard')}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-xl text-slate-350 transition-colors border border-slate-700/50 cursor-pointer"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 border border-rose-500/25 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              currentView !== 'auth' && (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentView('auth');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  Organizer Login
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* CORE PAGES RENDERING */}
      <main className={`flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-start ${currentView === 'event_manager' ? 'pb-24 md:pb-6' : ''}`}>
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: LANDING PAGE */}
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 py-6"
            >
              {/* Hero Banner Accent */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono font-bold text-[10px] uppercase tracking-widest inline-block mb-4">
                  Introducing VerifyFlow 3.0
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase font-display max-w-2xl mx-auto leading-tight">
                  Premium Event Registration & <span className="text-indigo-400">QR Gateway</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mt-4 leading-relaxed font-sans">
                  The ultimate secure ecosystem for event owners to build, register attendees, issue credentials, and run low-latency live camera verification.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setCurrentView('auth');
                    }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Create Organizer Account
                  </button>
                  <button
                    onClick={handleDemoLogin}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-700/50 transition-all cursor-pointer"
                  >
                    Explore Demo Portal
                  </button>
                </div>
              </div>

              {/* Direct Access / Code Entry */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Have a Private Event ID or Link?</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    If you received a private invite code or link, paste the Event ID below to access the registration page.
                  </p>
                </div>
                <div className="w-full md:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. event_1"
                    id="privateEventIdInput"
                    className="flex-1 md:w-64 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('privateEventIdInput') as HTMLInputElement | null;
                      const code = input?.value?.trim();
                      if (code) {
                        const found = events.find(e => e.id === code || e.id.toLowerCase() === code.toLowerCase());
                        if (found) {
                          setSelectedEventId(found.id);
                          setRegSuccessTicket(null);
                          setRegError('');
                          setCurrentView('public_event');
                        } else {
                          alert(`Could not find an event with ID "${code}". Please verify your code and try again.`);
                        }
                      } else {
                        alert('Please enter an Event ID.');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    Go to Event
                  </button>
                </div>
              </div>

              {/* Browse Public Events Grid */}
              <div className="space-y-4">
                {(() => {
                  const publicEvents = events.filter((ev) => ev.privacy !== 'private');
                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white font-display">Active Events Registry</h3>
                          <p className="text-xs text-slate-550">Browse public expos and summits. Click on any card to register as an attendee.</p>
                        </div>
                        <span className="px-2 py-1 bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-400 rounded-md">
                          {publicEvents.length} PUBLIC EVENTS
                        </span>
                      </div>

                      {publicEvents.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
                          <Globe className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-mono">No public events are active right now.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {publicEvents.map((ev) => {
                            const colorSet = getColorClasses(ev.bannerColor || 'indigo');
                            return (
                              <div 
                                key={ev.id}
                                className="bg-slate-900 rounded-2xl border border-slate-800/80 hover:border-slate-750 transition-all overflow-hidden flex flex-col justify-between group h-full"
                              >
                                <div>
                                  {/* Banner background picture or color scheme */}
                                  {ev.bannerUrl ? (
                                    <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                                      <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                                    </div>
                                  ) : (
                                    <div className={`h-3 bg-gradient-to-r ${colorSet}`} />
                                  )}
                                  <div className="p-6 text-left">
                                    <span className="px-2 py-0.5 bg-slate-950 text-indigo-400 font-mono text-[10px] font-bold rounded uppercase border border-slate-800 tracking-wider">
                                      PUBLIC REGISTRATION OPEN
                                    </span>
                                    <h4 className="text-xl font-bold font-display tracking-tight text-white uppercase mt-3 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                      {ev.title}
                                    </h4>
                                    <p className="text-xs text-slate-450 mt-2 line-clamp-3 leading-relaxed">
                                      {ev.description}
                                    </p>
                                    
                                    {/* Metadata list */}
                                    <div className="mt-5 space-y-2 border-t border-slate-850 pt-4 font-mono text-[11px] text-slate-400">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>{ev.date}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>{ev.time}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span className="truncate">{ev.venue}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="px-6 pb-6 pt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedEventId(ev.id);
                                      setRegSuccessTicket(null);
                                      setRegError('');
                                      setCurrentView('public_event');
                                    }}
                                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border border-slate-800 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                  >
                                    <UserPlus className="w-4 h-4 text-indigo-400" />
                                    <span>Register & Claim Ticket</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* VIEW 2: AUTHENTICATION (LOGIN / SIGN UP) */}
          {currentView === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md w-full mx-auto py-12"
            >
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-left">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600" />
                <div className="p-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <button 
                      onClick={() => setCurrentView('landing')}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors mr-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-xl font-bold font-display uppercase tracking-wide text-white">
                      Organizer Portal
                    </h3>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Organizer Name</label>
                          <input
                            type="text"
                            placeholder="e.g. CF Tech Lab"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                            <span>Company / Organizer Logo</span>
                            <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                          </label>
                          
                          {authLogoUrl ? (
                            <div className="flex items-center space-x-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                              <img src={authLogoUrl} alt="Logo Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" />
                              <div className="flex-1 min-w-0 text-left">
                                <span className="block text-xs font-semibold text-slate-200 truncate">Logo Attached</span>
                                <span className="block text-[10px] text-emerald-400 font-mono">Will show on events & profile</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAuthLogoUrl('')}
                                className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                                title="Remove Logo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center space-x-2 w-full px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs font-medium text-slate-400 transition-all cursor-pointer">
                              <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>Click or drop image to upload logo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. manager@domain.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Password</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs rounded-lg flex items-center space-x-2 font-mono">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer font-mono"
                    >
                      {authMode === 'login' ? 'Sign In as Organizer' : 'Create Organizer Account'}
                    </button>
                  </form>

                  {/* Auth Mode Toggle */}
                  <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => {
                        setAuthError('');
                        setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Login"}
                    </button>
                    
                    {authMode === 'login' && (
                      <button
                        onClick={handleDemoLogin}
                        className="text-amber-400 hover:text-amber-300 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Instant Demo Login</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 3: ORGANIZER DASHBOARD (MY EVENTS GRID) */}
          {currentView === 'organizer_dashboard' && currentUser && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left py-4"
            >
              {/* Dashboard Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-2xl gap-4">
                <div className="flex items-center space-x-3.5">
                  {currentUser.logoUrl ? (
                    <img src={currentUser.logoUrl} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white font-display uppercase tracking-wide">
                      My Managed Events
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Logged in as <strong className="text-slate-200">{currentUser.name}</strong>. Create new events or click Manage to boot the QR gateway.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              </div>

              {/* Event card layout filtered by organizerId */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events
                  .filter(e => e.organizerId === currentUser.id)
                  .map(ev => {
                    const colorSet = getColorClasses(ev.bannerColor || 'indigo');
                    // Compute ticket metrics
                    const evTickets = loadTicketsForEvent(ev.id);
                    const totalReg = evTickets.filter(t => t.name && t.email).length;
                    const totalCheckedIn = evTickets.filter(t => t.status === 'Attended').length;
                    
                    return (
                      <div 
                        key={ev.id}
                        className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-750 transition-colors group"
                      >
                        <div>
                          {ev.bannerUrl ? (
                            <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                              <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                            </div>
                          ) : (
                            <div className={`h-3 bg-gradient-to-r ${colorSet}`} />
                          )}
                          <div className="p-6">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-lg font-bold font-display text-white uppercase truncate flex-1">
                                {ev.title}
                              </h3>
                              {ev.privacy === 'private' ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                                  <Lock className="w-2.5 h-2.5" /> PRIVATE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                                  <Globe className="w-2.5 h-2.5" /> PUBLIC
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 font-mono flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{ev.date} @ {ev.time}</span>
                            </p>
                            
                            {/* Live Stats Row */}
                            <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-slate-850 py-3 font-mono text-xs">
                              <div className="bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-850 text-left">
                                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Registered Guests</span>
                                <strong className="text-sm font-bold text-slate-200">{totalReg}</strong>
                              </div>
                              <div className="bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-850 text-left">
                                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Checked In Pass</span>
                                <strong className="text-sm font-bold text-emerald-400">{totalCheckedIn}</strong>
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-450 mt-4 line-clamp-2 leading-relaxed">
                              {ev.description}
                            </p>
                          </div>
                        </div>

                        {/* Event action controls */}
                        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                setSelectedEventId(ev.id);
                                setRegSuccessTicket(null);
                                setRegError('');
                                setCurrentView('public_event');
                              }}
                              className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold uppercase rounded-xl border border-slate-800 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>Public Page</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedEventId(ev.id);
                                setCurrentView('event_manager');
                              }}
                              className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase rounded-xl shadow-md shadow-indigo-600/15 transition-all cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Manage & Verify</span>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => {
                              const shareUrl = window.location.origin + window.location.pathname + "?event=" + ev.id;
                              navigator.clipboard.writeText(shareUrl).then(() => {
                                showToast("Shareable invite link copied to clipboard!", "Verified");
                              }).catch(() => {
                                const el = document.createElement('textarea');
                                el.value = shareUrl;
                                document.body.appendChild(el);
                                el.select();
                                document.execCommand('copy');
                                document.body.removeChild(el);
                                showToast("Shareable invite link copied to clipboard!", "Verified");
                              });
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 hover:text-indigo-400 text-slate-400 font-mono text-[10px] font-bold uppercase rounded-xl border border-slate-800/60 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Copy Invitation Link</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* EMPTY STATE */}
              {events.filter(e => e.organizerId === currentUser.id).length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
                  <ClipboardList className="w-12 h-12 text-slate-650 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white uppercase">No events created yet</h3>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">Create your very first custom ticketing event using the action button at the top right.</p>
                </div>
              )}

              {/* CREATE EVENT MODAL DIALOG */}
              {showCreateEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden text-left"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />
                    <form onSubmit={handleCreateEventSubmit} className="p-6 space-y-4">
                      <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">
                        Create Ticketing Event
                      </h3>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Event Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CF Hackathon 2026"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                          <input
                            type="date"
                            required
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 09:00 AM"
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Venue / Location</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CF Tech Lab Auditorium, Dhaka"
                          value={newEventVenue}
                          onChange={(e) => setNewEventVenue(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Short Description</label>
                        <textarea
                          placeholder="Provide details about the tickets, passes, sponsors, or agenda..."
                          rows={3}
                          value={newEventDesc}
                          onChange={(e) => setNewEventDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>

                      {/* Event Banner Photo Upload */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Event Banner / Cover Photo</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                        </label>

                        {newEventBannerUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                            <img src={newEventBannerUrl} alt="Banner Preview" className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setNewEventBannerUrl('')}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-lg shadow flex items-center space-x-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Picture</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs text-slate-400 transition-all cursor-pointer text-center space-y-1">
                            <Upload className="w-5 h-5 text-indigo-400" />
                            <span className="font-semibold text-slate-300">Upload Banner / Cover Photo</span>
                            <span className="text-[10px] text-slate-500">JPG, PNG or WEBP (Auto-compressed)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBannerUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Design Accent Picker */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Design Theme Accent Color</label>
                        <div className="flex items-center space-x-3">
                          {['indigo', 'emerald', 'rose', 'fuchsia', 'amber'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewEventColor(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 cursor-pointer ${
                                newEventColor === color ? 'border-white scale-110' : 'border-transparent'
                              } ${
                                color === 'emerald' ? 'bg-emerald-500' :
                                color === 'rose' ? 'bg-rose-500' :
                                color === 'fuchsia' ? 'bg-fuchsia-500' :
                                color === 'amber' ? 'bg-amber-500' :
                                'bg-indigo-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Event Privacy Selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400">Event Listing Privacy</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNewEventPrivacy('public')}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                              newEventPrivacy === 'public'
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Globe className="w-4 h-4" />
                              <span className="font-bold text-xs uppercase tracking-wider font-mono">Public Event</span>
                            </div>
                            <span className="text-[10px] font-sans leading-normal opacity-80 mt-1">
                              Listed on the homepage registry. Anyone can discover and register.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewEventPrivacy('private')}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                              newEventPrivacy === 'private'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Lock className="w-4 h-4" />
                              <span className="font-bold text-xs uppercase tracking-wider font-mono">Private Event</span>
                            </div>
                            <span className="text-[10px] font-sans leading-normal opacity-80 mt-1">
                              Hidden from home listings. Only accessible via shared link.
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-850">
                        <button
                          type="button"
                          onClick={() => setShowCreateEventModal(false)}
                          className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg font-medium text-xs hover:bg-slate-800 transition-colors font-mono uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-600/10 transition-colors font-mono uppercase cursor-pointer"
                        >
                          Create Event
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 4: PUBLIC EVENT REGISTRATION PORTAL */}
          {currentView === 'public_event' && selectedEventId && (
            <motion.div
              key="public_event"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl w-full mx-auto py-4"
            >
              {(() => {
                const ev = events.find(e => e.id === selectedEventId);
                if (!ev) return <p className="text-center text-slate-400 py-12">Event not found.</p>;
                const colorSet = getColorClasses(ev.bannerColor || 'indigo');

                return (
                  <div className="space-y-6 text-left">
                    {/* Header back button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (currentUser) {
                              setCurrentView('organizer_dashboard');
                            } else {
                              setCurrentView('landing');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl font-mono text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Portal</span>
                        </button>

                        <button
                          onClick={() => {
                            const shareUrl = window.location.origin + window.location.pathname + "?event=" + ev.id;
                            navigator.clipboard.writeText(shareUrl).then(() => {
                              showToast("Shareable invite link copied to clipboard!", "Verified");
                            }).catch(() => {
                              const el = document.createElement('textarea');
                              el.value = shareUrl;
                              document.body.appendChild(el);
                              el.select();
                              document.execCommand('copy');
                              document.body.removeChild(el);
                              showToast("Shareable invite link copied to clipboard!", "Verified");
                            });
                          }}
                          className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/25 rounded-xl font-mono text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share Invitation Link</span>
                        </button>
                      </div>

                      {currentUser && currentUser.id === ev.organizerId && (
                        <button
                          onClick={() => setCurrentView('event_manager')}
                          className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/25 rounded-xl font-mono text-xs text-indigo-400 hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Manage This Event</span>
                        </button>
                      )}
                    </div>

                    {/* Event Banner Info */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                      {ev.bannerUrl ? (
                        <div className="h-48 sm:h-64 md:h-72 w-full overflow-hidden relative bg-slate-950">
                          <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                        </div>
                      ) : (
                        <div className={`h-4 bg-gradient-to-r ${colorSet}`} />
                      )}
                      <div className="p-6 md:p-8 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[10px] font-bold uppercase tracking-wider">
                            CLAIM REGISTERED TICKETS
                          </span>
                          {ev.privacy === 'private' ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Lock className="w-3 h-3" /> PRIVATE EVENT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Globe className="w-3 h-3" /> PUBLIC EVENT
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight font-display">
                          {ev.title}
                        </h2>
                        
                        {/* Meta Grid info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-slate-850 py-4 font-mono text-xs text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <span className="block text-[9px] text-slate-550">EVENT DATE</span>
                              <strong className="text-slate-200">{ev.date}</strong>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <span className="block text-[9px] text-slate-550">START TIME</span>
                              <strong className="text-slate-200">{ev.time}</strong>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div>
                              <span className="block text-[9px] text-slate-550">VENUE LOCATION</span>
                              <strong className="text-slate-200 truncate block max-w-[200px]">{ev.venue}</strong>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed font-sans">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    {/* Split registration form vs ticket success badge */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left: Registration block */}
                      <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8 space-y-4">
                        <h3 className="text-lg font-bold font-display text-white uppercase tracking-wide flex items-center space-x-2">
                          <UserPlus className="w-5 h-5 text-indigo-400" />
                          <span>Guest Attendance Registry</span>
                        </h3>
                        <p className="text-xs text-slate-450 leading-relaxed">
                          Fill out the details below to claim your digital entrance pass. An encrypted, verifiable pass with a dedicated QR security code will be generated instantly.
                        </p>

                        <form onSubmit={handlePublicRegisterSubmit} className="space-y-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Attendance Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. John Doe"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address (For ticket verification)</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. john@example.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Ticket Access level</label>
                            <select
                              value={regType}
                              onChange={(e) => setRegType(e.target.value as Ticket['type'])}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="General">General Admission</option>
                              <option value="VIP">VIP Access Pass</option>
                              <option value="Staff">Event Staff Crew</option>
                              <option value="Press">Press Media Pass</option>
                            </select>
                          </div>

                          {regError && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs rounded-lg flex items-center space-x-2 font-mono">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{regError}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer font-mono flex items-center justify-center space-x-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Claim Secure Entrance Pass</span>
                          </button>
                        </form>
                      </div>

                      {/* Right: Issued ticket summary with download action */}
                      <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-center text-center relative overflow-hidden min-h-[380px]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/15 to-transparent blur-xl" />
                        
                        {regSuccessTicket ? (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-100 font-display uppercase">Ticket Generated!</h4>
                              <p className="text-xs text-slate-450 mt-1">Below is your verified QR code entrance pass. Please download or bookmark this code for gate scanning.</p>
                            </div>

                            {/* Ticket Card preview */}
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-[10px] text-slate-500 font-mono">
                                <span>{regSuccessTicket.type.toUpperCase()} ACCESS</span>
                                <span className="text-indigo-400">{regSuccessTicket.code}</span>
                              </div>
                              
                              {/* QR visual */}
                              <div className="bg-white p-2 rounded-lg w-32 h-32 mx-auto">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(regSuccessTicket.code)}`}
                                  alt="QR code"
                                  className="w-full h-full"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="text-left font-mono text-[11px] space-y-1 text-slate-350">
                                <div className="truncate"><strong className="text-slate-500">GUEST:</strong> {regSuccessTicket.name}</div>
                                <div className="truncate"><strong className="text-slate-500">EMAIL:</strong> {regSuccessTicket.email}</div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => downloadPublicPass(regSuccessTicket.code)}
                              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase rounded-xl border border-slate-800 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-indigo-400" />
                              <span>Download QR Pass (PNG)</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setRegSuccessTicket(null)}
                              className="text-[11px] font-mono text-indigo-450 hover:text-indigo-400 transition-colors underline cursor-pointer"
                            >
                              Register another person
                            </button>
                          </motion.div>
                        ) : (
                          <div className="space-y-3 text-slate-500">
                            <QrCode className="w-12 h-12 stroke-[1.2] text-slate-700 mx-auto animate-pulse" />
                            <h4 className="text-sm font-bold uppercase font-mono text-slate-450">Waiting for Registration</h4>
                            <p className="text-[11px] text-slate-550 max-w-xs mx-auto">Complete the form details and claim your ticket to see your generated security pass here.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* VIEW 5: ORGANIZER EVENT MANAGER (THE QR GATEWAY CORE APP) */}
          {currentView === 'event_manager' && selectedEventId && currentUser && (
            <motion.div
              key="event_manager"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              {/* Event Manager Top Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedEventId(null);
                      setCurrentView('organizer_dashboard');
                    }}
                    className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-800 cursor-pointer"
                    title="Back to Events"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-950 text-emerald-400 font-mono text-[9px] font-bold border border-slate-800 rounded uppercase tracking-wider shrink-0">
                        VERIFICATION HUB ACTIVE
                      </span>
                      <span className="hidden sm:inline text-slate-600 font-mono text-xs">|</span>
                      <span className="hidden sm:inline text-slate-450 font-mono text-xs truncate">
                        {(() => {
                          const ev = events.find(e => e.id === selectedEventId);
                          return ev ? ev.venue : '';
                        })()}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold font-display text-white uppercase tracking-tight mt-1 line-clamp-1">
                      {(() => {
                        const ev = events.find(e => e.id === selectedEventId);
                        return ev ? ev.title : 'MANAGE EVENT';
                      })()}
                    </h2>
                  </div>
                </div>

                {/* Info & Public Link copying */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setRegSuccessTicket(null);
                      setRegError('');
                      setCurrentView('public_event');
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-800 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer font-mono"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Public Page</span>
                  </button>

                  <button
                    onClick={handleAddNewTicket}
                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer font-mono"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Issue Ticket</span>
                  </button>
                </div>
              </div>

              {/* LIVE STATS TILES GRID */}
              <div className={activeMobileTab === 'stats' ? 'block' : 'hidden md:block'}>
                <StatsGrid tickets={tickets} />
              </div>

              {/* CORE ROW: SCANNER CAMERA AND RECENT LOGS SIDE-BY-SIDE */}
              <div className={activeMobileTab === 'scanner' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full' : 'hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full'}>
                
                {/* SCANNER COMPONENT (LEFT) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[460px] sm:h-[500px]">
                  <Scanner
                    eventId={selectedEventId}
                    onScanCompleted={handleScanCompleted}
                    unscannedTickets={unscanned}
                    attendedTickets={attended}
                  />
                </div>

                {/* RECENT LOGS COMPONENT (RIGHT) */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[400px] sm:h-[500px]">
                  <ScanLogPanel
                    logs={logs}
                    onClear={handleClearLogs}
                    className="h-full"
                  />
                </div>

              </div>

              {/* REGISTRANT DATABASE (FULL-WIDTH) */}
              <div className={activeMobileTab === 'tickets' ? 'w-full flex flex-col min-h-[450px] sm:min-h-[500px]' : 'hidden md:flex w-full flex-col min-h-[450px] sm:min-h-[500px]'}>
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
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* COMPACT SECURED FOOTER */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 mt-auto py-6 px-6 font-mono text-xs text-slate-500 text-center sm:text-left">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
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

      {/* CORE TICKETING DETAILS MODAL */}
      <AnimatePresence>
        {selectedTicket && selectedEventId && (
          <TicketDetailModal
            eventId={selectedEventId}
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onSave={handleSaveTicket}
            onCheckIn={handleQuickCheckIn}
            onResetStatus={handleResetStatus}
          />
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {currentView === 'event_manager' && selectedEventId && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2.5 px-4 flex justify-around items-center md:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
          <button
            type="button"
            onClick={() => setActiveMobileTab('scanner')}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeMobileTab === 'scanner' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-5.5 h-5.5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('tickets')}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeMobileTab === 'tickets' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-5.5 h-5.5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Ticket List</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('stats')}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeMobileTab === 'stats' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Statistics</span>
          </button>
        </div>
      )}

    </div>
  );
}
