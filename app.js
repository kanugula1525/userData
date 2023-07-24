const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    response.sen(`DB Error:${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

// API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const checkUserExists = `
    SELECT * FROM user WHERE username='${username}';`;
  const isUserAlreadyExists = await db.get(checkUserExists);
  if (isUserAlreadyExists !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    let passwordLength = password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const registerUserQuery = `
        INSERT INTO user
        Values(
           '${username}',
            '${name}',
            '${encryptedPassword}',
            '${gender}',
            '${location}'
        );`;
      await db.run(registerUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

// API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserExists = `
    SELECT * FROM user WHERE username='${username}';`;
  const isUserAlreadyExists = await db.get(checkUserExists);
  if (isUserAlreadyExists === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordIsTrue = await bcrypt.compare(
      password,
      isUserAlreadyExists.password
    );
    if (isPasswordIsTrue === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserExists = `
    SELECT * FROM user WHERE username='${username}';`;
  const isUserAlreadyExists = await db.get(checkUserExists);
  const isOldPasswordSame = await bcrypt.compare(
    oldPassword,
    isUserAlreadyExists.password
  );
  if (!isOldPasswordSame) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const encryptedNewPassword = await bcrypt.hash(newPassword, 10);
      const passwordChangeQuery = `
          UPDATE user
          SET
          password='${encryptedNewPassword}'
          WHERE username='${username}';`;
      await db.run(passwordChangeQuery);
      response.send("Password updated");
    }
  }
});
