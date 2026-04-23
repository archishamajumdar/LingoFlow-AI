import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, Mic, Copy, Volume2, History, Star, 
  Send, Users, Settings, Search, Menu, X, 
  ArrowRightLeft, Sparkles, Wand2, MessageSquare, 
  Trash2, Download, Share2, Type
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

const App = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('translator'); // 'translator' | 'chat' | 'voice'
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "नमस्ते! हमारे नए AI चैट मोड को आजमाएं।", originalText: "Hello! Try out our new AI Chat Mode.", sender: "AI", isMine: false, time: "12:00 PM" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sessionId] = useState(crypto.randomUUID());
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiTyping]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: chatInput,
      sender: "Me",
      isMine: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsAiTyping(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentInput,
          session_id: sessionId,
          target_lang: targetLang
        }),
      });
      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        text: data.ai_translated,
        originalText: data.ai_original,
        sender: "AI",
        isMine: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleTranslate = async (text) => {
    if (!text) {
      setTargetText('');
      return;
    }
    setIsTranslating(true);
    try {
      const response = await fetch('http://localhost:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: sourceLang === 'auto' ? null : sourceLang,
          target_lang: targetLang
        }),
      });
      const data = await response.json();
      setTargetText(data.translated_text);
      
      // Update history after successful translation
      fetchHistory();
    } catch (error) {
      console.error("Translation error:", error);
      setTargetText("Error connecting to backend...");
    } finally {
      setIsTranslating(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/history');
      const data = await response.json();
      const formatted = data.map(item => ({
        id: item.id,
        source: item.original,
        target: item.translated,
        sourceLang: item.from,
        targetLang: item.to,
        time: "Just now"
      })).reverse();
      setHistory(formatted);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleTTS = async (text, lang) => {
    try {
      const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}&lang=${lang}`, {
        method: 'POST'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleTranslate(sourceText);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [sourceText, targetLang]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 selection:bg-primary/30">
      {/* Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} history={history} />

      <nav className="relative z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 lg:hidden cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight neon-text">LingoFlow AI</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button 
            onClick={() => setMode('translator')} 
            className={cn("hover:text-white transition-colors", mode === 'translator' && "text-primary")}
          >
            Translator
          </button>
          <button 
            onClick={() => setMode('chat')} 
            className={cn("hover:text-white transition-colors", mode === 'chat' && "text-primary")}
          >
            Chat Mode
          </button>
          <button className="hover:text-white transition-colors">API</button>
          <button className="hover:text-white transition-colors">Pricing</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors hidden lg:block"
          >
            <History className="w-5 h-5" />
          </button>
          <button className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium">
            Login
          </button>
          <button className="btn-primary">
            Get Pro
          </button>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 text-sm font-medium text-accent">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Real-Time Translation</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Break Language <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Barriers Instantly
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Experience the future of communication. Translate text, voice, and live conversations in over 100 languages with medical-grade accuracy.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => setMode('translator')}
              className="btn-primary flex items-center gap-2"
            >
              Start Translating <Wand2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMode('chat')}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold flex items-center gap-2"
            >
              Explore Chat Mode <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Dynamic Mode Switcher */}
        <AnimatePresence mode="wait">
          {mode === 'translator' && (
            <motion.div
              key="translator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl"
            >
              <div className="glass-card overflow-hidden grid lg:grid-cols-2">
                
                {/* Left Panel - Input */}
                <div className="p-8 border-r border-white/5 relative">
                  <div className="flex items-center justify-between mb-6">
                    <LanguageSelector 
                      languages={LANGUAGES} 
                      selected={sourceLang} 
                      onSelect={setSourceLang} 
                      label="From"
                    />
                    <div className="text-xs text-slate-500 font-medium bg-white/5 px-2 py-1 rounded-md">
                      Auto-detecting...
                    </div>
                  </div>

                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text here..."
                    className="w-full h-64 bg-transparent border-none focus:ring-0 text-xl lg:text-3xl resize-none placeholder:text-slate-600 outline-none"
                  />

                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsRecording(!isRecording)}
                        className={cn(
                          "p-4 rounded-full transition-all",
                          isRecording ? "bg-red-500/20 text-red-400 glow-red" : "bg-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        <Mic className={cn("w-6 h-6", isRecording && "animate-pulse")} />
                      </motion.button>
                      {isRecording && (
                        <div className="waveform">
                          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="wave-bar" />)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 font-medium">
                      {sourceText.length} / 5000
                    </div>
                  </div>
                </div>

                {/* Right Panel - Output */}
                <div className="p-8 bg-white/[0.012] relative">
                  <div className="flex items-center justify-between mb-6">
                    <LanguageSelector 
                      languages={LANGUAGES} 
                      selected={targetLang} 
                      onSelect={setTargetLang} 
                      label="To"
                    />
                    <motion.button 
                      whileHover={{ rotate: 180 }}
                      onClick={swapLanguages}
                      className="p-2 rounded-full hover:bg-white/5 transition-all text-slate-400 hover:text-accent"
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <div className="w-full h-64 relative">
                    {isTranslating && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                      </div>
                    )}
                    <div className={cn(
                      "w-full h-full text-xl lg:text-3xl text-accent font-medium transition-opacity",
                      isTranslating ? "opacity-0" : "opacity-100"
                    )}>
                      {targetText || <span className="text-slate-700 italic">Translation...</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTTS(targetText, targetLang)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
                      >
                        <Volume2 className="w-5 h-5 group-active:scale-95" />
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group">
                        <Copy className="w-5 h-5 group-active:scale-95" />
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group">
                        <Star className="w-5 h-5 group-active:scale-95" />
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Suggestion Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-12 w-full">
                {['Travel Phrases', 'Business Email', 'Academic Text'].map((item, idx) => (
                  <motion.div
                    key={item}
                    whileHover={{ y: -5 }}
                    className="glass-card p-6 cursor-pointer flex items-center justify-between hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-white mb-1">{item}</h3>
                      <p className="text-sm text-slate-500">Popular daily translations</p>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-slate-600" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {mode === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl"
            >
              <div className="glass-card h-[600px] flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-[#0a0a0c]">A</div>
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border-2 border-[#0a0a0c]">B</div>
                    </div>
                    <div>
                      <h3 className="font-bold">Global Chat</h3>
                      <p className="text-xs text-slate-500">
                        {LANGUAGES.find(l => l.code === sourceLang)?.name} ↔ {LANGUAGES.find(l => l.code === targetLang)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-2 rounded-lg hover:bg-white/5 transition-colors"><Settings className="w-5 h-5" /></button>
                     <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-red-400"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.map((msg) => (
                    <ChatMessage 
                      key={msg.id}
                      text={msg.text} 
                      originalText={msg.originalText}
                      translated={msg.translated} 
                      isMine={msg.isMine} 
                      time={msg.time}
                    />
                  ))}
                  {isAiTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1 max-w-[85%] mr-auto items-start"
                    >
                      <div className="p-4 rounded-2xl bg-white/10 rounded-tl-none border border-white/5 backdrop-blur-md flex items-center gap-2">
                        <div className="flex gap-1.5 items-center px-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                        </div>
                        <span className="text-sm text-slate-400 font-medium ml-2">AI is typing...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-white/5">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:border-primary/50 transition-all outline-none"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary rounded-xl text-white"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 mt-24">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">LingoFlow AI</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-6">
              The world's most advanced AI translation platform. Built for global teams, travelers, and language learners.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">𝕏</div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">in</div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">gh</div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Features</li>
              <li className="hover:text-white cursor-pointer transition-colors">Live Chat</li>
              <li className="hover:text-white cursor-pointer transition-colors">Voice Sync</li>
              <li className="hover:text-white cursor-pointer transition-colors">Mobile App</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-white cursor-pointer transition-colors">API Keys</li>
              <li className="hover:text-white cursor-pointer transition-colors">Guides</li>
              <li className="hover:text-white cursor-pointer transition-colors">Github</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© 2026 LingoFlow AI. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LanguageSelector = ({ languages, selected, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find(l => l.code === selected);

  return (
    <div className="relative">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">{label}</span>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
      >
        <span className="text-lg">{selectedLang?.flag}</span>
        <span className="font-semibold text-sm">{selectedLang?.name}</span>
        <Menu className="w-3 h-3 text-slate-500 ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 top-full mt-2 w-48 bg-[#121214] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-2"
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Search..." className="w-full bg-white/5 rounded-md py-1.5 pl-7 pr-3 text-xs outline-none" />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelect(lang.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/20 transition-colors",
                      selected === lang.code ? "text-primary bg-primary/10" : "text-slate-400"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatMessage = ({ text, translated, originalText, isMine, time }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "flex flex-col gap-1 max-w-[85%]",
      isMine ? "ml-auto items-end" : "mr-auto items-start"
    )}
  >
    <div className={cn(
      "p-4 rounded-2xl shadow-sm",
      isMine ? "bg-primary rounded-tr-none text-white" : "bg-white/10 rounded-tl-none border border-white/5 backdrop-blur-md"
    )}>
      <p className={cn("font-medium mb-1 leading-relaxed", !isMine && "text-slate-200")}>{text}</p>
      
      {!isMine && originalText && (
        <>
          <div className="h-[1px] w-full bg-white/10 my-3" />
          <p className="text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1 uppercase tracking-wider">
             <Sparkles className="w-3 h-3 text-accent" /> Translated from English
          </p>
          <p className="text-sm text-slate-400 italic">"{originalText}"</p>
        </>
      )}
      {isMine && translated && translated !== "Translating..." && (
        <>
          <div className="h-[1px] w-full bg-white/20 my-2" />
          <p className="text-sm text-white/80">{translated}</p>
        </>
      )}
    </div>
    <span className="text-[10px] text-slate-500 px-2 mt-1">{time}</span>
  </motion.div>
);

const Sidebar = ({ isOpen, onClose, history }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 bottom-0 w-80 bg-[#0d0d0f] border-r border-white/5 z-[101] p-6 shadow-2xl overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">History</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {item.sourceLang} <ArrowRightLeft className="w-3 h-3" /> {item.targetLang}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">{item.time}</span>
                </div>
                <p className="text-sm font-semibold text-white line-clamp-1 mb-1">{item.source}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{item.target}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6">Favorites</h3>
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/5 text-slate-700">
               <Star className="w-8 h-8 mb-4 opacity-20" />
               <p className="text-sm font-medium">No saved translations</p>
            </div>
          </div>

          <div className="mt-auto pt-10 border-t border-white/5">
             <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                   <Settings className="w-5 h-5 text-slate-500" />
                   <span className="text-sm font-semibold">Settings</span>
                </div>
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">New</div>
             </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default App;
