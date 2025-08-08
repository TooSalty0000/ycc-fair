import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3.Database
    });
    
    await initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  await db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game words table
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      activated_at DATETIME NULL,
      completed_at DATETIME NULL,
      required_completions INTEGER DEFAULT 5
    );

    -- User submissions table
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      points INTEGER NOT NULL,
      confidence INTEGER DEFAULT 0,
      image_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (word_id) REFERENCES words (id),
      UNIQUE(user_id, word_id) -- Prevent duplicate submissions for same word
    );

    -- Coupons earned table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      coupon_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      prize_description TEXT DEFAULT 'Special booth prize',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_word_id ON submissions(word_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
    CREATE INDEX IF NOT EXISTS idx_words_active ON words(is_active);
  `);

  // Insert initial word list if empty
  const wordCount = await db.get('SELECT COUNT(*) as count FROM words');
  if (wordCount.count === 0) {
    await insertInitialWords();
  }

  // Ensure there's always an active word
  await ensureActiveWord();
  
  // Add is_admin column if it doesn't exist
  await addAdminColumn();
  
  // Migrate existing tokens to new coupons table
  await migrateToCoupons();
  
  // Create admin user if doesn't exist
  await createAdminUser();
}

async function insertInitialWords() {
  const initialWords = [
    'apple', 'book', 'chair', 'dog', 'elephant', 'flower', 'guitar', 'house',
    'ice', 'jacket', 'key', 'lamp', 'mountain', 'notebook', 'ocean', 'pencil',
    'queen', 'rainbow', 'sun', 'tree', 'umbrella', 'violin', 'water', 'xray',
    'yacht', 'zebra', 'backpack', 'camera', 'diamond', 'eagle', 'fire', 'glass',
    'helmet', 'island', 'jungle', 'kite', 'lighthouse', 'mirror', 'nest', 'owl',
    'piano', 'quilt', 'rocket', 'star', 'telescope', 'unicorn', 'valley', 'whale',
    'xenon', 'yarn', 'zoo', 'airplane', 'bridge', 'castle', 'door', 'engine',
    'forest', 'garden', 'horizon', 'igloo', 'jewel', 'kitchen', 'library', 'maze'
  ];

  const stmt = await db.prepare('INSERT INTO words (word) VALUES (?)');
  for (const word of initialWords) {
    await stmt.run(word);
  }
  await stmt.finalize();
}

async function ensureActiveWord() {
  const activeWord = await db.get('SELECT * FROM words WHERE is_active = TRUE LIMIT 1');
  
  if (!activeWord) {
    // Get a random word that hasn't been completed
    const nextWord = await db.get(`
      SELECT * FROM words 
      WHERE completed_at IS NULL 
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    
    if (nextWord) {
      await db.run(
        'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE id = ?',
        nextWord.id
      );
    }
  }
}

