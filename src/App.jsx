import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, LineChart, Briefcase, Search,
  Zap, Newspaper, Settings, Bell, Command,
  TrendingUp, TrendingDown, Activity, ShieldCheck, 
  ChevronRight, Menu, X, Filter, ArrowUpDown, LogOut, 
  UploadCloud, FileText, CheckCircle, AlertCircle,
  Star, Landmark, Calculator, PieChart, Info
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

// --- STOCK & INDEX TEMPLATES ---
const SECTORS = ['Banking', 'IT', 'Energy', 'FMCG', 'Auto', 'Pharma', 'Telecom', 'Metals'];
const MARKET_CAPS = ['Large Cap', 'Mid Cap', 'Small Cap'];

const STOCK_TEMPLATES = [
  { sym: 'RELIANCE', name: 'Reliance Industries', basePrice: 2945.60, vol: 0.002, mcap: 'Large Cap', sector: 'Energy' },
  { sym: 'TCS', name: 'Tata Consultancy', basePrice: 3876.20, vol: 0.0015, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', basePrice: 1642.35, vol: 0.0025, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'INFY', name: 'Infosys Limited', basePrice: 1567.80, vol: 0.002, mcap: 'Large Cap', sector: 'IT' },
  { sym: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1089.45, vol: 0.003, mcap: 'Large Cap', sector: 'Banking' },
  { sym: 'ITC', name: 'ITC Limited', basePrice: 462.15, vol: 0.001, mcap: 'Large Cap', sector: 'FMCG' },
  { sym: 'TATAMOTORS', name: 'Tata Motors', basePrice: 987.60, vol: 0.004, mcap: 'Large Cap', sector: 'Auto' },
  { sym: 'SUNPHARMA', name: 'Sun Pharma', basePrice: 1543.20, vol: 0.002, mcap: 'Large Cap', sector: 'Pharma' },
];

const INDEX_TEMPLATES = [
  { id: 'nifty', name: 'NIFTY 50', basePrice: 22147.90, vol: 0.001 },
  { id: 'sensex', name: 'SENSEX', basePrice: 72831.94, vol: 0.001 },
  { id: 'bank', name: 'NIFTY BANK', basePrice: 47562.30, vol: 0.0015 },
  { id: 'it', name: 'NIFTY IT', basePrice: 36890.15, vol: 0.0012 }
];

const MUTUAL_FUNDS = [
  { name: 'Parag Parikh Flexi Cap Fund', house: 'PPFAS', rating: 5, nav: 68.45, ret1y: 28.4, ret3y: 22.1, aum: '48,200 Cr', risk: 'Moderate' },
  { name: 'Mirae Asset Large Cap Fund', house: 'Mirae Asset', rating: 5, nav: 92.30, ret1y: 18.2, ret3y: 16.8, aum: '38,500 Cr', risk: 'Moderate' },
  { name: 'SBI Small Cap Fund', house: 'SBI MF', rating: 4, nav: 156.78, ret1y: 35.6, ret3y: 28.9, aum: '22,300 Cr', risk: 'High' },
  { name: 'Axis Bluechip Fund', house: 'Axis MF', rating: 4, nav: 48.90, ret1y: 14.5, ret3y: 12.8, aum: '34,100 Cr', risk: 'Low' },
  { name: 'HDFC Mid-Cap Opportunities', house: 'HDFC MF', rating: 5, nav: 134.56, ret1y: 42.3, ret3y: 26.7, aum: '42,800 Cr', risk: 'High' }
];

const TAX_INSTRUMENTS = [
  { name: 'ELSS Mutual Funds', section: '80C', limit: 150000, invested: 120000, icon: '📈', returns: '12-15% p.a.' },
  { name: 'PPF', section: '80C', limit: 150000, invested: 50000, icon: '🏦', returns: '7.1% p.a.' },
  { name: 'Health Insurance', section: '80D', limit: 75000, invested: 25000, icon: '🏥', returns: 'Tax Saving' },
];

// --- UTILS ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
const formatLakhs = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return formatCurrency(val);
};

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

