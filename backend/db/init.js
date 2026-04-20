const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'blocks.sqlite');

let db;

function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database at', dbPath);
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create blocks table
      db.run(`
        CREATE TABLE IF NOT EXISTS blocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          grid_rows INTEGER NOT NULL,
          grid_cols INTEGER NOT NULL,
          data TEXT NOT NULL,
          is_public INTEGER DEFAULT 0,
          user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database tables created or already exist');
          resolve();
        }
      });
    });
  });
}

function getDb() {
  return db;
}

function closeDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDb,
  getDb,
  closeDb
};
