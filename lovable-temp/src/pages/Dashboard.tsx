import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, Network, Map, BarChart3, Bell, Mic, Send, Languages,
  ChevronRight, User, Shield, Clock, X, Menu, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import KSPLogo from "@/components/KSPLogo";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  type: "user" | "ai";
  text: string;
  source?: string;
  confidence?: number;
  timestamp: Date;
}

const mockMessages: Message[] = [
  { id: 1, type: "user", text: "Show me recent chain snatching cases in Bengaluru South", timestamp: new Date() },
  {
    id: 2, type: "ai",
    text: "I found 23 chain snatching cases in Bengaluru South district in the last 30 days. There's a notable cluster around Jayanagar and BTM Layout areas, with 8 cases linked to a suspect group operating on two-wheelers. The peak hours are between 6-8 PM. Would you like me to show the network analysis or hotspot map?",
    source: "FIR Database + Crime Analytics",
    confidence: 94,
    timestamp: new Date(),
  },
];

const recentQueries = [
  "Chain snatching Bengaluru South",
  "Criminal network - Rajesh Yadav",
  "Murder cases Mysuru 2024",
  "Vehicle theft hotspots",
  "Drug trafficking routes",
];

const quickActions = [
  { icon: Search, label: "New Query", route: "/dashboard" },
  { icon: FileText, label: "Cases", route: "/dashboard" },
  { icon: Network, label: "Network", route: "/network" },
  { icon: Map, label: "Map", route: "/map" },
  { icon: BarChart3, label: "Reports", route: "/analytics" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<"en" | "kn">("en");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), type: "user", text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: Date.now() + 1, type: "ai",
        text: "Based on the intelligence database, I've analyzed the relevant records. The data shows significant patterns that correlate with your query. I recommend cross-referencing with the criminal network graph for deeper insights.",
        source: "Intelligence DB",
        confidence: 87,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 2000);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Left Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <div className="glass-card p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center">
                  <User size={20} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Inspector Sharma</p>
                  <p className="text-xs text-muted-foreground">Badge: KSP-4521</p>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-1">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                >
                  <action.icon size={16} className="text-accent" />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-3 scrollbar-thin">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">Recent Queries</p>
              {recentQueries.map((q, i) => (
                <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all flex items-center gap-2">
                  <Clock size={12} />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Center Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <Menu size={18} />
            </Button>
            <KSPLogo size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 pulse-dot" />
              Connected
            </div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.type === "ai" && (
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <Shield size={14} className="text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[70%] ${msg.type === "user"
                  ? "gradient-primary rounded-2xl rounded-br-md px-4 py-3"
                  : "glass-card rounded-2xl rounded-bl-md px-4 py-3"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.source && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{msg.source}</span>
                      {msg.confidence && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{msg.confidence}% confidence</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-primary-foreground" />
              </div>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 glass-card p-2 rounded-xl">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={language === "en" ? "Ask anything about cases, criminals, locations..." : "ಪ್ರಕರಣಗಳು, ಅಪರಾಧಿಗಳು, ಸ್ಥಳಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ..."}
              className="border-0 bg-transparent focus-visible:ring-0 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
              className={`flex-shrink-0 ${isRecording ? "text-destructive glow-red" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Mic size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <Languages size={14} />
              {language === "en" ? "EN" : "ಕನ್ನಡ"}
            </Button>
            <Button
              onClick={handleSend}
              size="icon"
              className="flex-shrink-0 gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full border-l border-border bg-sidebar overflow-y-auto scrollbar-thin"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Context Panel</h3>
                <Button variant="ghost" size="icon" onClick={() => setRightPanelOpen(false)} className="text-muted-foreground h-7 w-7">
                  <X size={14} />
                </Button>
              </div>

              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Active Case</span>
                </div>
                <h4 className="font-semibold text-sm">Chain Snatching Series — BLR South</h4>
                <p className="text-xs text-muted-foreground">FIR: KSP/BLR/2024/4521 · Filed: 15 Mar 2024</p>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">High Priority</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">Under Investigation</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Cases</h4>
                {["Chain snatching — Jayanagar", "Two-wheeler theft — BTM", "Robbery — HSR Layout"].map((c, i) => (
                  <div key={i} className="glass-card p-3 flex items-center justify-between hover:border-accent/20 transition-all cursor-pointer">
                    <div>
                      <p className="text-xs font-medium">{c}</p>
                      <p className="text-[10px] text-muted-foreground">FIR: KSP/BLR/2024/{4522 + i}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "Total Cases", value: "1,247", color: "text-accent" },
                    { label: "Solved %", value: "67.3%", color: "text-green-400" },
                    { label: "Active Investigations", value: "89", color: "text-yellow-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!rightPanelOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-2 top-1/2 -translate-y-1/2 text-muted-foreground z-50"
        >
          <MessageSquare size={18} />
        </Button>
      )}
    </div>
  );
};

export default Dashboard;
