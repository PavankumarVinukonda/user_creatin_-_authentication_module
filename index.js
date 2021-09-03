const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// Create User API
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  // checking where there is any user is present with same name in the database
  const selectUserQuery = `
    SELECT
    *
    FROM
    user 
    WHERE
    username = '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //create user table
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    // else invalid user name
    response.status(400);
    response.send("User name already exists");
  }
});

//user Login Api

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT
    *
    FROM
    user 
    WHERE
    username = '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //user dosent exist
    response.status(400);
    response.send(
      "Invalid user to crete account please press on signup button"
    );
  } else {
    //comparing password with the hased one
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("log in successful");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
