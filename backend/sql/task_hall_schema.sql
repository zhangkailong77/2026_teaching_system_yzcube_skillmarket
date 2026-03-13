-- Task hall core schema (MySQL 8+)
-- Generated for yzcube_skillmarket backend

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(64) NOT NULL,
  publisher_user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  bounty_points INT NOT NULL DEFAULT 0,
  required_score INT NOT NULL DEFAULT 0,
  deadline_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  max_claimants INT NOT NULL DEFAULT 1,
  claimed_count INT NOT NULL DEFAULT 0,
  tags_json JSON NULL,
  attachments_json JSON NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_tasks_status_category_deadline (status, category, deadline_at),
  KEY ix_tasks_bounty_points (bounty_points),
  KEY ix_tasks_created_at (created_at),
  KEY ix_tasks_school_id (school_id),
  KEY ix_tasks_publisher_user_id (publisher_user_id),
  CONSTRAINT fk_tasks_publisher_user_id FOREIGN KEY (publisher_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_claims (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT NOT NULL,
  claimer_user_id BIGINT NOT NULL,
  claimer_school_id VARCHAR(64) NOT NULL,
  claimer_source_user_id VARCHAR(128) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'claimed',
  submission_text VARCHAR(3000) NULL,
  submission_attachments_json JSON NULL,
  claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  reviewed_at DATETIME NULL,
  settlement_points INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_task_claim_task_user (task_id, claimer_user_id),
  KEY ix_task_claims_task_status (task_id, status),
  KEY ix_task_claims_user_status (claimer_user_id, status),
  KEY ix_task_claims_claimer_school_id (claimer_school_id),
  KEY ix_task_claims_claimer_source_user_id (claimer_source_user_id),
  CONSTRAINT fk_task_claims_task_id FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_claims_claimer_user_id FOREIGN KEY (claimer_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_task_favorite_task_user (task_id, user_id),
  KEY ix_task_favorites_task_id (task_id),
  KEY ix_task_favorites_user_id (user_id),
  CONSTRAINT fk_task_favorites_task_id FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_favorites_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
