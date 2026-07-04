'use strict';

const db = require('../config/db');

const Recommendation = {
  async findAll(level = '') {
    if (level) {
      const [rows] = await db.execute(
        `SELECT recommendation_id, stress_level, recommendation_text, created_at
           FROM recommendations
          WHERE stress_level = ?
          ORDER BY recommendation_id ASC`,
        [level]
      );
      return rows;
    }
    const [rows] = await db.execute(
      `SELECT recommendation_id, stress_level, recommendation_text, created_at
         FROM recommendations
        ORDER BY stress_level ASC, recommendation_id ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT recommendation_id, stress_level, recommendation_text, created_at FROM recommendations WHERE recommendation_id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ stress_level, recommendation_text }) {
    const [result] = await db.execute(
      'INSERT INTO recommendations (stress_level, recommendation_text) VALUES (?, ?)',
      [stress_level, recommendation_text]
    );
    return result.insertId;
  },

  async deleteById(id) {
    await db.execute('DELETE FROM recommendations WHERE recommendation_id = ?', [id]);
  },
};

module.exports = Recommendation;
