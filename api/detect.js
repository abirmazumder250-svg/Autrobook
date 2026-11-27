import fetch from 'node-fetch';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Keys from Vercel Environment Variables
const HIVE_ACCESS = process.env.HIVE_ACCESS_KEY;
const HIVE_SECRET = process.env.HIVE_SECRET_KEY;
const SIGHT_USER = process.env.SIGHTENGINE_USER;
const SIGHT_SECRET = process.env.SIGHTENGINE_SECRET;
const DEEPAI = process.env.DEEPAI_KEY;
const ZEROGPT = process.env.ZEROGPT_KEY;

// Main Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type'] || '';

  // CASE 1: IMAGE DETECTION
  if (contentType.includes('multipart/form-data')) {
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'File parse error' });
      
      const imagePath = files.image[0].filepath;
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Fallback Chain: Hive > Sightengine > DeepAI
      let result = await detectWithHiveImage(base64Image);
      if (!result) result = await detectWithSightengine(imagePath);
      if (!result) result = await detectWithDeepAI(base64Image);

      return res.status(200).json(result);
    });
  
  // CASE 2: TEXT DETECTION
  } else {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { text } = JSON.parse(body);
      if (!text) return res.status(400).json({ error: 'Text is required' });

      // Fallback Chain: Hive Text > ZeroGPT
      let result = await detectWithHiveText(text);
      if (!result) result = await detectWithZeroGPT(text);
      
      return res.status(200).json(result);
    });
  }
}

// 1. HIVE AI - IMAGE
async function detectWithHiveImage(base64) {
  try {
    const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_ACCESS}:${HIVE_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "models": ["ai-generated-content"],
        "data": [{ "type": "image", "data": base64 }]
      })
    });
    const data = await response.json();
    const score = data.response[0].score * 100;
    return {
      ai_score: score.toFixed(2),
      result: score > 70 ? "AI Generated" : "Human Created"
    };
  } catch { return null; }
}

// 2. SIGHTENGINE - IMAGE
async function detectWithSightengine(path) {
  try {
    const formData = new FormData();
    formData.append('media', fs.createReadStream(path));
    formData.append('models', 'genai');
    formData.append('api_user', SIGHT_USER);
    formData.append('api_secret', SIGHT_SECRET);

    const response = await fetch('https://api.sightengine.com/1.1/check.json', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    const score = data.genai * 100;
    return {
      ai_score: score.toFixed(2),
      result: score > 70 ? "AI Generated" : "Human Created"
    };
  } catch { return null; }
}

// 3. DEEPAI - IMAGE
async function detectWithDeepAI(base64) {
  try {
    const response = await fetch('https://api.deepai.org/api/ai-detector', {
      method: 'POST',
      headers: { 'api-key': DEEPAI },
      body: `image=${base64}`
    });
    const data = await response.json();
    const score = data.output.ai_probability * 100;
    return {
      ai_score: score.toFixed(2),
      result: score > 70 ? "AI Generated" : "Human Created"
    };
  } catch { return null; }
}

// 4. HIVE AI - TEXT
async function detectWithHiveText(text) {
  try {
    const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_ACCESS}:${HIVE_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "models": ["ai-generated-text"],
        "data": [{ "type": "text", "data": text }]
      })
    });
    const data = await response.json();
    const score = data.response[0].score * 100;
    return {
      ai_score: score.toFixed(2),
      result: score > 70 ? "AI Generated" : "Human Written"
    };
  } catch { return null; }
}

// 5. ZEROGPT - TEXT
async function detectWithZeroGPT(text) {
  try {
    const response = await fetch('https://api.zerogpt.com/api/detect', {
      method: 'POST',
      headers: {
        'ApiKey': ZEROGPT,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input_text: text })
    });
    const data = await response.json();
    const score = data.data.attributes.ai_score;
    return {
      ai_score: score,
      result: score > 70 ? "AI Generated" : "Human Written"
    };
  } catch { return null; }
          }
