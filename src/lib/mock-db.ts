import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'mock_db.json');

export function saveMockProfile(type: 'leetcode' | 'hackerrank', userId: string, data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(DB_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
    if (!db[userId]) db[userId] = {};
    db[userId][type] = data;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save mock db', e);
  }
}

export function getMockProfile(type: 'leetcode' | 'hackerrank', userId: string) {
  try {
    if (fs.existsSync(DB_PATH)) {
      const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (db[userId] && db[userId][type]) {
        return db[userId][type];
      }
    }
  } catch (e) {
    console.error('Failed to read mock db', e);
  }
  return null;
}
