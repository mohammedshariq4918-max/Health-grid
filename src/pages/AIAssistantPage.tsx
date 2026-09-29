import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  Info, 
  AlertTriangle, 
  ArrowLeftRight, 
  FileText, 
  TrendingDown, 
  CheckCircle2,
  Building2,
  Clock,
  User
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const AIAssistantPage: React.FC = () => {
  const { 
    aiMessages, 
    isAILoading, 
    aiMode, 
    sendAIMessage, 
    clearAIChat, 
    activeSurgePercent 
  } = useInventory();

  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, isAILoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAILoading) return;
    const text = inputPrompt;
    setInputPrompt('');
    sendAIMessage(text);
  };

  const promptSuggestions = [
    {
      title: 'Summarize Critical Shortages',
      subtitle: 'Identify PHCs with ≤ 3 days stock left',
      prompt: 'Summarize high-risk shortages across Mysuru, Nanjangud, and Hunsur PHCs in plain language.',
    },
    {
      title: 'Explain Rabies Vaccine Transfer',
      subtitle: 'Why transfer from Mysuru to Hunsur?',
      prompt: 'Explain the clinical reasoning and mathematical safety behind transferring Rabies Vaccine from Mysuru PHC to Hunsur PHC.',
    },
    {
      title: 'Simulate +50% Viral Surge',
      subtitle: 'Assess fever and antibiotic depletion',
      prompt: 'What happens to antibiotic and Paracetamol reserves if a 50% viral fever surge occurs across Mysuru District?',
    },
    {
      title: 'Draft District Indent Request',
      subtitle: 'Procurement note for District Medical Officer',
      prompt: 'Draft an urgent procurement indent and logistics replenishment request to the District Health Officer (DHO) for Mysuru District.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
              aiMode === 'live'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>{aiMode === 'live' ? 'Live Gemini 3.8 Flash Active' : 'Demo AI Explanation Engine Active'}</span>
            </span>

            <span className="text-xs text-slate-500 font-medium">Supply Chain Intelligence</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            HEALTHGRID AI Supply Chain Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explains inventory status, depletion formulas, and inter-facility transfer trade-offs in plain language.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearAIChat}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Conversation</span>
          </button>
        </div>
      </div>

      {/* AI Mode Transparency Notice */}
      <div className={`rounded-xl p-3.5 border text-xs flex items-center justify-between gap-3 ${
        aiMode === 'live'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-sky-50/80 border-sky-200 text-sky-950'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {aiMode === 'live' ? (
              <strong>Live Gemini 3.8 Flash Connected:</strong>
            ) : (
              <strong>Simulated Demo Explanation Engine:</strong>
            )}{' '}
            {aiMode === 'live'
              ? 'Real-time inferences powered by Google Gemini SDK on backend. Zero patient personal data transmitted.'
              : 'Running in transparent simulated benchmark mode. Generates grounded explanations based directly on current stock tables and formulas without hallucinating.'}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase font-bold text-slate-500 shrink-0 hidden sm:inline">
          {aiMode === 'live' ? 'MODEL: GEMINI-3.8-FLASH' : 'HEURISTIC DEMO MODE'}
        </span>
      </div>

      {/* Quick Prompts Bar */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Suggested Logistics Questions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => sendAIMessage(item.prompt)}
              disabled={isAILoading}
              className="p-3 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group disabled:opacity-50"
            >
              <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                <span>{item.title}</span>
                <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {item.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[540px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {aiMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-blue-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {/* Markdown or plain text rendered with line breaks */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  <div className={`text-[10px] flex items-center justify-between pt-1 border-t ${
                    isUser ? 'border-blue-500 text-blue-100' : 'border-slate-200 text-slate-400'
                  }`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && (
                      <span className="font-mono text-[9px] uppercase">
                        {msg.mode === 'live' ? '✨ Gemini Live' : 'ℹ️ Demo Mode'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isAILoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span>Synthesizing supply chain run-rates and inventory balances...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask about inventory, stock-out horizons, or transfer reasoning..."
              disabled={isAILoading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isAILoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-400 text-center">
            HEALTHGRID AI does not process patient identifiable health data. Focuses strictly on logistics and medicine stock telemetry.
          </div>
        </div>
      </div>
    </div>
  );
};
