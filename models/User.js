'use strict';

const db = require('../config/db');

const User = {
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(user_id) {
    const [rows] = await db.execute(
      'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = ? LIMIT 1',
      [user_id]
    );
    return rows[0] || null;
  },

  async create({ full_name, email, password }) {
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name, email, password, 'student']
    );
    return result.insertId;
  },

  async update(user_id, fields) {
    const allowed = ['full_name', 'email', 'password'];
    const updates = [];
    const values  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (updates.length === 0) return false;
    values.push(user_id);
    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    return true;
  },

  async listStudents({ search = '', limit = 50, offset = 0 } = {}) {
    const like = `%${search}%`;
    const [rows] = await db.execute(
      `SELECT user_id, full_name, email, created_at
         FROM users
        WHERE role = 'student'
          AND (full_name LIKE ? OR email LIKE ?)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
      [like, like, limit, offset]
    );
    return rows;
  },

  async countStudents(search = '') {
    const like = `%${search}%`;
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM users
        WHERE role = 'student'
          AND (full_name LIKE ? OR email LIKE ?)`,
      [like, like]
    );
    return rows[0].total;
  },

  async deleteById(user_id) {
    await db.execute('DELETE FROM users WHERE user_id = ? AND role = ?', [user_id, 'student']);
  },
};

module.exports = User;
