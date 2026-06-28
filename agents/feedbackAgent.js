import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const generateFeedbackMessage = async (missingFields, language, reason) => {
  try {
    const prompt = `You are a helpful assistant for local shop sellers. A seller submitted a product but it has issues.
Missing fields: ${missingFields.join(', ')}.
Rejection Reason: ${reason || 'Missing details'}.
Language: ${language}.

Write a very short, polite WhatsApp message in the seller's language telling them what is missing and asking them to reply with it.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
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

    return response.data.content[0].text;
  } catch (error) {
    console.error('Feedback Agent Error:', error.message);
    return `Please provide the following missing details: ${missingFields.join(', ')}. Reason: ${reason}`;
  }
};
