import fs from 'fs/promises';
import path from 'path';
import { requireUser } from '../lib/auth.js';

const DB_PATH = path.join(process.cwd(), 'data', 'characters.json');

async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeDb(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db));
}

function normalizeCharacter(c = {}) {
  const clamp = (str, max = 50) => String(str || '').slice(0, max);
  return {
    name: clamp(c.name, 50),
    clan: clamp(c.clan, 50),
    element: clamp(c.element, 50),
    description: clamp(c.description, 200)
  };
}

export default async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  const db = await readDb();
  const list = db[user] || [];

  if (req.method === 'GET') {
    res.status(200).json(list);
  } else if (req.method === 'POST') {
    const character = normalizeCharacter(req.body);
    list.push(character);
    db[user] = list;
    await writeDb(db);
    res.status(201).json(list);
  } else if (req.method === 'PUT') {
    const { index } = req.query || {};
    if (index === undefined) {
      res.status(400).json({ error: 'Missing index' });
      return;
    }
    const character = normalizeCharacter(req.body);
    list[Number(index)] = character;
    db[user] = list;
    await writeDb(db);
    res.status(200).json(list);
  } else if (req.method === 'DELETE') {
    const { index } = req.query || {};
    if (index === undefined) {
      res.status(400).json({ error: 'Missing index' });
      return;
    }
    list.splice(Number(index), 1);
    db[user] = list;
    await writeDb(db);
    res.status(200).json(list);
  } else {
    res.status(405).end();
  }
}
