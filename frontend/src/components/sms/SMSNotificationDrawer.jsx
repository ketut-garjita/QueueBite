import React, { useState, useEffect } from 'react';
import { Smartphone, X, RefreshCw, MessageCircle, ShieldCheck, CheckCheck } from 'lucide-react';
import { api } from '../../services/api';

export default function SMSNotificationDrawer({ isOpen, onClose, filterPhone = null }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(filterPhone || '');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(selectedPhone || null);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterPhone) {
      setSelectedPhone(filterPhone);
    }
  }, [filterPhone]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedPhone]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200">
        
        {/* Smartphone Notch & Header */}
        <div className="pt-3 px-4 pb-2 bg-slate-950 flex flex-col items-center border-b border-slate-800">
          <div className="w-24 h-4 bg-slate-800 rounded-full mb-2"></div>
          <div className="w-full flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold tracking-tight">Guest SMS Inbox Simulator</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender Info Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 text-center">
          <div className="w-10 h-10 bg-orange-600 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm shadow">
            QB
          </div>
          <h4 className="text-white text-xs font-bold mt-1">QueueBite Alerts</h4>
          <p className="text-[10px] text-slate-400">+1 (800) 555-2483 (The Rustic Olive)</p>

          {/* Optional phone filter */}
          <div className="mt-2 flex items-center gap-1">
            <input
              type="text"
              placeholder="Filter by phone (optional)..."
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="flex-1 text-[11px] px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 focus:outline-none"
            />
            {selectedPhone && (
              <button
                onClick={() => setSelectedPhone('')}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1"
              >
                Clear
              </button>
            )}
            <button onClick={fetchLogs} className="p-1 text-slate-400 hover:text-white">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SMS Chat Bubbles Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
          <div className="text-center">
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
              Today
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p>No SMS notifications dispatched yet.</p>
              <p className="text-[11px] mt-1 text-slate-600">Join waitlist or click "Notify Guest" to see simulated texts.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between px-1">
                  <span>To: <strong>{m.recipient_name}</strong> ({m.recipient_phone})</span>
                  <span>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed border border-slate-700/80 shadow-xs">
                  {m.message}
                </div>
                <div className="flex justify-end pr-1 text-emerald-400">
                  <CheckCheck className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer simulation info */}
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Simulated in-memory carrier transmission (Zero Twilio fees)
          </p>
        </div>
      </div>
    </div>
  );
}
