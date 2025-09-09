import crypto from 'crypto';

export const COOKIE_NAME = 'session';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signToken(username) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })
  );
  const data = `${header}.${payload}`;
  const sig = base64url(crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

function verifyToken(token) {
  const [headerB64, payloadB64, sig] = token.split('.');
  if (!headerB64 || !payloadB64 || !sig) throw new Error('Malformed token');
  const data = `${headerB64}.${payloadB64}`;
  const expected = base64url(
    crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest()
  );
  if (sig !== expected) throw new Error('Bad signature');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Expired');
  return payload.username;
}

export function setSession(res, username) {
  const token = signToken(username);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
  );
}

export function clearSession(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
  );
}

export function requireUser(req, res) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[COOKIE_NAME];
    if (!token) throw new Error('Missing token');
    const username = verifyToken(token);
    return username;
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

function parseCookies(str) {
  return Object.fromEntries(
    str
      .split(';')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const idx = v.indexOf('=');
        const key = v.substring(0, idx);
        const val = decodeURIComponent(v.substring(idx + 1));
        return [key, val];
      })
  );
}
