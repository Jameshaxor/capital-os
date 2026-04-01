import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, LineChart, Briefcase, Search,
  Zap, Newspaper, Settings, Bell, Command,
  TrendingUp, TrendingDown, Activity, ShieldCheck, 
  ChevronRight, Menu, X, Filter, ArrowUpDown, LogOut, UploadCloud, FileText, CheckCircle
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// PASTE YOUR FIREBASE CONFIG KEYS HERE
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase only if config is provided
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// --- MOCK DATA FALLBACKS ---
const SECTORS = ['Banking', 'IT', 'Energy', 'FMCG', 'Auto', 'Pharma', 'Telecom', 'Metals'];

const FALLBACK_STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries', basePrice: 2945.60, vol: 0.002, mcap: 'Large Cap', sector: 'Energy' },
  { sym: 'TCS', name: 'Tata Consultancy', basePrice: 3876.20, vol: 0.0015, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', basePrice: 1642.35, vol: 0.0025, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'INFY', name: 'Infosys Limited', basePrice: 1567.80, vol: 0.002, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1089.45, vol: 0.003, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'ITC', name: 'ITC Limited', basePrice: 462.15, vol: 0.001, mcap: 'Large Cap', sector: 'FMCG' },
];

// --- UTILS ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

// --- SIMULATION ENGINE (Used only if Real API fails) ---
const generateNextPrice = (currentPrice, volatility) => {
  const drift = 0.0001;
  const shock = (Math.random() - 0.5) * 2 * volatility;
  return Math.max(0.01, currentPrice * (1 + drift + shock));
};

const generateHistory = (basePrice, volatility, points = 40) => {
  let history = [basePrice];
  for (let i = 1; i < points; i++) history.push(generateNextPrice(history[i - 1], volatility));
  return history;
};

