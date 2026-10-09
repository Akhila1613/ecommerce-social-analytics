const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Security: Limit payload size

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// --- 1. Database Configuration & State ---
const MONGO_URI = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
let collection;
let dbStatus = 'DISCONNECTED';

async function initMongo() {
  try {
    await client.connect();
    const db = client.db('social_analytics');
    collection = db.collection('sentiment_results');
    dbStatus = 'CONNECTED';
    systemLog('MongoDB', 'Connected to database: social_analytics');
  } catch (err) {
    dbStatus = 'ERROR';
    systemLog('MongoDB', `Connection error: ${err.message}`, 'ERROR');
  }
}
initMongo();

// --- 2. Enterprise System Logger ---
function systemLog(module, message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [${module}] ${message}`);
}

// --- 3. Custom Rate Limiter for Ingestion ---
const rateLimit = { hits: 0, resetTime: Date.now() + 1000 };
function ingestionRateLimiter(req, res, next) {
  if (Date.now() > rateLimit.resetTime) {
    rateLimit.hits = 0;
    rateLimit.resetTime = Date.now() + 1000;
  }
  rateLimit.hits++;
  if (rateLimit.hits > 500) { // Max 500 events per second
    systemLog('API', 'Rate limit exceeded on ingestion endpoint', 'WARN');
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  next();
}

// --- 4. Health & Telemetry Endpoint (Prometheus/Grafana Ready) ---
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'ONLINE',
    uptime_seconds: Math.floor(process.uptime()),
    database_status: dbStatus,
    active_websocket_clients: io.engine.clientsCount,
    memory_mb: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    timestamp: new Date().toISOString()
  });
});

// --- 5. Advanced Historical Query API (Database-level Filtering) ---
app.get('/api/events', async (req, res) => {
  if (!collection) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const { brand, platform, sentiment, limit = 100 } = req.query;
    const query = {};
    
    // Dynamic Query Builder based on URL parameters
    if (brand && brand !== 'ALL') query.brand = brand;
    if (platform && platform !== 'ALL') query.platform = platform;
    if (sentiment && sentiment !== 'ALL') query.sentiment = sentiment;

    const events = await collection
      .find(query)
      .sort({ event_created_at: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.status(200).json({ count: events.length, data: events });
  } catch (error) {
    systemLog('API', `Query failed: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- 6. Webhook Ingestion API (Called by Python Consumer) ---
app.post('/api/stream-event', ingestionRateLimiter, (req, res) => {
  const event = req.body;
  
  if (!event || !event.event_id || !event.text) {
    systemLog('API', 'Dropped malformed payload from consumer', 'WARN');
    return res.status(400).json({ error: 'Malformed event payload' });
  }

  // Broadcast instantly to all connected UI clients
  io.emit('new_sentiment_event', event);
  res.status(200).json({ status: 'broadcasted', event_id: event.event_id });
});

// --- 7. WebSocket Connection Lifecycle ---
io.on('connection', async (socket) => {
  systemLog('WebSocket', `Client connected: ${socket.id} | Total: ${io.engine.clientsCount}`);

  // Fetch initial snapshot for the new client
  if (collection) {
    try {
      const history = await collection.find({}).sort({ event_created_at: -1 }).limit(150).toArray();
      history.reverse().forEach(event => {
        socket.emit('new_sentiment_event', event);
      });
    } catch (err) {
      systemLog('WebSocket', `Failed to send history: ${err.message}`, 'ERROR');
    }
  }

  socket.on('disconnect', () => {
    systemLog('WebSocket', `Client disconnected: ${socket.id} | Total: ${io.engine.clientsCount}`);
  });
});

// --- 8. Graceful Shutdown ---
function shutdown() {
  systemLog('System', 'Shutting down gracefully...', 'WARN');
  server.close(() => {
    systemLog('System', 'HTTP/WebSocket server closed.');
    client.close(false, () => {
      systemLog('MongoDB', 'Database connection closed.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const PORT = 5000;
server.listen(PORT, () => {
  systemLog('System', `Enterprise WebSocket/REST API running on port ${PORT}`);
});