'use strict';

const db = require('../config/db');

const Question = {
  async findAllActive() {
    const [rows] = await db.execute(
      'SELECT question_id, question_text FROM questions WHERE is_active = 1 ORDER BY question_id ASC'
    );
    return rows;
  },

  async count() {
    const [rows] = await db.execute('SELECT COUNT(*) AS total FROM questions WHERE is_active = 1');
    return rows[0].total;
  },
};

module.exports = Question;
