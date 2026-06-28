import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db } from './fcmService.js';
import { connectWhatsApp, getQRCode, getStatus, sendMessage } from './whatsappConnection.js';
import { processIncomingMessage } from './agents/intakeAgent.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jhatpat';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔴 Client disconnected:', socket.id));
});

app.set('io', io);

app.get('/', (req, res) => res.send('Jhat-Pat Backend API is running!'));

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import coreRoutes from './routes/core.js';
import transactionRoutes from './routes/transactions.js';
import { startNotificationWorker } from './fcmService.js';

app.use('/api/admin', authRoutes);
app.use('/api', productRoutes);
app.use('/api', coreRoutes);
app.use('/api', transactionRoutes);

startNotificationWorker();

// Start WhatsApp with AI Agent pipeline
connectWhatsApp(async (msg, sock) => {
  try {
    const sender = msg.key.remoteJid;
    if (!sender || sender === 'status@broadcast') return;

    const messageText = msg.message?.conversation ||
                       msg.message?.extendedTextMessage?.text || '';
    const imageMsg = msg.message?.imageMessage || null;

    console.log('📨 Message from:', sender, ':', messageText || '[Image]');

    // Save incoming message to Firestore
    await db.collection('messages').add({
      sellerId: sender.split('@')[0],
      direction: 'IN',
      text: messageText || (imageMsg ? '[Image]' : ''),
      timestamp: new Date(),
      hasImage: !!imageMsg
    });

    // Process with full AI agent pipeline
    await processIncomingMessage({
      sender,
      text: messageText,
      imageMsg,
      sock
    });

  } catch (err) {
    console.error('❌ Message processing error:', err);
  }
}).catch(err => console.error('❌ WhatsApp failed:', err));

// --- WHATSAPP QR PAGE ---
app.get('/api/whatsapp/qr', (req, res) => {
  const qr = getQRCode();
  const status = getStatus();

  if (status.connected) {
    return res.send(`
      <html><body style="display:flex;flex-direction:column;align-items:center;
      justify-content:center;height:100vh;background:#111;color:#25D366;
      font-family:sans-serif;text-align:center;">
        <div style="font-size:60px;">✅</div>
        <h2>WhatsApp Connected!</h2>
        <p style="color:#aaa;">Phone: ${status.phone}</p>
        <p style="color:#666;font-size:14px;">Server is receiving messages automatically</p>
      </body></html>
    `);
  }

  if (!qr) {
    return res.send(`
      <html><body style="display:flex;flex-direction:column;align-items:center;
      justify-content:center;height:100vh;background:#111;color:white;
      font-family:sans-serif;text-align:center;">
        <div style="font-size:60px;">⏳</div>
        <h2>Generating QR Code...</h2>
        <p style="color:#aaa;">Please wait, refreshing in 5 seconds</p>
        <script>setTimeout(()=>location.reload(), 5000)</script>
      </body></html>
    `);
  }

  return res.send(`
    <html><body style="display:flex;flex-direction:column;align-items:center;
    justify-content:center;height:100vh;background:#111;color:white;
    font-family:sans-serif;text-align:center;">
      <div style="font-size:40px;">📱</div>
      <h2 style="color:#25D366;">Scan with WhatsApp</h2>
      <p style="color:#aaa;">WhatsApp → Linked Devices → Link a Device</p>
      <img src="${qr}" style="width:280px;height:280px;
        border:4px solid #25D366;border-radius:16px;margin:16px 0;"/>
      <p style="color:#555;font-size:13px;">Auto-refreshes every 20 seconds</p>
      <script>setTimeout(()=>location.reload(), 20000)</script>
    </body></html>
  `);
});

app.get('/api/whatsapp/status', (req, res) => {
  res.json(getStatus());
});

// --- RECENT MESSAGES API ---
app.get('/api/messages/recent', async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(messages);
  } catch (err) {
    console.error('Messages fetch error:', err);
    res.json([]);
  }
});

// --- LISTINGS APPROVE/REJECT ---
app.post('/api/listings/approve/:id', async (req, res) => {
  try {
    const listingRef = db.collection('listings').doc(req.params.id);
    const listingDoc = await listingRef.get();
    if (!listingDoc.exists) return res.status(404).json({ error: 'Listing not found' });
    const listing = listingDoc.data();

    await listingRef.update({ status: 'APPROVED' });

    await db.collection('products').add({
      name: listing.productName,
      price: listing.price,
      stock: listing.stock,
      category: listing.category,
      shop_id: listing.sellerId,
      images: [listing.processedImageUrl || listing.imageUrl],
      status: 'active',
      createdAt: new Date()
    });

    const sellerRef = db.collection('sellers').doc(listing.sellerId);
    const sellerDoc = await sellerRef.get();
    const currentCount = sellerDoc.exists ? (sellerDoc.data().approvedCount || 0) : 0;
    await sellerRef.update({ approvedCount: currentCount + 1 });

    await sendMessage(listing.sellerId,
      `🎉 तुमचा product "${listing.productName}" आता marketplace वर LIVE आहे!`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve listing' });
  }
});

app.post('/api/listings/reject/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    const listingRef = db.collection('listings').doc(req.params.id);
    const listingDoc = await listingRef.get();
    if (!listingDoc.exists) return res.status(404).json({ error: 'Listing not found' });
    const listing = listingDoc.data();

    await listingRef.update({ status: 'REJECTED' });

    await sendMessage(listing.sellerId,
      `❌ "${listing.productName}" approve nahi zala. Reason: ${reason || 'Guidelines meet nahi zhala.'} Please fix and resubmit.`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject listing' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
