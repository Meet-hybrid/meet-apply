# meet-apply-node

A **modern Node.js rebuild** of [MEET's](https://github.com/meet) online application system —
the Rails 3.0.20 app at [`github.com/meet/apply`](https://github.com/meet/apply) (2012) — rebuilt so
it actually runs on a modern machine, is easy to read, and easy to modify.

> **Original**: `meet/apply` — Rails 3.0.20, SQLite, Paperclip/S3, OpenID.
> **This rebuild**: Node.js (Express) + SQLite (built-in `node:sqlite`, no native compilation).

---

## 📌 Status (last updated: Aug 8, 2026)

| Piece | Status |
|---|---|
| GitHub repo (public) | ✅ live — `https://github.com/Meet-hybrid/meet-apply` |
| Project scaffold (`package.json`, `.env`, `.gitignore`) | ✅ done |
| SQLite schema (`config/db.js`, mirrors original `schema.rb`) | ✅ done |
| Models (Student, Fellow, Instructor, Business, Mentor, Call, InstructorReview) | ✅ done |
| Routes (apply, calls, review, export, visualize, auth) | ✅ done |
| Views (EJS: form, thanks, review, export, visualize) | ✅ done |
| Seed script + sample data (5 calls incl. mentor) | ✅ done |
| Install & run verification | ✅ done |
| Automated tests (`npm test`, 37 passing) | ✅ done |

**If you're continuing work**: finish the models first (see [Roadmap](#-roadmap)), then routes,
then views, then run `npm install && npm run seed && npm start`.

---

## 🚀 Quick start (once models/routes/views exist)

```bash
cd meet-apply-node

# 1. Install dependencies (Express, EJS, sessions, multer — all pure JS, no build tools)
npm install

# 2. Configure
cp .env.example .env        # edit ADMIN_USERNAME / ADMIN_PASSWORD / SESSION_SECRET

# 3. Create the database + seed the 4 "calls" (student, fellow, instructor, business)
npm run seed                # or: npm run reset  (wipes + reseeds)

# 4. Start the server
npm start                   # → http://localhost:3000
```

### What you'll see

- `http://localhost:3000/` — home page listing the application calls
- `http://localhost:3000/student` (and `/fellow`, `/instructor`, `/business`) — application forms
  with the *same* fields and validations as the original
- Log in with your `.env` admin credentials to reach:
  - `/calls` — manage calls (open/close, deadlines, titles)
  - `/review/:model` — review submitted applications (scoring, comments)
  - `/export/:model` — CSV export of applications
  - `/visualize/:model/table` — summary table of reviews

### 🐳 Run with Docker

```bash
docker-compose up --build   # → http://localhost:3000
# data/ (SQLite DB) and uploads/ (resumes) persist in named volumes
# Admin login comes from ADMIN_USERNAME / ADMIN_PASSWORD (see the compose file)
```

---

## 🗺️ How this maps to the original Rails app

| Original (Rails 3 / `meet/apply`) | This rebuild |
|---|---|
| `app/models/student.rb`, `fellow.rb`, `instructor.rb`, `business.rb` | `models/student.js`, `fellow.js`, `instructor.js`, `business.js` |
| `models/mentor.js` (new type, learning example) | *(no original — added to show how to extend)* |
| `app/models/call.rb` — a "call for applications" | `models/call.js` |
| `app/models/review.rb` + `instructor_review.rb` | `models/instructor_review.js` (review scoring/summaries) |
| `app/controllers/apply_controller.rb` (`new`, `create`) | `routes/apply.js` (`GET /:model`, `POST /:model`) |
| `app/controllers/calls_controller.rb` | `routes/calls.js` (`/calls`) |
| `app/controllers/review_controller.rb` | `routes/review.js` (`/review/:model/...`) |
| `app/controllers/export_controller.rb` | `routes/export.js` (`/export/:model` → CSV) |
| `app/controllers/visualize_controller.rb` | `routes/visualize.js` (`/visualize/:model/...`) |
| `config/routes.rb` | `server.js` route mounting |
| `db/schema.rb` | `config/db.js` (same tables/columns) |
| `db/migrate/*` | schema created fresh on boot (`CREATE TABLE IF NOT EXISTS`) |
| `config/locales/*.yml` (labels) | label strings live in the model column definitions |
| OpenID staff login | simple session login (`ADMIN_USERNAME`/`ADMIN_PASSWORD` in `.env`) |
| Paperclip → S3 resume uploads | `multer` → local `uploads/` folder |
| `app/views/**` (ERB) | `views/**` (EJS) |

### Feature parity notes

- **4 application types** with the original field names, labels, and validations
  (e.g. student must have a 9-digit ID, gender must be Male/Female, city/school from the original
  suggestion lists or `-Other-`, parental permission checkbox required).
- **Call system** — each `Call` has an id (`student`, `fellow`, ...), `open`, `reviewable`,
  `title`, `description`, `deadline`, `identity_columns`.
- **Review workflow** — reviewers score apps (enthusiasm 1–5, programming 1–5 or `?`,
  teaching 1–5, teamwork 1–3, overall 1–7, Y1/Y2/Y3/interview flags, comment) and a summary
  shows averages / percents / per-reviewer text.
- **Preview mode** — `?preview` validates without saving (same as original).
- **Late submissions** — `?late` requires login (same as original).
- **Download resumes** — `GET /review/:model/:app_id/download/:column` serves the uploaded file
  (original redirected to an expiring S3 URL).

---

## 🔧 How to modify it (learning path)

All the interesting logic is small and deliberately plain. Start here:

1. **Add a field to a form** — edit a model file, e.g. `models/student.js`:
   ```js
   { name: '_student_shirt_size', type: 'string', label: 'Shirt size', required: false },
   ```
   Add the column to `config/db.js` (the schema) if it's new, then `npm run reset`.
   The form, review screen, and CSV export pick it up automatically.

2. **Add a new application type** — 4 steps, all data-driven (the `mentor` type is a
   complete worked example):
   a. `config/db.js` → add an `CREATE TABLE IF NOT EXISTS` block for the new table.
   b. `models/xyz.js` → create a model file (mirror `models/mentor.js` or `models/fellow.js`):
      column metadata `{ name, type, label, ... }` with validation flags.
   c. `models/call.js` → add `const xyz = require('./xyz')` and put `xyz` in
      `APPLICATION_MODELS`.
   d. `db/seed.js` → add a `['xyz', open, reviewable, title, description, deadline,
      identity_columns]` row to `seedCalls()` (+ optional sample data in a `seedXyz()`).

   That's it — the generic `/:model` routes, form rendering, review view, CSV export,
   and visualizations all pick the new type up automatically. Restart, `npm run seed`,
   done. See commit history for the exact `mentor` changes.

3. **Change a validation** — the `required`, `options`, `length`, `unique`, `email`,
   `accept`, `suggest` flags on a column map 1:1 to the original Rails validators.

4. **Tweak the review scoring** — edit `models/instructor_review.js` (`options` per column)
   and the summary math in `routes/visualize.js`.

5. **Restyle the site** — everything visual lives in `public/styles.css` and `views/**`.

### Adding a new column: full checklist

1. `config/db.js` → add column to the matching `CREATE TABLE` (or create a new table).
2. Model file → add the column metadata `{ name, type, label, ... }`.
3. `npm run reset` (drops nothing; it deletes `data/apply.db` and recreates + reseeds).
4. Test at `/student` (or whatever model) — form renders, saves, exports.

---

## 📁 Project structure

```
meet-apply-node/
├── server.js            # Express app: sessions, static files, route mounting
├── config/
│   └── db.js            # SQLite connection + schema (mirrors original schema.rb)
├── models/              # One file per model, column metadata + validations
│   ├── base.js          # Generic model: CRUD + validation engine (see below)
│   ├── call.js
│   ├── student.js
│   ├── fellow.js
│   ├── instructor.js
│   ├── business.js
│   └── instructor_review.js
├── routes/              # Express routers (controllers)
│   ├── apply.js         # public forms: GET/POST /:model
│   ├── calls.js         # admin: /calls
│   ├── review.js        # admin: /review/:model/:app_id
│   ├── export.js        # admin: /export/:model
│   ├── visualize.js     # admin: /visualize/:model/table|scatter|splom
│   └── auth.js          # login/logout (replaces OpenID)
├── middleware/
│   └── auth.js          # requireLogin()
├── views/               # EJS templates
├── public/styles.css    # all styling
├── uploads/             # resume files (gitignored)
├── data/apply.db        # SQLite database (gitignored, created at boot)
├── db/seed.js           # seeds the 4 calls (+ sample data)
├── .env.example         # copy to .env
└── package.json
```

### The base model (`models/base.js`) — read this first

Each model is *metadata*, not boilerplate. `models/base.js` provides:
- `list()`, `find(id)`, `count()` — SQLite queries via prepared statements
- `create(data)` / `update(id, data)` — writes with proper coercion (booleans, ints)
- `validate(data)` — returns `{ field: message }` errors, replicating Rails validators
  (`presence`, `inclusion`/options, `length`, `uniqueness`, `format`/email, `acceptance`,
  `attachment`/file-required, `suggest` lists with `-Other-`)
- `formColumns()` / `exportColumns()` — column metadata (field type, label, section)
  so forms and CSV export render themselves

---

## ✅ Roadmap / next steps (in order)

1. **Models** — `models/base.js` (generic CRUD + validators), then `student.js`,
   `fellow.js`, `instructor.js`, `business.js`, `call.js`, `instructor_review.js`.
2. **Middleware & auth** — `middleware/auth.js`, `routes/auth.js` (login/logout).
3. **Routes** — `apply.js`, `calls.js`, `review.js`, `export.js`, `visualize.js`.
4. **Views** — EJS templates + `public/styles.css` (form, thanks, review, export, visualize).
5. **Seed** — `db/seed.js`: 4 calls + a few sample applications/reviews so pages aren't empty.
6. **Verify** — `npm install && npm run seed && npm start`, click through every page,
   submit a test application, review it, export CSV, check visualizations.
7. **Commit & push** — every step above gets committed to GitHub so nothing is ever lost.

Nice-to-haves later: ~~automated tests (`node:test`, 37 passing)~~ (done), ~~Dockerfile~~
(done — see "🐳 Run with Docker" above), deploy to Render/Railway/Fly.

---

## 🧠 Design decisions (why things are the way they are)

- **`node:sqlite` instead of `better-sqlite3`** — zero native compilation, works on any Node ≥ 23.4.
- **No ORM** — plain prepared statements. More explicit, easier to learn from, and the app is
  small enough that an ORM would add more magic than value.
- **Session login instead of OpenID** — the original required Google/OpenID staff auth which is
  dead in 2026; a password from `.env` keeps the app self-contained.
- **Resumes stored on disk** — the original pushed to S3; `uploads/` keeps local dev dependency-free.
- **EJS instead of ERB** — the closest JS analog to the original templates.

---

## 📜 License & attribution

This is a **reimplementation/learning project** based on the open-source MEET application
(`github.com/meet/apply`, no license file in the original repo). The MEET program
(Middle East Education through Technology) retains all rights to their original code and
trademarks. This project is not affiliated with or endorsed by MEET.

Original repo: https://github.com/meet/apply · This repo: https://github.com/Meet-hybrid/meet-apply
