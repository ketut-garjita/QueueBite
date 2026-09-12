import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, Bell, CheckCircle2, AlertCircle, Utensils, 
  MapPin, Sparkles, MessageSquare, Phone, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

export default function CustomerQueueView({ onOpenChat, onOpenSMSDrawer }) {
  const [activeQueue, setActiveQueue] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ticket'); // 'ticket' or 'join'
  const [hasNotifiedPlayed, setHasNotifiedPlayed] = useState(false);

  // Self Join Form State
  const [joinForm, setJoinForm] = useState({
    customer_name: '',
    phone: '',
    party_size: 2,
    preference: 'First Available',
    notes: ''
  });
  const [predictedWait, setPredictedWait] = useState(null);

  const fetchActiveQueue = async () => {
    try {
      const data = await api.getQueue();
      setActiveQueue(data);
      if (!selectedEntryId && data.length > 0) {
        setSelectedEntryId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveQueue();
    const interval = setInterval(fetchActiveQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedEntryId) {
      const found = activeQueue.find(e => e.id === Number(selectedEntryId));
      setCurrentEntry(found || null);
    }
  }, [selectedEntryId, activeQueue]);

  // Trigger celebration & audio chime when notified
  useEffect(() => {
    if (currentEntry && currentEntry.status === 'notified' && !hasNotifiedPlayed) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      setHasNotifiedPlayed(true);
    }
  }, [currentEntry, hasNotifiedPlayed]);

  // AI Prediction when join form changes
  useEffect(() => {
    if (activeTab === 'join') {
      api.getWaitPrediction(joinForm.party_size, joinForm.preference)
        .then(setPredictedWait)
        .catch(console.error);
    }
  }, [joinForm.party_size, joinForm.preference, activeTab]);

  const handleSelfJoin = async (e) => {
    e.preventDefault();
    try {
      const created = await api.addToQueue(joinForm);
      setJoinForm({ customer_name: '', phone: '', party_size: 2, preference: 'First Available', notes: '' });
      await fetchActiveQueue();
      setSelectedEntryId(created.id);
      setActiveTab('ticket');
      if (onOpenSMSDrawer) onOpenSMSDrawer(created.phone);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelSpot = async () => {
    if (!currentEntry) return;
    if (!confirm("Are you sure you want to cancel your waitlist reservation?")) return;
    try {
      await api.updateQueueStatus(currentEntry.id, 'cancelled');
      await fetchActiveQueue();
      setCurrentEntry(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunningLate = () => {
    alert("Host notified that you are running ~5 minutes late! We will hold your table.");
  };

  // Find position in queue
  const queueIndex = activeQueue.findIndex(e => e.id === currentEntry?.id);
  const positionInLine = queueIndex >= 0 ? queueIndex + 1 : 1;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Restaurant Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
          <Utensils className="w-3.5 h-3.5" /> The Rustic Olive
        </div>
        <h1 className="text-2xl font-black text-slate-900">Live Waitlist Tracker</h1>
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" /> 104 Olive Grove Way, San Francisco
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('ticket')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'ticket' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Live Status
        </button>
        <button
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Join Waitlist
        </button>
      </div>

      {activeTab === 'ticket' ? (
        <div className="space-y-4">
          {/* Quick Demo Party Switcher */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Switch / View Guest Ticket:
            </label>
            <select
              value={selectedEntryId || ''}
              onChange={(e) => {
                setSelectedEntryId(e.target.value);
                setHasNotifiedPlayed(false);
              }}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {activeQueue.map(e => (
                <option key={e.id} value={e.id}>
                  {e.customer_name} ({e.party_size} guests, {e.preference}) — {e.status.toUpperCase()}
                </option>
              ))}
              {activeQueue.length === 0 && <option value="">No active parties waiting</option>}
            </select>
          </div>

          {currentEntry ? (
            <div className="space-y-4">
              {/* Primary Status Card */}
              <div className={`bg-white rounded-3xl p-6 shadow-md border-2 transition-all ${
                currentEntry.status === 'notified'
                  ? 'border-amber-500 ring-4 ring-amber-100'
                  : 'border-orange-200'
              }`}>
                {currentEntry.status === 'notified' ? (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <Bell className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        Table Ready Now!
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-2">
                        {currentEntry.customer_name}, your table is ready!
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                        Please proceed to the host stand now. We hold tables for up to 10 minutes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                        Position #{positionInLine} in Line
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {currentEntry.party_size} Guests
                      </span>
                    </div>

                    <div className="text-center py-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Wait</div>
                      <div className="text-5xl font-black text-orange-600 mt-1 tracking-tight">
                        ~{currentEntry.estimated_wait_minutes}<span className="text-xl font-bold ml-1 text-orange-400">min</span>
                      </div>
                      <div className="text-xs text-orange-900 font-medium mt-1">
                        Seating Preference: <strong>{currentEntry.preference}</strong>
                      </div>
                    </div>

                    <div className="text-center text-xs text-slate-500">
                      We will update this live screen & text you the second your table is assigned.
                    </div>
                  </div>
                )}

                {/* Self-serve Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={handleRunningLate}
                    className="py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Running 5m Late
                  </button>
                  <button
                    onClick={handleCancelSpot}
                    className="py-2 px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                  >
                    Cancel Spot
                  </button>
                </div>
              </div>

              {/* Guest AI Assistant Banner */}
              <div 
                onClick={() => onOpenChat && onOpenChat({ customer_name: currentEntry.customer_name })}
                className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Have a question for our AI?</h4>
                    <p className="text-[11px] text-orange-100">Ask about wait times, menu, patio seating & more</p>
                  </div>
                </div>
                <MessageSquare className="w-5 h-5 text-white/80 shrink-0" />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-700">No active waitlist ticket found.</p>
              <p className="text-xs text-slate-500 mt-1">Switch tabs to join the waitlist or pick a demo party above.</p>
            </div>
          )}
        </div>
      ) : (
        /* Self Join Form */
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
          <h2 className="text-lg font-black text-slate-900 mb-1">Join the Queue</h2>
          <p className="text-xs text-slate-500 mb-4">Enter your details to claim your spot in line.</p>

          <form onSubmit={handleSelfJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={joinForm.customer_name}
                onChange={(e) => setJoinForm({ ...joinForm, customer_name: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="415-555-0199"
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Party Size *</label>
                <select
                  value={joinForm.party_size}
                  onChange={(e) => setJoinForm({ ...joinForm, party_size: parseInt(e.target.value) })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} Guests</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seating Area</label>
              <select
                value={joinForm.preference}
                onChange={(e) => setJoinForm({ ...joinForm, preference: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="First Available">First Available (Fastest)</option>
                <option value="Indoor">Indoor Dining</option>
                <option value="Patio">Outdoor Patio</option>
                <option value="Bar Lounge">Bar Lounge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Special Requests / Notes</label>
              <input
                type="text"
                placeholder="High chair, dietary restrictions, quiet table"
                value={joinForm.notes}
                onChange={(e) => setJoinForm({ ...joinForm, notes: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* AI Dynamic Wait Calculation */}
            {predictedWait && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" /> AI Estimated Wait:
                  </span>
                  <p className="text-[11px] text-orange-700 mt-0.5">{predictedWait.reasoning}</p>
                </div>
                <span className="text-lg font-black text-orange-600 shrink-0">~{predictedWait.estimated_wait_minutes}m</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              Confirm & Join Queue
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
