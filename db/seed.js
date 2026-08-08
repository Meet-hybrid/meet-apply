/**
 * seed.js — seeds the database with the 4 original calls for applications
 * plus sample applications and reviews so every page has data to show.
 *
 *   npm run seed    → insert if missing
 *   npm run reset   → delete data/apply.db and reseed from scratch
 */
const fs = require('node:fs');
const path = require('node:path');

const FORCE = process.argv.includes('--force');

if (FORCE) {
  // Delete BEFORE requiring config/db so it re-creates a fresh database.
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'apply.db');
  fs.rmSync(dbPath, { force: true });
  console.log('DB reset.');
}

const { db } = require('../config/db');

const Call = require('../models/call');
const student = require('../models/student');
const fellow = require('../models/fellow');
const instructor = require('../models/instructor');
const business = require('../models/business');
const review = require('../models/instructor_review');

const DESCRIPTION_STUDENT =
  '<p>The MEET student program is an intensive three-year program in which ' +
  'Israeli and Palestinian high school students learn computer science and ' +
  'leadership together.</p>';
const DESCRIPTION_FELLOW =
  '<p>The MEET Fellowship is a year-long commitment for recent graduates to ' +
  'live in Jerusalem and teach computer science.</p>';
const DESCRIPTION_INSTRUCTOR =
  '<p>Summer technical instructors teach MEET\'s computer science curriculum ' +
  'during the summer program.</p>';
const DESCRIPTION_BUSINESS =
  '<p>Summer business instructors teach MEET\'s entrepreneurship and business ' +
  'curriculum during the summer program.</p>';

function seedCalls() {
  const calls = [
    ['student', 1, 0, 'MEET Student Application', DESCRIPTION_STUDENT, '2026-12-31', '_student_first_name _student_last_name'],
    ['fellow', 1, 0, 'MEET Fellowship Application', DESCRIPTION_FELLOW, '2026-12-31', 'first_name last_name'],
    ['instructor', 1, 1, 'Summer Technical Instructor Application', DESCRIPTION_INSTRUCTOR, '2026-12-31', 'first_name last_name'],
    ['business', 1, 1, 'Summer Business Instructor Application', DESCRIPTION_BUSINESS, '2026-12-31', 'first_name last_name'],
  ];
  for (const [id, open, reviewable, title, description, deadline, identity] of calls) {
    if (!Call.find(id)) {
      Call.create({ id, open, reviewable, title, description, deadline, identity_columns: identity });
    }
  }
  console.log('Calls:', Call.all().map((c) => c.id).join(', '));
}

function seedStudents() {
  if (student.count() > 0) return;
  const now = new Date().toISOString();
  student.create({
    _student_first_name: 'Yara', _student_last_name: 'Haddad',
    _student_id_number: 309182771, _student_gender: 'Female',
    _student_birthday: '2011-04-12', _student_city: 'Jerusalem',
    _student_school: 'Schmidt for girls', _student_address: '1 Old City Road',
    _student_cell_phone: '052-111-2233', _student_email: 'yara@example.com',
    _parent_full_name: 'Leila Haddad', _parent_cell_phone: '050-999-8877',
    _parent_email: 'leila@example.com', _permission_to_apply: 1, created_at: now,
  });
  student.create({
    _student_first_name: 'Omar', _student_last_name: 'Abu Nasser',
    _student_id_number: 218776554, _student_gender: 'Male',
    _student_birthday: '2010-11-03', _student_city: 'Ramallah',
    _student_school: 'Friends school/ Ramallah',
    _student_home_phone: '02-555-1234', _student_email: 'omar@example.com',
    _parent_full_name: 'Khalil Abu Nasser', _parent_work_phone: '02-555-9090',
    _parent_email: 'khalil@example.com', _permission_to_apply: 1, created_at: now,
  });
  console.log('Students:', student.count());
}

function seedFellows() {
  if (fellow.count() > 0) return;
  const now = new Date().toISOString();
  fellow.create({
    first_name: 'Daniel', last_name: 'Cohen', email: 'daniel.cohen@example.com',
    major: 'Computer Science', affiliation: 'MIT',
    why_fellow: 'I want to teach and grow with the MEET community.',
    challenges: 'Keeping students engaged in virtual classes.',
    role: 'A guide who helps students discover their own strengths.',
    foreign: 'Learning Arabic and building a new community.',
    mission: 'Support student projects beyond the classroom.',
    resume_file_name: 'daniel-resume.pdf', how_hear: 'Alumni network', created_at: now,
  });
  console.log('Fellows:', fellow.count());
}

