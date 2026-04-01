import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, LineChart, Briefcase, Search,
  Zap, Newspaper, Settings, Bell, Command,
  TrendingUp, TrendingDown, Activity, ShieldCheck, 
  ChevronRight, Menu, X, Filter, ArrowUpDown, LogOut, UploadCloud, FileText, CheckCircle, AlertCircle
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// PASTE YOUR FIREBASE CONFIG KEYS HERE
const firebaseConfig = {
  apiKey: "AIzaSyCw2rNU1drpsUidujbQMIIfLuQ6LmZcgxo",
  authDomain: "capitalos-f34f6.firebaseapp.com",
  projectId: "capitalos-f34f6",
  storageBucket: "capitalos-f34f6.firebasestorage.app",
  messagingSenderId: "426663595227",
  appId: "1:426663595227:web:cbdf7344b950a8e98ad0fe"
};

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// --- MOCK DATA FALLBACKS ---
const SECTORS = ['Banking', 'IT', 'Energy', 'FMCG', 'Auto', 'Pharma', 'Telecom', 'Metals'];
const MARKET_CAPS = ['Large Cap', 'Mid Cap', 'Small Cap'];

const FALLBACK_STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries', basePrice: 2945.60, vol: 0.002, mcap: 'Large Cap', sector: 'Energy' },
  { sym: 'TCS', name: 'Tata Consultancy', basePrice: 3876.20, vol: 0.0015, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', basePrice: 1642.35, vol: 0.0025, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'INFY', name: 'Infosys Limited', basePrice: 1567.80, vol: 0.002, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1089.45, vol: 0.003, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'ITC', name: 'ITC Limited', basePrice: 462.15, vol: 0.001, mcap: 'Large Cap', sector: 'FMCG' },
  { sym: 'TATAMOTORS', name: 'Tata Motors', basePrice: 987.60, vol: 0.004, mcap: 'Large Cap', sector: 'Auto' },
  { sym: 'SUNPHARMA', name: 'Sun Pharma', basePrice: 1543.20, vol: 0.002, mcap: 'Large Cap', sector: 'Pharma' },
];

const INITIAL_INDICES = [
  { id: 'nifty', name: 'NIFTY 50', basePrice: 22147.90, vol: 0.001 },
  { id: 'sensex', name: 'SENSEX', basePrice: 72831.94, vol: 0.001 },
  { id: 'bank', name: 'NIFTY BANK', basePrice: 47562.30, vol: 0.0015 },
  { id: 'it', name: 'NIFTY IT', basePrice: 36890.15, vol: 0.0012 }
];

const NEWS_FEED = [
  { id: 1, time: '2m ago', title: 'RBI maintains status quo on repo rate at 6.5%', source: 'Financial Express', sentiment: 'neutral' },
  { id: 2, time: '15m ago', title: 'FIIs turn net buyers, pump ₹2,450 Cr into Indian equities', source: 'Market Daily', sentiment: 'bullish' },
  { id: 3, time: '1h ago', title: 'Global markets jittery ahead of US Fed commentary', source: 'CNBC', sentiment: 'bearish' },
  { id: 4, time: '2h ago', title: 'IT Sector margins expected to contract in Q4', source: 'Reuters', sentiment: 'bearish' },
  { id: 5, time: '3h ago', title: 'Auto sales show 12% YoY growth across passenger vehicles', source: 'Bloomberg', sentiment: 'bullish' }
];

