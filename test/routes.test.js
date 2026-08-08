/**
 * routes.test.js — HTTP flow tests for the whole app.
 *
 * Starts the real Express app on an ephemeral port and drives it with fetch(),
 * exercising: home, application forms (valid + invalid), login (with CSRF),
 * admin calls/review/export/visualize pages, and the 404 handler.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { setupTestDb, teardownTestDb, createCookieJar, get, postForm, csrfFromHtml } = require('./helpers');
const { dir } = setupTestDb(); // must run before requiring app

const { seedAll } = require('../db/seed');
const app = require('../server');

const ADMIN = { username: 'admin', password: 'meet' };

let server;
let base;

test.before(async () => {
  seedAll();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  server.close();
  teardownTestDb(dir);
});

// ---------------------------------------------------------------------------
// Public pages
// ---------------------------------------------------------------------------

test('GET / lists the four application calls', async () => {
  const res = await get(base, createCookieJar(), '/');
  assert.equal(res.status, 200);
  const html = await res.text();
  for (const id of ['student', 'fellow', 'instructor', 'business']) {
    assert.ok(html.includes(`/${id}`), `home links to /${id}`);
  }
});

test('GET /student renders the application form with sections', async () => {
  const res = await get(base, createCookieJar(), '/student');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Student Information'));
  assert.ok(html.includes('Parent Information'));
  assert.ok(html.includes('Parental Permission'));
  assert.ok(html.includes('ID number'));
  assert.ok(html.includes('_student_email'));
});

test('GET /unknown-model returns 404', async () => {
  const res = await get(base, createCookieJar(), '/unicorn');
  assert.equal(res.status, 404);
});

test('POST /student with invalid data returns 422 and error messages', async () => {
  const jar = createCookieJar();
  const res = await postForm(base, jar, '/student', {
    _student_first_name: '',
    _student_last_name: '',
    _student_email: 'not-an-email',
  });
  assert.equal(res.status, 422);
  const html = await res.text();
  assert.ok(html.includes("can't be blank"));
  assert.ok(html.includes('invalid'));
});

test('POST /student with valid data redirects to thanks', async () => {
  const jar = createCookieJar();
  const res = await postForm(base, jar, '/student', {
    _student_first_name: 'Test', _student_last_name: 'Applicant',
    _student_id_number: '333444555', _student_gender: 'Female',
    _student_city: 'Jerusalem', _student_school: 'Leyada',
    _student_email: 'test.applicant@example.com',
    _parent_full_name: 'Parent One', _permission_to_apply: '1',
  });
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /\/student\/thanks/);
  const thanks = await get(base, jar, res.headers.get('location'));
  assert.equal(thanks.status, 200);
  assert.ok((await thanks.text()).includes('Thank you'));
});

// ---------------------------------------------------------------------------
// Auth + CSRF
// ---------------------------------------------------------------------------

test('admin routes redirect to login when unauthenticated', async () => {
  const jar = createCookieJar();
  for (const path of ['/calls', '/review/instructor', '/export/instructor', '/visualize/instructor/table']) {
    const res = await get(base, jar, path);
    assert.equal(res.status, 302, `${path} should redirect`);
    assert.match(res.headers.get('location'), /\/login/, `${path} redirects to login`);
  }
});

test('login rejects a POST without a CSRF token (403)', async () => {
  const jar = createCookieJar();
  const res = await postForm(base, jar, '/login', ADMIN);
  assert.equal(res.status, 403);
});

test('full login flow works with a CSRF token', async () => {
  const jar = createCookieJar();
  const loginPage = await get(base, jar, '/login');
  assert.equal(loginPage.status, 200);
  const token = csrfFromHtml(await loginPage.text());
  assert.ok(token, 'login page carries a CSRF token');

  const res = await postForm(base, jar, '/login', { ...ADMIN, _csrf: token });
  assert.equal(res.status, 302);

  // Authenticated admin pages now work
  const calls = await get(base, jar, '/calls');
  assert.equal(calls.status, 200);
  assert.ok((await calls.text()).includes('instructor'));
});

test('wrong password is rejected', async () => {
  const jar = createCookieJar();
  const loginPage = await get(base, jar, '/login');
  const token = csrfFromHtml(await loginPage.text());
  const res = await postForm(base, jar, '/login', { username: 'admin', password: 'wrong', _csrf: token });
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// Admin pages (authenticated)
// ---------------------------------------------------------------------------

async function login(jar) {
  const loginPage = await get(base, jar, '/login');
  const token = csrfFromHtml(await loginPage.text());
  await postForm(base, jar, '/login', { ...ADMIN, _csrf: token });
}

test('review index lists applications', async () => {
  const jar = createCookieJar();
  await login(jar);
  const res = await get(base, jar, '/review/instructor');
  assert.equal(res.status, 200);
  assert.ok((await res.text()).includes('Sarah Levy'));
});

test('review edit page shows the scoring form and a CSRF token', async () => {
  const jar = createCookieJar();
  await login(jar);
  const res = await get(base, jar, '/review/instructor/1');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Enthusiasm'));
  assert.ok(html.includes('Overall'));
  assert.ok(csrfFromHtml(html), 'review form carries CSRF token');
});

test('saving a review requires a CSRF token', async () => {
  const jar = createCookieJar();
  await login(jar);
  const res = await postForm(base, jar, '/review/instructor/1', { enthusiasm: '5' });
  assert.equal(res.status, 403);
});

test('saving a review with a valid token redirects back to the list', async () => {
  const jar = createCookieJar();
  await login(jar);
  const edit = await get(base, jar, '/review/instructor/1');
  const token = csrfFromHtml(await edit.text());
  const res = await postForm(base, jar, '/review/instructor/1', {
    _csrf: token, enthusiasm: '5', programming: '5', teaching: '4',
    teamwork: '3', overall: '7', comment: 'Great candidate',
  });
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /\/review\/instructor$/);
});

test('export returns a CSV with header row', async () => {
  const jar = createCookieJar();
  await login(jar);
  const res = await get(base, jar, '/export/instructor');
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes('First name'));
  assert.ok(text.includes('Sarah'));
});

test('visualize table and scatter render', async () => {
  const jar = createCookieJar();
  await login(jar);
  const table = await get(base, jar, '/visualize/instructor/table');
  assert.equal(table.status, 200);
  assert.ok((await table.text()).includes('Enthusiasm'));

  const scatter = await get(base, jar, '/visualize/instructor/scatter');
  assert.equal(scatter.status, 200);
  assert.ok((await scatter.text()).includes('<svg'));
});

test('calls edit page renders and updates work with CSRF', async () => {
  const jar = createCookieJar();
  await login(jar);
  const edit = await get(base, jar, '/calls/instructor/edit');
  assert.equal(edit.status, 200);
  const token = csrfFromHtml(await edit.text());
  assert.ok(token, 'calls edit carries CSRF token');

  const res = await postForm(base, jar, '/calls/instructor', {
    _csrf: token, open: '1', reviewable: '1', title: 'Updated Title',
    description: 'x', deadline: '2026-12-31', identity_columns: 'first_name last_name',
  });
  assert.equal(res.status, 302);
});
