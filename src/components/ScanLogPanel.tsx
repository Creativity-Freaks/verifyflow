import { ScanLog } from '../types';
import { History, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';

interface ScanLogPanelProps {
  logs: ScanLog[];
  onClear: () => void;
  className?: string;
}

export default function ScanLogPanel({ logs, onClear, className = "h-[280px]" }: ScanLogPanelProps) {
  return (
    <div className={`bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl ${className}`}>
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2 text-slate-200">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Recent Activity</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-semibold">LIVE</span>
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center space-x-1 transition-colors"
              title="Clear scan history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 pr-1">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
            <History className="w-8 h-8 opacity-25 mb-2 text-indigo-400" />
            <p className="text-xs font-mono">NO ACTIVE LOGS</p>
            <p className="text-[10px] text-slate-600 font-mono">SCAN TICKETS TO UPDATE FEED</p>
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            // Styling based on result type
            const logStyle = log.result === 'Verified'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : log.result === 'Already Attended'
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
              : 'bg-rose-500/5 border-rose-500/20 text-rose-400';

            return (
              <div
                key={log.id}
                className={`p-3 border rounded-lg transition-all ${logStyle}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-bold text-white">{log.code}</span>
                  <span className="text-[9px] font-mono text-slate-400">{timeStr}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mt-1.5">
                  <span>{log.result}</span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case font-mono truncate max-w-[200px]">
                    {log.result === 'Verified' && log.name ? log.name : ''}
                    {log.result === 'Already Attended' && log.name ? `Duplicate: ${log.name}` : ''}
                    {log.result === 'Invalid Ticket' ? 'No Database Entry' : ''}
                    {log.result === 'Verified' && !log.name ? 'Unregistered Ticket Scanned' : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
