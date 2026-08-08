/** Require a logged-in session user (replaces the original OpenID staff check). */
function requireLogin(req, res, next) {
  if (req.session && req.session.username) return next();
  const redirect = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/login?next=${redirect}`);
}

module.exports = { requireLogin };
