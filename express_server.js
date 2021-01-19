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

};

// RANDOM STRING GENERATOR //
const generateRandomString = () => {
  const ranNum = Math.floor(Math.random() * (199999999 - 100000000) + 100000000);
  const toBase36 = ranNum.toString(36);
  return toBase36;
};

// FIND USER //
const findUserInfo = (cookieVal) => {
  console.log('cookie func', cookieVal);
  console.log(users);
  if (Object.keys(users).includes(cookieVal)) {
    return users[cookieVal];
  } else {
    return undefined;
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: findUserInfo(req.cookies["username"]) };
  console.log(req.cookies["username"]);
  console.log(templateVars);
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
  const templateVars = { username: findUserInfo(req.cookies["username"]) };
  res.render('urls_new', templateVars);
});

app.post('/urls', (req, res) => {
  res.redirect(`/urls`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = { longURL: urlDatabase[req.params.shortURL], username: findUserInfo(req.cookies["username"]) };
  res.redirect(longURL.longURL);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: findUserInfo(req.cookies["username"])
  };
  res.render('urls_show', templateVars);
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// REGISTER //

app.get('/register', (req, res) => {
  const templateVars = { username: findUserInfo(req.cookies["username"]) };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const ranUsername = `user${generateRandomString()}`;
  users[ranUsername] = { id: ranUsername, email: req.body.email, password: req.body.password };
  res.cookie('username', ranUsername);
  console.log(users);
  res.redirect('/urls');
});

// PORT LISTEN //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});