import { runIntakeAgent } from './intakeAgent.js';
import { processProductImage } from './imageAgent.js';
import { runValidationAgent } from './validationAgent.js';
import { generateFeedbackMessage } from './feedbackAgent.js';
import { sendApprovalEmail } from './emailAgent.js';
import { db } from '../fcmService.js';
import { sendMessage } from '../whatsappConnection.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export { runIntakeAgent };

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

    if (!parsedData || parsedData.message_type !== 'NEW_PRODUCT') {
      // Not a product submission — send a helpful reply
      const replyText = '👋 Namaste! Product add karaycha asel tar please ya format madhe pathva:\n\nProduct: [Name]\nPrice: [Price]\nStock: [Quantity]\n\nAni product cha photo pan pathva!';
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

    // 6. If REJECTED — send feedback to seller
    if (validationResult.status === 'REJECTED') {
      const feedback = await generateFeedbackMessage(
        validationResult.missing_fields,
        parsedData.language_detected || 'english',
        'Missing required fields'
      );
      await sock.sendMessage(sender, { text: feedback });
      await db.collection('messages').add({
        sellerId: senderPhone,
        direction: 'OUT',
        text: feedback,
        timestamp: new Date()
      });
    } else {
      // 7. PENDING — notify admin via email + confirm to seller
      await sendApprovalEmail([{
        productName: parsedData.product_name,
        price: parsedData.price,
        qualityScore: validationResult.score
      }]);

      const successMsg = `✅ Dhanyavaad! Tumcha product "${parsedData.product_name}" successfully submit zala aahe!\n\n📋 AI Score: ${validationResult.score}/100\n⏳ Status: Admin approval pending\n\nTumhala notification milel jeva approve hoil!`;
      await sock.sendMessage(sender, { text: successMsg });
      await db.collection('messages').add({
        sellerId: senderPhone,
        direction: 'OUT',
        text: successMsg,
        timestamp: new Date()
      });
    }

  } catch (err) {
    console.error('❌ processIncomingMessage error:', err);
    // Send error reply to seller
    try {
      await sock.sendMessage(sender, { text: '⚠️ Sorry, kahi technical issue aahe. Please thoda vel thamba ani parat try kara.' });
    } catch (e) { /* ignore */ }
  }
}
