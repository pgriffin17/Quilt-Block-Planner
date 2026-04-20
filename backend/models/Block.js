const { getDb } = require('../db/init');

class Block {
  static create(name, description, gridRows, gridCols, data, userId = null) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const dataJson = typeof data === 'string' ? data : JSON.stringify(data);
      
      db.run(
        `INSERT INTO blocks (name, description, grid_rows, grid_cols, data, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, gridRows, gridCols, dataJson, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM blocks WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            row.data = JSON.parse(row.data);
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  static getAll(userId = null) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      let query = `SELECT id, name, description, grid_rows, grid_cols, is_public, created_at, updated_at FROM blocks`;
      let params = [];

      if (userId) {
        query += ` WHERE user_id = ? OR is_public = 1`;
        params = [userId];
      }

      query += ` ORDER BY updated_at DESC`;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static update(id, name, description, gridRows, gridCols, data) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const dataJson = typeof data === 'string' ? data : JSON.stringify(data);

      db.run(
        `UPDATE blocks 
         SET name = ?, description = ?, grid_rows = ?, grid_cols = ?, data = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, gridRows, gridCols, dataJson, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `DELETE FROM blocks WHERE id = ?`,
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  static setPublic(id, isPublic) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE blocks SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isPublic ? 1 : 0, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }
}

module.exports = Block;
