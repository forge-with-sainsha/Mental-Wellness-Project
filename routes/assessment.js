'use strict';

const express               = require('express');
const { body }              = require('express-validator');
const assessmentController  = require('../controllers/assessmentController');
const { verifyToken }       = require('../middleware/auth');
const { requireRole }       = require('../middleware/roleCheck');

const router = express.Router();

const studentOnly = [verifyToken, requireRole('student')];

router.get('/questions', studentOnly, assessmentController.getQuestions);

router.post(
  '/submit',
  studentOnly,
  [
    body('responses')
      .isArray({ min: 10, max: 10 })
      .withMessage('Exactly 10 responses are required.'),
    body('responses.*.question_id')
      .isInt({ min: 1 })
      .withMessage('Each question_id must be a positive integer.'),
    body('responses.*.selected_value')
      .isInt({ min: 0, max: 4 })
      .withMessage('Each selected_value must be between 0 and 4.'),
  ],
  assessmentController.submitAssessment
);

router.get('/history', studentOnly, assessmentController.getHistory);
router.get('/latest',  studentOnly, assessmentController.getLatestWithRecommendations);
router.get('/trend',   studentOnly, assessmentController.getTrend);

module.exports = router;
