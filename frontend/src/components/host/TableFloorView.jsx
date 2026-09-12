import React from 'react';
import { Utensils, CheckCircle2, Sparkles, Clock, AlertTriangle } from 'lucide-react';

export default function TableFloorView({ tables, onClearTable, onMarkReady, onSelectTableToSeat, isHostMode }) {
  // Group tables by section
  const sections = ['Indoor', 'Patio', 'Bar Lounge'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Available</span>;
      case 'occupied':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Occupied</span>;
      case 'cleaning':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Cleaning</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'available': return 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500';
      case 'occupied': return 'border-amber-300 bg-amber-50/40 hover:border-amber-500';
      case 'cleaning': return 'border-blue-300 bg-blue-50/40 hover:border-blue-500';
      default: return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Floor Plan & Table Status</h2>
          <p className="text-sm text-slate-500">Live operational view across dining sections</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Cleaning</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => {
          const sectionTables = tables.filter((t) => t.section.toLowerCase() === section.toLowerCase());
          return (
            <div key={section} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  {section}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {sectionTables.filter(t => t.status === 'available').length} / {sectionTables.length} Free
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {sectionTables.map((t) => (
                  <div
                    key={t.id}
                    className={`border-2 rounded-xl p-3 flex flex-col justify-between transition-all ${getBorderColor(t.status)}`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="font-extrabold text-slate-900 text-base">Table {t.table_number}</span>
                        {getStatusBadge(t.status)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Capacity: <strong className="text-slate-800">{t.capacity} seats</strong>
                      </div>
                      {t.status === 'occupied' && t.current_party_name && (
                        <div className="mt-2 text-xs bg-white/80 p-1.5 rounded border border-amber-200">
                          <p className="font-semibold text-slate-800 truncate">{t.current_party_name}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100/80 flex flex-col gap-1.5">
                      {t.status === 'occupied' && (
                        <button
                          onClick={() => onClearTable(t.id)}
                          className="w-full text-xs font-semibold py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
                        >
                          Clear (Bus Table)
                        </button>
                      )}
                      {t.status === 'cleaning' && (
                        <button
                          onClick={() => onMarkReady(t.id)}
                          className="w-full text-xs font-semibold py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark Ready
                        </button>
                      )}
                      {t.status === 'available' && onSelectTableToSeat && (
                        <button
                          onClick={() => onSelectTableToSeat(t)}
                          className="w-full text-xs font-semibold py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition"
                        >
                          Seat Waiting Party
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
