'use strict';

const { validationResult } = require('express-validator');
const User                 = require('../models/User');
const Assessment           = require('../models/Assessment');
const Recommendation       = require('../models/Recommendation');

const adminController = {
  async getStats(_req, res) {
    const stats = await Assessment.getStats();
    return res.json({ stats });
  },

  async getTrend(req, res) {
    const days  = Math.min(90, parseInt(req.query.days) || 30);
    const trend = await Assessment.getTrend(days);
    return res.json({ trend });
  },

  async listStudents(req, res) {
    const search = req.query.search || '';
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.listStudents({ search, limit, offset }),
      User.countStudents(search),
    ]);

    return res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },

  async deleteStudent(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: 'Invalid student ID.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Student not found.' });
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Cannot delete admin accounts.' });
    }

    await User.deleteById(id);
    return res.json({ message: 'Student deleted successfully.' });
  },

  async listAssessments(req, res) {
    const search = req.query.search || '';
    const level  = req.query.level  || '';
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Assessment.listAll({ search, level, limit, offset }),
      Assessment.countAll({ search, level }),
    ]);

    return res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },

  async listRecommendations(req, res) {
    const level = req.query.level || '';
    const recommendations = await Recommendation.findAll(level);
    return res.json({ recommendations });
  },

  async addRecommendation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { stress_level, recommendation_text } = req.body;
    const id = await Recommendation.create({ stress_level, recommendation_text });

    return res.status(201).json({
      message: 'Recommendation added.',
      recommendation_id: id,
    });
  },

  async deleteRecommendation(req, res) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ message: 'Invalid recommendation ID.' });
    }

    const found = await Recommendation.findById(id);
    if (!found) return res.status(404).json({ message: 'Recommendation not found.' });

    await Recommendation.deleteById(id);
    return res.json({ message: 'Recommendation deleted.' });
  },
};

module.exports = adminController;
