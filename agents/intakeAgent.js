import axios from 'axios';
import { db } from '../fcmService.js';
import { processProductImage } from './imageAgent.js';
import { runValidationAgent } from './validationAgent.js';
import { sendApprovalEmail } from './emailAgent.js';
import { sendMessage } from '../whatsappConnection.js';
import dotenv from 'dotenv';
dotenv.config();

// Store conversation history per seller (in memory)
const sellerConversations = new Map();

export async function processIncomingMessage({ sender, text, imageMsg, sock }) {
  try {
    // Skip group messages
    if (sender.includes('@g.us')) return;
    
    // Get or create conversation history for this seller
    if (!sellerConversations.has(sender)) {
      sellerConversations.set(sender, []);
    }
    const history = sellerConversations.get(sender);
    
    // Add seller message to history
    history.push({ role: 'user', content: text || '[Image sent]' });
    
    // System prompt
    const systemPrompt = `You are a WhatsApp assistant for MyCityMart marketplace helping local store sellers list products.

Your job:
1. Understand seller messages in ANY language (Marathi, Hindi, English, mix)
2. Extract product details from natural casual messages
3. Create product listings when you have enough info

EXTRACTION RULES:
- If message has product name + price → IMMEDIATELY create listing, respond with JSON
- If only price missing → ask price casually in seller's language  
- If only name unclear → ask product name casually
- NEVER ask for info you already have
- NEVER send same message twice

RESPONSE FORMAT:
If you have enough info to create a listing, respond with ONLY this JSON:
{"action":"CREATE_LISTING","product_name":"...","price":000,"stock":0,"description":"...","language":"marathi/hindi/english"}

If you need more info, respond with ONLY this JSON:
{"action":"ASK","message":"your casual friendly question in seller's language"}

Examples:
- "soap 50 rs 100 piece" → {"action":"CREATE_LISTING","product_name":"Soap","price":50,"stock":100,"description":"Soap","language":"english"}
- "JQR Running Shoes price 668" → {"action":"CREATE_LISTING","product_name":"JQR Running Shoes","price":668,"stock":1,"description":"JQR Running Shoes","language":"english"}
- "product aahe" → {"action":"ASK","message":"कोणता product आहे आणि किंमत किती? 😊"}`;

    // Call Claude via Axios
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: history.slice(-6) // Keep last 6 messages for context
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const claudeText = response.data.content[0].text.trim();
    console.log('Claude response:', claudeText);
    
    // Parse Claude response
    let parsed;
    try {
      // Extract JSON from response
      const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch[0]);
    } catch(e) {
      console.error('Parse error:', e);
      // Fallback - ask naturally
      await sendMessage(sender, "Arre product details sanga na! Name ani price? 😊");
      return;
    }

    if (parsed.action === 'ASK') {
      // Add assistant response to history
      history.push({ role: 'assistant', content: parsed.message });
      await sendMessage(sender, parsed.message);
      return;
    }

    if (parsed.action === 'CREATE_LISTING') {
      // Clear conversation history after successful extraction
      sellerConversations.delete(sender);
      
      // Process image if sent
      let processedImageUrl = null;
      if (imageMsg) {
        try {
          const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
          const imageBuffer = await downloadMediaMessage(
            { key: { remoteJid: sender }, message: { imageMessage: imageMsg } },
            'buffer',
            {},
            { logger: { level: 'silent', trace: ()=>{}, debug: ()=>{}, info: ()=>{}, warn: ()=>{}, error: ()=>{}, fatal: ()=>{}, child: ()=>({ level: 'silent', trace: ()=>{}, debug: ()=>{}, info: ()=>{}, warn: ()=>{}, error: ()=>{}, fatal: ()=>{}, child: ()=>{} }) }, reuploadRequest: sock.updateMediaMessage }
          );
          processedImageUrl = await processProductImage(imageBuffer);
        } catch (imgErr) {
          console.error('⚠️ Image processing failed:', imgErr.message);
        }
      }

      // Register seller if new
      const sellerRef = db.collection('sellers').doc(sender);
      const sellerDoc = await sellerRef.get();
      if (!sellerDoc.exists) {
        await sellerRef.set({
          phone: sender,
          language: parsed.language || 'english',
          totalSubmissions: 0,
          approvedCount: 0,
          createdAt: new Date()
        });
      }
      await sellerRef.update({ 
        totalSubmissions: (sellerDoc.exists ? (sellerDoc.data().totalSubmissions || 0) : 0) + 1 
      });

      // Validate listing
      const validation = runValidationAgent({
        product_name: parsed.product_name,
        price: parsed.price,
        stock: parsed.stock || 1,
        category: parsed.category || 'General',
        description: parsed.description
      });

      // Save to Firestore
      const listingRef = await db.collection('listings').add({
        sellerId: sender,
        productName: parsed.product_name,
        price: parsed.price,
        stock: parsed.stock || 1,
        category: parsed.category || 'General',
        description: parsed.description || '',
        imageUrl: processedImageUrl || null,
        processedImageUrl: processedImageUrl || null,
        qualityScore: validation.score || 70,
        status: 'PENDING',
        language: parsed.language,
        createdAt: new Date()
      });

      console.log('✅ Listing saved:', listingRef.id);

      // Send confirmation to seller
      const confirmMsg = parsed.language === 'marathi' 
        ? `✅ "${parsed.product_name}" listing ready झाली! Admin approve केल्यावर तुम्हाला कळवतो 🙏`
        : parsed.language === 'hindi'
        ? `✅ "${parsed.product_name}" listing taiyar! Admin approve karega toh batayenge 🙏`
        : `✅ "${parsed.product_name}" listing is ready! Admin will review and notify you 🙏`;
      
      await sendMessage(sender, confirmMsg);

      // Send email to admin
      try {
        await sendApprovalEmail([{
          productName: parsed.product_name,
          price: parsed.price,
          qualityScore: validation.score || 70
        }]);
        console.log('✅ Email sent to admin');
      } catch(e) {
        console.error('Email error:', e);
      }
    }

  } catch (err) {
    console.error('❌ processIncomingMessage error:', err);
  }
}
