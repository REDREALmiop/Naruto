import { requireUser } from '../lib/auth.js';

const limits = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  const now = Date.now();
  const entry = limits.get(user) || { count: 0, time: now };
  if (now - entry.time > 60_000) {
    entry.count = 0;
    entry.time = now;
  }
  entry.count++;
  limits.set(user, entry);
  if (entry.count > 5) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }]
      })
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed' });
  }
}
