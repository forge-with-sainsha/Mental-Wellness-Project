'use strict';

const bcrypt              = require('bcryptjs');
const jwt                 = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User                = require('../models/User');

function signToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

const authController = {
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { full_name, email, password } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hash    = await bcrypt.hash(password, 12);
    const user_id = await User.create({ full_name, email, password: hash });

    const token = signToken(
      { user_id, email, role: 'student' },
      process.env.JWT_EXPIRES_IN || '24h'
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { user_id, full_name, email, role: 'student' },
    });
  },

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(
      { user_id: user.user_id, email: user.email, role: 'student' },
      process.env.JWT_EXPIRES_IN || '24h'
    );

    return res.json({
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: 'student' },
    });
  },

  async adminLogin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(
      { user_id: user.user_id, email: user.email, role: 'admin' },
      process.env.ADMIN_JWT_EXPIRES_IN || '8h'
    );

    return res.json({
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: 'admin' },
    });
  },

  async getMe(req, res) {
    const user = await User.findById(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  },
};

module.exports = authController;
