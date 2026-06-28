import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let sock = null;
let currentQR = null;
let isConnected = false;
let connectedPhone = null;

export const getQRCode = () => currentQR;
export const getStatus = () => ({ connected: isConnected, phone: connectedPhone });

export async function connectWhatsApp(onMessage) {
  const sessionPath = join(__dirname, 'whatsapp_session');
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: { level: 'silent', trace: ()=>{}, debug: ()=>{}, info: ()=>{}, warn: ()=>{}, error: ()=>{}, fatal: ()=>{}, child: ()=>({ level: 'silent', trace: ()=>{}, debug: ()=>{}, info: ()=>{}, warn: ()=>{}, error: ()=>{}, fatal: ()=>{}, child: ()=>{} }) }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 New QR generated — open http://localhost:5000/api/whatsapp/qr in browser');
      currentQR = await qrcode.toDataURL(qr);
    }

    if (connection === 'open') {
      isConnected = true;
      currentQR = null;
      connectedPhone = sock.user?.id?.split(':')[0] || 'Connected';
      console.log('✅ WhatsApp connected! Phone:', connectedPhone);
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        : true;
      console.log('🔴 WhatsApp disconnected. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp(onMessage), 3000);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && onMessage) {
        await onMessage(msg, sock);
      }
    }
  });

  return sock;
}

export function sendMessage(phone, text) {
  if (!sock || !isConnected) throw new Error('WhatsApp not connected');
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  return sock.sendMessage(jid, { text });
}
