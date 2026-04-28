import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { translate } from 'google-translate-api-x';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// AI Logic - Translation Engine (Using Google Translate API as the core)
const translateAI = async (text, sourceLang, targetLang) => {
  try {
    console.log(`Neural Processing: "${text}" | From: ${sourceLang} | To: ${targetLang}`);
    
    const options = { 
      from: sourceLang === 'auto' ? 'auto' : sourceLang,
      to: targetLang,
      forceBatch: false
    };

    const res = await translate(text, options);

    return {
      translatedText: res.text,
      sourceLang: res.from?.language?.iso || sourceLang, // Defensive access
      targetLang: targetLang,
      mode: 'Neural_Engine_V2_Live'
    };
  } catch (error) {
    console.error('Translation Engine Error:', error);
    throw error;
  }
};

// Routes
app.post('/api/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang are required.' });
  }

  try {
    const result = await translateAI(text, sourceLang || 'auto', targetLang);
    
    res.json({
      original_text: text,
      translated_text: result.translatedText,
      source_lang: result.sourceLang,
      target_lang: result.targetLang,
      mode_used: result.mode
    });

  } catch (error) {
    res.status(500).json({ error: 'Neural engine synchronization failed. Please try again.' });
  }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { text, target_lang } = req.body;
  try {
    const translation = await translateAI(text, 'auto', target_lang);
    res.json({
      ai_translated: `Neural AI Response to: ${translation.translatedText}`,
      ai_original: `AI Response in English`,
      target_lang: target_lang,
      mode_used: 'Chat_V2'
    });
  } catch (error) {
    res.status(500).json({ error: 'Chat engine offline.' });
  }
});

// History Endpoint (Mock)
app.get('/api/history', (req, res) => {
  res.json([]); // Return empty for now
});

// TTS Endpoint (Mock)
app.post('/api/tts', (req, res) => {
  res.status(501).json({ error: 'TTS service initialization required.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Neural Translate Node Backend', engine: 'Online' });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Neural Translate Backend Upgraded
  📡 Port: ${PORT}
  🔗 http://localhost:${PORT}/api/translate
  `);
});
