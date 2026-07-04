'use strict';

const express                    = require('express');
const { body }                   = require('express-validator');
const authController             = require('../controllers/authController');
const { verifyToken }            = require('../middleware/auth');

const router = express.Router();

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const registerValidators = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(PASSWORD_REGEX).withMessage('Password must contain uppercase, number, and special character.'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/register',     registerValidators, authController.register);
router.post('/login',        loginValidators,    authController.login);
router.post('/admin/login',  loginValidators,    authController.adminLogin);
router.get('/me',            verifyToken,        authController.getMe);

module.exports = router;