async function addAdminColumn() {
  // Check if is_admin column exists
  const columns = await db.all(`PRAGMA table_info(users)`);
  const hasAdminColumn = columns.some(col => col.name === 'is_admin');
  
  if (!hasAdminColumn) {
    await db.run(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
    console.log('Added is_admin column to users table');
  }
}

async function migrateToCoupons() {
  // Check if tokens table exists and has data
  const tokenExists = await db.get(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'
  `);
  
  if (tokenExists) {
    // Get all existing tokens
    const existingTokens = await db.all('SELECT * FROM tokens');
    
    // Migrate to coupons table
    for (const token of existingTokens) {
      const couponCode = generateCouponCode();
      await db.run(`
        INSERT OR IGNORE INTO coupons (user_id, word, coupon_code, created_at)
        VALUES (?, ?, ?, ?)
      `, token.user_id, token.word, couponCode, token.created_at);
    }
    
    // Drop old tokens table after migration
    // await db.run('DROP TABLE tokens');
    // Note: Keeping both tables for now to ensure no data loss
  }
}

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `YCC-${result}`;
}

async function createAdminUser() {
  // Check if admin user already exists
  const existingAdmin = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  
  if (!existingAdmin) {
    const bcrypt = require('bcryptjs');
    const adminPasswordHash = await bcrypt.hash('YCCAdmin', 12);
    
    await db.run(`
      INSERT INTO users (username, password_hash, is_admin)
      VALUES (?, ?, TRUE)
    `, 'admin', adminPasswordHash);
    
    console.log('Admin user created: username=admin, password=YCCAdmin');
  }
}

export async function getCurrentWord() {
  const db = await getDatabase();
  return await db.get(`
    SELECT w.*, 
           COUNT(s.id) as current_completions
    FROM words w
    LEFT JOIN submissions s ON w.id = s.word_id
    WHERE w.is_active = TRUE
    GROUP BY w.id
    LIMIT 1
  `);
}

export async function getNextWord() {
  const db = await getDatabase();
  
  // Mark current word as completed
  await db.run(`
    UPDATE words 
    SET is_active = FALSE, completed_at = CURRENT_TIMESTAMP 
    WHERE is_active = TRUE
  `);
  
  // Get next random word
  const nextWord = await db.get(`
    SELECT * FROM words 
    WHERE completed_at IS NULL 
    ORDER BY RANDOM() 
    LIMIT 1
  `);
  
  if (nextWord) {
    await db.run(
      'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE id = ?',
      nextWord.id
    );
    return nextWord;
  }
  
  return null;
}

export async function checkWordCompletion() {
  // Database connection handled by getCurrentWord() and getNextWord()
  const currentWord = await getCurrentWord();
  
  if (currentWord && currentWord.current_completions >= currentWord.required_completions) {
    return await getNextWord();
  }
  
  return null;
}

// User operations
export async function createUser(username: string, passwordHash: string) {
  const db = await getDatabase();
  const result = await db.run(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    username,
    passwordHash
  );
  return result.lastID;
}

export async function getUserByUsername(username: string) {
  const db = await getDatabase();
  return await db.get('SELECT id, username, password_hash, is_admin, created_at, last_active FROM users WHERE username = ?', username);
}

export async function getUserById(id: number) {
  const db = await getDatabase();
  return await db.get('SELECT * FROM users WHERE id = ?', id);
}

// Submission operations
export async function createSubmission(userId: number, wordId: number, word: string, points: number, confidence: number, imageData?: string) {
  const database = await getDatabase();
  try {
    const result = await database.run(`
      INSERT INTO submissions (user_id, word_id, word, points, confidence, image_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `, userId, wordId, word, points, confidence, imageData);
    return result.lastID;
  } catch (error: unknown) {
    const sqliteError = error as { code?: string };
    if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Already submitted for this word');
    }
    throw error;
  }
}

export async function addCoupon(userId: number, word: string) {
  const db = await getDatabase();
  const couponCode = generateCouponCode();
  const result = await db.run(`
    INSERT INTO coupons (user_id, word, coupon_code)
    VALUES (?, ?, ?)
  `, userId, word, couponCode);
  return result.lastID;
}

export async function hasUserSubmittedForWord(userId: number, wordId: number) {
  const database = await getDatabase();
  const result = await database.get(`
    SELECT COUNT(*) as count 
    FROM submissions 
    WHERE user_id = ? AND word_id = ?
  `, userId, wordId);
  return result.count > 0;
}

export async function getUserCoupons(userId: number) {
  const database = await getDatabase();
  return await database.all(`
    SELECT id, word, coupon_code, status, prize_description, created_at, confirmed_at
    FROM coupons 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, userId);
}

export async function confirmCoupon(userId: number, couponId: number) {
  const database = await getDatabase();
  const result = await database.run(`
    UPDATE coupons 
    SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `, couponId, userId);
  return result.changes > 0;
}

export async function getUserCouponCount(userId: number) {
  const database = await getDatabase();
  const result = await database.get(`
    SELECT COUNT(*) as count 
    FROM coupons 
    WHERE user_id = ?
  `, userId);
  return result.count;
}

// Leaderboard operations
export async function getLeaderboard(limit: number = 10) {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      u.username,
      COALESCE(SUM(s.points), 0) as total_points,
      COALESCE(COUNT(c.id), 0) as total_tokens,
      COUNT(DISTINCT s.word_id) as words_completed
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id
    LEFT JOIN coupons c ON u.id = c.user_id
    GROUP BY u.id, u.username
    ORDER BY total_points DESC, total_tokens DESC, words_completed DESC
    LIMIT ?
  `, limit);
}

export async function getUserStats(userId: number) {
  const database = await getDatabase();
  return await database.get(`
    SELECT 
      u.username,
      COALESCE(SUM(s.points), 0) as total_points,
      COALESCE(COUNT(c.id), 0) as total_tokens,
      COUNT(DISTINCT s.word_id) as words_completed
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id
    LEFT JOIN coupons c ON u.id = c.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.username
  `, userId);
}

// Admin-specific functions
export async function getAllUsersStats() {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      u.id,
      u.username,
      u.is_admin,
      u.created_at,
      u.last_active,
      COALESCE(SUM(s.points), 0) as total_points,
      COALESCE(COUNT(c.id), 0) as total_coupons,
      COUNT(DISTINCT s.word_id) as words_completed
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id
    LEFT JOIN coupons c ON u.id = c.user_id
    GROUP BY u.id, u.username, u.is_admin, u.created_at, u.last_active
    ORDER BY total_points DESC
  `);
}

export async function getAllCouponsForAdmin() {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      c.id,
      c.coupon_code,
      c.word,
      c.status,
      c.created_at,
      c.confirmed_at,
      u.username
    FROM coupons c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `);
}

export async function getAllWords() {
  const database = await getDatabase();
  return await database.all(`
    SELECT id, word, is_active, created_at, activated_at, completed_at, required_completions
    FROM words
    ORDER BY id ASC
  `);
}

export async function updateWordRequiredCompletions(wordId: number, requiredCompletions: number) {
  const database = await getDatabase();
  await database.run(`
    UPDATE words 
    SET required_completions = ?
    WHERE id = ?
  `, requiredCompletions, wordId);
}

export async function setActiveWord(wordId: number) {
  const database = await getDatabase();
  
  // Deactivate all words
  await database.run('UPDATE words SET is_active = FALSE');
  
  // Activate the selected word
  await database.run(`
    UPDATE words 
    SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, wordId);
}

