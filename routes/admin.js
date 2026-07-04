'use strict';

const express          = require('express');
const { body, param }  = require('express-validator');
const adminController  = require('../controllers/adminController');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roleCheck');

const router = express.Router();

const adminOnly = [verifyToken, requireRole('admin')];

router.get('/stats',       adminOnly, adminController.getStats);
router.get('/trend',       adminOnly, adminController.getTrend);
router.get('/students',    adminOnly, adminController.listStudents);
router.get('/assessments', adminOnly, adminController.listAssessments);

router.delete(
  '/students/:id',
  adminOnly,
  [param('id').isInt({ min: 1 }).withMessage('Invalid student ID.')],
  adminController.deleteStudent
);

router.get('/recommendations',  adminOnly, adminController.listRecommendations);

router.post(
  '/recommendations',
  adminOnly,
  [
    body('stress_level')
      .isIn(['low', 'moderate', 'high'])
      .withMessage('stress_level must be low, moderate, or high.'),
    body('recommendation_text')
      .trim()
      .notEmpty().withMessage('Recommendation text is required.')
      .isLength({ max: 1000 }).withMessage('Text must not exceed 1000 characters.'),
  ],
  adminController.addRecommendation
);

router.delete(
  '/recommendations/:id',
  adminOnly,
  [param('id').isInt({ min: 1 }).withMessage('Invalid recommendation ID.')],
  adminController.deleteRecommendation
);

module.exports = router;
