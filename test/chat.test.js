import test from 'node:test';
import assert from 'node:assert/strict';
import chat from '../api/chat.js';
import { signToken, COOKIE_NAME } from '../lib/auth.js';
import { createReq, createRes } from './utils.js';

process.env.JWT_SECRET = 'test-secret';

test('chat requires authentication', async () => {
  const req = createReq('POST', { message: 'hi' });
  const res = createRes();
  await chat(req, res);
  assert.equal(res.statusCode, 401);
});

test('chat returns reply for authenticated request', async () => {
  global.fetch = async () => ({
    json: async () => ({ choices: [{ message: { content: 'ok' } }] })
  });
  const token = signToken('u');
  const req = createReq('POST', { message: 'hi' }, `${COOKIE_NAME}=${token}`);
  const res = createRes();
  await chat(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reply, 'ok');
});
