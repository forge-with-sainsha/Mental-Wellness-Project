CREATE DATABASE IF NOT EXISTS mental_wellness
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mental_wellness;


-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id    INT          NOT NULL AUTO_INCREMENT,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: questions
CREATE TABLE IF NOT EXISTS questions (
  question_id   INT  NOT NULL AUTO_INCREMENT,
  question_text TEXT NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table: assessments
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id   INT            NOT NULL AUTO_INCREMENT,
  user_id         INT            NOT NULL,
  assessment_date TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stress_score    TINYINT UNSIGNED NOT NULL,        -- range 0–40 (10 questions × max 4)
  stress_level    ENUM('low','moderate','high') NOT NULL,
  PRIMARY KEY (assessment_id),~~
  KEY idx_assessments_user (user_id),
  CONSTRAINT fk_assessments_user
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table: responses
CREATE TABLE IF NOT EXISTS responses (
  response_id    INT              NOT NULL AUTO_INCREMENT,
  assessment_id  INT              NOT NULL,
  question_id    INT              NOT NULL,
  selected_value TINYINT UNSIGNED NOT NULL,         -- valid range 0–4
  PRIMARY KEY (response_id),
  UNIQUE KEY uq_responses_per_assessment (assessment_id, question_id),
  KEY idx_responses_question   (question_id),
  CONSTRAINT fk_responses_assessment
    FOREIGN KEY (assessment_id) REFERENCES assessments (assessment_id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_question
    FOREIGN KEY (question_id)   REFERENCES questions   (question_id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  recommendation_id   INT  NOT NULL AUTO_INCREMENT,
  stress_level        ENUM('low','moderate','high') NOT NULL,
  recommendation_text TEXT NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recommendation_id),
  KEY idx_recommendations_level (stress_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