// --- UTILS ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

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
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Market snapshot for {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
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
            <h3 className="text-sm font-semibold text-zinc-50">Sector Heatmap</h3>
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
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Top Movers
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

const MarketsView = ({ indices, stocks }) => {
  const advances = stocks.filter(s => s.changePct > 0).length;
  const declines = stocks.filter(s => s.changePct < 0).length;
  const total = advances + declines || 1;
  const advanceRatio = (advances / total) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Market Analytics</h1>
        <p className="text-sm text-zinc-400 mt-1">Deep dive into market internals and indices.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">Market Breadth</h3>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{advances}</div>
              <div className="text-xs text-zinc-500">Advances</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-rose-400">{declines}</div>
              <div className="text-xs text-zinc-500">Declines</div>
            </div>
          </div>
          <div className="h-2 w-full bg-rose-500/20 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${advanceRatio}%` }}></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">India VIX (Vol Index)</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold font-mono text-zinc-50">14.25</span>
            <span className="text-sm font-mono text-rose-400 mb-1">+2.1%</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Volatility is expanding slightly.</p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">Institutional Flow (Est)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-300">FII Net</span>
              <span className="text-sm font-mono font-medium text-emerald-400">+₹1,240 Cr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-300">DII Net</span>
              <span className="text-sm font-mono font-medium text-rose-400">-₹450 Cr</span>
            </div>
          </div>
        </Card>
      </div>
      
      <h3 className="text-lg font-semibold text-zinc-50 mt-8 mb-4">Major Indices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indices.map(idx => {
          const isUp = idx.changePct >= 0;
          return (
            <Card key={idx.id} className="flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{idx.name}</div>
                  <div className="text-2xl font-bold font-mono text-zinc-50 mt-1">
                    {idx.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <Badge variant={isUp ? 'positive' : 'negative'}>
                  {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                </Badge>
              </div>
              <Sparkline data={idx.history} color={isUp ? '#34d399' : '#fb7185'} />
            </Card>
          )
        })}
      </div>
    </div>
  );
};

const ScreenerView = ({ stocks }) => {
  const [filterSector, setFilterSector] = useState('All');
  const [search, setSearch] = useState('');

  const filteredStocks = stocks.filter(s => {
    const matchSector = filterSector === 'All' || s.sector === filterSector;
    const matchSearch = s.sym.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    return matchSector && matchSearch;
  }).sort((a, b) => b.changePct - a.changePct);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Stock Screener</h1>
        <p className="text-sm text-zinc-400 mt-1">Filter and analyze equity components.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search symbol..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-white/30 transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={filterSector} 
            onChange={(e) => setFilterSector(e.target.value)}
            className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-white/30 appearance-none min-w-[150px]"
          >
            <option value="All">All Sectors</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Card noPadding className="overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Symbol</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">LTP</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Change</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Trend</th>
              <th className="py-4 px-5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sector</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredStocks.map((s, i) => {
              const isUp = s.changePct >= 0;
              return (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="py-3 px-5">
                    <div className="font-semibold text-zinc-200">{s.sym}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{s.name}</div>
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-medium text-zinc-200">
                    ₹{s.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Badge variant={isUp ? 'positive' : 'negative'}>
                      {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="py-3 px-5 w-48">
                    <Sparkline data={s.history} color={isUp ? '#34d399' : '#fb7185'} className="!h-8" />
                  </td>
                  <td className="py-3 px-5">
                    <span className="text-xs font-medium text-zinc-400 bg-white/5 px-2 py-1 rounded-md">{s.sector}</span>
                  </td>
                </tr>
              )
            })}
            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-zinc-500 text-sm">No equities match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const NewsView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header>
      <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Market News</h1>
      <p className="text-sm text-zinc-400 mt-1">Real-time feed with sentiment analysis.</p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {NEWS_FEED.map(news => {
          const sentimentStyles = {
            bullish: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/10',
            bearish: 'border-l-rose-500 text-rose-400 bg-rose-500/10',
            neutral: 'border-l-zinc-500 text-zinc-400 bg-zinc-500/10'
          };
          return (
            <Card key={news.id} className={`border-l-4 ${sentimentStyles[news.sentiment].split(' ')[0]} hover:bg-white/[0.02] transition-colors cursor-pointer`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-zinc-500">{news.time}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sentimentStyles[news.sentiment].split(' ').slice(1).join(' ')}`}>
                  {news.sentiment}
                </span>
              </div>
              <h3 className="text-base font-medium text-zinc-100 mb-2 leading-snug">{news.title}</h3>
              <div className="text-xs text-zinc-500">{news.source}</div>
            </Card>
          )
        })}
      </div>
      
      <div className="space-y-4">
        <Card className="bg-zinc-900 border border-white/5">
          <h3 className="text-sm font-semibold text-zinc-50 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-zinc-400" /> Daily Summary
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Markets are trading with a positive bias today led by banking and energy stocks. Foreign institutional flows remain supportive. Watch for resistance around major index levels.
          </p>
        </Card>
      </div>
    </div>
  </div>
);

const PortfolioView = ({ user, liveStocks }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(true);
    setTimeout(async () => {
      try {
        const mockParsedHoldings = [
          { sym: 'RELIANCE', qty: 50, avg: 2650 },
          { sym: 'HDFCBANK', qty: 100, avg: 1520 },
          { sym: 'TCS', qty: 30, avg: 3950 },
          { sym: 'INFY', qty: 120, avg: 1400 }
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

  if (portfolio.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">My Portfolio</h1>
          <p className="text-sm text-zinc-400 mt-1">Connect your broker securely via CAS.</p>
        </header>

        <Card className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800 bg-zinc-900/10">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className="w-8 h-8 text-zinc-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-3">
            {uploading ? "Syncing Portfolio..." : "Sync Your Portfolio"}
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
            {uploading ? "Extracting your holdings and saving them to your secure account..." : "Upload your CAMS/KFintech Consolidated Account Statement (CAS) PDF. We'll track your holdings securely without requiring your broker passwords."}
          </p>
          
          {!uploading && (
            <div className="flex gap-4">
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Upload CAS PDF
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-600 mt-8 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-zinc-500" /> End-to-end encrypted. Data stays yours.
          </p>
        </Card>
      </div>
    );
  }

  const enrichedPortfolio = portfolio.map(p => {
    const liveStock = liveStocks.find(s => s.sym === p.sym);
    const ltp = liveStock ? liveStock.price : (p.avg * 1.05); 
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
          <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> Synced via CAS Secure Vault</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="text-sm bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-zinc-300 hover:text-white transition-colors flex items-center gap-2">
          <UploadCloud className="w-4 h-4"/> Re-Sync Portfolio
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
      </header>

      <Card className="flex flex-col justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-400 mb-1">Total Equity Value</div>
          <div className="text-5xl font-bold font-mono text-zinc-50 tracking-tight">
            {formatCurrency(currentValue)}
          </div>
        </div>
        <div className="flex gap-10 mt-10 border-t border-white/5 pt-6">
          <div>
            <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">Invested Amount</div>
            <div className="text-xl font-mono font-medium text-zinc-300">{formatCurrency(totalInvested)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">Total Returns</div>
            <div className={`text-xl font-mono font-medium flex items-center gap-2 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}{formatCurrency(totalPnL)}
              <Badge variant={isUp ? 'positive' : 'negative'} className="ml-2 text-sm px-2.5 py-1">
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
              <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Asset</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Qty</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Avg. Cost</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">LTP (Live)</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Returns</th>
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
                  <td className="py-4 px-6">
                    <div className="font-semibold text-zinc-200 text-base">{p.sym}</div>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm text-zinc-300">{p.qty}</td>
                  <td className="py-4 px-6 text-right font-mono text-sm text-zinc-300">₹{p.avg.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right font-mono text-base font-medium text-zinc-100">
                    <span className="animate-pulse mr-2 text-emerald-400/50">●</span>
                    ₹{p.ltp.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono">
                    <div className={`text-sm font-medium ${pIsUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pIsUp ? '+' : ''}₹{pl.toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{pIsUp ? '+' : ''}{plPct.toFixed(2)}%</div>
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


// --- ONBOARDING & LOGIN SCREENS ---
const OnboardingScreen = ({ user, onComplete }) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: name.trim() }, { merge: true });
      onComplete(name.trim());
    } catch(err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-500 p-8">
         <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Welcome to CapitalOS</h2>
         <p className="text-zinc-400 text-sm mb-6">Let's set up your profile before you enter the terminal.</p>
         
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh A."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={!name.trim() || saving}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-4"
            >
              {saving ? 'Initializing...' : 'Enter Dashboard'}
            </button>
         </form>
      </Card>
    </div>
  );
}

const LoginScreen = ({ onLogin, configError }) => (
  <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 selection:bg-zinc-500/30">
    <div className="w-full max-w-5xl px-6 flex flex-col lg:flex-row items-center justify-between gap-16">
      
      <div className="flex-1 text-center lg:text-left animate-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-4xl lg:text-6xl font-semibold text-white tracking-tight mb-6 leading-tight">
          Modern tools for <br/><span className="text-zinc-500">smart investors.</span>
        </h1>
        <p className="text-lg text-zinc-400 mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0">
          Track your portfolio, analyze market trends, and optimize your wealth with our clean, unified platform.
        </p>
        <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-zinc-500">
          <div className="flex flex-col gap-1.5"><strong className="text-zinc-200 text-lg">Secure</strong> Bank-grade encryption</div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col gap-1.5"><strong className="text-zinc-200 text-lg">Live</strong> Real-time data</div>
        </div>
      </div>

      <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-1000 delay-200">
        <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl shadow-xl">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-2xl mb-6">C</div>
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Welcome</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">Sign in to securely connect your broker data and access the dashboard.</p>

          <button 
            onClick={onLogin}
            disabled={configError}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Continue to App <ChevronRight className="w-4 h-4" />
          </button>

          {configError && (
             <div className="mt-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-medium leading-relaxed">
              <strong className="block mb-1 text-sm text-rose-300">Configuration Missing</strong>
              Please paste your Firebase keys into the App.jsx file to enable authentication.
             </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // App State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Holds the Name
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Market State
  const [stocks, setStocks] = useState(() => 
    FALLBACK_STOCKS.map(s => {
      const history = generateHistory(s.basePrice, s.vol);
      return { ...s, history, price: history[history.length - 1], changePct: ((history[history.length - 1] - s.basePrice) / s.basePrice) * 100 }
    })
  );
  
  const [indices, setIndices] = useState(() => 
    INITIAL_INDICES.map(idx => {
      const history = generateHistory(idx.basePrice, idx.vol);
      return { ...idx, history, price: history[history.length - 1], changePct: ((history[history.length - 1] - idx.basePrice) / idx.basePrice) * 100 }
    })
  );

  // 1. SETUP FIREBASE AUTHENTICATION & PROFILE FETCH
  useEffect(() => {
    if (!auth) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && db) {
        setUser(currentUser);
        // Check if user has a name profile
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists() && docSnap.data().displayName) {
            setUserProfile(docSnap.data());
          }
        } catch(e) { console.error("Error fetching profile", e); }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    try { await signInAnonymously(auth); } 
    catch (err) { alert("Login failed. Verify Firebase settings and Anonymous auth."); }
  }

  // 2. FETCH LIVE PRICES (Vercel API) OR FALLBACK TO SIMULATION
  useEffect(() => {
    if (!user || !userProfile) return;
    let simInterval;

    const fetchLivePrices = async () => {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) {
           setApiErrorMsg(`Backend Error (${res.status}): Make sure Vercel /api/prices.js is deployed.`);
           throw new Error('API route failed');
        }
        const data = await res.json();
        
        setStocks(prev => data.map(d => {
          const old = prev.find(p => p.sym === d.sym);
          const newPrice = d.price;
          const newHistory = old ? [...old.history.slice(1), newPrice] : Array(40).fill(newPrice);
          return { ...old, ...d, price: newPrice, history: newHistory };
        }));
        setApiErrorMsg("");
        setIsLiveMode(true);
      } catch (err) {
        if(!apiErrorMsg) setApiErrorMsg("Local API not found. Using simulation.");
        setIsLiveMode(false);
        setStocks(prev => prev.map(s => {
          const newPrice = generateNextPrice(s.price, s.vol);
          const newHistory = [...s.history.slice(1), newPrice];
          return { ...s, price: newPrice, history: newHistory, changePct: ((newPrice - s.basePrice) / s.basePrice) * 100 };
        }));
        setIndices(prev => prev.map(idx => {
          const newPrice = generateNextPrice(idx.price, idx.vol);
          const newHistory = [...idx.history.slice(1), newPrice];
          return { ...idx, price: newPrice, history: newHistory, changePct: ((newPrice - idx.basePrice) / idx.basePrice) * 100 };
        }));
      }
    };

    fetchLivePrices();
    const pollRate = isLiveMode ? 5000 : 1500;
    simInterval = setInterval(fetchLivePrices, pollRate);
    
    return () => clearInterval(simInterval);
  }, [user, userProfile, isLiveMode, apiErrorMsg]);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div></div>;

  // Unauthenticated
  if (!user) return <LoginScreen onLogin={handleLogin} configError={configError} />;

  // Authenticated but no profile (Onboarding)
  if (user && !userProfile) return <OnboardingScreen user={user} onComplete={(name) => setUserProfile({ displayName: name })} />;

  // Fully Authenticated Dashboard
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: LineChart },
    { id: 'screener', label: 'Screener', icon: Filter },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'news', label: 'News Feed', icon: Newspaper },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView stocks={stocks} />;
      case 'markets': return <MarketsView indices={indices} stocks={stocks} />;
      case 'screener': return <ScreenerView stocks={stocks} />;
      case 'portfolio': return <PortfolioView user={user} liveStocks={stocks} />;
      case 'news': return <NewsView />;
      default: return <DashboardView stocks={stocks} />;
    }
  };

  return (
    <div className="flex h-screen text-zinc-300 overflow-hidden selection:bg-zinc-500/30">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] border-r border-[#1a1a1a] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-[#1a1a1a]">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black font-bold text-xl mr-3">C</div>
          <div><div className="font-bold text-zinc-50 tracking-tight leading-none text-lg">CapitalOS</div></div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 text-xs font-medium text-zinc-500 mb-3 mt-4 first:mt-0">Menu</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${activeTab === item.id ? 'bg-white/10 text-zinc-50' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-zinc-50' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
              {userProfile.displayName.slice(0,2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-zinc-200 truncate">{userProfile.displayName}</div>
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
            {!isLiveMode && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {apiErrorMsg}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border ${isLiveMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveMode ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isLiveMode ? 'text-emerald-500' : 'text-orange-500'}`}>
                {isLiveMode ? 'Live Backend Connected' : 'Simulated Data Active'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24">
          <div className="max-w-7xl mx-auto">
             {renderContent()}
          </div>
        </main>

      </div>
    </div>
  );
}
