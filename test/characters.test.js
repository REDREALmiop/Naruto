import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import characters from '../api/characters.js';
import { signToken, COOKIE_NAME } from '../lib/auth.js';
import { createReq, createRes } from './utils.js';

process.env.JWT_SECRET = 'test-secret';
const cookie = `${COOKIE_NAME}=${signToken('u')}`;
const dbPath = path.join(process.cwd(), 'data', 'characters.json');

async function resetDb() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, '{}');
}

test('character CRUD flow', async () => {
  await resetDb();
  let req = createReq('POST', { name: 'Naruto', clan: 'Uzumaki' }, cookie);
  let res = createRes();
  await characters(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body[0].name, 'Naruto');

  req = createReq('PUT', { name: 'Sasuke' }, cookie);
  req.query = { index: '0' };
  res = createRes();
  await characters(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].name, 'Sasuke');

  req = createReq('DELETE', {}, cookie);
  req.query = { index: '0' };
  res = createRes();
  await characters(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 0);
});

test('update requires index', async () => {
  await resetDb();
  const req = createReq('PUT', { name: 'x' }, cookie);
  const res = createRes();
  await characters(req, res);
  assert.equal(res.statusCode, 400);
});