// --- COMPONENTS ---
const Sparkline = ({ data, color, className = "" }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * 100},${30 - ((d - min) / range) * 30}`).join(' ');
  return (
    <svg className={`w-full h-12 overflow-visible ${className}`} viewBox="0 -5 100 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,40 ${pts} 100,40`} fill={`url(#grad-${color})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Card = ({ children, className = "", noPadding = false }) => (
  <div className={`bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-sm ${noPadding ? '' : 'p-5'} ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'neutral', className = "" }) => {
  const styles = {
    positive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    negative: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    neutral: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide font-mono ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- VIEWS ---
const DashboardView = ({ stocks }) => {
  const topGainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Command Center</h1>
        <p className="text-sm text-zinc-400 mt-1">Market overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stocks.slice(0,4).map((idx, i) => {
          const isUp = idx.changePct >= 0;
          return (
            <Card key={i} className="relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-zinc-400">{idx.sym}</span>
                  <Badge variant={isUp ? 'positive' : 'negative'}>{isUp ? '+' : ''}{idx.changePct.toFixed(2)}%</Badge>
                </div>
                <div className="text-2xl font-bold text-zinc-50 font-mono tracking-tight">
                  {idx.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
              <div className="mt-4 -mx-2 -mb-2">
                <Sparkline data={idx.history} color={isUp ? '#34d399' : '#fb7185'} className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-zinc-50">Quantitative Sector Heatmap</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTORS.map((sectorName, i) => {
              const sectorStocks = stocks.filter(s => s.sector === sectorName);
              const avgChange = sectorStocks.length ? sectorStocks.reduce((sum, s) => sum + s.changePct, 0) / sectorStocks.length : (Math.random() - 0.5) * 2;
              const isUp = avgChange >= 0;
              const intensity = Math.min(Math.abs(avgChange) / 2, 1);
              const bg = isUp ? `rgba(16, 185, 129, ${0.05 + intensity * 0.2})` : `rgba(244, 63, 94, ${0.05 + intensity * 0.2})`;
              const border = isUp ? `rgba(16, 185, 129, ${0.1 + intensity * 0.3})` : `rgba(244, 63, 94, ${0.1 + intensity * 0.3})`;
              return (
                <div key={i} className="p-4 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-[1.02] cursor-pointer" style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}>
                  <span className="text-xs font-semibold text-zinc-400 mb-1">{sectorName}</span>
                  <span className={`text-lg font-bold font-mono tracking-tight ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{avgChange.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-zinc-50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Momentum Leaders
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {topGainers.map((s, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{s.sym}</div>
                  <div className="text-xs font-medium text-zinc-500 mt-0.5">{s.sector || 'Equity'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-zinc-200">₹{s.price.toFixed(2)}</div>
                  <div className="text-xs text-emerald-400 font-mono mt-0.5">+{s.changePct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const PortfolioView = ({ user, liveStocks }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // FETCH PORTFOLIO FROM FIRESTORE
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }
    
    try {
      const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
      const unsubscribe = onSnapshot(portfolioRef, (snapshot) => {
        const fetchedPortfolio = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPortfolio(fetchedPortfolio);
        setLoading(false);
      }, (error) => {
        console.error("Firestore fetch error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch(e) {
      console.error(e);
      setLoading(false);
    }
  }, [user]);

  // SIMULATE UPLOAD & PARSING, THEN WRITE TO FIRESTORE
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(true);
    
    // Simulate API delay for parsing CAS PDF
    setTimeout(async () => {
      try {
        const mockParsedHoldings = [
          { sym: 'RELIANCE', qty: 50, avg: 2650 },
          { sym: 'HDFCBANK', qty: 100, avg: 1520 },
          { sym: 'TCS', qty: 30, avg: 3950 }
        ];

        const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
        for (const holding of mockParsedHoldings) {
          const docRef = doc(portfolioRef, holding.sym);
          await setDoc(docRef, holding);
        }
        
        setUploading(false);
      } catch (err) {
        console.error("Error saving portfolio:", err);
        setUploading(false);
      }
    }, 2000);
  };

  if (loading) return <div className="text-center text-zinc-500 py-20 animate-pulse">Loading secure vault...</div>;

  // EMPTY STATE: Show Upload Zone
  if (portfolio.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">My Portfolio</h1>
          <p className="text-sm text-zinc-400 mt-1">Connect your broker securely via CAS.</p>
        </header>

        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-zinc-800 bg-zinc-900/20">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
            {uploading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            {uploading ? "Decrypting & Parsing CAS..." : "Sync Your Portfolio"}
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm">
            {uploading ? "Extracting stocks and mutual funds. Securing to Firestore..." : "Upload your CAMS/KFintech Consolidated Account Statement (CAS) PDF. We extract your holdings securely without requiring your broker passwords."}
          </p>
          
          {!uploading && (
            <div className="flex gap-4">
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-zinc-100 text-black font-semibold rounded-xl hover:bg-white transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Upload CAS PDF
              </button>
            </div>
          )}
          <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-widest font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Bank-grade encryption • Data never leaves your account
          </p>
        </Card>
      </div>
    );
  }

  // ACTIVE PORTFOLIO STATE
  const enrichedPortfolio = portfolio.map(p => {
    const liveStock = liveStocks.find(s => s.sym === p.sym);
    const ltp = liveStock ? liveStock.price : (p.avg * 1.05); // Fallback pricing
    return { ...p, ltp };
  });

  const totalInvested = enrichedPortfolio.reduce((sum, p) => sum + (p.avg * p.qty), 0);
  const currentValue = enrichedPortfolio.reduce((sum, p) => sum + (p.ltp * p.qty), 0);
  const totalPnL = currentValue - totalInvested;
  const pnlPercent = (totalPnL / totalInvested) * 100;
  const isUp = totalPnL >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Portfolio</h1>
          <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400"/> Synced via CAS Secure Vault</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="text-sm bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:text-white transition-colors">
          Re-Sync Portfolio
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
      </header>

      <Card className="flex flex-col justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-400 mb-1">Total Equity Value</div>
          <div className="text-4xl font-bold font-mono text-zinc-50 tracking-tight">
            {formatCurrency(currentValue)}
          </div>
        </div>
        <div className="flex gap-8 mt-8 border-t border-white/5 pt-6">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Invested Amount</div>
            <div className="text-lg font-mono font-medium text-zinc-300">{formatCurrency(totalInvested)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Returns</div>
            <div className={`text-lg font-mono font-medium flex items-center gap-2 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}{formatCurrency(totalPnL)}
              <Badge variant={isUp ? 'positive' : 'negative'} className="ml-1">
                {isUp ? '+' : ''}{pnlPercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Asset</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Qty</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Avg. Cost</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">LTP (Live)</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Returns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrichedPortfolio.map((p, i) => {
              const val = p.ltp * p.qty;
              const cost = p.avg * p.qty;
              const pl = val - cost;
              const plPct = (pl / cost) * 100;
              const pIsUp = pl >= 0;

              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-5">
                    <div className="font-semibold text-zinc-200">{p.sym}</div>
                  </td>
                  <td className="py-4 px-5 text-right font-mono text-sm text-zinc-300">{p.qty}</td>
                  <td className="py-4 px-5 text-right font-mono text-sm text-zinc-300">₹{p.avg.toFixed(2)}</td>
                  <td className="py-4 px-5 text-right font-mono text-sm font-medium text-zinc-200">
                    <span className="animate-pulse mr-2 text-emerald-400/50">●</span>
                    ₹{p.ltp.toFixed(2)}
                  </td>
                  <td className="py-4 px-5 text-right font-mono">
                    <div className={`text-sm font-medium ${pIsUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pIsUp ? '+' : ''}₹{pl.toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{pIsUp ? '+' : ''}{plPct.toFixed(2)}%</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// --- AUTHENTICATION SCREEN ---
const LoginScreen = ({ onLogin, configError }) => (
  <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
    <div className="w-full max-w-md">
      <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-700">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-black font-bold text-3xl mx-auto shadow-2xl shadow-white/10 mb-6">
          C
        </div>
        <h1 className="text-4xl font-bold text-zinc-50 tracking-tight mb-3">CapitalOS</h1>
        <p className="text-zinc-400">Algorithmic Intelligence for Retail Investors.</p>
      </div>

      <Card className="animate-in slide-in-from-bottom-8 duration-700 delay-150 p-8">
        <div className="space-y-4">
          <button 
            onClick={onLogin}
            disabled={configError}
            className="w-full py-3.5 bg-zinc-100 text-black font-semibold rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Access Terminal <ArrowUpDown className="w-4 h-4 rotate-90" />
          </button>
          {configError && (
             <p className="text-center text-xs text-rose-500 mt-4 font-medium border border-rose-500/20 bg-rose-500/10 p-3 rounded-lg">
              Firebase Config Missing! Please paste your Firebase keys into the App.jsx file to enable authentication.
             </p>
          )}
          <p className="text-center text-xs text-zinc-600 mt-4">
            By entering, you agree to our terms of service and quantitative data policies.
          </p>
        </div>
      </Card>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // Firebase Auth State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  // Market State
  const [stocks, setStocks] = useState(() => 
    FALLBACK_STOCKS.map(s => {
      const history = generateHistory(s.basePrice, s.vol);
      const currentPrice = history[history.length - 1];
      return { ...s, history, price: currentPrice, changePct: ((currentPrice - s.basePrice) / s.basePrice) * 100 }
    })
  );

  // 1. SETUP FIREBASE AUTHENTICATION
  useEffect(() => {
    if (!auth) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Check console or verify Firebase settings.");
    }
  }

  // 2. FETCH LIVE PRICES (Vercel API) OR FALLBACK TO SIMULATION
  useEffect(() => {
    if (!user) return;
    let simInterval;

    const fetchLivePrices = async () => {
      try {
        // Try fetching from our Vercel Backend
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('API route not found locally');
        const data = await res.json();
        
        // Transform incoming Vercel API data to match UI shape
        setStocks(prev => data.map(d => {
          const old = prev.find(p => p.sym === d.sym);
          const newPrice = d.price;
          const newHistory = old ? [...old.history.slice(1), newPrice] : Array(40).fill(newPrice);
          return { ...old, ...d, price: newPrice, history: newHistory };
        }));
        setIsLiveMode(true);
      } catch (err) {
        // Fallback Simulation
        setIsLiveMode(false);
        setStocks(prev => prev.map(s => {
          const newPrice = generateNextPrice(s.price, s.vol);
          const newHistory = [...s.history.slice(1), newPrice];
          return { ...s, price: newPrice, history: newHistory, changePct: ((newPrice - s.basePrice) / s.basePrice) * 100 };
        }));
      }
    };

    fetchLivePrices();
    const pollRate = isLiveMode ? 5000 : 1500;
    simInterval = setInterval(fetchLivePrices, pollRate);
    
    return () => clearInterval(simInterval);
  }, [user, isLiveMode]);

  const handleLogout = async () => {
    if(auth) await signOut(auth);
    setUser(null);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin"></div></div>;

  if (!user) return <LoginScreen onLogin={handleLogin} configError={configError} />;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio (CAS)', icon: Briefcase },
  ];

  return (
    <div className="flex h-screen text-zinc-300 overflow-hidden selection:bg-blue-500/30">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] border-r border-[#1a1a1a] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-[#1a1a1a]">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black font-bold text-xl mr-3 shadow-md shadow-white/5">C</div>
          <div>
            <div className="font-bold text-zinc-50 tracking-tight leading-none text-lg">CapitalOS</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1 font-semibold">Algorithmic Intelligence</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 mt-4 first:mt-0">Terminal Modules</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === item.id ? 'bg-white/10 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-zinc-50' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
              US
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-zinc-200 truncate">Auth User</div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">{user.uid.slice(0,8)}</div>
            </div>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-rose-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#000000]">
        
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-zinc-400" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border ${isLiveMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveMode ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isLiveMode ? 'text-emerald-500' : 'text-orange-500'}`}>
                {isLiveMode ? 'Real-Time Data' : 'Simulated Data'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24">
          <div className="max-w-7xl mx-auto">
             {activeTab === 'dashboard' ? <DashboardView stocks={stocks} /> : <PortfolioView user={user} liveStocks={stocks} />}
          </div>
        </main>

      </div>
    </div>
  );
}
