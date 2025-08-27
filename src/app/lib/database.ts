import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

let db: Database | null = null;

export async function getDatabase() {
  if (!db) {
    // Use data directory for production, current directory for development
    const dbPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'data', 'database.sqlite')
      : path.join(process.cwd(), 'database.sqlite');
    
    console.log(`Database path: ${dbPath}, NODE_ENV: ${process.env.NODE_ENV}, CWD: ${process.cwd()}`);
    
    // Ensure directory exists in production
    if (process.env.NODE_ENV === 'production') {
      const fs = await import('fs/promises');
      const dataDir = path.dirname(dbPath);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
        console.log(`Created directory: ${dataDir}`);
      }
    }
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  if (!db) throw new Error('Database not initialized');
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
      activated_at DATETIME NULL
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

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  if (!db) throw new Error('Database not initialized');
  const initialWords = [
    '사과', '책', '의자', '강아지', '코끼리', '꽃', '기타', '집',
    '얼음', '재킷', '열쇠', '램프', '산', '노트북', '바다', '연필',
    '여왕', '무지개', '해', '나무', '우산', '바이올린', '물', '엑스레이',
    '요트', '얼룩말', '백팩', '카메라', '다이아몬드', '독수리', '불', '유리',
    '헬멧', '섬', '정글', '연', '등대', '거울', '둥지', '올빼미',
    '피아노', '퀼트', '로켓', '별', '망원경', '유니콘', '계곡', '고래',
    '크세논', '실', '동물원', '비행기', '다리', '성', '문', '엔진',
    '숲', '정원', '수평선', '이글루', '보석', '주방', '도서관', '미로'
  ];

  const stmt = await db.prepare('INSERT INTO words (word) VALUES (?)');
  for (const word of initialWords) {
    await stmt.run(word);
  }
  await stmt.finalize();
}

