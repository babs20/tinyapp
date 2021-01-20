const { assert } = require('chai');
const { getUserByEmail } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function () {
  it('should return a user id with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers, (bool, id) => id.id);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });

  it('should return false if email does not exist in database', function () {
    const user = getUserByEmail("userfafa@example.com", testUsers, (bool, id) => bool);
    const expectedOutput = false;
    assert.strictEqual(user, expectedOutput);
  });
});