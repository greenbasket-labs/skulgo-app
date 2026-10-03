-- SkulGo Offline reference local schema
-- SQLite
-- Shared identity/replication foundation.
-- Domain modules may add their own tables without changing the node protocol.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  school_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id)
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  is_trusted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,
  FOREIGN KEY (school_id) REFERENCES schools(school_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS classes (
  class_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  subject_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id)
);

CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  admission_number TEXT,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id),
  FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  assignment_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  teacher_user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (school_id, class_id, subject_id),
  FOREIGN KEY (school_id) REFERENCES schools(school_id),
  FOREIGN KEY (teacher_user_id) REFERENCES users(user_id),
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

CREATE TABLE IF NOT EXISTS records (
  record_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_device_id TEXT NOT NULL,
  session_id TEXT,
  term_id TEXT,
  class_id TEXT,
  subject_id TEXT,
  entity_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  visibility_scope TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(school_id)
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  change_id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_device_id TEXT NOT NULL,
  entity_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued',
  acknowledged_at TEXT,
  FOREIGN KEY (record_id) REFERENCES records(record_id)
);

CREATE TABLE IF NOT EXISTS sync_inbox (
  change_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  received_from_device_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  applied_at TEXT,
  state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  conflict_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  local_version INTEGER NOT NULL,
  remote_version INTEGER NOT NULL,
  local_payload_json TEXT NOT NULL,
  remote_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
