import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { Send, Sparkles, Trash2, Menu } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I am **BioStat AI**. \n\nI can help you calculate the sample size for your medical research. Are you planning a study to compare two groups (like a drug vs. placebo) or estimating a parameter (like prevalence)?\n\nTell me a bit about your study design!",
      sender: Sender.BOT,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: Sender.USER,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Add Thinking Placeholder
    const thinkingId = 'thinking-' + Date.now();
    setMessages(prev => [...prev, {
        id: thinkingId,
        text: '',
        sender: Sender.BOT,
        timestamp: Date.now(),
        isThinking: true
    }]);

    try {
      const response = await geminiService.sendMessage(userText);
      
      // Remove thinking, add real response
      setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
        id: Date.now().toString(),
        text: response.text,
        sender: Sender.BOT,
        timestamp: Date.now(),
        calculation: response.calculation
      }));
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
        id: Date.now().toString(),
        text: "Sorry, I encountered a connection error. Please try again.",
        sender: Sender.BOT,
        timestamp: Date.now()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
      if(window.confirm("Start a new calculation session?")) {
        window.location.reload(); 
      }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-medical-600 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-slate-800 text-lg leading-tight">BioStat AI</h1>
                    <p className="text-xs text-slate-500 font-medium">Research Sample Size Calculator</p>
                </div>
            </div>
            <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-full transition-colors" title="Reset Session">
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-medical-500 focus-within:border-transparent transition-all overflow-hidden p-2">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your study (e.g., 'Compare two drugs with 50% vs 65% cure rate')..."
                    className="w-full resize-none max-h-32 bg-transparent border-none focus:ring-0 p-2 text-slate-800 placeholder:text-slate-400 text-base"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="flex-none p-2 rounded-xl bg-medical-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-medical-700 transition-colors mb-0.5"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
                AI can make mistakes. Please verify generated parameters. Calculations are performed by validated code.
            </p>
        </div>
      </footer>
    </div>
  );
}

export default App;