async function ensureActiveWord() {
  if (!db) throw new Error('Database not initialized');
  const activeWord = await db.get('SELECT * FROM words WHERE is_active = TRUE LIMIT 1');
  
  if (!activeWord) {
    const requiredCompletions = await getDefaultRequiredCompletions();
    
    // Try to get a word that hasn't reached completion threshold
    const availableWord = await db.get(`
      SELECT w.*, COUNT(s.id) as current_completions
      FROM words w
      LEFT JOIN submissions s ON w.id = s.word_id
      GROUP BY w.id
      HAVING current_completions < ?
      ORDER BY RANDOM()
      LIMIT 1
    `, requiredCompletions);
    
    const nextWord = availableWord || await db.get(`
      SELECT * FROM words 
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
  if (!db) throw new Error('Database not initialized');
  // Check if is_admin column exists
  const columns = await db.all(`PRAGMA table_info(users)`);
  const hasAdminColumn = columns.some(col => col.name === 'is_admin');
  
  if (!hasAdminColumn) {
    await db.run(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
    console.log('Added is_admin column to users table');
  }
}

async function migrateToCoupons() {
  if (!db) throw new Error('Database not initialized');
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
  if (!db) throw new Error('Database not initialized');
  // Check if admin user already exists
  const existingAdmin = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  
  if (!existingAdmin) {
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
  const requiredCompletions = await getDefaultRequiredCompletions();
  
  // Deactivate current word
  await db.run(`
    UPDATE words 
    SET is_active = FALSE
    WHERE is_active = TRUE
  `);
  
  // First, try to get a word that hasn't reached the completion threshold
  const availableWord = await db.get(`
    SELECT w.*, COUNT(s.id) as current_completions
    FROM words w
    LEFT JOIN submissions s ON w.id = s.word_id
    GROUP BY w.id
    HAVING current_completions < ?
    ORDER BY RANDOM()
    LIMIT 1
  `, requiredCompletions);
  
  if (availableWord) {
    await db.run(
      'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE id = ?',
      availableWord.id
    );
    return availableWord;
  }
  
  // If all words have reached completion threshold, clear submissions and reset
  console.log('All words completed - resetting word cycle by clearing submissions');
  
  // Clear all submissions to reset completion counts
  await db.run('DELETE FROM submissions');
  
  // Record the reset timestamp to invalidate existing sessions
  const resetTime = new Date().toISOString();
  await db.run(`
    INSERT OR REPLACE INTO settings (key, value) 
    VALUES ('last_reset_time', ?)
  `, resetTime);
  
  // Now get any word since all are available again
  const resetWord = await db.get(`
    SELECT * FROM words 
    ORDER BY RANDOM() 
    LIMIT 1
  `);
  
  if (resetWord) {
    await db.run(
      'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE id = ?',
      resetWord.id
    );
    return resetWord;
  }
  
  return null;
}

export async function checkWordCompletion() {
  // Database connection handled by getCurrentWord() and getNextWord()
  const currentWord = await getCurrentWord();
  const requiredCompletions = await getDefaultRequiredCompletions();
  
  if (currentWord && currentWord.current_completions >= requiredCompletions) {
    return await getNextWord();
  }
  
  return null;
}

export async function resetWordCycle() {
  // Reset word cycle by clearing submissions but keeping points
  const database = await getDatabase();
  
  console.log('Resetting word cycle - clearing submission counts but preserving points');
  
  // Clear all submissions to reset word completion counts
  // Points are preserved in user stats
  await database.run('DELETE FROM submissions');
  
  // Record the reset timestamp to invalidate existing sessions
  const resetTime = new Date().toISOString();
  await database.run(`
    INSERT OR REPLACE INTO settings (key, value) 
    VALUES ('last_reset_time', ?)
  `, resetTime);
  
  // Activate a random word
  const randomWord = await database.get(`
    SELECT * FROM words 
    ORDER BY RANDOM() 
    LIMIT 1
  `);
  
  if (randomWord) {
    await database.run('UPDATE words SET is_active = FALSE');
    await database.run(
      'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE id = ?',
      randomWord.id
    );
  }
  
  console.log('Word cycle reset complete');
  return randomWord;
}

export async function manualNextWord() {
  // Manually move to next word (admin function)
  return await getNextWord();
}

export async function isSessionValid(userCreatedAt: string) {
  // Check if user's session is still valid after database resets
  const database = await getDatabase();
  
  const lastReset = await database.get(`
    SELECT value FROM settings WHERE key = 'last_reset_time'
  `);
  
  if (!lastReset || !lastReset.value) {
    return true; // No reset has occurred
  }
  
  const resetTime = new Date(lastReset.value);
  const userLoginTime = new Date(userCreatedAt);
  
  // If user logged in before the last reset, session is invalid
  return userLoginTime >= resetTime;
}

// Booth operating hours functions
export async function getBoothHours() {
  const database = await getDatabase();
  
  const openTime = await database.get(`SELECT value FROM settings WHERE key = 'booth_open_time'`);
  const closeTime = await database.get(`SELECT value FROM settings WHERE key = 'booth_close_time'`);
  
  return {
    openTime: openTime?.value || '09:00',
    closeTime: closeTime?.value || '18:00'
  };
}

export async function setBoothHours(openTime: string, closeTime: string, timezone?: string) {
  const database = await getDatabase();
  
  await database.run(`
    INSERT OR REPLACE INTO settings (key, value) VALUES ('booth_open_time', ?)
  `, openTime);
  
  await database.run(`
    INSERT OR REPLACE INTO settings (key, value) VALUES ('booth_close_time', ?)
  `, closeTime);
  
  // Store timezone for reference (optional but helpful for debugging)
  if (timezone) {
    await database.run(`
      INSERT OR REPLACE INTO settings (key, value) VALUES ('booth_timezone', ?)
    `, timezone);
  }
}

export async function isBoothOpen(userTimezone?: string) {
  const { openTime, closeTime } = await getBoothHours();
  
  // Use provided timezone or default to system timezone
  const timezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Get current time in the specified timezone
  const now = new Date();
  const timeInTimezone = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);
  
  const [currentHour, currentMinutes] = timeInTimezone.split(':').map(Number);
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  return currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
}

export async function clearAllData() {
  const database = await getDatabase();
  
  // Start transaction to ensure atomic operation
  await database.run('BEGIN TRANSACTION');
  
  try {
    // Delete all user data except admin users
    await database.run('DELETE FROM submissions');
    await database.run('DELETE FROM coupons');
    await database.run('DELETE FROM users WHERE is_admin = FALSE');
    
    // Reset all words to inactive state
    await database.run('UPDATE words SET is_active = FALSE');
    
    // Reset settings to defaults
    await database.run('DELETE FROM settings');
    
    // Ensure there's an active word
    await ensureActiveWord();
    
    await database.run('COMMIT');
    console.log('Database cleared successfully');
    
  } catch (error) {
    await database.run('ROLLBACK');
    console.error('Failed to clear database:', error);
    throw error;
  }
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

export async function updateUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDatabase();
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', newPasswordHash, userId);
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
  return (result.changes ?? 0) > 0;
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
      COALESCE(points_data.total_points, 0) as total_points,
      COALESCE(coupon_data.total_coupons, 0) as total_coupons,
      COALESCE(points_data.words_completed, 0) as words_completed
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(points) as total_points,
        COUNT(DISTINCT word_id) as words_completed
      FROM submissions 
      GROUP BY user_id
    ) points_data ON u.id = points_data.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_coupons
      FROM coupons 
      GROUP BY user_id
    ) coupon_data ON u.id = coupon_data.user_id
    WHERE u.is_admin = FALSE
    ORDER BY total_points DESC, total_coupons DESC, words_completed DESC
    LIMIT ?
  `, limit);
}

export async function getUserStats(userId: number) {
  const database = await getDatabase();
  return await database.get(`
    SELECT 
      u.username,
      COALESCE(points_data.total_points, 0) as total_points,
      COALESCE(coupon_data.total_coupons, 0) as total_coupons,
      COALESCE(points_data.words_completed, 0) as words_completed
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(points) as total_points,
        COUNT(DISTINCT word_id) as words_completed
      FROM submissions 
      WHERE user_id = ?
      GROUP BY user_id
    ) points_data ON u.id = points_data.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_coupons
      FROM coupons 
      WHERE user_id = ?
      GROUP BY user_id
    ) coupon_data ON u.id = coupon_data.user_id
    WHERE u.id = ?
  `, userId, userId, userId);
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
      COALESCE(points_data.total_points, 0) as total_points,
      COALESCE(coupon_data.total_coupons, 0) as total_coupons,
      COALESCE(points_data.words_completed, 0) as words_completed
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(points) as total_points,
        COUNT(DISTINCT word_id) as words_completed
      FROM submissions 
      GROUP BY user_id
    ) points_data ON u.id = points_data.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_coupons
      FROM coupons 
      GROUP BY user_id
    ) coupon_data ON u.id = coupon_data.user_id
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
    SELECT w.id, w.word, w.is_active, w.created_at, w.activated_at,
           COUNT(s.id) as current_completions
    FROM words w
    LEFT JOIN submissions s ON w.id = s.word_id
    GROUP BY w.id, w.word, w.is_active, w.created_at, w.activated_at
    ORDER BY w.id ASC
  `);
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

export async function getDefaultRequiredCompletions(): Promise<number> {
  const database = await getDatabase();
  const setting = await database.get('SELECT value FROM settings WHERE key = ?', 'default_required_completions') as { value: string } | undefined;
  return setting ? parseInt(setting.value) : 5;
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

export async function bulkAddWords(words: string[]) {
  const database = await getDatabase();
  
  // Clean and validate words
  const cleanWords = words
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0)
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  
  let addedCount = 0;
  
  for (const word of cleanWords) {
    try {
      // Check if word already exists
      const existing = await database.get('SELECT id FROM words WHERE word = ?', word);
      if (!existing) {
        await database.run(
          'INSERT INTO words (word, created_at) VALUES (?, CURRENT_TIMESTAMP)',
          word
        );
        addedCount++;
      }
    } catch (error) {
      console.error(`Failed to add word "${word}":`, error);
    }
  }
  
  return addedCount;
}

export async function bulkReplaceWords(words: string[]) {
  const database = await getDatabase();
  
  // Clean and validate words
  const cleanWords = words
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0)
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  
  // Start transaction to ensure data consistency
  await database.run('BEGIN TRANSACTION');
  
  try {
    // Get current active word to preserve it
    const currentActiveWord = await database.get('SELECT word FROM words WHERE is_active = TRUE');
    
    // Delete all words EXCEPT those referenced in submissions table
    // This preserves data integrity for existing points
    // Note: Coupons table stores word as text, not word_id, so we check by word name
    await database.run(`
      DELETE FROM words 
      WHERE id NOT IN (
        SELECT DISTINCT word_id FROM submissions 
      )
      AND word NOT IN (
        SELECT DISTINCT word FROM coupons
      )
    `);
    
    // Add new words
    let addedCount = 0;
    for (const word of cleanWords) {
      try {
        // Check if word already exists (might be preserved due to dependencies)
        const existing = await database.get('SELECT id FROM words WHERE word = ?', word);
        if (!existing) {
          await database.run(
            'INSERT INTO words (word, created_at) VALUES (?, CURRENT_TIMESTAMP)',
            word
          );
          addedCount++;
        }
      } catch (error) {
        console.error(`Failed to add word "${word}":`, error);
      }
    }
    
    // Restore active word if it was among the new words
    if (currentActiveWord && cleanWords.includes(currentActiveWord.word)) {
      await database.run(
        'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE word = ?',
        currentActiveWord.word
      );
    } else if (cleanWords.length > 0) {
      // Set a random new word as active if the previous active word was removed
      const randomWord = cleanWords[Math.floor(Math.random() * cleanWords.length)];
      await database.run(
        'UPDATE words SET is_active = TRUE, activated_at = CURRENT_TIMESTAMP WHERE word = ?',
        randomWord
      );
    }
    
    await database.run('COMMIT');
    return addedCount;
    
  } catch (error) {
    await database.run('ROLLBACK');
    throw error;
  }
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
  const database = await getDatabase();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  await database.run(`
    UPDATE users 
    SET password_hash = ?
    WHERE id = ?
  `, passwordHash, userId);
}