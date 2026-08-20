import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  User,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { ChatMessage, ChatSourceCitation } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AIAssistantViewProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const SAMPLE_PROMPTS = [
  'Find AI internships suitable for a second-year engineering student.',
  'Am I eligible for Prime Minister Research Fellowship (PMRF)?',
  'Show hackathons with upcoming deadlines in 2026.',
  'Explain PM Kaushal Vikas Yojana (PMKVY 4.0) in simple English.',
  'What are the best scholarships for biotechnology students in India?'
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  initialPrompt,
  onClearInitialPrompt
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: `Hello **${user.name}**! 👋 I am your **CivicSense AI Assistant**, powered by Gemini 3.7 with live search grounding.\n\nI can help you:\n- Check detailed eligibility criteria against your **${user.degree}** profile\n- Discover live public schemes, internships, hackathons, and scholarships\n- Explain complex government notifications and grant requirements in clear terms\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [
        { title: 'National Career Service Portal', url: 'https://www.ncs.gov.in' },
        { title: 'National Scholarship Portal', url: 'https://scholarships.gov.in' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages.map(m => ({ sender: m.sender, content: m.content }));
      const response = await api.chatAssistant(query, user.id, history);

      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (e) {
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: 'I encountered an issue retrieving real-time data. Please verify your query or check back shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">CivicSense AI Assistant</h2>
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Grounding Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Context active: {user.name} ({user.education}, {user.degree})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-reset',
                sender: 'assistant',
                content: `Chat history reset. How can I assist you with your opportunity search?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-xs flex items-center gap-1"
          title="Reset Chat"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`space-y-2 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content}
                  </div>
                </div>

                {/* Sources & Citations if present */}
                {msg.sources && msg.sources.length > 0 && !isUser && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Supporting Sources & Official Portals
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 font-medium text-[11px] transition shadow-2xs"
                        >
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-xs text-slate-600 shadow-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>CivicSense Agent is consulting official databases and synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="whitespace-nowrap text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="pt-2">
        <div className="relative flex items-center rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
          <input
            id="input-chat-assistant"
            type="text"
            placeholder="Ask anything about eligibility, government schemes, scholarships, internships..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
          <button
            id="btn-send-chat"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          CivicSense AI retrieves from official government repositories and verified public domains. Cross-verify critical application details before final submission.
        </p>
      </div>

    </div>
  );
};