function seedInstructors() {
  if (instructor.count() > 0) return;
  const now = new Date().toISOString();
  instructor.create({
    first_name: 'Sarah', last_name: 'Levy', email: 'sarah.levy@example.com',
    major: 'Electrical Engineering', status: 'Undergraduate',
    graduation_year: '2027', why_meet: 'I love teaching Python to beginners.',
    programming: 'Python, C++, web basics; interned at a robotics lab.',
    teaching: 'Tutored intro CS for two semesters.',
    teamwork: 'Led a 5-person robotics team in a national competition.',
    anything_else: 'I play guitar and love camping.',
    resume_file_name: 'sarah-resume.pdf', how_hear: 'Campus flyer', created_at: now,
  });
  instructor.create({
    first_name: 'Mahmoud', last_name: 'Jaber', email: 'mahmoud.jaber@example.com',
    major: 'Computer Science', status: 'Grad student',
    why_meet: 'To give back to the community that shaped me.',
    programming: 'Research assistant in NLP; strong Python and data skills.',
    teaching: 'TA for algorithms, ran coding workshops for high schoolers.',
    teamwork: 'Coordinated a hackathon with 60 participants.',
    anything_else: 'Fluent in Arabic, Hebrew, and English.',
    resume_file_name: 'mahmoud-resume.pdf', how_hear: 'MEET alumni', created_at: now,
  });
  instructor.create({
    first_name: 'Noa', last_name: 'Goldberg', email: 'noa.goldberg@example.com',
    major: 'Mathematics', status: 'Alumnus/a', graduation_year: '2024',
    why_meet: 'MEET changed my life; I want to be part of that for others.',
    programming: 'Full-stack dev at a startup; strong in JS and SQL.',
    teaching: 'Volunteered at an after-school coding club.',
    teamwork: 'Product team lead; strong communication skills.',
    anything_else: 'I write a tech blog in three languages.',
    resume_file_name: 'noa-resume.pdf', how_hear: 'Alumni network', created_at: now,
  });
  console.log('Instructors:', instructor.count());
}

function seedBusinesses() {
  if (business.count() > 0) return;
  const now = new Date().toISOString();
  business.create({
    first_name: 'Adam', last_name: 'Shapiro', email: 'adam.shapiro@example.com',
    major: 'Business Administration', graduation_year: '2027',
    why_meet: 'I want to mentor students building their first startups.',
    experience: 'Ran a small e-commerce business in college.',
    teamwork: 'Led the student entrepreneurship club.',
    limitations: 'Available full-time in July.',
    anything_else: 'Passionate about social impact.',
    resume_file_name: 'adam-resume.pdf', how_hear: 'Campus flyer', created_at: now,
  });
  console.log('Businesses:', business.count());
}

function seedReviews() {
  if (review.count() > 0) return;
  const now = new Date().toISOString();
  const apps = instructor.list();
  const reviewer1 = process.env.ADMIN_USERNAME || 'admin';
  const reviewer2 = 'reviewer2';

  const scores = [
    { app: apps[0], r1: { enthusiasm: 4, programming: '5', teaching: 5, teamwork: 3, overall: 6, y1: 1, y2: 0, y3: 0, interview: 1, comment: 'Strong candidate, great energy.' }, r2: { enthusiasm: 5, programming: '4', teaching: 4, teamwork: 3, overall: 6, y1: 1, y2: 1, y3: 0, interview: 0, comment: 'Solid teaching background.' } },
    { app: apps[1], r1: { enthusiasm: 5, programming: '5', teaching: 4, teamwork: 2, overall: 7, y1: 1, y2: 1, y3: 1, interview: 1, comment: 'Excellent fit.' }, r2: { enthusiasm: 4, programming: '5', teaching: 5, teamwork: 3, overall: 7, y1: 1, y2: 1, y3: 1, interview: 1, comment: '' } },
    { app: apps[2], r1: { enthusiasm: 3, programming: '4', teaching: 3, teamwork: 2, overall: 5, y1: 1, y2: 0, y3: 0, interview: 0, comment: 'Good, some concerns about availability.' }, r2: { enthusiasm: 4, programming: '5', teaching: 3, teamwork: 2, overall: 5, y1: 1, y2: 1, y3: 0, interview: 1, comment: '' } },
  ];

  for (const s of scores) {
    if (!s.app) continue;
    for (const [who, r] of [['r1', s.r1], ['r2', s.r2]]) {
      const reviewer = who === 'r1' ? reviewer1 : reviewer2;
      review.save({ app_reviewer_id: reviewer, app_id: s.app.id, ...r });
    }
  }
  console.log('Reviews:', review.count());
}

seedCalls();
seedStudents();
seedFellows();
seedInstructors();
seedBusinesses();
seedReviews();
console.log('Seed complete.');
process.exit(0);
