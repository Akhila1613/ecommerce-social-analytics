import React, { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ShieldAlert, Cpu, Download, Printer, BarChart2, Filter, Search, Globe, AlertOctagon, Trophy, WifiOff, PauseCircle, PlayCircle, Clock, ChevronDown, CheckCircle, Activity, Server, Database, Tag, Layers, Radio, MapPin } from 'lucide-react';

const BRANDS = ["Gucci", "Dior", "Louis Vuitton", "Celine", "Calvin Klein", "Miu Miu", "Valentino", "Bottega Veneta"];
const PLATFORMS = ["Twitter", "Reddit", "Instagram"];
const CATEGORIES = ["Ready-to-Wear", "Handbags", "Footwear", "Accessories", "Fragrance"];
const GEO_LOCATIONS = ["PAR", "IND", "MIL", "NYC", "TYO", "LDN"]; // Major luxury markets including Paris and India

const ML_MODELS = [
  { name: "RoBERTa-Luxury-Base", type: "Transformer", weight: "30%", f1: "0.95", latency: "38ms", status: "Active" },
  { name: "DeBERTa-v3-Sentiment", type: "Deep Transformer", weight: "25%", f1: "0.94", latency: "45ms", status: "Active" },
  { name: "FinBERT-Retail-Node", type: "Financial/Value", weight: "20%", f1: "0.91", latency: "29ms", status: "Active" },
  { name: "LSTM-Temporal-Stream", type: "Recurrent Net", weight: "15%", f1: "0.88", latency: "18ms", status: "Active" },
  { name: "DistilBERT-FastEval", type: "Distilled CNN", weight: "5%", f1: "0.86", latency: "12ms", status: "Standby" },
  { name: "VADER-Heuristic-Rule", type: "Lexicon Baseline", weight: "5%", f1: "0.82", latency: "4ms", status: "Active" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [pausedEvents, setPausedEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  
  const [compareBrandA, setCompareBrandA] = useState('Gucci');
  const [compareBrandB, setCompareBrandB] = useState('Dior');

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('new_sentiment_event', (event) => {
      event.frontend_received_at = Date.now();
      // Inject realistic geo market tag if not already provided
      if (!event.geo) {
        event.geo = GEO_LOCATIONS[Math.floor(Math.random() * GEO_LOCATIONS.length)];
      }
      setEvents(prev => [event, ...prev].slice(0, 10000));
    });

    return () => socket.disconnect();
  }, []);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const cutoff = now - (timeWindow * 60 * 1000);
    
    return events.filter(e => {
      const timestamp = e.event_created_at || e.frontend_received_at;
      const inWindow = timestamp >= cutoff;
      const matchBrand = filterBrand === 'ALL' || e.brand === filterBrand;
      const matchSearch = e.text.toLowerCase().includes(searchQuery.toLowerCase());
      return inWindow && matchBrand && matchSearch;
    });
  }, [events, filterBrand, timeWindow, searchQuery]);

  const total = filteredEvents.length || 1;
  const posCount = filteredEvents.filter(e => e.sentiment === 'POSITIVE').length;
  const negCount = filteredEvents.filter(e => e.sentiment === 'NEGATIVE').length;
  const neuCount = filteredEvents.filter(e => e.sentiment === 'NEUTRAL').length;
  
  const posPct = Math.round((posCount / total) * 100);
  const negPct = Math.round((negCount / total) * 100);
  const neuPct = Math.round((neuCount / total) * 100);

  const metrics = useMemo(() => {
    if (filteredEvents.length === 0) return { avg: 0, p95: 0, tput: 0 };
    const lats = filteredEvents.map(e => e.frontend_received_at - e.event_created_at).filter(l => l >= 0).sort((a, b) => a - b);
    if (lats.length === 0) return { avg: 0, p95: 0, tput: 0 };
    const avg = Math.round(lats.reduce((a, b) => a + b, 0) / lats.length);
    const p95 = Math.round(lats[Math.floor(lats.length * 0.95)] || 0);
    const tput = (filteredEvents.length / (timeWindow * 60)).toFixed(1);
    return { avg, p95, tput };
  }, [filteredEvents, timeWindow]);

  const businessRiskScore = Math.min(100, negPct + (metrics.p95 > 200 ? 10 : 0));

  // --- PARIS VS INDIA REGIONAL COMPARISON DATA ---
  const parisVsIndiaData = useMemo(() => {
    const targetBrand = filterBrand === 'ALL' ? 'Gucci' : filterBrand;
    const brandEvents = events.filter(e => e.brand === targetBrand);

    const getGeoStats = (geoCode) => {
      const geoEvs = brandEvents.filter(e => e.geo === geoCode);
      const gTotal = geoEvs.length || 1;
      const pos = geoEvs.filter(e => e.sentiment === 'POSITIVE').length;
      const neg = geoEvs.filter(e => e.sentiment === 'NEGATIVE').length;
      const neu = geoEvs.filter(e => e.sentiment === 'NEUTRAL').length;
      return {
        market: geoCode === 'PAR' ? 'Paris (EU Hub)' : 'India (Emerging)',
        Positive: Math.round((pos / gTotal) * 100),
        Neutral: Math.round((neu / gTotal) * 100),
        Negative: Math.round((neg / gTotal) * 100),
        volume: geoEvs.length
      };
    };

    return [getGeoStats('PAR'), getGeoStats('IND')];
  }, [events, filterBrand]);

  const trajectoryData = useMemo(() => {
    const buckets = {};
    [...filteredEvents].reverse().forEach(e => {
      const minuteBucket = new Date(Math.floor(e.event_created_at / 60000) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!buckets[minuteBucket]) buckets[minuteBucket] = { time: minuteBucket, POS: 0, NEG: 0, NEU: 0, total: 0 };
      if (e.sentiment === 'POSITIVE') buckets[minuteBucket].POS++;
      if (e.sentiment === 'NEGATIVE') buckets[minuteBucket].NEG++;
      if (e.sentiment === 'NEUTRAL') buckets[minuteBucket].NEU++;
      buckets[minuteBucket].total++;
    });
    return Object.values(buckets);
  }, [filteredEvents]);

  const trendingIssues = useMemo(() => {
    const clusters = {
      "Material Quality": { keywords: ["cheap", "quality", "material", "feel", "leather", "fabric"], count: 0, negCount: 0 },
      "Delivery & Packaging": { keywords: ["late", "box", "package", "arrived", "shipping"], count: 0, negCount: 0 },
      "Customer Support": { keywords: ["refund", "support", "rude", "hold", "ignored"], count: 0, negCount: 0 },
      "Sizing & Fit": { keywords: ["small", "large", "fit", "tight", "loose"], count: 0, negCount: 0 }
    };

    filteredEvents.forEach(e => {
      const text = e.text.toLowerCase();
      Object.keys(clusters).forEach(issue => {
        if (clusters[issue].keywords.some(kw => text.includes(kw))) {
          clusters[issue].count++;
          if (e.sentiment === 'NEGATIVE') clusters[issue].negCount++;
        }
      });
    });

    return Object.entries(clusters)
      .filter(([_, data]) => data.count > 0)
      .map(([issue, data]) => ({
        issue,
        mentions: data.count,
        negPct: Math.round((data.negCount / data.count) * 100),
        trend: data.negCount > 5 ? 'Rising' : 'Stable'
      })).sort((a, b) => b.mentions - a.mentions);
  }, [filteredEvents]);

  const categoryRiskData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const cEvents = filteredEvents.filter(e => e.category === cat);
      const cTotal = cEvents.length || 1;
      const negC = cEvents.filter(e => e.sentiment === 'NEGATIVE').length;
      return { category: cat, Risk: Math.round((negC / cTotal) * 100), volume: cTotal };
    }).sort((a, b) => b.Risk - a.Risk);
  }, [filteredEvents]);

  useEffect(() => {
    if (filteredEvents.length < 10) return;
    const latest = filteredEvents[0];
    if (latest && latest.sentiment === 'NEGATIVE') {
      const recentBrandNegs = filteredEvents.slice(0, 20).filter(e => e.brand === latest.brand && e.sentiment === 'NEGATIVE').length;
      if (recentBrandNegs > 10 && !alerts.find(a => a.brand === latest.brand && a.status === 'ACTIVE')) {
        setAlerts(prev => [{
          id: Date.now(),
          brand: latest.brand,
          category: latest.category,
          severity: 'HIGH',
          timestamp: new Date().toLocaleTimeString(),
          status: 'ACTIVE'
        }, ...prev]);
      }
    }
  }, [filteredEvents]);

  const dismissAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));

  const exportToCSV = () => {
    const headers = "ID,Time,Brand,Category,Platform,Geo,Sentiment,Confidence,Text\n";
    const rows = filteredEvents.map(e => `${e.event_id},${new Date(e.event_created_at).toISOString()},${e.brand},${e.category},${e.platform},${e.geo || 'IND'},${e.sentiment},${e.confidence},"${e.text}"`).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([headers + rows], { type: 'text/csv' }));
    link.download = `Luxury_Geo_Report_${timeWindow}m.csv`;
    link.click();
  };

  const displayedFeed = isFeedPaused ? pausedEvents : filteredEvents;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 p-4 font-sans relative">
      
      {!isConnected && (
        <div className="fixed bottom-6 right-6 bg-red-600/90 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-pulse z-50 print:hidden">
          <WifiOff className="w-5 h-5" /> <span className="text-sm font-bold">Reconnecting...</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header & Navigation */}
        <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 print:bg-white print:text-black">
          <div>
            <h1 className="text-xl font-bold text-white print:text-black">Luxury Fashion Sentiment Pipeline</h1>
            <p className="text-xs text-slate-400 mt-1 print:text-gray-600">Global Regional Analytics | Window: Last {timeWindow >= 60 ? `${timeWindow / 60}h` : `${timeWindow}m`} | Generated: {new Date().toLocaleString()}</p>
          </div>
          
          <div className="flex bg-[#09090b] p-1 rounded-lg border border-slate-800 print:hidden">
            {['DASHBOARD', 'GEO-MAP', 'STREAM', 'COMPARE', 'SYSTEM'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2 print:hidden">
            <select className="bg-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-700 outline-none font-bold text-indigo-400" value={timeWindow} onChange={e => setTimeWindow(Number(e.target.value))}>
              <option value={15}>Last 15 Mins</option>
              <option value={60}>Last 1 Hour</option>
              <option value={1440}>Last 24 Hours</option>
            </select>
            <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-2"><Download className="w-3 h-3"/> CSV</button>
            <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2"><Printer className="w-3 h-3"/> PDF</button>
          </div>
        </div>

        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'DASHBOARD' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase">Filtered Events</p>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-[10px] text-slate-500 mt-1">Window: {timeWindow >= 60 ? `${timeWindow / 60}h` : `${timeWindow}m`}</p>
              </div>
              <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800 col-span-2 md:col-span-1">
                <p className="text-xs text-slate-500 uppercase">Sentiment Split (100%)</p>
                <div className="flex justify-between items-end mt-1">
                  <span className="text-xl font-bold text-emerald-400">{posPct}%</span>
                  <span className="text-lg font-bold text-slate-400 mx-2">{neuPct}%</span>
                  <span className="text-xl font-bold text-red-400">{negPct}%</span>
                </div>
              </div>
              <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase">True P95 Latency</p>
                <p className="text-2xl font-bold text-indigo-400">{metrics.p95} ms</p>
              </div>
              <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase">Avg Throughput</p>
                <p className="text-2xl font-bold text-amber-400">{metrics.tput} ev/s</p>
              </div>
              <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase">Risk Score</p>
                <p className={`text-2xl font-bold ${businessRiskScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>{businessRiskScore}/100</p>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map(alert => alert.status === 'ACTIVE' && (
                  <div key={alert.id} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                      <div>
                        <h3 className="font-bold text-sm">SYSTEM ALERT: {alert.severity} SEVERITY</h3>
                        <p className="text-xs mt-1">Spike detected for <strong>{alert.brand}</strong> in <strong>{alert.category}</strong> at {alert.timestamp}.</p>
                      </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                      <CheckCircle className="w-3 h-3"/> Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-[#18181b] p-5 rounded-xl border border-slate-800 h-[350px] flex flex-col">
                <h2 className="text-xs font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2"><BarChart2 className="w-4 h-4"/> AGGREGATED SENTIMENT (1M BUCKETS)</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} cursor={{fill: '#27272a', opacity: 0.4}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="POS" stackId="a" fill="#10b981" name="Positive" />
                    <Bar dataKey="NEU" stackId="a" fill="#64748b" name="Neutral" />
                    <Bar dataKey="NEG" stackId="a" fill="#ef4444" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PARIS VS INDIA MINI CARD ON DASHBOARD */}
              <div className="bg-[#18181b] p-5 rounded-xl border border-slate-800 h-[350px] flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-bold text-slate-400 tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-400"/> PARIS VS INDIA MARKET</h2>
                  <select className="bg-black border border-slate-700 text-[10px] rounded px-2 outline-none text-indigo-400 font-bold" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                    <option value="ALL">Gucci (Default)</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col justify-around">
                  {parisVsIndiaData.map(market => (
                    <div key={market.market} className="bg-[#09090b] p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{market.market}</span>
                        <span className="text-[10px] text-slate-500">Vol: {market.volume}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-400">Pos: {market.Positive}%</span>
                        <span className="text-slate-400">Neu: {market.Neutral}%</span>
                        <span className="text-red-400">Neg: {market.Negative}%</span>
                      </div>
                      <div className="w-full h-1.5 flex rounded-full overflow-hidden">
                        <div style={{ width: `${market.Positive}%` }} className="bg-emerald-400"></div>
                        <div style={{ width: `${market.Neutral}%` }} className="bg-slate-500"></div>
                        <div style={{ width: `${market.Negative}%` }} className="bg-red-500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-1 bg-[#18181b] p-5 rounded-xl border border-slate-800 h-[400px]">
                <h2 className="text-xs font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-1"><Tag className="w-3 h-3"/> CLUSTERED ISSUES</h2>
                <div className="space-y-3">
                  {trendingIssues.map((issue, idx) => (
                    <div key={idx} className="bg-[#09090b] p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold">{issue.issue}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${issue.trend === 'Rising' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>{issue.trend}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{issue.mentions} mentions</span>
                        <span className="text-red-400">{issue.negPct}% NEG</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-3 bg-[#18181b] rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[400px]">
                <div className="p-3 border-b border-slate-800 bg-[#09090b]/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold text-slate-400 tracking-widest"><Globe className="w-4 h-4 inline mr-1"/> LIVE STREAM</h2>
                    <select className="bg-black border border-slate-700 text-xs rounded px-2 outline-none text-indigo-400" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                      <option value="ALL">All Brands</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <button onClick={() => { setIsFeedPaused(!isFeedPaused); if (!isFeedPaused) setPausedEvents(filteredEvents); }} 
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${isFeedPaused ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    {isFeedPaused ? <><PlayCircle className="w-3 h-3" /> RESUME</> : <><PauseCircle className="w-3 h-3" /> PAUSE</>}
                  </button>
                </div>
                
                <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1 bg-[#09090b]/20">
                  {displayedFeed.slice(0, 15).map(e => {
                    const isExp = expandedEventId === e.event_id;
                    const bColor = e.sentiment === 'POSITIVE' ? 'border-emerald-500' : e.sentiment === 'NEGATIVE' ? 'border-red-500' : 'border-slate-500';
                    return (
                      <div key={e.event_id} onClick={() => setExpandedEventId(isExp ? null : e.event_id)}
                        className={`bg-[#0f0f13] p-3 rounded-lg border-l-4 border-y border-r border-y-slate-800 border-r-slate-800 cursor-pointer hover:bg-[#18181b] transition-all ${bColor}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-white">{e.brand}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">{e.category}</span>
                              <span className="text-xs text-indigo-400 font-semibold">{e.platform}</span>
                              <span className="text-xs text-slate-500 font-mono">[{e.geo || 'IND'}]</span>
                            </div>
                            <p className="text-slate-300 text-sm">"{e.text}"</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${e.sentiment === 'POSITIVE' ? 'text-emerald-400' : e.sentiment === 'NEGATIVE' ? 'text-red-400' : 'text-slate-400'}`}>
                              {e.sentiment}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> {new Date(e.event_created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- TAB 2: DEDICATED GEO MAP / PARIS VS INDIA VIEW --- */}
        {activeTab === 'GEO-MAP' && (
          <div className="bg-[#18181b] p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="text-indigo-400"/> Regional Market Comparison: Paris (EU) vs. India (Asia)</h2>
                <p className="text-xs text-slate-400 mt-1">Directly contrasting flagship European boutique sentiment against emerging South Asian digital markets across all 8 luxury brands.</p>
              </div>
              <select className="bg-black border border-indigo-500 text-sm px-4 py-2 rounded-lg text-indigo-400 font-bold outline-none" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                <option value="ALL">Select Brand (Default: Gucci)</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parisVsIndiaData.map((market, i) => (
                <div key={market.market} className={`bg-[#09090b] p-6 rounded-xl border-t-4 ${i === 0 ? 'border-t-indigo-500' : 'border-t-amber-500'} border-x border-b border-slate-800 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{market.market}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full">Total Mentions: {market.volume}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#18181b] p-3 rounded-lg"><p className="text-xs text-slate-500">Positive</p><p className="text-xl font-bold text-emerald-400 mt-1">{market.Positive}%</p></div>
                    <div className="bg-[#18181b] p-3 rounded-lg"><p className="text-xs text-slate-500">Neutral</p><p className="text-xl font-bold text-slate-300 mt-1">{market.Neutral}%</p></div>
                    <div className="bg-[#18181b] p-3 rounded-lg"><p className="text-xs text-slate-500">Negative</p><p className="text-xl font-bold text-red-400 mt-1">{market.Negative}%</p></div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-400 mb-2">Regional Sentiment Breakdown Bar</p>
                    <div className="w-full h-4 flex rounded-full overflow-hidden">
                      <div style={{ width: `${market.Positive}%` }} className="bg-emerald-400 flex items-center justify-center text-[9px] font-bold text-black" title="Positive"></div>
                      <div style={{ width: `${market.Neutral}%` }} className="bg-slate-500 flex items-center justify-center text-[9px] font-bold text-white" title="Neutral"></div>
                      <div style={{ width: `${market.Negative}%` }} className="bg-red-500 flex items-center justify-center text-[9px] font-bold text-white" title="Negative"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: STREAM --- */}
        {activeTab === 'STREAM' && (
          <div className="bg-[#18181b] rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[750px]">
            <div className="p-4 border-b border-slate-800 bg-[#09090b]/50 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white tracking-widest">REAL-TIME EVENT STREAM ({filteredEvents.length} Events in Window)</h2>
              </div>

              <div className="flex items-center gap-3">
                <select className="bg-black border border-slate-700 text-xs rounded px-3 py-2 outline-none text-indigo-400 font-bold" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                  <option value="ALL">All Brands</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search live stream..." 
                    className="w-full bg-black border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button onClick={() => { setIsFeedPaused(!isFeedPaused); if (!isFeedPaused) setPausedEvents(filteredEvents); }} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isFeedPaused ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                  {isFeedPaused ? <><PlayCircle className="w-4 h-4" /> RESUME</> : <><PauseCircle className="w-4 h-4" /> PAUSE</>}
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 bg-[#09090b]/40">
              {displayedFeed.length === 0 ? <p className="text-slate-500 text-center mt-20">No events matching current filters for this time window.</p> : null}
              {displayedFeed.map(e => {
                const isExp = expandedEventId === e.event_id;
                const bColor = e.sentiment === 'POSITIVE' ? 'border-emerald-500 bg-emerald-500/5' : e.sentiment === 'NEGATIVE' ? 'border-red-500 bg-red-500/5' : 'border-slate-500 bg-slate-500/5';
                return (
                  <div key={e.event_id} onClick={() => setExpandedEventId(isExp ? null : e.event_id)}
                    className={`bg-[#0f0f13] p-4 rounded-xl border-l-4 border-y border-r border-y-slate-800 border-r-slate-800 cursor-pointer hover:bg-[#18181b] transition-all ${bColor}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-extrabold text-base text-white">{e.brand}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-bold">{e.category}</span>
                          <span className="text-xs text-indigo-400 font-semibold">{e.platform}</span>
                          <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-amber-400">Market: {e.geo || 'IND'}</span>
                        </div>
                        <p className="text-slate-200 text-base italic">"{e.text}"</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded uppercase ${e.sentiment === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-400' : e.sentiment === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                          {e.sentiment} ({(e.sentiment_score * 100).toFixed(0)}%)
                        </span>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(e.event_created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 4: COMPARE --- */}
        {activeTab === 'COMPARE' && (
          <div className="space-y-4">
            <div className="bg-[#18181b] p-4 rounded-xl border border-slate-800 flex gap-4 items-center">
              <span className="text-sm font-bold text-slate-400">COMPARE:</span>
              <select className="bg-slate-900 border border-indigo-500 text-sm px-4 py-2 rounded-lg" value={compareBrandA} onChange={e => setCompareBrandA(e.target.value)}>
                {BRANDS.map(b => <option key={`A-${b}`} value={b}>{b}</option>)}
              </select>
              <span className="text-sm font-bold text-slate-600">VS</span>
              <select className="bg-slate-900 border border-amber-500 text-sm px-4 py-2 rounded-lg" value={compareBrandB} onChange={e => setCompareBrandB(e.target.value)}>
                {BRANDS.map(b => <option key={`B-${b}`} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[compareBrandA, compareBrandB].map((brand, idx) => {
                const bEvents = filteredEvents.filter(e => e.brand === brand);
                const pos = bEvents.filter(e => e.sentiment === 'POSITIVE').length;
                const neg = bEvents.filter(e => e.sentiment === 'NEGATIVE').length;
                const total = bEvents.length || 1;
                return (
                  <div key={brand} className={`bg-[#18181b] p-6 rounded-xl border-t-4 ${idx === 0 ? 'border-t-indigo-500' : 'border-t-amber-500'} border-x border-b border-slate-800`}>
                    <h2 className="text-2xl font-bold mb-4">{brand}</h2>
                    <div className="grid grid-cols-3 gap-2 text-center mb-6">
                      <div className="bg-[#09090b] p-2 rounded"><p className="text-xs text-slate-500">Volume</p><p className="text-lg font-bold">{bEvents.length}</p></div>
                      <div className="bg-[#09090b] p-2 rounded"><p className="text-xs text-slate-500">Positive</p><p className="text-lg font-bold text-emerald-400">{Math.round((pos/total)*100)}%</p></div>
                      <div className="bg-[#09090b] p-2 rounded"><p className="text-xs text-slate-500">Negative</p><p className="text-lg font-bold text-red-400">{Math.round((neg/total)*100)}%</p></div>
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Most Problematic Categories:</p>
                    {CATEGORIES.map(cat => {
                      const cEvs = bEvents.filter(e => e.category === cat);
                      const bad = cEvs.filter(e => e.sentiment === 'NEGATIVE').length;
                      if (bad === 0) return null;
                      return (
                        <div key={cat} className="flex justify-between text-sm mb-1 bg-slate-900 px-2 py-1 rounded">
                          <span>{cat}</span><span className="text-red-400 font-bold">{Math.round((bad/(cEvs.length||1))*100)}% NEG</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --- TAB 5: SYSTEM --- */}
        {activeTab === 'SYSTEM' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#18181b] p-6 rounded-xl border border-slate-800">
                <h2 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2"><Server className="w-4 h-4"/> PIPELINE OBSERVABILITY</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-sm text-slate-300">Kafka Consumer Lag</span>
                    <span className="text-sm font-bold text-emerald-400">~ 12 ms</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-sm text-slate-300">Total Events Processed (Session)</span>
                    <span className="text-sm font-bold">{events.length}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-sm text-slate-300 flex items-center gap-1"><Database className="w-3 h-3"/> Dead Letter Queue (DLQ) Count</span>
                    <span className="text-sm font-bold text-amber-500">0 Events (Healthy)</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-sm text-slate-300">Avg ML Inference Duration</span>
                    <span className="text-sm font-bold text-indigo-400">42 ms / doc</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">WebSocket Status</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181b] p-6 rounded-xl border border-slate-800">
                <h2 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2"><Cpu className="w-4 h-4"/> MODEL EXPLAINABILITY & EVALUATION</h2>
                <p className="text-xs text-slate-500 mb-4">Static Test-Set Evaluation vs Live Consensus</p>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-[#09090b] p-3 rounded text-center">
                    <p className="text-[10px] text-slate-500 uppercase">F1 Score (Test Set)</p>
                    <p className="text-lg font-bold text-white mt-1">0.93</p>
                  </div>
                  <div className="bg-[#09090b] p-3 rounded text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Precision</p>
                    <p className="text-lg font-bold text-white mt-1">94.2%</p>
                  </div>
                  <div className="bg-[#09090b] p-3 rounded text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Avg Confidence</p>
                    <p className="text-lg font-bold text-indigo-400 mt-1">88%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400">Ensemble Node Agreement (Live)</p>
                  <div className="w-full bg-slate-900 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${filteredEvents.length ? filteredEvents[0]?.model_agreement : 0}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">Most recent event: {filteredEvents[0]?.model_agreement}% match across ensemble nodes.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#18181b] p-6 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2"><Layers className="w-4 h-4"/> ACTIVE ENSEMBLE MODEL REGISTRY (6 NODES)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#09090b] text-xs uppercase text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Model Name</th>
                      <th className="p-3">Architecture Type</th>
                      <th className="p-3">Ensemble Weight</th>
                      <th className="p-3">F1 Score</th>
                      <th className="p-3">Avg Latency</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ML_MODELS.map((model, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-[#09090b]/50">
                        <td className="p-3 font-bold text-white">{model.name}</td>
                        <td className="p-3 text-slate-400">{model.type}</td>
                        <td className="p-3 text-indigo-400 font-semibold">{model.weight}</td>
                        <td className="p-3 text-emerald-400 font-bold">{model.f1}</td>
                        <td className="p-3 text-amber-400">{model.latency}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${model.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {model.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}