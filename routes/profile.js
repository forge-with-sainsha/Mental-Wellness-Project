'use strict';

const express              = require('express');
const { body }             = require('express-validator');
const profileController    = require('../controllers/profileController');
const { verifyToken }      = require('../middleware/auth');
const { requireRole }      = require('../middleware/roleCheck');

const router = express.Router();

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

router.put(
  '/',
  verifyToken,
  requireRole('student'),
  [
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  ],
  profileController.updateProfile
);

router.put(
  '/password',
  verifyToken,
  requireRole('student'),
  [
    body('current_password').notEmpty().withMessage('Current password is required.'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
      .matches(PASSWORD_REGEX).withMessage('Password must contain uppercase, number, and special character.'),
  ],
  profileController.changePassword
);

module.exports = router;
