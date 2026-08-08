/**
 * server.js — entry point for meet-apply-node.
 *
 * Mirrors config/routes.rb of the original Rails app:
 *   public:  GET /:model, POST /:model (application forms)
 *   admin:   /calls, /review/:model, /export/:model, /visualize/:model (login required)
 *   auth:    /login, /logout
 */
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    name: 'meet_apply',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

// Landing page listing the calls
app.get('/', (req, res) => {
  const Call = require('./models/call');
  res.render('home', {
    calls: Call.all(),
    currentUser: req.session.username,
  });
});

// Mount specific paths BEFORE the catch-all apply router (/:model),
// otherwise '/calls', '/review', etc. would be swallowed by it.
app.use(require('./routes/auth'));
app.use('/calls', require('./routes/calls'));
app.use('/review', require('./routes/review'));
app.use('/export', require('./routes/export'));
app.use('/visualize', require('./routes/visualize'));
app.use(require('./routes/apply'));

app.use((req, res) => res.status(404).render('apply/call_bad', { model: req.path }));

app.listen(PORT, () => {
  console.log(`meet-apply-node running at http://localhost:${PORT}`);
  console.log(`Admin login: ${process.env.ADMIN_USERNAME || 'admin'} / (see .env)`);
});
