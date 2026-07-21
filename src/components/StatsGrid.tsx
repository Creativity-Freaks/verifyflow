import { Ticket } from '../types';
import { Ticket as TicketIcon, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface StatsGridProps {
  tickets: Ticket[];
}

export default function StatsGrid({ tickets }: StatsGridProps) {
  const total = tickets.length;
  const attended = tickets.filter(t => t.status === 'Attended').length;
  const unscanned = total - attended;
  
  const vips = tickets.filter(t => t.type === 'VIP');
  const vipTotal = vips.length;
  const vipAttended = vips.filter(t => t.status === 'Attended').length;

  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  // Format with leading zeros for high-tech look
  const formatNum = (num: number) => String(num).padStart(3, '0');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Tickets */}
      <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 shrink-0">
          <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 w-full">
          <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Total Database</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-mono text-white font-bold leading-tight my-0.5">{formatNum(total)}</h3>
          <p className="text-[8px] sm:text-[10px] text-slate-500 font-mono truncate">CAPACITY_LIMIT</p>
        </div>
      </div>

      {/* Attended (Verified) */}
      <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 w-full">
          <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Verified In</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-mono text-emerald-400 font-bold leading-tight my-0.5">
            {formatNum(attended)} <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">({attendanceRate}%)</span>
          </h3>
          <p className="text-[8px] sm:text-[10px] text-slate-500 font-mono truncate">ENTRY_GRANTED</p>
        </div>
      </div>

      {/* Unscanned / Remaining */}
      <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 w-full">
          <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Remaining</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-mono text-amber-400 font-bold leading-tight my-0.5">{formatNum(unscanned)}</h3>
          <p className="text-[8px] sm:text-[10px] text-slate-500 font-mono truncate">PENDING_CHECKIN</p>
        </div>
      </div>

      {/* VIP Access */}
      <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg border border-fuchsia-500/20 shrink-0">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 w-full">
          <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">VIP Priority</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-mono text-fuchsia-400 font-bold leading-tight my-0.5">
            {formatNum(vipAttended)}<span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">/{formatNum(vipTotal)}</span>
          </h3>
          <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full mt-1 overflow-hidden border border-slate-700/50">
            <div 
              className="bg-fuchsia-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${vipTotal > 0 ? (vipAttended / vipTotal) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
