/* eslint-disable camelcase */
'use strict';
// IMPORT MODULES //
const express = require("express");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// SETTING UP APP
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['some-value'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set('view engine', 'ejs');

// DATABASES //
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: 'user1x1gd1' },
  "b2xabc": { longURL: "http://www.lighthouselabs.ca", userId: 'DIFFUSER' },
  "9sm5xK": { longURL: "http://www.google.com", userId: 'user1x1gd1' }
};

const users = {
  // user1x1gd1:
  //   { id: 'user1x1gd1', email: 'test@gmail.com', password: 'test' }
};

// RANDOM STRING GENERATOR //
const generateRandomString = () => {
  const ranNum = Math.floor(Math.random() * (199999999 - 100000000) + 100000000);
  const toBase36 = ranNum.toString(36);
  return toBase36;
};

// FIND USER //
const findUserInfo = (cookieVal) => {
  if (Object.keys(users).includes(cookieVal)) {
    return users[cookieVal];
  } else {
    return undefined;
  }
};

// EMAIL LOOKUP //
const emailLookup = (reqEmail, callback) => {
  for (const id in users) {
    if (users[id].email === reqEmail) {
      return callback(true, users[id]);
    }
  }
  return false;
};

// PASSWORD CHECKER //
const passwordChecker = (reqEmail, reqPass, callback) => {
  emailLookup(reqEmail, (bool, id) => {
    if (bool && bcrypt.compareSync(reqPass, id.password)) { // both have matches
      // console.log('passing here');
      return callback(true, id.id);
    } else {
      return callback(false, null);
    }
  });
};

// CREATE URL OBJECT FOR TEMPLATE //
const urlsForUser = (id) => {
  let validURLS = {};
  if (id !== undefined) {
    for (const shortURL in urlDatabase) {
      if (urlDatabase[shortURL].userId === id.id) {
        validURLS[shortURL] = { longURL: urlDatabase[shortURL].longURL };
      }
    }
  }
  if (Object.keys(validURLS).length === 0) {
    return undefined;
  } else {
    return validURLS;
  }
};

// ROUTING //
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// URLS //
app.get('/urls', (req, res) => { // CREATE MY URLS PAGE
  console.log(req.session.user_id);
  const userId = findUserInfo(req.session.user_id);
  const templateVars = { urls: urlsForUser(userId), userId: userId };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => { // DELETE LINK FROM DATABASE
  if (req.session.user_id === urlDatabase[req.params.shortURL].userId) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:newURL', (req, res) => { // UPDATE LINK AFTER EDIT
  const newURL = Object.keys(req.body)[0];
  if (req.session.user_id === urlDatabase[newURL].userId) {
    urlDatabase[newURL].longURL = req.body[newURL];
  }
  console.log('after update: ', urlDatabase);
  res.redirect('/urls');
});

app.post('/urls', (req, res) => { // CREATE NEW SHORT LINK AND ADD TO DATABASE
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userId: req.session.user_id };
  console.log(urlDatabase);
  res.redirect(`urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const userId = findUserInfo(req.session.user_id);
  if (userId === undefined) {
    res.redirect('/login');
  } else {
    const templateVars = { userId: userId };
    res.render('urls_new', templateVars);
  }
});

app.post('/urls', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => { // URL SHOW PAGE
  const templateVars = {
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: findUserInfo(req.session.user_id)
  };
  res.render('urls_show', templateVars);
});

// REDIRECT SHORTEN LINKS //
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL].longURL);
});

// LOGIN //
app.post('/login', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;

  passwordChecker(reqEmail, reqPass, (bool, id) => {
    if (bool) {
      console.log('here');
      req.session.user_id = id;
      return res.redirect('/urls');
    } else {
      console.log('Password Fail');
      res.status(403);
      return res.send('403');
    }
  });

});

app.get('/login', (req, res) => {
  const templateVars = { userId: findUserInfo(req.session.user_id) };
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
  const templateVars = { userId: findUserInfo(req.session.user_id) };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;
  const hashedPass = bcrypt.hashSync(reqPass, 10);
  if ((reqEmail === '' || reqPass === '') || emailLookup(reqEmail, (bool, id) => bool)) {
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