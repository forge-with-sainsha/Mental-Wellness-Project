'use strict';

const bcrypt               = require('bcryptjs');
const { validationResult } = require('express-validator');
const User                 = require('../models/User');

const profileController = {
  async updateProfile(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { full_name, email } = req.body;

    if (!full_name && !email) {
      return res.status(400).json({ message: 'Provide at least one field to update.' });
    }

    if (email) {
      const existing = await User.findByEmail(email);
      if (existing && existing.user_id !== req.user.user_id) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
    }

    const fields = {};
    if (full_name) fields.full_name = full_name;
    if (email)     fields.email     = email;

    await User.update(req.user.user_id, fields);
    const updated = await User.findById(req.user.user_id);

    return res.json({ message: 'Profile updated.', user: updated });
  },

  async changePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    const dbUser = await User.findByEmail(req.user.email);
    if (!dbUser) return res.status(404).json({ message: 'User not found.' });

    const match = await bcrypt.compare(current_password, dbUser.password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const sameAsOld = await bcrypt.compare(new_password, dbUser.password);
    if (sameAsOld) {
      return res.status(400).json({ message: 'New password must differ from current password.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await User.update(req.user.user_id, { password: hash });

    return res.json({ message: 'Password changed successfully.' });
  },
};

module.exports = profileController;
