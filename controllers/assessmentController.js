'use strict';

const { validationResult } = require('express-validator');
const db                   = require('../config/db');
const Question             = require('../models/Question');
const Assessment           = require('../models/Assessment');
const Recommendation       = require('../models/Recommendation');

function classifyStress(score) {
  if (score <= 13) return 'low';
  if (score <= 26) return 'moderate';
  return 'high';
}

const assessmentController = {
  async getQuestions(_req, res) {
    const questions = await Question.findAllActive();
    return res.json({ questions });
  },

  async submitAssessment(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { responses } = req.body;

    if (!Array.isArray(responses) || responses.length !== 10) {
      return res.status(400).json({ message: 'Exactly 10 responses are required.' });
    }

    const ids = responses.map((r) => r.question_id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== 10) {
      return res.status(400).json({ message: 'Each question must be answered exactly once.' });
    }

    for (const r of responses) {
      if (r.selected_value < 0 || r.selected_value > 4) {
        return res.status(400).json({ message: 'Each answer must be between 0 and 4.' });
      }
    }

    const stress_score = responses.reduce((sum, r) => sum + Number(r.selected_value), 0);
    const stress_level = classifyStress(stress_score);

    const assessment_id = await Assessment.create(
      { user_id: req.user.user_id, stress_score, stress_level },
      responses
    );

    return res.status(201).json({
      message: 'Assessment submitted.',
      assessment_id,
      stress_score,
      stress_level,
    });
  },

  async getHistory(req, res) {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Assessment.findByUser(req.user.user_id, { limit, offset }),
      Assessment.countByUser(req.user.user_id),
    ]);

    return res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },

  async getLatestWithRecommendations(req, res) {
    const latest = await Assessment.findLatestByUser(req.user.user_id);
    if (!latest) {
      return res.status(404).json({ message: 'No assessments found. Take your first assessment!' });
    }

    const recommendations = await Recommendation.findAll(latest.stress_level);
    return res.json({ assessment: latest, recommendations });
  },

  async getTrend(req, res) {
    const days = Math.min(90, parseInt(req.query.days) || 30);

    const [rows] = await db.execute(
      `SELECT DATE(assessment_date) AS day,
              ROUND(AVG(stress_score), 1) AS avg_score,
              stress_level
         FROM assessments
        WHERE user_id = ?
          AND assessment_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY day, stress_level
        ORDER BY day ASC`,
      [req.user.user_id, days]
    );

    return res.json({ trend: rows });
  },
};

module.exports = assessmentController;