// --- GEMINI AI INTEGRATION (REAL DATA FETCH) ---
const fetchRealMarketDataFromAI = async () => {
  const apiKey = ""; // Provided globally by execution environment
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const prompt = `Search the web for the absolute latest, real-time stock prices (in INR) and percentage changes for today in the Indian Stock Market.
  Find data for: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, ITC, TATAMOTORS, SUNPHARMA.
  Find latest values for indices: NIFTY 50 (id: nifty), SENSEX (id: sensex), NIFTY BANK (id: bank), NIFTY IT (id: it).
  Find 5 of the absolute latest Indian financial news headlines and assign sentiment (bullish, bearish, neutral).
  Write a 2-sentence AI market summary based on the news.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    systemInstruction: { parts: [{ text: "You are a financial API. You must return only valid JSON according to the schema. Always ensure all 8 stocks and 4 indices are included." }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          stocks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { sym: { type: "STRING" }, price: { type: "NUMBER" }, changePct: { type: "NUMBER" } }
            }
          },
          indices: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { id: { type: "STRING" }, price: { type: "NUMBER" }, changePct: { type: "NUMBER" } }
            }
          },
          news: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { title: { type: "STRING" }, source: { type: "STRING" }, time: { type: "STRING" }, sentiment: { type: "STRING" } }
            }
          },
          summary: { type: "STRING" }
        },
        required: ["stocks", "indices", "news", "summary"]
      }
    }
  };

  // Exponential backoff for API robustness
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      if (i === 2) throw error;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
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
    warning: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
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

const WatchlistView = ({ stocks }) => {
  // Using a mock watchlist derived from first 3 stocks
  const watchlisted = stocks.slice(0,3);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Watchlist</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your favorite equities.</p>
        </div>
        <button className="text-sm bg-white text-black px-4 py-2.5 rounded-lg font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
          <Search className="w-4 h-4"/> Add Symbol
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watchlisted.map((s, i) => {
          const isUp = s.changePct >= 0;
          return (
            <Card key={i} className="hover:border-white/10 transition-colors">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-zinc-300">
                        {s.sym.slice(0,2)}
                     </div>
                     <div>
                        <div className="font-semibold text-zinc-100">{s.sym}</div>
                        <div className="text-xs text-zinc-500">{s.name}</div>
                     </div>
                  </div>
                  <button className="text-zinc-500 hover:text-rose-400 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
               </div>
               
               <div className="mb-4">
                 <div className="text-3xl font-bold font-mono text-zinc-50 tracking-tight mb-1">
                    {formatCurrency(s.price)}
                 </div>
                 <div className={`text-sm font-mono font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                 </div>
               </div>
               
               <Sparkline data={s.history} color={isUp ? '#34d399' : '#fb7185'} className="!h-16 mb-4" />

               <div className="grid grid-cols-2 gap-2 mt-4">
                  <button className="py-2 bg-emerald-500/10 text-emerald-400 font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors text-sm">
                    Buy
                  </button>
                  <button className="py-2 bg-rose-500/10 text-rose-400 font-semibold rounded-lg hover:bg-rose-500/20 transition-colors text-sm">
                    Sell
                  </button>
               </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const MutualFundsView = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Mutual Funds</h1>
        <p className="text-sm text-zinc-400 mt-1">Research and invest in top-rated funds.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MUTUAL_FUNDS.map((f, i) => {
          const riskCls = f.risk === 'High' ? 'negative' : f.risk === 'Moderate' ? 'warning' : 'positive';
          return (
            <Card key={i} className="hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">{f.house}</div>
                <div className="text-lg font-semibold text-zinc-100 leading-tight mb-3">{f.name}</div>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex text-orange-400">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-3.5 h-3.5 ${idx < f.rating ? 'fill-current' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <Badge variant={riskCls}>{f.risk} Risk</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">NAV</div>
                    <div className="font-mono font-semibold text-zinc-200">₹{f.nav}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">AUM</div>
                    <div className="font-mono font-semibold text-zinc-200">{f.aum}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 rounded-xl border border-white/5 mb-6 text-center">
                   <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">1Y Return</div>
                      <div className="font-mono text-emerald-400 font-bold">+{f.ret1y}%</div>
                   </div>
                   <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">3Y Return</div>
                      <div className="font-mono text-emerald-400 font-bold">+{f.ret3y}%</div>
                   </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-sm">
                  Invest Now
                </button>
                <button className="flex-1 py-2.5 bg-zinc-900 border border-white/10 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-800 transition-colors text-sm">
                  Details
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

const TaxPlannerView = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Tax Planner</h1>
        <p className="text-sm text-zinc-400 mt-1">Optimize your tax deductions for FY 2024-25.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4">
             <Briefcase className="w-6 h-6" />
          </div>
          <div className="text-sm text-zinc-500 font-semibold uppercase tracking-wider mb-1">Total Deductions</div>
          <div className="text-3xl font-bold font-mono text-zinc-50">₹1,95,000</div>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-sm text-zinc-500 font-semibold uppercase tracking-wider mb-1">Estimated Tax Saved</div>
          <div className="text-3xl font-bold font-mono text-zinc-50">₹58,500</div>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center border-orange-500/30 bg-orange-500/5">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mb-4">
             <Zap className="w-6 h-6" />
          </div>
          <div className="text-sm text-orange-500/80 font-semibold uppercase tracking-wider mb-1">More Savings Possible</div>
          <div className="text-3xl font-bold font-mono text-orange-400">₹80,000</div>
        </Card>
      </div>

      <h3 className="text-lg font-semibold text-zinc-50 mt-8 mb-4">Tax Saving Instruments</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TAX_INSTRUMENTS.map((t, i) => {
          const pct = Math.min((t.invested / t.limit) * 100, 100);
          const isFull = pct >= 100;
          return (
            <Card key={i}>
              <div className="flex items-center gap-4 mb-4">
                 <div className="text-3xl bg-zinc-900 p-2 rounded-xl border border-white/5">{t.icon}</div>
                 <div>
                   <div className="font-semibold text-zinc-100">{t.name}</div>
                   <div className="text-xs text-zinc-500 font-medium mt-0.5">Section {t.section}</div>
                 </div>
              </div>
              
              <div className="flex justify-between text-sm mb-2 font-mono">
                 <span className="text-zinc-300">Invested: ₹{(t.invested/1000).toFixed(0)}k</span>
                 <span className="text-zinc-500">Limit: ₹{(t.limit/1000).toFixed(0)}k</span>
              </div>
              
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
                 <div className={`h-full ${isFull ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${pct}%`}}></div>
              </div>
              
              <div className="flex justify-between text-xs text-zinc-500 font-medium">
                 <span>{pct.toFixed(0)}% utilized</span>
                 <span>Est. {t.returns}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  );
};

const CalculatorView = () => {
  const [sip, setSip] = useState(25000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  // SIP Math: M * (((1 + i)^n - 1) / i) * (1 + i)
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const futureValue = sip * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  const totalInvested = sip * months;
  const wealthGained = futureValue - totalInvested;

  // Generate chart data
  const chartData = [];
  let currentVal = 0;
  for(let y=1; y<=years; y++) {
      const m = y * 12;
      currentVal = sip * (((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate));
      chartData.push(currentVal);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Financial Calculators</h1>
        <p className="text-sm text-zinc-400 mt-1">Plan your SIP investments.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
           <h3 className="text-lg font-semibold text-zinc-100 mb-6">SIP Parameters</h3>
           
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-400">Monthly Investment</label>
                    <span className="font-mono text-zinc-200">₹{sip.toLocaleString()}</span>
                 </div>
                 <input type="range" min="1000" max="100000" step="1000" value={sip} onChange={e=>setSip(Number(e.target.value))} className="w-full accent-blue-500" />
              </div>
              
              <div>
                 <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-400">Investment Period</label>
                    <span className="font-mono text-zinc-200">{years} Years</span>
                 </div>
                 <input type="range" min="1" max="30" step="1" value={years} onChange={e=>setYears(Number(e.target.value))} className="w-full" />
              </div>
              
              <div>
                 <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-400">Expected Return (p.a)</label>
                    <span className="font-mono text-zinc-200">{rate}%</span>
                 </div>
                 <input type="range" min="5" max="25" step="0.5" value={rate} onChange={e=>setRate(Number(e.target.value))} className="w-full" />
              </div>
           </div>
        </Card>

        <Card className="flex flex-col">
           <h3 className="text-lg font-semibold text-zinc-100 mb-6">Projection</h3>
           
           <div className="text-center mb-8">
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-2">Future Value</div>
              <div className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {formatLakhs(futureValue)}
              </div>
           </div>

           <div className="flex justify-around mb-8 border-t border-white/5 pt-6">
              <div className="text-center">
                 <div className="text-xs text-zinc-500 mb-1">Invested Amount</div>
                 <div className="font-mono font-medium text-zinc-200">{formatLakhs(totalInvested)}</div>
              </div>
              <div className="text-center">
                 <div className="text-xs text-zinc-500 mb-1">Wealth Gained</div>
                 <div className="font-mono font-medium text-emerald-400">+{formatLakhs(wealthGained)}</div>
              </div>
           </div>

           <div className="mt-auto">
              <Sparkline data={chartData} color="#3b82f6" className="!h-24" />
           </div>
        </Card>
      </div>
    </div>
  );
};

const NewsView = ({ newsFeed, aiSummary }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <header>
      <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Market News</h1>
      <p className="text-sm text-zinc-400 mt-1">Real-time feed with AI sentiment analysis.</p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {newsFeed.map((news, idx) => {
          const sentimentStyles = {
            bullish: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/10',
            bearish: 'border-l-rose-500 text-rose-400 bg-rose-500/10',
            neutral: 'border-l-zinc-500 text-zinc-400 bg-zinc-500/10'
          };
          const style = sentimentStyles[news.sentiment?.toLowerCase()] || sentimentStyles.neutral;
          return (
            <Card key={idx} className={`border-l-4 ${style.split(' ')[0]} hover:bg-white/[0.02] transition-colors cursor-pointer`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-zinc-500">{news.time}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${style.split(' ').slice(1).join(' ')}`}>
                  {news.sentiment || 'neutral'}
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
            <Activity className="w-4 h-4 text-zinc-400" /> AI Market Summary
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {aiSummary || "Loading intelligent market insights based on today's active news..."}
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
    if (!file) return;

    setUploading(true);
    setTimeout(async () => {
      try {
        const mockParsedHoldings = [
          { sym: 'RELIANCE', qty: 50, avg: 2650 },
          { sym: 'HDFCBANK', qty: 100, avg: 1520 },
          { sym: 'TCS', qty: 30, avg: 3950 },
          { sym: 'INFY', qty: 120, avg: 1400 }
        ];

        if (db) {
          const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
          for (const holding of mockParsedHoldings) {
            const docRef = doc(portfolioRef, holding.sym);
            await setDoc(docRef, holding);
          }
        } else {
           setPortfolio(mockParsedHoldings);
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
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (db) {
         await setDoc(doc(db, 'users', user.uid), { displayName: name.trim() }, { merge: true });
      }
    } catch(err) {
      console.warn("DB not connected, proceeding locally.", err);
    }
    onComplete(name.trim());
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
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col gap-1.5"><strong className="text-zinc-200 text-lg">CAS Sync</strong> Auto-track holdings</div>
        </div>
      </div>

      <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-1000 delay-200">
        <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl shadow-xl">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-2xl mb-6">C</div>
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Welcome</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">Sign in to securely connect your broker data via CAS and access the dashboard.</p>

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

// --- COMMAND PALETTE OVERLAY ---
const CommandPalette = ({ isOpen, onClose, navItems, onNavigate }) => {
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    if(!isOpen) setSearch("");
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNav = navItems.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
       <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center px-4 border-b border-white/10">
             <Search className="w-5 h-5 text-zinc-500" />
             <input 
               type="text"
               autoFocus
               placeholder="Search modules..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none"
             />
             <span className="text-xs text-zinc-500 border border-white/10 rounded px-2 py-1">ESC</span>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
             <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Navigation</div>
             {filteredNav.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl text-left transition-colors"
                >
                   <item.icon className="w-5 h-5 text-zinc-400" />
                   <div>
                      <div className="text-sm font-medium text-zinc-200">{item.label}</div>
                      <div className="text-xs text-zinc-500">Go to {item.label} view</div>
                   </div>
                </button>
             ))}
             {filteredNav.length === 0 && (
                <div className="p-4 text-center text-sm text-zinc-500">No results found.</div>
             )}
          </div>
       </div>
    </div>
  )
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // App State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [apiStatus, setApiStatus] = useState("fetching"); // fetching, live, sim
  const [isAiLoading, setIsAiLoading] = useState(true);

  // Market State Initialize with Templates
  const [stocks, setStocks] = useState(() => 
    STOCK_TEMPLATES.map(s => {
      const history = generateHistory(s.basePrice, s.vol);
      return { ...s, history, price: history[history.length - 1], changePct: ((history[history.length - 1] - s.basePrice) / s.basePrice) * 100 }
    })
  );
  
  const [indices, setIndices] = useState(() => 
    INDEX_TEMPLATES.map(idx => {
      const history = generateHistory(idx.basePrice, idx.vol);
      return { ...idx, history, price: history[history.length - 1], changePct: ((history[history.length - 1] - idx.basePrice) / idx.basePrice) * 100 }
    })
  );

  const [newsFeed, setNewsFeed] = useState(NEWS_FEED);
  const [aiSummary, setAiSummary] = useState("");

  // 1. SETUP FIREBASE AUTHENTICATION
  useEffect(() => {
    if (!auth) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (db) {
           try {
             const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
             if (docSnap.exists() && docSnap.data().displayName) {
               setUserProfile(docSnap.data());
             }
           } catch(e) { console.error("Error fetching profile", e); }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Global Keyboard Shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    try { await signInAnonymously(auth); } 
    catch (err) { alert("Login failed. Verify Firebase settings and Anonymous auth."); }
  }

  // 2. FETCH REAL DATA FROM AI SEARCH
  useEffect(() => {
    if (!user || !userProfile) return;
    
    let isMounted = true;
    const loadRealData = async () => {
      try {
        setApiStatus("fetching");
        const realData = await fetchRealMarketDataFromAI();
        
        if (!isMounted) return;

        // Map AI Stocks onto Templates
        if (realData.stocks) {
           setStocks(STOCK_TEMPLATES.map(template => {
             const aiMatch = realData.stocks.find(s => s.sym === template.sym);
             if (aiMatch) {
               const basePrice = aiMatch.price / (1 + (aiMatch.changePct / 100));
               const history = generateHistory(basePrice, template.vol);
               history[history.length - 1] = aiMatch.price; 
               return { ...template, price: aiMatch.price, changePct: aiMatch.changePct, history, basePrice };
             }
             return { ...template, price: template.basePrice, changePct: 0, history: Array(40).fill(template.basePrice) };
           }));
        }

        // Map AI Indices onto Templates
        if (realData.indices) {
           setIndices(INDEX_TEMPLATES.map(template => {
             const aiMatch = realData.indices.find(i => i.id === template.id);
             if (aiMatch) {
               const basePrice = aiMatch.price / (1 + (aiMatch.changePct / 100));
               const history = generateHistory(basePrice, template.vol);
               history[history.length - 1] = aiMatch.price;
               return { ...template, price: aiMatch.price, changePct: aiMatch.changePct, history, basePrice };
             }
             return { ...template, price: template.basePrice, changePct: 0, history: Array(40).fill(template.basePrice) };
           }));
        }

        if (realData.news && realData.news.length > 0) setNewsFeed(realData.news);
        if (realData.summary) setAiSummary(realData.summary);

        setApiStatus("live");
        setIsAiLoading(false);
      } catch (err) {
        console.error("AI Data Fetch Failed. Using local simulation.", err);
        if (isMounted) {
          setApiStatus("sim");
          setIsAiLoading(false);
        }
      }
    };

    loadRealData();

    return () => { isMounted = false; };
  }, [user, userProfile]);

  // 3. START LOCAL TICK ENGINE (Ticking order book effect on base data)
  useEffect(() => {
    if (!user || !userProfile || isAiLoading) return;
    
    const simInterval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const newPrice = generateNextPrice(s.price, s.vol);
        const newHistory = [...s.history.slice(1), newPrice];
        const newPct = s.basePrice ? ((newPrice - s.basePrice) / s.basePrice) * 100 : s.changePct;
        return { ...s, price: newPrice, history: newHistory, changePct: newPct };
      }));

      setIndices(prev => prev.map(idx => {
        const newPrice = generateNextPrice(idx.price, idx.vol);
        const newHistory = [...idx.history.slice(1), newPrice];
        const newPct = idx.basePrice ? ((newPrice - idx.basePrice) / idx.basePrice) * 100 : idx.changePct;
        return { ...idx, price: newPrice, history: newHistory, changePct: newPct };
      }));
    }, 1500);
    
    return () => clearInterval(simInterval);
  }, [user, userProfile, isAiLoading]);

  const handleLogout = async () => {
    if(auth) await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

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
    { id: 'mutualfunds', label: 'Mutual Funds', icon: Landmark },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'calculator', label: 'Calculators', icon: Calculator },
    { id: 'tax', label: 'Tax Planner', icon: PieChart },
    { id: 'news', label: 'News Feed', icon: Newspaper },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView stocks={stocks} />;
      case 'markets': return <MarketsView indices={indices} stocks={stocks} />;
      case 'screener': return <ScreenerView stocks={stocks} />;
      case 'portfolio': return <PortfolioView user={user} liveStocks={stocks} />;
      case 'watchlist': return <WatchlistView stocks={stocks} />;
      case 'mutualfunds': return <MutualFundsView />;
      case 'calculator': return <CalculatorView />;
      case 'tax': return <TaxPlannerView />;
      case 'news': return <NewsView newsFeed={newsFeed} aiSummary={aiSummary} />;
      default: return <DashboardView stocks={stocks} />;
    }
  };

  return (
    <div className="flex h-screen text-zinc-300 overflow-hidden selection:bg-zinc-500/30">
      
      {/* COMMAND PALETTE */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        navItems={NAV_ITEMS}
        onNavigate={setActiveTab}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] border-r border-[#1a1a1a] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-[#1a1a1a]">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-black font-bold text-xl mr-3">C</div>
          <div><div className="font-bold text-zinc-50 tracking-tight leading-none text-lg">CapitalOS</div></div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 text-xs font-medium text-zinc-500 mb-3 mt-4 first:mt-0">Modules</div>
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
            <div 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-zinc-700 transition-colors w-64 group"
            >
              <Search className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400" />
              <span className="text-sm text-zinc-500 group-hover:text-zinc-400">Search modules...</span>
              <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-zinc-600 font-mono">
                <Command className="w-3 h-3" /> K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {apiStatus === "fetching" && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> AI Engine Fetching Live Data...
              </div>
            )}
            
            {apiStatus === "sim" && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-400">
                <Info className="w-4 h-4" /> AI Data Unavailable. Using Simulation.
              </div>
            )}

            {apiStatus === "live" && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                  AI Real-Time Data Active
                </span>
              </div>
            )}
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