export async function addNewWord(word: string) {
  const database = await getDatabase();
  const result = await database.run(`
    INSERT INTO words (word) VALUES (?)
  `, word);
  return result.lastID;
}

export async function removeWord(wordId: number) {
  const database = await getDatabase();
  
  // Don't allow removal of active word
  const activeWord = await database.get('SELECT id FROM words WHERE id = ? AND is_active = TRUE', wordId);
  if (activeWord) {
    throw new Error('Cannot remove active word');
  }
  
  await database.run('DELETE FROM words WHERE id = ?', wordId);
}

export async function deleteUser(userId: number) {
  const database = await getDatabase();
  
  // Don't allow deletion of admin users
  const user = await database.get('SELECT is_admin FROM users WHERE id = ?', userId);
  if (user?.is_admin) {
    throw new Error('Cannot delete admin user');
  }
  
  // Delete user's submissions and coupons first (cascade)
  await database.run('DELETE FROM submissions WHERE user_id = ?', userId);
  await database.run('DELETE FROM coupons WHERE user_id = ?', userId);
  
  // Delete the user
  await database.run('DELETE FROM users WHERE id = ?', userId);
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const bcrypt = require('bcryptjs');
  const database = await getDatabase();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  await database.run(`
    UPDATE users 
    SET password_hash = ?
    WHERE id = ?
  `, passwordHash, userId);
}