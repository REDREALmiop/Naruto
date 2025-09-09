import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import login from '../api/login.js';
import { COOKIE_NAME } from '../lib/auth.js';
import { createReq, createRes } from './utils.js';

process.env.JWT_SECRET = 'test-secret';
process.env.APP_PASSWORD_HASH = crypto.createHash('sha256').update('pass').digest('hex');

test('login rejects invalid credentials', () => {
  const req = createReq('POST', { username: 'u', password: 'wrong' });
  const res = createRes();
  login(req, res);
  assert.equal(res.statusCode, 401);
});

test('login sets session cookie on success', () => {
  const req = createReq('POST', { username: 'u', password: 'pass' });
  const res = createRes();
  login(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['set-cookie'].startsWith(`${COOKIE_NAME}=`));
});
