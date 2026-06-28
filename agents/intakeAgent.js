import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const runIntakeAgent = async (messageText, senderPhone, hasImage) => {
  try {
    const prompt = `You are the Intake Agent. A seller sent this message:
"${messageText}"

Classify the message and extract details.
Output ONLY a JSON object:
{
  "message_type": "NEW_PRODUCT" | "QUERY" | "UNCLEAR",
  "language_detected": "marathi" | "hindi" | "english",
  "product_name": "...",
  "category": "...",
  "price": 0,
  "stock": 0,
  "description": "...",
  "missing_fields": ["price", "stock", "image" (if has_image is false)]
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
