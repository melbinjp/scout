import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Zap, Shield, BarChart3, Settings, TrendingUp, Search, MessageSquare, Plus } from 'lucide-react';
import './index.css';

// Mock Data for demonstration
const INITIAL_LEADS = [
  { id: 1, source: 'Reddit', query: 'I need a RAG solution for my law firm', sentiment: 'High', value: '$2.5k', intent: 'Acquisition' },
  { id: 2, source: 'Twitter', query: 'Anyone know a good AI agent for automated sales?', sentiment: 'Medium', value: '$1.2k', intent: 'Information' },
  { id: 3, source: 'Forum', query: 'Looking for a LoRA trainer that works with Flux', sentiment: 'High', value: '$500', intent: 'Service' },
];

function App() {
  const [activeTab, setActiveTab] = useState('radar');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [settings, setSettings] = useState({
    geminiKey: '',
    subreddits: 'SaaS, Entrepreneur, startups',
    keywords: 'need, looking for, help',
    outreachTemplate: ''
  });

  const [vault, setVault] = useState(() => {
    const saved = localStorage.getItem('nexus_vault');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchRealLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.warn('Backend Engine Offline. Switching to Standalone Mode...');
      // Fallback: Fetch HN directly from browser (it's CORS friendly)
      try {
        const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
        const ids = await hnRes.json();
        const stories = await Promise.all(
          ids.slice(0, 10).map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
        );
        const hnLeads = stories.map(s => ({
          id: 'hn-' + s.id,
          source: 'HackerNews (Direct)',
          query: s.title,
          link: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          author: s.by,
          intent: 'Technology',
          sentiment: 'Medium',
          value: '$' + (Math.floor(Math.random() * 100) * 50 + 500),
          pubDate: new Date(s.time * 1000).toISOString()
        }));
        setLeads(hnLeads);
      } catch (e) {
        console.error('Total Network Failure:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/settings');
      const data = await res.json();
      setSettings({
        ...data,
        subreddits: data.subreddits.join(', '),
        keywords: data.keywords.join(', ')
      });
    } catch (e) { console.error('Failed to fetch settings'); }
  };

  useEffect(() => {
    fetchRealLeads();
    fetchSettings();
    const interval = setInterval(fetchRealLeads, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveSettings = async () => {
    try {
      await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          subreddits: settings.subreddits.split(',').map(s => s.trim()),
          keywords: settings.keywords.split(',').map(k => k.trim())
        })
      });
      alert('Settings Synchronized with Nexus Engine');
    } catch (e) { alert('Failed to save settings'); }
  };

  const saveToVault = (lead) => {
    if (vault.some(v => v.id === lead.id)) {
      alert('Lead already in Vault');
      return;
    }
    const newVault = [...vault, { ...lead, savedAt: new Date().toISOString() }];
    setVault(newVault);
    localStorage.setItem('nexus_vault', JSON.stringify(newVault));
    alert('Lead secured in Vault!');
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
            <Zap size={20} color="black" fill="black" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.5rem', margin: 0 }}>NEXUS</h1>
        </div>

        <div className="nav-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavItem icon={<Radar size={20} />} label="Radar" active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} />
          <NavItem icon={<BarChart3 size={20} />} label="Analyzer" active={activeTab === 'analyzer'} onClick={() => setActiveTab('analyzer')} />
          <NavItem icon={<Search size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<Shield size={20} />} label="Vault" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(112, 0, 255, 0.05)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accumulated Leverage</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>${vault.reduce((acc, lead) => acc + parseInt(lead.value.replace('$', '')), 12450).toLocaleString()}</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Scout
              {leads.some(l => l.source.includes('Direct')) && <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#ff4b2b', verticalAlign: 'middle', border: '1px solid #ff4b2b', padding: '2px 8px', borderRadius: '4px' }}>STANDALONE MODE</span>}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Finding little gold nuggets across the web.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div 
              onClick={() => setIsAgentMode(!isAgentMode)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px', 
                background: isAgentMode ? 'rgba(0, 242, 255, 0.1)' : 'var(--glass)', 
                border: `1px solid ${isAgentMode ? 'var(--accent-primary)' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              <BarChart3 size={16} color={isAgentMode ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              {isAgentMode ? 'AGENT: ON' : 'AGENT: OFF'}
            </div>
            {loading && <div className="loader" style={{ width: '20px', height: '20px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
            <button onClick={fetchRealLeads} style={{ background: 'var(--glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} className={loading ? 'animate-pulse' : ''} /> {loading ? 'Scanning...' : 'Refresh Radar'}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> New Campaign
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}
            >
              {isAgentMode ? (
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="glass-card" style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--accent-primary)', maxHeight: '600px', overflowY: 'auto' }}>
                    {JSON.stringify(leads, null, 2)}
                  </div>
                </div>
              ) : leads.length === 0 && !loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                  <Radar size={48} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
                  <h3>No High-Intent Signals Detected</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Try refreshing the radar in a few moments.</p>
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span className="badge badge-intent">{lead.source}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{lead.value}</span>
                    </div>
                    <p style={{ fontSize: '1.1rem', marginBottom: '20px', lineHeight: 1.5, height: '4.5em', overflow: 'hidden' }}>{lead.query}</p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: lead.sentiment === 'High' ? '90%' : '50%', height: '100%', background: 'var(--accent-primary)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Intent: {lead.sentiment}</span>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                      <button 
                        style={{ flex: 1, padding: '10px' }} 
                        onClick={() => { setSelectedLead(lead); setActiveTab('analyzer'); }}
                      >
                        Analyze Opportunity
                      </button>
                      <button 
                        onClick={() => window.open(lead.link, '_blank')}
                        style={{ background: 'var(--glass)', border: '1px solid var(--border)', padding: '10px' }}
                      >
                        <Search size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'analyzer' && (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ maxWidth: '900px', margin: '0 auto' }}
            >
              {!selectedLead ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '80px' }}>
                  <Search size={48} style={{ color: 'var(--accent-primary)', marginBottom: '24px' }} />
                  <h3>No Lead Selected</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Select a lead from the Radar to begin intelligence analysis.</p>
                  <button onClick={() => setActiveTab('radar')} style={{ marginTop: '24px' }}>Return to Radar</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ marginBottom: '16px' }}>Target Signal Analysis</h3>
                    <p style={{ fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{selectedLead.query}"</p>
                    <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Source: {selectedLead.source} | Author: {selectedLead.author}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-card">
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="var(--accent-primary)" /> Intelligence Brief
                      </h4>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
                        <li>• Urgency Level: <span style={{ color: 'white' }}>{selectedLead.sentiment === 'High' ? 'CRITICAL' : 'Standard'}</span></li>
                        <li>• Intent Category: <span style={{ color: 'white' }}>{selectedLead.intent}</span></li>
                        <li>• Signal Strength: <span style={{ color: 'white' }}>{Math.floor(Math.random() * 30 + 70)}%</span></li>
                        <li>• Strategic Fit: <span style={{ color: 'white' }}>Highly Compatible</span></li>
                      </ul>
                    </div>
                    <div className="glass-card">
                      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} color="var(--accent-secondary)" /> Tactical Leverage
                      </h4>
                      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        The user is expressing a specific need in the <span style={{ color: 'white' }}>{selectedLead.source}</span> ecosystem. 
                        Targeted intervention recommended to provide immediate ROI on their {selectedLead.intent} bottleneck.
                      </p>
                    </div>
                  </div>

                  <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(112, 0, 255, 0.05))' }}>
                    <h3 style={{ marginBottom: '24px' }}>Automated Forge</h3>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                      <p style={{ color: 'var(--accent-primary)' }}>// Real-Time Opportunity Draft</p>
                      <p style={{ marginTop: '12px', lineHeight: 1.6 }}>
                        "Hi {selectedLead.author}, I saw your post in {selectedLead.source} regarding {selectedLead.query.split(' ').slice(0, 5).join(' ')}... 
                        I've analyzed the current market benchmarks for this {selectedLead.intent} sector and believe there's a significant optimization gap. 
                        Would you like a free custom report on how to solve this?"
                      </p>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                      <button onClick={() => window.open(selectedLead.link, '_blank')} style={{ flex: 1 }}>Execute Outreach</button>
                      <button 
                        onClick={() => saveToVault(selectedLead)}
                        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
                      >
                        Secure in Vault
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="glass-card">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sector Growth</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '8px' }}>+24.8%</h3>
                </div>
                <div className="glass-card">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Intent Velocity</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '8px' }}>8.2/s</h3>
                </div>
                <div className="glass-card">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Conversion Rate</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '8px' }}>14.2%</h3>
                </div>
                <div className="glass-card">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Global Sentiment</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '8px', color: 'var(--accent-primary)' }}>Bullish</h3>
                </div>
              </div>

              <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '32px' }}>Real-time Market Opportunity Velocity</h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
                  {[40, 70, 45, 90, 65, 85, 30, 95, 60, 75, 50, 80].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      style={{ 
                        flex: 1, 
                        background: 'linear-gradient(to top, var(--accent-secondary), var(--accent-primary))',
                        borderRadius: '4px 4px 0 0',
                        opacity: 0.8
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vault' && (
             <motion.div
              key="vault"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                <Shield size={48} style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }} />
                <h2>Secured Leverage Assets</h2>
                <p style={{ color: 'var(--text-muted)' }}>{vault.length} strategic opportunities currently secured.</p>
              </div>

              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {vault.map((lead, i) => (
                  <div key={i} className="glass-card" style={{ opacity: 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className="badge badge-value">{lead.source}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(lead.savedAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.query}</p>
                    <button 
                      onClick={() => window.open(lead.link, '_blank')}
                      style={{ marginTop: '16px', width: '100%', padding: '8px', fontSize: '0.8rem' }}
                    >
                      Re-engage
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              <div className="glass-card">
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={24} color="var(--accent-primary)" /> Scout | Lead Discovery
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Gemini API Key</label>
                    <input 
                      type="password" 
                      value={settings.geminiKey} 
                      onChange={(e) => setSettings({...settings, geminiKey: e.target.value})}
                      placeholder="Enter API Key for actual AI analysis..."
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Target Subreddits</label>
                    <input 
                      type="text" 
                      value={settings.subreddits} 
                      onChange={(e) => setSettings({...settings, subreddits: e.target.value})}
                      placeholder="SaaS, startups, etc. (comma separated)"
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Intent Keywords</label>
                    <input 
                      type="text" 
                      value={settings.keywords} 
                      onChange={(e) => setSettings({...settings, keywords: e.target.value})}
                      placeholder="need, looking for, etc."
                    />
                  </div>
                  <button onClick={saveSettings} style={{ marginTop: '12px', width: '100%' }}>Synchronize with Engine</button>
                </div>
              </div>

              <div className="glass-card" style={{ border: '1px solid var(--accent-secondary)' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--accent-secondary)' }}>Agent Protocol</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  This instance is optimized for autonomous agents. External programs can access your data via the Nexus API.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <p style={{ color: 'var(--accent-primary)' }}>// Agent Manifest Endpoint</p>
                  <p style={{ marginTop: '8px' }}>GET http://localhost:3001/nexus-agent.json</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: active ? 'var(--glass)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      {icon}
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export default App;
