import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Bell, CheckCircle, UserPlus, Sparkles, 
  RotateCcw, RefreshCw, X, AlertCircle, Phone, ArrowRight, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import TableFloorView from './TableFloorView';

export default function HostDashboard({ onOpenSMSDrawer, onOpenChatWithParty }) {
  const [queue, setQueue] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [seatingParty, setSeatingParty] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'floor'

  // New Walk-in form state
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    party_size: 2,
    preference: 'First Available',
    notes: ''
  });
  const [predictedWait, setPredictedWait] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, tablesData] = await Promise.all([
        api.getQueue(),
        api.getTables()
      ]);
      setQueue(queueData);
      setTables(tablesData);
    } catch (err) {
      console.error('Error fetching host dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000); // 6s live polling
    return () => clearInterval(interval);
  }, []);

  // Fetch AI dynamic wait prediction when form inputs change
  useEffect(() => {
    if (showAddModal) {
      api.getWaitPrediction(formData.party_size, formData.preference)
        .then(setPredictedWait)
        .catch(console.error);
    }
  }, [formData.party_size, formData.preference, showAddModal]);

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.phone) return;
    try {
      await api.addToQueue(formData);
      setShowAddModal(false);
      setFormData({ customer_name: '', phone: '', party_size: 2, preference: 'First Available', notes: '' });
      await loadData();
      if (onOpenSMSDrawer) onOpenSMSDrawer();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleNotify = async (entry) => {
    try {
      await api.notifyGuest(entry.id);
      await loadData();
      if (onOpenSMSDrawer) onOpenSMSDrawer(entry.phone);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenSeating = async (entry) => {
    setSeatingParty(entry);
    setRecLoading(true);
    try {
      const recs = await api.getTableRecommendations(entry.id);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  const handleConfirmSeat = async (tableId) => {
    if (!seatingParty) return;
    try {
      await api.seatParty(seatingParty.id, tableId);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      setSeatingParty(null);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelEntry = async (id) => {
    if (!confirm("Are you sure you want to remove this party from the waitlist?")) return;
    try {
      await api.updateQueueStatus(id, 'cancelled');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearTable = async (tableId) => {
    try {
      await api.clearTable(tableId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkReady = async (tableId) => {
    try {
      await api.markTableReady(tableId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset demo data back to initial state?")) return;
    try {
      await api.resetDemoData();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const notifiedCount = queue.filter(q => q.status === 'notified').length;
  const availableTablesCount = tables.filter(t => t.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{waitingCount}</div>
            <div className="text-xs font-medium text-slate-500">Parties Waiting</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{notifiedCount}</div>
            <div className="text-xs font-medium text-slate-500">Notified / Ready</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{availableTablesCount} / {tables.length}</div>
            <div className="text-xs font-medium text-slate-500">Tables Available</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">~18m</div>
            <div className="text-xs font-medium text-slate-500">AI Avg Wait Time</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
              activeTab === 'queue'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Live Waitlist ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('floor')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
              activeTab === 'floor'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Floor Plan & Tables ({tables.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow transition"
          >
            <UserPlus className="w-4 h-4" /> Add Walk-In
          </button>
          <button
            onClick={handleResetDemo}
            title="Reset demo data"
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
          </button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'queue' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Active Waitlist</h3>
            <span className="text-xs text-slate-500 font-medium">Sorted by wait duration</span>
          </div>

          {queue.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No parties in the waitlist right now.</p>
              <p className="text-xs mt-1">Add a walk-in or reset demo data to populate parties.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((entry, idx) => (
                <div key={entry.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">{entry.customer_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                          {entry.party_size} Guests
                        </span>
                        {entry.status === 'notified' ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold animate-pulse">
                            🔔 Table Ready (Notified)
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            Waiting
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {entry.phone}
                        </span>
                        <span>Prefers: <strong>{entry.preference}</strong></span>
                        <span className="flex items-center gap-1 text-orange-600 font-semibold">
                          <Clock className="w-3 h-3" /> Est: ~{entry.estimated_wait_minutes}m
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-slate-600 italic mt-1 bg-slate-100/70 px-2 py-0.5 rounded inline-block">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {entry.status === 'waiting' && (
                      <button
                        onClick={() => handleNotify(entry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
                      >
                        <Bell className="w-3.5 h-3.5" /> Notify Guest
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenSeating(entry)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Seat Party
                    </button>
                    <button
                      onClick={() => handleCancelEntry(entry.id)}
                      title="Cancel / No Show"
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <TableFloorView
          tables={tables}
          onClearTable={handleClearTable}
          onMarkReady={handleMarkReady}
          onSelectTableToSeat={(table) => {
            if (queue.length > 0) {
              handleOpenSeating(queue[0]);
            } else {
              alert("No parties waiting in the queue to seat.");
            }
          }}
          isHostMode={true}
        />
      )}

      {/* Add Walk-in Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" /> Add Walk-In Party
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Miller"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="415-555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Party Size *</label>
                  <select
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} Guests</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seating Preference</label>
                <select
                  value={formData.preference}
                  onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="First Available">First Available</option>
                  <option value="Indoor">Indoor Dining</option>
                  <option value="Patio">Patio</option>
                  <option value="Bar Lounge">Bar Lounge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Special Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday, Booster seat, Anniversary"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Dynamic AI Wait Estimate Preview */}
              {predictedWait && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <div>
                      <span className="text-xs font-bold text-orange-950">AI Wait Estimate:</span>
                      <p className="text-[11px] text-orange-700">{predictedWait.reasoning}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-orange-600 shrink-0">~{predictedWait.estimated_wait_minutes}m</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Table Seating Optimizer Modal */}
      {seatingParty && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" /> AI Table Seating Optimizer
                </h3>
                <p className="text-xs text-slate-500">
                  Seating <strong>{seatingParty.customer_name}</strong> (Party of {seatingParty.party_size}, {seatingParty.preference})
                </p>
              </div>
              <button onClick={() => setSeatingParty(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {recLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
                  <p className="text-xs font-semibold">Analyzing table turnover & party capacity...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="font-semibold text-sm">No compatible tables found for party size {seatingParty.party_size}.</p>
                </div>
              ) : (
                recommendations.map((rec, index) => {
                  const isTopChoice = index === 0;
                  return (
                    <div
                      key={rec.table_id}
                      className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                        isTopChoice ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base">Table {rec.table_number}</span>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {rec.section} ({rec.capacity} seats)
                          </span>
                          {isTopChoice && (
                            <span className="text-[11px] font-extrabold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                              ⭐ AI Top Pick
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{rec.reason}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">Status: <strong className="capitalize text-slate-800">{rec.status}</strong></span>
                          <span className="text-[11px] font-semibold text-orange-700">Match Score: {rec.score} pts</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConfirmSeat(rec.table_id)}
                        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          rec.status === 'available'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        Seat Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
