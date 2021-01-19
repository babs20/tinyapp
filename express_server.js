'use strict';
// IMPORT MODULES //
const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// SETTING UP APP
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

// DATABASES //
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  user1x1gd1:
    { id: 'user1x1gd1', email: 'test@gmail.com', password: 'test' }
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
    if (bool && id.password === reqPass) { // both have matches
      console.log('passing here');
      return callback(true, id.id);
    } else {
      return callback(false, null);
    }
  });
};

// ROUTING //
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, userId: findUserInfo(req.cookies["user_id"]) };
  res.render('urls_index', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:newURL', (req, res) => {
  const shortURL = Object.keys(req.body)[0];
  urlDatabase[shortURL] = req.body[shortURL];
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { userId: findUserInfo(req.cookies["user_id"]) };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  res.redirect(`/urls`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = { longURL: urlDatabase[req.params.shortURL], userId: findUserInfo(req.cookies["user_id"]) };
  res.redirect(longURL.longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userId: findUserInfo(req.cookies["user_id"])
  };
  res.render('urls_show', templateVars);
});

// LOGIN //
app.post('/login', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;

  passwordChecker(reqEmail, reqPass, (bool, id) => {
    if (bool) {
      res.cookie('user_id', id);
      return res.redirect('/urls');
    } else {
      console.log('Password Fail');
      res.status(403);
      return res.send('403');
    }
  });

});

app.get('/login', (req, res) => {
  const templateVars = { userId: findUserInfo(req.cookies["user_id"]) };
  res.render('urls_login', templateVars);
});

// LOGOUT //
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// REGISTER //
app.get('/register', (req, res) => {
  const templateVars = { userId: findUserInfo(req.cookies["user_id"]) };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const reqEmail = req.body.email;
  const reqPass = req.body.password;
  if ((reqEmail === '' || reqPass === '') || emailLookup(reqEmail, (bool, id) => bool)) {
    res.status(400);
    return res.send('400');
  }
  const ranUserId = `user${generateRandomString()}`;
  users[ranUserId] = { id: ranUserId, email: reqEmail, password: reqPass };
  console.log(users);
  res.cookie('user_id', ranUserId);
  res.redirect('/urls');
});

// PORT LISTEN //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});