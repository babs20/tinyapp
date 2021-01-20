const bcrypt = require('bcrypt');

// EMAIL LOOKUP //
const getUserByEmail = (reqEmail, users, callback) => { // return bool and id in callback
  for (const id in users) {
    if (users[id].email === reqEmail) {
      return callback(true, users[id]);
    }
  }
  return false;
};

// FIND USER //
const findUserId = (cookieVal, users) => {
  if (Object.keys(users).includes(cookieVal)) {
    return users[cookieVal];
  } else {
    return undefined;
  }
};

// PASSWORD CHECKER //
const passwordChecker = (reqEmail, reqPass, db, callback) => {
  getUserByEmail(reqEmail, db, (bool, id) => {
    if (bool && bcrypt.compareSync(reqPass, id.password)) {
      // console.log('passing here');
      return callback(true, id.id);
    } else {
      return callback(false, null);
    }
  });
};

// CREATE URL OBJECT FOR TEMPLATE //
const urlsForUser = (id, urlDatabase) => {
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

// RANDOM STRING GENERATOR //
const generateRandomString = () => {
  const ranNum = Math.floor(Math.random() * (199999999 - 100000000) + 100000000);
  const toBase36 = ranNum.toString(36);
  return toBase36;
};

module.exports = { getUserByEmail, findUserId, passwordChecker, urlsForUser, generateRandomString };