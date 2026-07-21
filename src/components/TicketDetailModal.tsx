import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Ticket } from '../types';
import { registerAttendeeForEvent, loadEvents } from '../db';
import { X, Check, Clock, User, Mail, ShieldAlert, Award, FileText, ToggleLeft, ArrowRight, Smartphone, Download } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSave: (updatedTicket: Ticket) => void;
  onCheckIn: (code: string) => void;
  onResetStatus: (code: string) => void;
  eventId: string;
}

export default function TicketDetailModal({
  ticket,
  onClose,
  onSave,
  onCheckIn,
  onResetStatus,
  eventId,
}: TicketDetailModalProps) {
  const [name, setName] = useState(ticket.name);
  const [email, setEmail] = useState(ticket.email);
  const [type, setType] = useState<Ticket['type']>(ticket.type);
  const [notes, setNotes] = useState(ticket.notes || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [eventTitle, setEventTitle] = useState('EVENT PASS');

  useEffect(() => {
    try {
      const evs = loadEvents();
      const ev = evs.find(e => e.id === eventId);
      if (ev) {
        setEventTitle(ev.title);
      }
    } catch (e) {
      console.error(e);
    }
  }, [eventId]);

  useEffect(() => {
    setName(ticket.name);
    setEmail(ticket.email);
    setType(ticket.type);
    setNotes(ticket.notes || '');
    setError('');
    setSuccess('');
  }, [ticket]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If either name or email is entered, they both should be valid
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if ((trimmedName && !trimmedEmail) || (!trimmedName && trimmedEmail)) {
      setError('Please provide both attendee name AND email to complete registration.');
      return;
    }

    if (trimmedEmail && !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const updated = registerAttendeeForEvent(eventId, ticket.code, {
        name: trimmedName,
        email: trimmedEmail,
        type,
        notes: notes.trim(),
      });
      onSave(updated);
      setSuccess('Registration details updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update registration.');
    }
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VerifyFlow_QR_${ticket.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download QR code", error);
      // Fallback
      window.open(qrUrl, '_blank');
    }
  };

  const isRegistered = ticket.name && ticket.email;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    ticket.code
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row border border-slate-800"
      >
        {/* LEFT COLUMN: THE DIGITAL TICKET PASS */}
        <div className="bg-slate-950 text-white p-6 md:w-[280px] flex flex-col justify-between relative shrink-0 border-r border-slate-800">
          {/* Subtle design elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-transparent blur-xl pointer-events-none" />

          {/* Ticket Header */}
          <div className="text-center md:text-left z-10">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                ticket.type === 'VIP'
                  ? 'bg-purple-500/20 text-purple-350 border border-purple-500/30'
                  : ticket.type === 'Staff'
                  ? 'bg-blue-500/20 text-blue-350 border border-blue-500/30'
                  : ticket.type === 'Press'
                  ? 'bg-amber-500/20 text-amber-350 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30'
              }`}
            >
              {ticket.type} PASS
            </span>
            <h4 className="text-lg font-extrabold font-display tracking-tight mt-1 line-clamp-2 text-white">
              {eventTitle}
            </h4>
            <p className="text-[10px] text-indigo-400 font-mono mt-0.5 uppercase tracking-widest font-semibold">VERIFYFLOW PORTAL</p>
          </div>

          {/* Live QR Code Display */}
          <div className="my-5 flex flex-col items-center justify-center z-10">
            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-800 hover:scale-[1.02] transition-transform duration-300">
              <img
                src={qrUrl}
                alt={`QR code for ${ticket.code}`}
                className="w-36 h-36 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] text-slate-300 font-mono font-bold tracking-widest uppercase mt-2">
              {ticket.code}
            </span>
            <button
              type="button"
              onClick={downloadQRCode}
              className="mt-3 w-full max-w-[180px] py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-[10px] font-bold rounded-lg border border-slate-700/50 transition-all flex items-center justify-center space-x-1.5 uppercase cursor-pointer"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>Download QR</span>
            </button>
          </div>

          {/* Ticket Footer (Attendee details) */}
          <div className="border-t border-slate-800/80 pt-4 text-center md:text-left z-10">
            {isRegistered ? (
              <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Attendee</p>
                <p className="text-sm font-bold truncate text-slate-200">{ticket.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{ticket.email}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider font-mono">Unregistered Pass</p>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-snug">
                  Fill out the credential fields to register this attendee.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-dashed border-slate-800 text-[10px] text-slate-400">
              <span className="font-mono">STATUS</span>
              <span
                className={`font-semibold font-mono tracking-wide uppercase ${
                  ticket.status === 'Attended' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {ticket.status}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE FORM & CONTROLS */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto max-h-[550px] md:max-h-none bg-slate-900">
          {/* Top Row: Title & Close */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Manage Ticket</h3>
                <p className="text-xs text-slate-400">Update credentials, toggle status, or scan simulation</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick check-in / toggle status panel */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start space-x-3 text-left w-full sm:w-auto">
                {ticket.status === 'Attended' ? (
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0">
                    <Clock className="w-5 h-5" />
                  </span>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Attendance Status
                  </p>
                  <p className="text-sm font-bold text-slate-200">
                    {ticket.status === 'Attended' ? 'ATTENDED' : 'UNSCANNED'}
                  </p>
                  {ticket.status === 'Attended' && ticket.attendedAt && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Scanned: {new Date(ticket.attendedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto flex space-x-2 shrink-0">
                {ticket.status === 'Unscanned' ? (
                  <button
                    onClick={() => onCheckIn(ticket.code)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 uppercase font-mono tracking-wider cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Check In Attendee</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onResetStatus(ticket.code)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 uppercase font-mono tracking-wider cursor-pointer"
                  >
                    <ToggleLeft className="w-3.5 h-3.5" />
                    <span>Reset to Unscanned</span>
                  </button>
                )}
              </div>
            </div>

            {/* Registration Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center space-x-1 font-mono">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Registration Credentials</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. eleanor@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ticket Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                    <Award className="w-3 h-3 text-slate-500" />
                    <span>Ticket Type Level</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Ticket['type'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-mono"
                  >
                    <option value="General">General Admission</option>
                    <option value="VIP">VIP Access Pass</option>
                    <option value="Staff">Event Staff Crew</option>
                    <option value="Press">Press Media Pass</option>
                  </select>
                </div>

                {/* Registered Timestamp read-only */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 font-mono">
                    Registration Date
                  </label>
                  <div className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-400 font-mono">
                    {ticket.registeredAt
                      ? new Date(ticket.registeredAt).toLocaleString()
                      : 'Not registered yet'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Custom Staff Notes</span>
                </label>
                <textarea
                  placeholder="Enter custom comments (e.g. 'Needs wheelchair access')"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                />
              </div>

              {/* Feedback lines */}
              {error && (
                <div className="p-2.5 bg-rose-500/10 text-rose-400 text-xs rounded-lg border border-rose-500/20 flex items-start space-x-1.5 font-mono">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20 flex items-start space-x-1.5 font-mono">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}
            </form>
          </div>

          {/* Bottom Row Actions */}
          <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between bg-slate-950 p-4 rounded-xl -mx-6 -mb-6">
            <span className="text-[10px] text-slate-500 font-mono">
              * Database updates are saved dynamically to local cache.
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg font-medium text-xs hover:bg-slate-800 transition-all font-mono uppercase tracking-wider cursor-pointer"
              >
                Close Panel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center space-x-1.5 font-mono uppercase tracking-wider cursor-pointer"
              >
                <span>Save Credentials</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
