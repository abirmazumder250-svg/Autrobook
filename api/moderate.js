import fetch from 'node-fetch';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }
};

// Load keys from Vercel Environment Variables
const HIVE_ACCESS = process.env.HIVE_ACCESS_KEY;
const HIVE_SECRET = process.env.HIVE_SECRET_KEY;
const SIGHT_USER = process.env.SIGHTENGINE_USER;
const SIGHT_SECRET = process.env.SIGHTENGINE_SECRET;
const DEEPAI = process.env.DEEPAI_KEY;
const ZEROGPT = process.env.ZEROGPT_KEY;
const OPENAI = process.env.OPENAI_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: false, maxFileSize: 50 * 1024 * 1024 }); // 50MB max
  
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File parse error' });
    
    const text = fields.text ? fields.text[0] : "";
    const imageFile = files.image ? files.image[0] : null;
    const videoFile = files.video ? files.video[0] : null;
    
    let ai_score = 0;
    let toxicity_score = 0;
    let type = "text";
    let result = "Clean";

    // STEP 1: AI DETECTION - Auto for Image / Video / Text
    if (imageFile) {
      type = "image";
      const imageBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = imageBuffer.toString('base64');
      const aiResult = await detectAIImage(base64Image);
      ai_score = aiResult.ai_score;
      
    } else if (videoFile) {
      type = "video";
      const videoBuffer = fs.readFileSync(videoFile.filepath);
      const base64Video = videoBuffer.toString('base64');
      const aiResult = await detectAIVideo(base64Video);
      ai_score = aiResult.ai_score;

    } else if (text) {
      type = "text";
      const aiResult = await detectAIText(text);
      ai_score = aiResult.ai_score;
    }

    // STEP 2: TOXICITY / ABUSE DETECTION - Only for Text
    if (text && text.length > 3) {
      const toxicResult = await checkToxicity(text);
      toxicity_score = toxicResult.score;
    }

    // STEP 3: AUTO DECISION LOGIC
    let action = "allow";
    let badge = "";

    // Rule 1: Auto Suspend if Toxicity > 80%
    if (toxicity_score > 80) {
      action = "suspend";
      result = `Account Suspended. Toxicity: ${toxicity_score.toFixed(2)}%`;
    }
    // Rule 2: AI Badge if AI Score > 70%
    else if (ai_score > 70) {
      action = "badge";
      badge = "AI Generated";
      result = `${type} Posted with AI Badge. Score: ${ai_score.toFixed(2)}%`;
    }
    // Rule 3: Clean Post
    else {
      result = `${type} Posted Successfully. AI: ${ai_score.toFixed(2)}% | Toxic: ${toxicity_score.toFixed(2)}%`;
    }

    return res.status(200).json({
      action: action, // "suspend" | "badge" | "allow"
      badge: badge,
      type: type,
      ai_score: ai_score.toFixed(2),
      toxicity_score: toxicity_score.toFixed(2),
      message: result
    });
  });
}


// 1. AI IMAGE DETECTION - 3 Layer Fallback: Hive > Sightengine > DeepAI
async function detectAIImage(base64) {
  let result = await detectWithHiveImage(base64);
  if (!result || result.ai_score < 1) result = await detectWithSightengine(base64);
  if (!result || result.ai_score < 1) result = await detectWithDeepAI(base64);
  return result || { ai_score: 0 };
}

async function detectWithHiveImage(base64) {
  try {
    const res = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HIVE_ACCESS}:${HIVE_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "models": ["ai-generated-content"], "data": [{ "type": "image", "data": base64 }] })
    });
    const data = await res.json();
    return { ai_score: data.response[0].score * 100 };
  } catch { return null; }
}

async function detectWithSightengine(base64) {
  try {
    const formData = new FormData();
    formData.append('media', base64);
    formData.append('models', 'genai');
    formData.append('api_user', SIGHT_USER);
    formData.append('api_secret', SIGHT_SECRET);
    const res = await fetch('https://api.sightengine.com/1.1/check.json', { method: 'POST', body: formData });
    const data = await res.json();
    return { ai_score: (data.genai || 0) * 100 };
  } catch { return null; }
}

async function detectWithDeepAI(base64) {
  try {
    const res = await fetch('https://api.deepai.org/api/ai-detector', {
      method: 'POST',
      headers: { 'api-key': DEEPAI },
      body: `image=${base64}`
    });
    const data = await res.json();
    return { ai_score: (data.output.ai_probability || 0) * 100 };
  } catch { return null; }
}


// 2. AI VIDEO DETECTION - Hive Only
async function detectAIVideo(base64) {
  try {
    const res = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HIVE_ACCESS}:${HIVE_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "models": ["ai-generated-content"], "data": [{ "type": "video", "data": base64 }] })
    });
    const data = await res.json();
    return { ai_score: data.response[0].score * 100 };
  } catch { return { ai_score: 0 }; }
}


// 3. AI TEXT DETECTION - 2 Layer Fallback: Hive > ZeroGPT
async function detectAIText(text) {
  let result = await detectWithHiveText(text);
  if (!result || result.ai_score < 1) result = await detectWithZeroGPT(text);
  return result || { ai_score: 0 };
}

async function detectWithHiveText(text) {
  try {
    const res = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HIVE_ACCESS}:${HIVE_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ "models": ["ai-generated-text"], "data": [{ "type": "text", "data": text }] })
    });
    const data = await res.json();
    return { ai_score: data.response[0].score * 100 };
  } catch { return null; }
}

async function detectWithZeroGPT(text) {
  try {
    const res = await fetch('https://api.zerogpt.com/api/detect', {
      method: 'POST',
      headers: { 'ApiKey': ZEROGPT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: text })
    });
    const data = await res.json();
    return { ai_score: data.data.attributes.ai_score };
  } catch { return null; }
}


// 4. TOXICITY / ABUSE DETECTION - OpenAI Moderation API
async function checkToxicity(text) {
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${OPENAI}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ input: text })
    });
    const data = await res.json();
    
    // Get harassment score 0-100
    const harassmentScore = data.results[0].category_scores['harassment'] * 100;
    return { score: harassmentScore };
  } catch (e) { 
    console.log("Moderation error:", e)
    return { score: 0 }; 
  }
      }
