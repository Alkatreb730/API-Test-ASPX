// backend/forecast_routes.js
// Endpoint for 1-minute forecasts. Uses local ML service if available, otherwise falls back to OpenAI simple heuristic.

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';

// Helper to call ML microservice
async function callML(asset) {
  try {
    const url = `${ML_SERVICE}?asset=${encodeURIComponent(asset)}`;
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('ML call failed', e.message || e);
    return null;
  }
}

// Fallback: quick OpenAI prompt-based forecast (lightweight, low tokens)
async function callOpenAIFallback(asset) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const prompt = `Provide a one-line 1-minute directional forecast for asset "${asset}" as one of: + (up), - (down), 0 (neutral). Also provide a short confidence percent and one-sentence reason. Format: prediction|confidence|reason`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-thinking-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.2
      })
    });
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content?.trim();
    if (!txt) return null;
    // Expect format like: +|72%|Reason...
    const parts = txt.split('|').map(s => s.trim());
    return {
      prediction: parts[0] || '0',
      confidence: parts[1] || '50%',
      reason: parts.slice(2).join(' | ') || txt
    };
  } catch (e) {
    console.warn('OpenAI fallback failed', e.message || e);
    return null;
  }
}

router.get('/forecast', async (req, res) => {
  const asset = req.query.asset || req.query.a || 'BTC/USD';
  // 1) try ML microservice
  const ml = await callML(asset);
  if (ml && (ml.prediction || ml.value)) {
    return res.json({
      source: 'ml_service',
      asset,
      prediction: ml.prediction || '0',
      confidence: ml.confidence || (ml.confidence_pct ? `${ml.confidence_pct}%` : '50%'),
      value: ml.value || null,
      note: ml.note || null
    });
  }
  // 2) fallback to OpenAI
  const oa = await callOpenAIFallback(asset);
  if (oa) {
    return res.json({
      source: 'openai_fallback',
      asset,
      prediction: oa.prediction || '0',
      confidence: oa.confidence || '50%',
      reason: oa.reason || null
    });
  }
  // 3) default neutral
  return res.json({ source: 'none', asset, prediction: '0', confidence: '0%', reason: 'No model available' });
});

module.exports = router;
