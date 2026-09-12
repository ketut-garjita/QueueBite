import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, User, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

export default function AICopilotDrawer({ isOpen, onClose, initialMode = 'guest', context = {} }) {
  const [mode, setMode] = useState(initialMode); // 'guest' or 'host'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialMode === 'host'
        ? "Hello! I am your QueueBite Host Copilot. Ask me about queue congestion, who has been waiting longest, or table seating recommendations."
        : "Hello! Welcome to The Rustic Olive. How can I help you with your wait time, seating preferences, or menu questions today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPills, setSuggestedPills] = useState(
    initialMode === 'host'
      ? ["Who has been waiting the longest?", "Show queue summary", "Available tables"]
      : ["How long is our wait?", "Can we sit on the patio?", "Vegetarian options?"]
  );

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMode(initialMode);
    setMessages([
      {
        role: 'assistant',
        content: initialMode === 'host'
          ? "Hello! I am your QueueBite Host Copilot. Ask me about queue congestion, who has been waiting longest, or table seating recommendations."
          : "Hello! Welcome to The Rustic Olive. How can I help you with your wait time, seating preferences, or menu questions today?"
      }
    ]);
    setSuggestedPills(
      initialMode === 'host'
        ? ["Who has been waiting the longest?", "Show queue summary", "Available tables"]
        : ["How long is our wait?", "Can we sit on the patio?", "Vegetarian options?"]
    );
  }, [initialMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAI(newMsgs, mode, context);
      setMessages([...newMsgs, { role: 'assistant', content: res.reply }]);
      if (res.suggested_actions && res.suggested_actions.length > 0) {
        setSuggestedPills(res.suggested_actions);
      }
    } catch (err) {
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: "Sorry, I encountered an issue reaching the AI engine. Please try again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-orange-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                QueueBite AI Copilot
              </h3>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-700">
                <span>Mode:</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="bg-transparent border-none text-orange-800 font-bold underline cursor-pointer p-0 focus:outline-none"
                >
                  <option value="guest">Guest Assistant</option>
                  <option value="host">Host Stand Copilot</option>
                </select>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-orange-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                }`}>
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-400 italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" /> Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
          {suggestedPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              className="text-[11px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full transition"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={mode === 'host' ? "Ask copilot: 'Who is next?', 'Patio status'..." : "Ask: 'How long?', 'Patio tables?'..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl shadow transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
