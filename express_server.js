'use strict';

// IMPORT MODULES //
const express = require("express");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { getUserByEmail, findUserId, passwordChecker, urlsForUser, generateRandomString, incrementUniqueViewCookie } = require('./helpers');

// SETTING UP APP
const app = express();
const PORT = 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['some-value'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

/// DATABASES ///
const urlDatabase = { // Simple Data For Testing Edge Cases
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: 'user1x1gd1',
    traffic: 0,
    unique: 0,
    visitLog: [{ timestamp: 1611191758000, visitorId: 'user' }],
    created: 1611191758000
  },
  "b2xabc": {
    longURL: "http://www.lighthouselabs.ca",
    userId: 'DIFFUSER',
    dateCreated: 1611191758000,
    traffic: 0,
    unique: 0,
    visitLog: [{ timestamp: 1611191758000, visitorId: 'user' }],
    created: 1611191758000
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: 'user1x1gd1',
    traffic: 0,
    unique: 0,
    visitLog: [{ timestamp: 1611191758000, visitorId: 'user' }],
    created: 1611191758000
  }
};

const users = {};

/// ROUTING ///

// ROOT //
app.get("/", (req, res) => { // Redirect to URLS or Login depending on user login
  if (!req.session.clientId) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// URLS //
app.get('/urls', (req, res) => { // CREATE MY URLS PAGE
  const userId = findUserId(req.session.clientId, users);
  const templateVars = { urls: urlsForUser(userId, urlDatabase), userId: userId };
  res.render('urls_index', templateVars);
});

app.delete('/urls/:shortURL', (req, res) => { // DELETE LINK FROM DATABASE
  const userId = findUserId(req.session.clientId, users);
  let templateVars = { userId };

  if (!urlDatabase[req.params.shortURL]) { // Link doesn't exist
    templateVars['errMessage'] = '404: The link you are trying to delete does not exist.';
    return res.render('urls_error', templateVars);
  } else if (req.session.clientId !== urlDatabase[req.params.shortURL].userId) { // Wrong Account / Not Logged In
    templateVars['errMessage'] = '403: You do not have permission to delete this file. If this is your link, please log in.';
    res.render('urls_error', templateVars);
  } else {
    delete urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
  }
});

app.put('/urls/:id', (req, res) => { // UPDATE LINK AFTER EDIT
  const id = Object.keys(req.body)[0];
  if (!urlDatabase[id]) { // Not logged in
    return res.redirect('/login');
  } else if (req.session.clientId !== urlDatabase[id].userId) { // Not the right user
    return res.redirect(`/urls/${id}`);
  } else {
    urlDatabase[id].longURL = req.body[id];
    return res.redirect('/urls');
  }
});

app.post('/urls', (req, res) => { // CREATE NEW SHORT LINK AND ADD TO DATABASE
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: req.session.clientId,
    traffic: 0,
    unique: 0,
    created: Date.now(),
    visitLog: []
  };
  res.redirect(`urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => { // CREATE NEW SHORT URL
  const userId = findUserId(req.session.clientId, users);
  if (userId === undefined) {
    res.redirect('/login');
  } else {
    const templateVars = { userId: userId };
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:id', (req, res) => { // URL SHOW PAGE
  let linkExists = Object.keys(urlDatabase).includes(req.params.id) ? true : false;
  const templateVars = {
    urls: urlDatabase,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id] ? urlDatabase[req.params.id].longURL : null,
    userId: findUserId(req.session.clientId, users),
    linkExists,
  };
  res.render('urls_show', templateVars);
});

// REDIRECT SHORTEN LINKS //
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL]) { // DEAL WITH ANALYTICS BEFORE REDIRECT
    // VISITS
    let viewCookieExists = false;
    const idObject = urlDatabase[shortURL];
    req.session[shortURL] ? viewCookieExists = true : req.session[shortURL] = true;
    incrementUniqueViewCookie(viewCookieExists, idObject);

    // VISIT TIMESTAMPS
    req.session.visitorId ? req.session.visitorId : req.session.visitorId = `visitor${generateRandomString()}`;
    urlDatabase[shortURL].visitLog.push({ timestamp: Date.now(), visitorId: req.session.visitorId });

    return res.redirect(urlDatabase[shortURL].longURL);

  } else {
    const userId = findUserId(req.session.clientId, users);
    const templateVars = { errMessage: '404. That link does not exist, please check your url.', userId };
    res.status(404).render('urls_error', templateVars);
  }
});

// LOGIN //
app.post('/login', (req, res) => {
  const userId = findUserId(req.session.clientId, users);
  const reqEmail = req.body.email;
  const reqPass = req.body.password;

  passwordChecker(reqEmail, reqPass, users, (correctLogin, id) => {
    if (correctLogin) {
      req.session.clientId = id;
      return res.redirect('/urls');
    } else {
      const templateVars = { userId, errMessage: 'The log in information is incorrect please try again.' };
      return res.render('urls_error', templateVars);
    }
  });
});

app.get('/login', (req, res) => {
  if (req.session.clientId) {
    return res.redirect('/urls');
  }
  const templateVars = { userId: findUserId(req.session.clientId, users) };
  res.render('urls_login', templateVars);
});

// REGISTER //
app.get('/register', (req, res) => {
  if (req.session.clientId) {
    return res.redirect('/urls');
  }
  const templateVars = { userId: findUserId(req.session.clientId, users), errMessage: '404' };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;
  const hashedPass = bcrypt.hashSync(reqPass, 10);
  const templateVars = { userId: findUserId(req.session.clientId, users) };

  if ((reqEmail === '' || reqPass === '')) { // Both fields empty
    templateVars['errMessage'] = 'Please enter information into the text fields.';
    return res.render('urls_error', templateVars);
  } else if (getUserByEmail(reqEmail, users, (bool) => bool)) { // Email in use
    templateVars['errMessage'] = 'That E-Mail is already in use.';
    return res.render('urls_error', templateVars);
  } else {
    const ranUserId = `user${generateRandomString()}`;
    users[ranUserId] = { id: ranUserId, email: reqEmail, password: hashedPass };
    req.session.clientId = ranUserId;
    res.redirect('/urls');
  }

});

// LOGOUT //
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// PORT LISTEN //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
