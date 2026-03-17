import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-hackathon';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Database Setup
const db = new Database('auction.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'bidder')),
    credits INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    min_bid INTEGER NOT NULL,
    current_bid INTEGER DEFAULT 0,
    highest_bidder_id INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
    FOREIGN KEY(highest_bidder_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(auction_id) REFERENCES auctions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
}

// Create bot user
const botExists = db.prepare('SELECT id FROM users WHERE username = ?').get('AutoBidder');
if (!botExists) {
  const hash = bcrypt.hashSync('botpass', 10);
  db.prepare('INSERT INTO users (username, password, role, credits) VALUES (?, ?, ?, ?)').run('AutoBidder', hash, 'bidder', 1000000);
}
const botUser: any = db.prepare('SELECT id FROM users WHERE username = ?').get('AutoBidder');

// Auto-seed mock data if no auctions exist
const auctionCount: any = db.prepare('SELECT COUNT(*) as count FROM auctions').get();
if (auctionCount.count === 0) {
  const hash = bcrypt.hashSync('password123', 10);
  const users = ['alice', 'bob', 'charlie'];
  users.forEach(u => {
    db.prepare('INSERT OR IGNORE INTO users (username, password, role, credits) VALUES (?, ?, ?, ?)').run(u, hash, 'bidder', 100);
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'Vintage Rolex Daytona', 'A classic timepiece in mint condition.', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=800', now.toISOString(), tomorrow.toISOString(), 10, 0
  );
  db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'Signed Michael Jordan Jersey', 'Authentic 1998 Finals jersey.', 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=800', now.toISOString(), nextWeek.toISOString(), 5, 0
  );
  db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    '1st Edition Charizard Holographic', 'PSA 10 graded.', 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=800', now.toISOString(), tomorrow.toISOString(), 20, 0
  );
}

// WebSocket Clients
interface ExtWebSocket extends WebSocket {
  roomId?: string;
}
const clients = new Set<ExtWebSocket>();

const broadcast = (type: string, payload: any, targetRoom?: string) => {
  const message = JSON.stringify({ type, payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!targetRoom || client.roomId === targetRoom || client.roomId === 'dashboard' || !client.roomId) {
        client.send(message);
      }
    }
  });
};

wss.on('connection', (ws: ExtWebSocket) => {
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'JOIN_ROOM') {
        ws.roomId = data.payload.roomId;
      } else if (data.type === 'PLACE_BID') {
        const { token, auctionId, amount } = data.payload;
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded.role !== 'bidder') {
            return ws.send(JSON.stringify({ type: 'BID_ERROR', payload: { auctionId, error: 'Admins cannot bid' } }));
          }
          const userId = decoded.id;

          const transaction = db.transaction(() => {
            const auction: any = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId);
            if (!auction) throw new Error('Auction not found');
            if (auction.status !== 'active') throw new Error('Auction is closed');
            
            const now = new Date().toISOString();
            if (now < auction.start_time) throw new Error('Auction has not started');
            if (now > auction.end_time) throw new Error('Auction has ended');

            const minRequiredBid = auction.current_bid > 0 ? auction.current_bid + 1 : auction.min_bid;
            if (amount < minRequiredBid) throw new Error(`Bid must be at least ${minRequiredBid}`);

            const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
            const heldCreditsResult: any = db.prepare(`
              SELECT SUM(amount) as held FROM bids b
              JOIN auctions a ON b.auction_id = a.id
              WHERE b.user_id = ? AND a.status = 'active' AND a.highest_bidder_id = ? AND a.id != ?
            `).get(userId, userId, auctionId);
            
            const heldCredits = heldCreditsResult?.held || 0;
            const availableCredits = user.credits - heldCredits;

            if (amount > availableCredits) throw new Error('Insufficient available credits');

            db.prepare('INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)').run(auctionId, userId, amount);
            db.prepare('UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?').run(amount, userId, auctionId);

            return db.prepare(`
              SELECT a.*, u.username as highest_bidder_name 
              FROM auctions a 
              LEFT JOIN users u ON a.highest_bidder_id = u.id
              WHERE a.id = ?
            `).get(auctionId);
          });

          const updatedAuction = transaction();
          broadcast('BID_PLACED', updatedAuction, `auction_${auctionId}`);

          // Bot Competition Logic
          if (userId !== botUser.id) {
            setTimeout(() => {
              try {
                const auction: any = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId);
                if (auction && auction.status === 'active' && auction.highest_bidder_id !== botUser.id) {
                  const now = new Date().toISOString();
                  if (now >= auction.start_time && now <= auction.end_time) {
                    // 70% chance the bot bids
                    if (Math.random() < 0.7) {
                      const minRequiredBid = auction.current_bid > 0 ? auction.current_bid + 1 : auction.min_bid;
                      const botBid = minRequiredBid + Math.floor(Math.random() * 5); // Bid slightly higher
                      
                      const botTransaction = db.transaction(() => {
                        db.prepare('INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)').run(auctionId, botUser.id, botBid);
                        db.prepare('UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?').run(botBid, botUser.id, auctionId);
                        return db.prepare(`
                          SELECT a.*, u.username as highest_bidder_name 
                          FROM auctions a 
                          LEFT JOIN users u ON a.highest_bidder_id = u.id
                          WHERE a.id = ?
                        `).get(auctionId);
                      });
                      
                      const botUpdatedAuction = botTransaction();
                      broadcast('BID_PLACED', botUpdatedAuction, `auction_${auctionId}`);
                    }
                  }
                }
              } catch (e) {
                console.error('Bot bid error', e);
              }
            }, 2000 + Math.random() * 3000); // Wait 2-5 seconds
          }
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'BID_ERROR', payload: { auctionId, error: err.message || 'Invalid token' } }));
        }
      }
    } catch (err) {
      console.error('WS message error', err);
    }
  });

  ws.on('close', () => clients.delete(ws));
});

// Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// API Routes

// Add credits
app.post('/api/add-credits', authenticate, (req: any, res: any) => {
  try {
    db.prepare('UPDATE users SET credits = credits + 1000 WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Auth
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, 'bidder');
    res.json({ id: result.lastInsertRowid, username, role: 'bidder' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, credits: user.credits } });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user: any = db.prepare('SELECT id, username, role, credits FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Calculate available credits (total - currently held in active bids)
  const heldCreditsResult: any = db.prepare(`
    SELECT SUM(amount) as held FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    WHERE b.user_id = ? AND a.status = 'active' AND a.highest_bidder_id = ?
  `).get(user.id, user.id);
  
  const heldCredits = heldCreditsResult?.held || 0;
  const availableCredits = user.credits - heldCredits;

  res.json({ ...user, availableCredits, heldCredits });
});

// Admin: Mock Data
app.post('/api/admin/mock-data', authenticate, requireAdmin, (req, res) => {
  try {
    const hash = bcrypt.hashSync('password123', 10);
    const users = ['alice', 'bob', 'charlie'];
    users.forEach(u => {
      db.prepare('INSERT OR IGNORE INTO users (username, password, role, credits) VALUES (?, ?, ?, ?)').run(u, hash, 'bidder', 100);
    });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const res1 = db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Vintage Rolex Daytona', 'A classic timepiece in mint condition.', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=800', now.toISOString(), tomorrow.toISOString(), 10, 0
    );
    const res2 = db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Signed Michael Jordan Jersey', 'Authentic 1998 Finals jersey.', 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=800', now.toISOString(), nextWeek.toISOString(), 5, 0
    );
    const res3 = db.prepare(`INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      '1st Edition Charizard Holographic', 'PSA 10 graded.', 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=800', now.toISOString(), tomorrow.toISOString(), 20, 0
    );

    // Broadcast the new auctions
    broadcast('AUCTION_CREATED', db.prepare('SELECT * FROM auctions WHERE id = ?').get(res1.lastInsertRowid));
    broadcast('AUCTION_CREATED', db.prepare('SELECT * FROM auctions WHERE id = ?').get(res2.lastInsertRowid));
    broadcast('AUCTION_CREATED', db.prepare('SELECT * FROM auctions WHERE id = ?').get(res3.lastInsertRowid));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Users
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, credits FROM users WHERE role = "bidder"').all();
  res.json(users);
});

app.post('/api/admin/users/:id/credits', authenticate, requireAdmin, (req, res) => {
  const { amount } = req.body;
  const userId = req.params.id;
  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, userId);
  res.json({ success: true });
});

// Auctions
app.get('/api/auctions', (req, res) => {
  const auctions = db.prepare(`
    SELECT a.*, u.username as highest_bidder_name 
    FROM auctions a 
    LEFT JOIN users u ON a.highest_bidder_id = u.id
    ORDER BY a.end_time ASC
  `).all();
  res.json(auctions);
});

app.post('/api/auctions', authenticate, requireAdmin, (req, res) => {
  const { title, description, image_url, start_time, end_time, min_bid } = req.body;
  const result = db.prepare(`
    INSERT INTO auctions (title, description, image_url, start_time, end_time, min_bid, current_bid)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, image_url, start_time, end_time, min_bid, 0);
  
  const newAuction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(result.lastInsertRowid);
  broadcast('AUCTION_CREATED', newAuction);
  res.json(newAuction);
});

app.post('/api/auctions/:id/close', authenticate, requireAdmin, (req, res) => {
  const auctionId = req.params.id;
  
  const auction: any = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  if (auction.status === 'closed') return res.status(400).json({ error: 'Auction already closed' });

  // Close auction
  db.prepare('UPDATE auctions SET status = "closed" WHERE id = ?').run(auctionId);
  
  // Deduct credits permanently from winner
  if (auction.highest_bidder_id) {
    db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(auction.current_bid, auction.highest_bidder_id);
  }

  const updatedAuction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(auctionId);
  broadcast('AUCTION_CLOSED', updatedAuction);
  res.json(updatedAuction);
});

// Bidding is now handled via WebSockets

// Reports
app.get('/api/reports/bids', authenticate, requireAdmin, (req, res) => {
  const bids = db.prepare(`
    SELECT b.*, a.title as auction_title, u.username as bidder_name
    FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(bids);
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }
}

setupVite().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
