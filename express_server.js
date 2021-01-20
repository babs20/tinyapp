/* eslint-disable camelcase */
'use strict';
// IMPORT MODULES //
const express = require("express");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail, findUserId, passwordChecker, urlsForUser, generateRandomString } = require('./helpers');

// SETTING UP APP
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['some-value'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set('view engine', 'ejs');

/// DATABASES ///
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: 'user1x1gd1' },
  "b2xabc": { longURL: "http://www.lighthouselabs.ca", userId: 'DIFFUSER' },
  "9sm5xK": { longURL: "http://www.google.com", userId: 'user1x1gd1' }
};

const users = {
  // user1x1gd1:
  //   { id: 'user1x1gd1', email: 'test@gmail.com', password: 'test' }
};

/// ROUTING ///

// ROOT //
app.get("/", (req, res) => { // Redirect to URLS or Login depending on user login
  const userId = findUserId(req.session.user_id, users);
  if (userId === undefined) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// URLS //
app.get('/urls', (req, res) => { // CREATE MY URLS PAGE
  // console.log(req.session.user_id);
  const userId = findUserId(req.session.user_id, users);
  const templateVars = { urls: urlsForUser(userId, urlDatabase), userId: userId };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => { // DELETE LINK FROM DATABASE
  if (req.session.user_id === urlDatabase[req.params.shortURL].userId) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => { // UPDATE LINK AFTER EDIT
  const id = Object.keys(req.body)[0];
  console.log(req);
  if (!urlDatabase[id]) {
    return res.redirect('/login');
  } else if (req.session.user_id !== urlDatabase[id].userId) {
    return res.redirect(`/urls/${id}`);
  } else {
    urlDatabase[id].longURL = req.body[id];
    return res.redirect('/urls');
  }
});

app.post('/urls', (req, res) => { // CREATE NEW SHORT LINK AND ADD TO DATABASE
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userId: req.session.user_id };
  res.redirect(`urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => { //
  const userId = findUserId(req.session.user_id, users);
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
    userId: findUserId(req.session.user_id, users),
    linkExists
  };
  res.render('urls_show', templateVars);
});

// REDIRECT SHORTEN LINKS //
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] ? res.redirect(urlDatabase[shortURL].longURL) : res.redirect(`/urls/${shortURL}`);
});

// LOGIN //
app.post('/login', (req, res) => {
  const userId = findUserId(req.session.user_id, users);
  const reqEmail = req.body.email;
  const reqPass = req.body.password;

  passwordChecker(reqEmail, reqPass, users, (bool, id) => {
    if (bool) {
      // console.log('here');
      req.session.user_id = id;
      return res.redirect('/urls');
    } else {
      // console.log('Password Fail');
      const templateVars = { userId };
      return res.render('urls_error', templateVars);
    }
  });
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { userId: findUserId(req.session.user_id, users) };
  res.render('urls_login', templateVars);
});

// LOGOUT //
app.post('/logout', (req, res) => {
  req.session = null;
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// REGISTER //
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { userId: findUserId(req.session.user_id, users) };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;
  const hashedPass = bcrypt.hashSync(reqPass, 10);
  if ((reqEmail === '' || reqPass === '') || getUserByEmail(reqEmail, users, (bool, id) => bool)) {
    res.status(400);
    return res.send('400');
  }
  const ranUserId = `user${generateRandomString()}`;
  users[ranUserId] = { id: ranUserId, email: reqEmail, password: hashedPass };
  // console.log(users);
  req.session.user_id = ranUserId;
  res.redirect('/urls');
});

// PORT LISTEN //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});