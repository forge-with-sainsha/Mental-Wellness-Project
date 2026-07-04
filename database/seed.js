'use strict';

/**
 * Seed script — run AFTER schema.sql has been applied.
 * Usage: node database/seed.js
 *
 * Inserts:
 *   - 1 admin account  (admin@system.com / Admin@1234)
 *   - 10 assessment questions
 *   - 20 recommendations (5 low / 7 moderate / 8 high)
 */

require('dotenv').config();
const mysql    = require('mysql2/promise');
const bcrypt   = require('bcryptjs');

const dbConfig = {
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT || '3307', 10),
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'mental_wellness',
};

// ── Questions ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  'How often do you feel overwhelmed by your academic workload?',
  'How frequently do you have trouble sleeping due to stress or anxiety?',
  'How often do you feel unable to concentrate on your studies?',
  'How often do you feel irritable or moody due to academic pressure?',
  'How frequently do you skip meals or eat poorly because of stress?',
  'How often do you feel anxious about upcoming exams or deadlines?',
  'How often do you feel physically tired or exhausted from stress?',
  'How often do you feel isolated or withdrawn from friends and family?',
  'How frequently do you experience headaches or physical tension from stress?',
  'How often do you feel like you have lost motivation for your studies?',
];

// ── Recommendations ────────────────────────────────────────────────────────
const RECOMMENDATIONS = [
  // Low stress (0–13)
  { stress_level: 'low', recommendation_text: 'Maintain your current healthy habits and daily routines — consistency is key to long-term well-being.' },
  { stress_level: 'low', recommendation_text: 'Practice gratitude journaling for 5 minutes each morning to reinforce a positive mindset.' },
  { stress_level: 'low', recommendation_text: 'Stay physically active with light exercise like walking, cycling, or yoga at least 3 times per week.' },
  { stress_level: 'low', recommendation_text: 'Nurture your social connections — schedule regular check-ins with friends and family.' },
  { stress_level: 'low', recommendation_text: 'Set small, achievable goals each week to maintain motivation and a sense of progress.' },

  // Moderate stress (14–26)
  { stress_level: 'moderate', recommendation_text: 'Practice the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times.' },
  { stress_level: 'moderate', recommendation_text: 'Create a structured study schedule using the Pomodoro technique — 25 minutes of focused study followed by a 5-minute break.' },
  { stress_level: 'moderate', recommendation_text: 'Limit social media and recreational screen time to under 2 hours per day to reduce mental overload.' },
  { stress_level: 'moderate', recommendation_text: 'Engage in physical activity for at least 30 minutes, three times per week — even a brisk walk counts.' },
  { stress_level: 'moderate', recommendation_text: 'Talk openly about your feelings with a trusted friend, family member, or student counselor.' },
  { stress_level: 'moderate', recommendation_text: 'Try mindfulness meditation for 10 minutes daily using free apps like Insight Timer or Smiling Mind.' },
  { stress_level: 'moderate', recommendation_text: 'Prioritise 7–8 hours of quality sleep each night — a consistent sleep schedule improves stress resilience.' },

  // High stress (27–40)
  { stress_level: 'high', recommendation_text: 'Seek support from a school counselor, therapist, or mental health professional as soon as possible.' },
  { stress_level: 'high', recommendation_text: 'Contact your institution\'s student support services — academic accommodations (extensions, reduced load) may be available.' },
  { stress_level: 'high', recommendation_text: 'Practice progressive muscle relaxation daily: tense and release each muscle group from feet to forehead.' },
  { stress_level: 'high', recommendation_text: 'Break overwhelming tasks into the smallest possible steps and focus on completing just one at a time.' },
  { stress_level: 'high', recommendation_text: 'If you feel in crisis, reach out immediately — call a crisis helpline or text a crisis support service in your country.' },
  { stress_level: 'high', recommendation_text: 'Reduce non-essential commitments and communicate with lecturers or supervisors about deadline flexibility.' },
  { stress_level: 'high', recommendation_text: 'Connect with peer support groups on campus or online — sharing experiences with others in similar situations reduces isolation.' },
  { stress_level: 'high', recommendation_text: 'Limit caffeine and alcohol, eat regular nutritious meals, and protect a consistent sleep schedule.' },
];

async function seed() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to database.\n');

  try {
    // ── Admin account ──────────────────────────────────────────────────────
    const [existing] = await conn.execute(
      'SELECT user_id FROM users WHERE email = ?',
      ['admin@system.com']
    );
    if (existing.length === 0) {
      const hash = await bcrypt.hash('Admin@1234', 12);
      await conn.execute(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@system.com', hash, 'admin']
      );
      console.log('✓ Admin account created  →  admin@system.com / Admin@1234');
    } else {
      console.log('– Admin account already exists, skipping.');
    }

    // ── Questions ──────────────────────────────────────────────────────────
    const [qRows] = await conn.execute('SELECT COUNT(*) AS cnt FROM questions');
    if (qRows[0].cnt === 0) {
      for (const text of QUESTIONS) {
        await conn.execute('INSERT INTO questions (question_text) VALUES (?)', [text]);
      }
      console.log(`✓ ${QUESTIONS.length} questions inserted.`);
    } else {
      console.log('– Questions already exist, skipping.');
    }

    // ── Recommendations ────────────────────────────────────────────────────
    const [rRows] = await conn.execute('SELECT COUNT(*) AS cnt FROM recommendations');
    if (rRows[0].cnt === 0) {
      for (const rec of RECOMMENDATIONS) {
        await conn.execute(
          'INSERT INTO recommendations (stress_level, recommendation_text) VALUES (?, ?)',
          [rec.stress_level, rec.recommendation_text]
        );
      }
      console.log(`✓ ${RECOMMENDATIONS.length} recommendations inserted.`);
    } else {
      console.log('– Recommendations already exist, skipping.');
    }

    console.log('\nSeed complete. You can now start the server with: npm run dev');
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
