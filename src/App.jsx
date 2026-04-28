import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, Mic, Copy, Volume2, History, Star, 
  Send, Users, Settings, Search, Menu, X, 
  ArrowRightLeft, Sparkles, Wand2, MessageSquare, 
  Trash2, Download, Share2, Type, Zap, ZapOff, Check, Cpu
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect', flag: '🔍' },
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
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
];

const App = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [view, setView] = useState('translator'); // 'translator' | 'chat' | 'profile' | 'login'
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  
  const [detectedLang, setDetectedLang] = useState('');
  
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Welcome to Neural Translate! Try our real-time AI engine.", originalText: "Welcome! Experience our advanced neural mode.", sender: "AI", isMine: false, time: "12:00 PM" }
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
      const response = await fetch('http://localhost:8000/api/chat', {
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
      setDetectedLang('');
      return;
    }
    setIsTranslating(true);
    try {
      const response = await fetch('http://localhost:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: sourceLang === 'auto' ? null : sourceLang,
          targetLang: targetLang
        }),
      });
      const data = await response.json();
      setTargetText(data.translated_text);
      
      if (sourceLang === 'auto' && data.source_lang) {
        const langName = LANGUAGES.find(l => l.code === data.source_lang)?.name || data.source_lang.toUpperCase();
        setDetectedLang(langName);
      } else {
        setDetectedLang('');
      }
      
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
      const response = await fetch('http://localhost:8000/api/history');
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
      const response = await fetch(`http://localhost:8000/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`, {
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
    if (!isLiveEnabled) return;
    
    const delayDebounce = setTimeout(() => {
      handleTranslate(sourceText);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [sourceText, targetLang, isLiveEnabled]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-slate-200 selection:bg-primary/30">
      {/* Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} history={history} />

      <nav className="relative z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 lg:hidden cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight neon-text">Neural Translate</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button 
            onClick={() => setView('translator')} 
            className={cn("hover:text-white transition-colors flex items-center gap-2", view === 'translator' && "text-primary")}
          >
            <Languages className="w-4 h-4" /> Translator
          </button>
          <button 
            onClick={() => setView('chat')} 
            className={cn("hover:text-white transition-colors flex items-center gap-2", view === 'chat' && "text-primary")}
          >
            <MessageSquare className="w-4 h-4" /> AI Chat
          </button>
          <button className="hover:text-white transition-colors">Documentation</button>
          <button className="hover:text-white transition-colors">Pricing</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors hidden lg:block"
          >
            <History className="w-5 h-5" />
          </button>
          {isLoggedIn ? (
            <button 
              onClick={() => setView('profile')}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Profile
            </button>
          ) : (
            <button 
              onClick={() => setView('login')}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
            >
              Login
            </button>
          )}
          <button className="btn-primary">
            Upgrade Pro
          </button>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {view === 'translator' && (
            <motion.div 
              key="hero-translator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-12 max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 text-sm font-medium text-accent">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Neural Translation Engine</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
                Translate with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  AI Precision
                </span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
                Real-time translation powered by advanced neural networks. Experience seamless communication across 20+ languages.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Mode Switcher */}
        <AnimatePresence mode="wait">
          {view === 'translator' && (
            <motion.div
              key="translator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl"
            >
              {/* Controls bar */}
              <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Translation</span>
                    <button 
                      onClick={() => setIsLiveEnabled(!isLiveEnabled)}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        isLiveEnabled ? "bg-accent" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: isLiveEnabled ? 20 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </button>
                    {isLiveEnabled ? <Zap className="w-3 h-3 text-accent" /> : <ZapOff className="w-3 h-3 text-slate-500" />}
                  </div>
                </div>
                
                {!isLiveEnabled && (
                  <button 
                    onClick={() => handleTranslate(sourceText)}
                    className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                  >
                    Translate Now <Wand2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="glass-card overflow-hidden grid lg:grid-cols-2">
                
                {/* Left Panel - Input */}
                <div className="p-8 border-r border-white/5 relative bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-6">
                    <LanguageSelector 
                      languages={LANGUAGES} 
                      selected={sourceLang} 
                      onSelect={setSourceLang} 
                      label="Source Language"
                    />
                    {sourceLang === 'auto' && sourceText && (
                      <div className="flex items-center gap-2 text-[10px] text-accent font-bold bg-accent/10 px-2 py-1 rounded-md border border-accent/20">
                        <Sparkles className="w-3 h-3" /> {detectedLang ? `DETECTED: ${detectedLang.toUpperCase()}` : 'AUTO-DETECTING'}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Type or paste text to translate..."
                    className="w-full h-64 bg-transparent border-none focus:ring-0 text-xl lg:text-2xl resize-none placeholder:text-slate-700 outline-none"
                  />

                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsRecording(!isRecording)}
                        className={cn(
                          "p-4 rounded-2xl transition-all",
                          isRecording ? "bg-red-500/20 text-red-400 glow-red border border-red-500/30" : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                        )}
                      >
                        <Mic className={cn("w-6 h-6", isRecording && "animate-pulse")} />
                      </motion.button>
                      {isRecording && (
                        <div className="waveform px-4">
                          {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="wave-bar" />)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tracking-widest">
                      {sourceText.length} / 5000
                    </div>
                  </div>
                </div>

                {/* Right Panel - Output */}
                <div className="p-8 bg-white/[0.02] relative">
                  <div className="flex items-center justify-between mb-6">
                    <LanguageSelector 
                      languages={LANGUAGES.filter(l => l.code !== 'auto')} 
                      selected={targetLang} 
                      onSelect={setTargetLang} 
                      label="Target Language"
                    />
                    <motion.button 
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={swapLanguages}
                      disabled={sourceLang === 'auto'}
                      className={cn(
                        "p-2.5 rounded-xl transition-all border",
                        sourceLang === 'auto' ? "opacity-30 cursor-not-allowed border-transparent" : "hover:bg-white/5 text-slate-400 hover:text-accent border-white/10"
                      )}
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <div className="w-full h-64 relative">
                    <AnimatePresence>
                      {isTranslating && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 backdrop-blur-[2px]"
                        >
                          <div className="flex gap-2">
                            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-3 h-3 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-3 h-3 bg-accent rounded-full animate-bounce" />
                          </div>
                          <span className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">AI Thinking...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className={cn(
                      "w-full h-full text-xl lg:text-2xl text-white font-medium transition-all duration-500 leading-relaxed",
                      isTranslating ? "opacity-20 blur-sm scale-95" : "opacity-100"
                    )}>
                      {targetText || <span className="text-slate-700 italic">Neural translation will appear here...</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTTS(targetText, targetLang)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group border border-white/5"
                        title="Speak translation"
                      >
                        <Volume2 className="w-5 h-5 group-active:scale-95" />
                      </button>
                      <button 
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group border border-white/5"
                        onClick={() => navigator.clipboard.writeText(targetText)}
                        title="Copy to clipboard"
                      >
                        <Copy className="w-5 h-5 group-active:scale-95" />
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white group border border-white/5" title="Save to favorites">
                        <Star className="w-5 h-5 group-active:scale-95" />
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats / Features Grid */}
              <div className="grid md:grid-cols-4 gap-6 mt-12 w-full">
                {[
                  { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: 'Real-time', desc: 'Zero latency typing' },
                  { icon: <Sparkles className="w-5 h-5 text-purple-400" />, title: 'Neural Engine', desc: '99% Accuracy rate' },
                  { icon: <History className="w-5 h-5 text-blue-400" />, title: 'Sync History', desc: 'Access anywhere' },
                  { icon: <Users className="w-5 h-5 text-green-400" />, title: '20+ Languages', desc: 'Global coverage' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="glass-card p-5 border-white/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl"
            >
              <div className="glass-card h-[650px] flex flex-col border-primary/20 shadow-primary/5">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0c]"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Neural AI Chat</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Online • Low Latency</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-white/10"><Settings className="w-5 h-5" /></button>
                     <button 
                        onClick={() => setChatMessages([])}
                        className="p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 border border-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                      <div className="p-4 rounded-2xl bg-white/10 rounded-tl-none border border-white/5 backdrop-blur-md flex items-center gap-3 shadow-xl">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"></span>
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] text-accent uppercase">AI Thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message in any language..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-16 focus:border-primary/50 transition-all outline-none text-white shadow-inner"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim()}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow-lg",
                        chatInput.trim() ? "bg-primary text-white scale-100" : "bg-white/5 text-slate-600 scale-90"
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 px-2">
                    <p className="text-[10px] text-slate-500 font-medium">Messages are auto-detected and translated in real-time.</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Powered by Neural V2</span>
                       <Zap className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="glass-card p-8 border-primary/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 tracking-tight">Access Neural Cloud</h2>
                  <p className="text-slate-400 text-sm">Sign in to sync your translations across devices</p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoggedIn(true);
                    setView('profile');
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Node ID</label>
                    <input 
                      type="email" 
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:border-primary/50 focus:bg-white/10 transition-all outline-none text-white placeholder:text-slate-700"
                      placeholder="operator@neural.net"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Access Protocol</label>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:border-primary/50 focus:bg-white/10 transition-all outline-none text-white placeholder:text-slate-700"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full btn-primary py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      Authenticate <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center mt-6">
                    <p className="text-xs text-slate-500">
                      New to Neural? <span className="text-primary hover:underline cursor-pointer">Register Node</span>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl"
            >
              <div className="glass-card overflow-hidden">
                <div className="p-12 border-b border-white/5 bg-gradient-to-b from-primary/15 to-transparent flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent)] opacity-50"></div>
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-5xl font-bold border-4 border-[#0a0a0c] mb-6 relative z-10 shadow-2xl shadow-primary/30 transform rotate-3 hover:rotate-0 transition-transform">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <h2 className="text-4xl font-bold relative z-10 tracking-tighter">{userEmail || 'Neural Operator'}</h2>
                  <div className="mt-3 relative z-10 flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-accent font-bold text-xs uppercase tracking-widest">Neural Pro Explorer</span>
                  </div>
                </div>
                <div className="p-10 md:p-12 grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Neural Identity</p>
                        <p className="font-semibold text-lg text-white">{userEmail || 'operator@neural.net'}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">Compute Plan</p>
                        <p className="font-semibold text-lg text-white flex items-center gap-2">
                          Enterprise Tier (Active) <Check className="w-4 h-4 text-green-500" />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center hover:border-primary/40 transition-all hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/5">
                        <p className="text-4xl font-black text-primary mb-2">1.2K</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Syncs</p>
                      </div>
                      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center hover:border-secondary/40 transition-all hover:bg-secondary/5 hover:shadow-xl hover:shadow-secondary/5">
                        <p className="text-4xl font-black text-secondary mb-2">24</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Nodes</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-4">Encryption: AES-256 Neural Guard</p>
                  <button 
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserEmail('');
                      setView('translator');
                    }}
                    className="px-8 py-3 rounded-2xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Terminate Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-20 mt-24 bg-[#040406]">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">Neural Translate</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Advancing human communication through state-of-the-art neural networks and real-time AI translation.
            </p>
            <div className="flex items-center gap-5">
              {[ '𝕏', 'in', 'gh', 'dr'].map(icon => (
                <div key={icon} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-all font-bold">
                  {icon}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 mb-8">Technology</h4>
            <ul className="space-y-5 text-slate-500 text-sm font-medium">
              <li className="hover:text-white cursor-pointer transition-colors">Neural Core V2</li>
              <li className="hover:text-white cursor-pointer transition-colors">Edge Computing</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Shield</li>
              <li className="hover:text-white cursor-pointer transition-colors">API Access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 mb-8">Resources</h4>
            <ul className="space-y-5 text-slate-500 text-sm font-medium">
              <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-white cursor-pointer transition-colors">Model Benchmarks</li>
              <li className="hover:text-white cursor-pointer transition-colors">System Status</li>
              <li className="hover:text-white cursor-pointer transition-colors">Open Source</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <p>© 2026 Neural Translate. Intelligence by Antigravity.</p>
          <div className="flex gap-10">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Security Protocol</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Node</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Neural Cookie</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LanguageSelector = ({ languages, selected, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedLang = languages.find(l => l.code === selected) || languages[0];

  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2 block ml-1">{label}</span>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group shadow-lg"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">{selectedLang?.flag}</span>
        <span className="font-bold text-sm tracking-tight">{selectedLang?.name}</span>
        <Menu className="w-3.5 h-3.5 text-slate-500 ml-1 group-hover:text-accent transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-3 w-64 bg-[#0e0e12] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 py-2 backdrop-blur-2xl"
            >
              <div className="px-3 py-3 border-b border-white/5 mb-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search languages..." 
                    className="w-full bg-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none border border-white/5 focus:border-primary/50 transition-all" 
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelect(lang.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-5 py-3 text-sm hover:bg-primary/10 transition-all group",
                        selected === lang.code ? "text-primary bg-primary/5" : "text-slate-400"
                      )}
                    >
                      <span className="text-lg group-hover:scale-125 transition-transform">{lang.flag}</span>
                      <span className="font-bold tracking-tight">{lang.name}</span>
                      {selected === lang.code && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No Node Found</p>
                  </div>
                )}
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
    initial={{ opacity: 0, y: 15, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={cn(
      "flex flex-col gap-2 max-w-[85%]",
      isMine ? "ml-auto items-end" : "mr-auto items-start"
    )}
  >
    <div className={cn(
      "p-5 rounded-[2rem] shadow-2xl relative group transition-all",
      isMine 
        ? "bg-gradient-to-br from-primary to-secondary rounded-tr-none text-white" 
        : "bg-white/5 rounded-tl-none border border-white/10 backdrop-blur-md"
    )}>
      <p className={cn("font-bold text-sm lg:text-[15px] leading-relaxed", !isMine && "text-slate-200")}>{text}</p>
      
      {!isMine && originalText && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[9px] text-accent font-black mb-2 flex items-center gap-1.5 uppercase tracking-[0.2em]">
             <Sparkles className="w-3 h-3" /> Neural Insight
          </p>
          <p className="text-[13px] text-slate-400 italic font-medium leading-relaxed opacity-80">"{originalText}"</p>
        </div>
      )}
      {isMine && translated && translated !== "Translating..." && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-[13px] text-white/70 font-medium italic">"{translated}"</p>
        </div>
      )}

      {/* Decorative dot */}
      <div className={cn(
        "absolute top-2 w-1.5 h-1.5 rounded-full opacity-50",
        isMine ? "left-2 bg-white" : "right-2 bg-accent"
      )}></div>
    </div>
    <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] px-4">{time}</span>
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
        />
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-[320px] bg-[#08080a] border-r border-white/10 z-[110] flex flex-col shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Neural Log</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {history.length > 0 ? (
              history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.sourceLang} → {item.targetLang}</span>
                    <span className="text-[10px] text-slate-700 font-bold">{item.time}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200 line-clamp-1 mb-1 group-hover:text-white transition-colors">{item.source}</p>
                  <p className="text-xs text-slate-500 line-clamp-1 italic group-hover:text-slate-400 transition-colors">{item.target}</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <History className="w-16 h-16 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No Logs Found</p>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-white/5">
             <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
               Clear All Logs <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default App;
