const express = require("express");
const moment = require("moment");
const sqlite3 = require("sqlite3");
const path = require("path");

//database생성
const db_name = path.join(__dirname, "users.db");
const db = new sqlite3.Database(db_name, (err) => {
  if (err) {
    console.log(err);
  }
});

//table 생성
const create_sql = `
create table if not exists users (
    id integer primary key AUTOINCREMENT, 
    name varchar(100),
    email varchar(255) UNIQUE,
    password varchar(255),
    createdAt datetime default CURRENT_TIMESTAMP
);
`;

const habit_sql = `
create table if not exists hibits (
    id integer primary key AUTOINCREMENT, 
    habit_name vachar(255),
    str_date datetime,
    end_date datetime,
    createdAt datetime default CURRENT_TIMESTAMP,
    user_id integer not null,
    FOREIGN KEY(user_id) REFERENCES users (id)
);
`;

const recode_sql = `
create table if not exists records (
    id integer primary key AUTOINCREMENT,   
    memo varchar(500),
    createdAt datetime default CURRENT_TIMESTAMP,
    habit_id integer not null,
    FOREIGN KEY(habit_id) REFERENCES hibits (id)
);
`;

db.serialize(() => {
  //   db.run(create_sql);
  db.run(habit_sql);
  db.run(recode_sql);
});

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log("listening on listServer");
});
