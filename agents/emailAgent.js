import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendApprovalEmail = async (listings) => {
  if (!process.env.RESEND_API_KEY) return;
  
  try {
    let htmlContent = `<h2>Pending AI Listings</h2><p>There are ${listings.length} listings awaiting your review.</p><ul>`;
    for (const l of listings) {
      htmlContent += `<li><strong>${l.productName}</strong> - Rs. ${l.price} (Score: ${l.qualityScore})</li>`;
    }
    htmlContent += '</ul>';

    await resend.emails.send({
      from: 'AI Marketplace <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'ghadiswaroop5874@gmail.com',
      subject: `${listings.length} New Listings Awaiting Approval`,
      html: htmlContent
    });
    
    console.log('✅ Admin notification email sent.');
  } catch (err) {
    console.error('Error sending email:', err.message);
  }
};
