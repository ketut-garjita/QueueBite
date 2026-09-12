import React, { useState } from 'react';
import { 
  Utensils, LayoutDashboard, Smartphone, Sparkles, 
  MessageSquare, BellRing, Info
} from 'lucide-react';
import HostDashboard from './components/host/HostDashboard';
import CustomerQueueView from './components/guest/CustomerQueueView';
import AICopilotDrawer from './components/chat/AICopilotDrawer';
import SMSNotificationDrawer from './components/sms/SMSNotificationDrawer';

export default function App() {
  const [portal, setPortal] = useState('host'); // 'host' or 'guest'
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialMode, setCopilotInitialMode] = useState('host');
  const [copilotContext, setCopilotContext] = useState({});
  const [isSMSOpen, setIsSMSOpen] = useState(false);
  const [smsPhoneFilter, setSmsPhoneFilter] = useState(null);

  const openCopilot = (mode = 'host', context = {}) => {
    setCopilotInitialMode(mode);
    setCopilotContext(context);
    setIsCopilotOpen(true);
  };

  const openSMS = (phone = null) => {
    setSmsPhoneFilter(phone);
    setIsSMSOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-lg tracking-tight">QueueBite</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  AI v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Intelligent Waitlist & Table Management</p>
            </div>
          </div>

          {/* Portal Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => {
                setPortal('host');
                setCopilotInitialMode('host');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                portal === 'host'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Host Stand</span>
              <span className="sm:hidden">Host</span>
            </button>

            <button
              onClick={() => {
                setPortal('guest');
                setCopilotInitialMode('guest');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                portal === 'guest'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Mobile View</span>
              <span className="sm:hidden">Guest</span>
            </button>
          </div>

          {/* Utility Tools (SMS Drawer & AI Copilot Drawer) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openSMS()}
              title="Open SMS notification simulator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden md:inline">SMS Simulator</span>
            </button>

            <button
              onClick={() => openCopilot(portal === 'host' ? 'host' : 'guest')}
              title="Open AI Copilot"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {portal === 'host' ? (
          <HostDashboard 
            onOpenSMSDrawer={openSMS}
            onOpenChatWithParty={(context) => openCopilot('host', context)}
          />
        ) : (
          <CustomerQueueView
            onOpenChat={(context) => openCopilot('guest', context)}
            onOpenSMSDrawer={openSMS}
          />
        )}
      </main>

      {/* Global AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        initialMode={copilotInitialMode}
        context={copilotContext}
      />

      {/* Global Simulated SMS Drawer */}
      <SMSNotificationDrawer
        isOpen={isSMSOpen}
        onClose={() => setIsSMSOpen(false)}
        filterPhone={smsPhoneFilter}
      />
    </div>
  );
}
