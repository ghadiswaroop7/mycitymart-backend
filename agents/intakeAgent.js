
import { processProductImage } from './imageAgent.js';
import { runValidationAgent } from './validationAgent.js';
import { generateFeedbackMessage } from './feedbackAgent.js';
import { sendApprovalEmail } from './emailAgent.js';
import { db } from '../fcmService.js';
import { sendMessage } from '../whatsappConnection.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const runIntakeAgent = async (messageText, senderPhone, hasImage) => {
  try {
    const prompt = `You are a friendly WhatsApp business assistant for MyCityMart marketplace. Local store sellers message you to list their products.

CRITICAL RULES:
1. Understand ANY natural language - Marathi, Hindi, English or mix
2. Extract product details from casual messages - sellers will NOT use a fixed format
3. If you can understand the product from context, proceed with listing
4. Only ask for missing CRITICAL info (price OR product name) in a very casual friendly way
5. NEVER send a rigid format template message
6. Talk like a helpful friend, not a robot
7. Match seller's language automatically

Examples of messages you should understand:
- "soap 50 ka hai 100 piece" → Product: Soap, Price: 50, Stock: 100
- "bhai lipstick aahe 200 rs madhe" → Product: Lipstick, Price: 200
- "cement 5 bag available 300 each" → Product: Cement, Price: 300, Stock: 5
- "nava stock aala sarees 500 pcs 800 rupaye" → Saree, 800rs, 500 stock

If price is missing, ask casually:
Marathi: "अरे किंमत सांग ना! 😊"
Hindi: "bhai kitne mein doge? 😊"  
English: "Hey what's the price? 😊"

If product name unclear, ask:
Marathi: "कोणता product आहे? 😊"
Hindi: "kaunsa product hai bhai? 😊"

Seller Message:
"${messageText}"

Output ONLY a JSON object:
{
  "message_type": "NEW_PRODUCT" | "QUERY" | "UNCLEAR",
  "language_detected": "marathi" | "hindi" | "english",
  "product_name": "...",
  "category": "...",
  "price": 0,
  "stock": 0,
  "description": "...",
  "missing_fields": ["price", "product_name"],
  "clarification_question": "..." (put the friendly question here if price or product_name is missing, else null)
}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const resultText = response.data.content[0].text;
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI JSON response");
    
    const parsedData = JSON.parse(jsonMatch[0]);
    if (!hasImage && !parsedData.missing_fields.includes("image")) {
      parsedData.missing_fields.push("image");
    }
    return parsedData;

  } catch (error) {
    console.error('Intake Agent Error:', error.message);
    return null;
  }
};

/**
 * Full AI pipeline: processes an incoming WhatsApp message end-to-end.
 * Called from server.js connectWhatsApp callback.
 */
export async function processIncomingMessage({ sender, text, imageMsg, sock }) {
  const senderPhone = sender.split('@')[0];

  try {
    // 1. Register seller if new
    const sellerRef = db.collection('sellers').doc(senderPhone);
    const sellerDoc = await sellerRef.get();
    if (!sellerDoc.exists) {
      await sellerRef.set({
        phone: senderPhone,
        name: 'Unknown Seller',
        language: 'english',
        totalSubmissions: 0,
        approvedCount: 0,
        createdAt: new Date()
      });
    }

    // 2. Run AI Intake Agent to classify & extract product info
    const hasImage = !!imageMsg;
    const parsedData = await runIntakeAgent(text, senderPhone, hasImage);

    if (!parsedData || parsedData.message_type !== 'NEW_PRODUCT' || !parsedData.product_name || !parsedData.price) {
      // Missing critical info or unclear, send a friendly clarification question
      let replyText = parsedData?.clarification_question;
      if (!replyText) {
         if (parsedData?.language_detected === 'marathi') replyText = '👋 नमस्ते! तुम्हाला प्रॉडक्ट ॲड करायचा आहे का? कृपया प्रॉडक्टचं नाव आणि किंमत सांगा. 😊';
         else if (parsedData?.language_detected === 'hindi') replyText = '👋 नमस्ते! क्या आप प्रोडक्ट ऐड करना चाहते हैं? कृपया प्रोडक्ट का नाम और कीमत बताएं. 😊';
         else replyText = '👋 Hello! Do you want to add a product? Please tell me the product name and price. 😊';
      }
      
      await sock.sendMessage(sender, { text: replyText });
      await db.collection('messages').add({
        sellerId: senderPhone,
        direction: 'OUT',
        text: replyText,
        timestamp: new Date()
      });
      return;
    }

    // 3. Process image if present
    let processedImageUrl = null;
    if (hasImage && imageMsg) {
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

    // 4. Validation Agent — score the listing
    const validationResult = runValidationAgent(parsedData);

    // 5. Save listing to Firestore
    const listingRef = await db.collection('listings').add({
      sellerId: senderPhone,
      productName: parsedData.product_name || 'Unknown',
      price: parsedData.price || 0,
      stock: parsedData.stock || 0,
      category: parsedData.category || 'Uncategorized',
      description: parsedData.description || '',
      imageUrl: processedImageUrl || null,
      processedImageUrl: processedImageUrl || null,
      qualityScore: validationResult.score,
      status: validationResult.status,
      createdAt: new Date()
    });

    console.log(`📦 Listing saved: ${listingRef.id} | Score: ${validationResult.score} | Status: ${validationResult.status}`);

    // Update seller stats
    const currentSubmissions = sellerDoc.exists ? (sellerDoc.data().totalSubmissions || 0) : 0;
    await sellerRef.update({ totalSubmissions: currentSubmissions + 1 });

    // 6. We have Name + Price -> Automatically proceed to PENDING without rigid loops
    await sendApprovalEmail([{
      productName: parsedData.product_name,
      price: parsedData.price,
      qualityScore: validationResult.score
    }]);

    let successMsg = `✅ ${parsedData.product_name} listing ready! Admin review karun approve karil, mg tumhala kalvto 🙏`;
    if (parsedData.language_detected === 'hindi') {
      successMsg = `✅ ${parsedData.product_name} listing taiyar! Admin approve karega toh batayenge 🙏`;
    } else if (parsedData.language_detected === 'english') {
      successMsg = `✅ ${parsedData.product_name} listing is ready! We will let you know once the admin approves it 🙏`;
    }

    await sock.sendMessage(sender, { text: successMsg });
    await db.collection('messages').add({
      sellerId: senderPhone,
      direction: 'OUT',
      text: successMsg,
      timestamp: new Date()
    });

  } catch (err) {
    console.error('❌ processIncomingMessage error:', err);
    // Send error reply to seller
    try {
      await sock.sendMessage(sender, { text: '⚠️ Sorry, kahi technical issue aahe. Please thoda vel thamba ani parat try kara.' });
    } catch (e) { /* ignore */ }
  }
}
