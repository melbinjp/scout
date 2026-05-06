import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
const parser = new Parser({
  headers: { 'User-Agent': 'NexusIntelligence/1.0.0 (Market Research Tool)' }
});
const PORT = 3001;

app.use(cors());
app.use(express.json());

const SUBREDDITS = ['SaaS', 'Entrepreneur', 'smallbusiness', 'startups', 'ArtificialInteligence', 'technology', 'programming', 'business'];

async function fetchLeads() {
  const allLeads = [];
  console.log('--- Starting Lead Capture ---');

  // Hacker News Fetch
  try {
    const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
    const storyIds = await hnRes.json();
    const stories = await Promise.all(
      storyIds.slice(0, 15).map(id => 
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );
    for (const story of stories) {
      if (story && story.title) {
        allLeads.push({
          id: 'hn-' + story.id,
          source: 'HackerNews',
          query: story.title,
          link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          author: story.by || 'anonymous',
          content: story.text || story.title,
          pubDate: new Date(story.time * 1000).toISOString(),
          sentiment: 'Medium',
          value: '$' + (Math.floor(Math.random() * 100) * 50 + 500),
          intent: 'Technology'
        });
      }
    }
    console.log(`HN fetched: ${allLeads.length} leads`);
  } catch (e) { console.error('HN Error:', e.message); }

  // TechCrunch Fetch
  try {
    const tcFeed = await parser.parseURL('https://techcrunch.com/feed/');
    for (const item of tcFeed.items.slice(0, 10)) {
      allLeads.push({
        id: 'tc-' + (item.guid || Math.random()),
        source: 'TechCrunch',
        query: item.title,
        link: item.link,
        author: item.creator || 'TC Staff',
        content: item.contentSnippet || item.title,
        pubDate: item.pubDate,
        sentiment: 'High',
        value: '$' + (Math.floor(Math.random() * 100) * 50 + 1000),
        intent: 'Venture/SaaS'
      });
    }
    console.log('TechCrunch fetched');
  } catch (e) { console.error('TechCrunch Error:', e.message); }

  // Reddit Fetch
  for (const sub of SUBREDDITS) {
    try {
      const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/new/.rss`);
      for (const item of feed.items) {
        allLeads.push({
          id: 'reddit-' + (item.guid || Math.random()),
          source: `r/${sub}`,
          query: item.title,
          link: item.link,
          author: item.author,
          content: item.contentSnippet || item.title,
          pubDate: item.pubDate,
          sentiment: 'Medium',
          value: '$' + (Math.floor(Math.random() * 100) * 50 + 500),
          intent: 'Community'
        });
      }
    } catch (error) {
      console.log(`Error fetching r/${sub}: ${error.message}`);
    }
  }
  
  console.log(`Total leads captured: ${allLeads.length}`);
  const result = allLeads.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return result;
}

app.get('/api/leads', async (req, res) => {
  try {
    const leads = await fetchLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

let CONFIG = {
  geminiKey: '',
  subreddits: ['SaaS', 'Entrepreneur', 'startups'],
  keywords: ['need', 'looking for', 'help', 'recommend', 'how to'],
  outreachTemplate: "Hi {author}, I saw your post in {source} regarding {query}... Would you like a custom analysis?"
};

app.get('/api/settings', (req, res) => res.json(CONFIG));
app.post('/api/settings', (req, res) => {
  CONFIG = { ...CONFIG, ...req.body };
  res.json({ status: 'success', config: CONFIG });
});

// Agent Accessibility Manifest
app.get('/nexus-agent.json', (req, res) => {
  res.json({
    name: "Nexus Intent Arbitrage Engine",
    version: "1.0.0",
    description: "An automated lead discovery and value generation engine for Sales Intelligence.",
    capabilities: [
      "real_time_lead_scanning",
      "ai_intent_analysis",
      "automated_outreach_generation",
      "leverage_vault_storage"
    ],
    endpoints: {
      get_leads: "/api/leads",
      get_settings: "/api/settings",
      update_settings: "/api/settings",
      vault_stats: "/api/vault/stats"
    },
    schema_version: "1.0.0"
  });
});

app.listen(PORT, () => {
  console.log(`Nexus Intelligence Server running on http://localhost:${PORT}`);
});
