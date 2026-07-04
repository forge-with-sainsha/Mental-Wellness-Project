'use strict';

const db = require('../config/db');

const Assessment = {
  async create({ user_id, stress_score, stress_level }, responses) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [aResult] = await conn.execute(
        'INSERT INTO assessments (user_id, stress_score, stress_level) VALUES (?, ?, ?)',
        [user_id, stress_score, stress_level]
      );
      const assessment_id = aResult.insertId;

      for (const r of responses) {
        await conn.execute(
          'INSERT INTO responses (assessment_id, question_id, selected_value) VALUES (?, ?, ?)',
          [assessment_id, r.question_id, r.selected_value]
        );
      }

      await conn.commit();
      return assessment_id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findByUser(user_id, { limit = 20, offset = 0 } = {}) {
    const [rows] = await db.execute(
      `SELECT assessment_id, assessment_date, stress_score, stress_level
         FROM assessments
        WHERE user_id = ?
        ORDER BY assessment_date DESC
        LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    return rows;
  },

  async countByUser(user_id) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS total FROM assessments WHERE user_id = ?',
      [user_id]
    );
    return rows[0].total;
  },

  async findLatestByUser(user_id) {
    const [rows] = await db.execute(
      `SELECT assessment_id, assessment_date, stress_score, stress_level
         FROM assessments
        WHERE user_id = ?
        ORDER BY assessment_date DESC
        LIMIT 1`,
      [user_id]
    );
    return rows[0] || null;
  },

  async findRecentByUser(user_id, count = 7) {
    const [rows] = await db.execute(
      `SELECT assessment_date, stress_score, stress_level
         FROM assessments
        WHERE user_id = ?
        ORDER BY assessment_date DESC
        LIMIT ?`,
      [user_id, count]
    );
    return rows.reverse();
  },

  async listAll({ search = '', level = '', limit = 50, offset = 0 } = {}) {
    const like  = `%${search}%`;
    const params = [like, like];
    let levelClause = '';
    if (level) {
      levelClause = 'AND a.stress_level = ?';
      params.push(level);
    }
    params.push(limit, offset);

    const [rows] = await db.execute(
      `SELECT a.assessment_id, a.assessment_date, a.stress_score, a.stress_level,
              u.user_id, u.full_name, u.email
         FROM assessments a
         JOIN users u ON u.user_id = a.user_id
        WHERE (u.full_name LIKE ? OR u.email LIKE ?)
          ${levelClause}
        ORDER BY a.assessment_date DESC
        LIMIT ? OFFSET ?`,
      params
    );
    return rows;
  },

  async countAll({ search = '', level = '' } = {}) {
    const like = `%${search}%`;
    const params = [like, like];
    let levelClause = '';
    if (level) {
      levelClause = 'AND a.stress_level = ?';
      params.push(level);
    }
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total
         FROM assessments a
         JOIN users u ON u.user_id = a.user_id
        WHERE (u.full_name LIKE ? OR u.email LIKE ?)
          ${levelClause}`,
      params
    );
    return rows[0].total;
  },

  async getStats() {
    const [totals] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'student')           AS total_students,
         (SELECT COUNT(*) FROM assessments)                             AS total_assessments,
         (SELECT ROUND(AVG(stress_score),1) FROM assessments)          AS avg_score,
         (SELECT COUNT(*) FROM assessments WHERE stress_level = 'low')      AS count_low,
         (SELECT COUNT(*) FROM assessments WHERE stress_level = 'moderate') AS count_moderate,
         (SELECT COUNT(*) FROM assessments WHERE stress_level = 'high')     AS count_high`
    );
    return totals[0];
  },

  async getTrend(days = 30) {
    const [rows] = await db.execute(
      `SELECT DATE(assessment_date) AS day, COUNT(*) AS total,
              SUM(stress_level = 'low')      AS low,
              SUM(stress_level = 'moderate') AS moderate,
              SUM(stress_level = 'high')     AS high
         FROM assessments
        WHERE assessment_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY day
        ORDER BY day ASC`,
      [days]
    );
    return rows;
  },
};

module.exports = Assessment;
