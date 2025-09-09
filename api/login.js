import crypto from 'crypto';
import { setSession, clearSession, requireUser } from '../lib/auth.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Missing credentials' });
      return;
    }
    const hash = crypto.createHash('sha256').update(password).digest();
    const expectedHex = process.env.APP_PASSWORD_HASH || '';
    const expected = Buffer.from(expectedHex, 'hex');
    const provided = Buffer.from(hash);
    const match =
      expected.length === provided.length && crypto.timingSafeEqual(provided, expected);
    if (match) {
      setSession(res, username);
      res.status(200).json({ ok: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else if (req.method === 'GET') {
    const user = requireUser(req, res);
    if (user) res.status(200).json({ username: user });
  } else if (req.method === 'DELETE') {
    clearSession(res);
    res.status(200).json({ ok: true });
  } else {
    res.status(405).end();
  }
}
