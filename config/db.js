/**
 * SQLite setup for meet-apply-node.
 *
 * Uses Node's built-in `node:sqlite` module (no native compilation needed).
 * The schema mirrors db/schema.rb from the original Rails app exactly.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'apply.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id              VARCHAR(32) PRIMARY KEY,
    open            INTEGER NOT NULL DEFAULT 0,
    reviewable      INTEGER NOT NULL DEFAULT 0,
    title           VARCHAR(255),
    description     TEXT,
    deadline        TEXT,
    identity_columns VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS students (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    _student_first_name     TEXT NOT NULL,
    _student_last_name      TEXT NOT NULL,
    _student_id_number      INTEGER NOT NULL,
    _student_gender         TEXT NOT NULL,
    _student_birthday       TEXT,
    _student_city           TEXT,
    _student_school         TEXT,
    _student_address        TEXT,
    _student_home_phone     TEXT,
    _student_cell_phone     TEXT,
    _student_email          TEXT NOT NULL,
    _parent_full_name       TEXT NOT NULL,
    _parent_work_phone      TEXT,
    _parent_cell_phone      TEXT,
    _parent_email           TEXT,
    _permission_to_apply    INTEGER,
    created_at              TEXT
  );

  CREATE TABLE IF NOT EXISTS fellows (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name         TEXT NOT NULL,
    last_name          TEXT NOT NULL,
    email              TEXT NOT NULL,
    major              TEXT,
    affiliation        TEXT,
    why_fellow         TEXT,
    challenges         TEXT,
    role               TEXT,
    "foreign"         TEXT,
    mission            TEXT,
    resume_file_name   TEXT,
    how_hear           TEXT,
    created_at         TEXT
  );

  CREATE TABLE IF NOT EXISTS instructors (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name         TEXT NOT NULL,
    last_name          TEXT NOT NULL,
    email              TEXT NOT NULL,
    major              TEXT,
    status             TEXT,
    graduation_year    TEXT,
    why_meet           TEXT,
    programming        TEXT,
    teaching           TEXT,
    teamwork           TEXT,
    anything_else      TEXT,
    resume_file_name   TEXT,
    how_hear           TEXT,
    created_at         TEXT
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name         TEXT NOT NULL,
    last_name          TEXT NOT NULL,
    email              TEXT NOT NULL,
    major              TEXT,
    graduation_year    TEXT,
    why_meet           TEXT,
    experience         TEXT,
    teamwork           TEXT,
    limitations        TEXT,
    anything_else      TEXT,
    resume_file_name   TEXT,
    how_hear           TEXT,
    created_at         TEXT
  );

  CREATE TABLE IF NOT EXISTS mentors (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    email                 TEXT NOT NULL,
    current_role          TEXT,
    organization          TEXT,
    years_experience      INTEGER,
    expertise_areas       TEXT,
    why_mentor            TEXT,
    availability          TEXT,
    linkedin              TEXT,
    created_at            TEXT
  );

  CREATE TABLE IF NOT EXISTS instructor_reviews (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    app_reviewer_id   TEXT NOT NULL,
    app_id            INTEGER NOT NULL,
    enthusiasm        INTEGER,
    programming       TEXT,
    teaching          INTEGER,
    teamwork          INTEGER,
    overall           INTEGER,
    y1                INTEGER,
    y2                INTEGER,
    y3                INTEGER,
    interview         INTEGER,
    comment           TEXT,
    created_at        TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS index_instructor_reviews_on_app_reviewer_id_and_app_id
    ON instructor_reviews (app_reviewer_id, app_id);
`);

module.exports = { db };
