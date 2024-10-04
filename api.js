const express = require("express");
const moment = require("moment");
const sqlite3 = require("sqlite3");
const path = require("path");
const exp = require("constants");

//database생성
const db_name = path.join(__dirname, "users.db");
const db = new sqlite3.Database(db_name, (err) => {
  if (err) {
    console.log(err);
  }
});

const app = express();
const PORT = 3001;
app.use(express.json());

app.get("/users", (req, res) => {
  const users_sql = `select * from users`;

  db.all(users_sql, [], (err, rows) => {
    res.json({ users: rows });
  });
});

//습관목록
app.get("/users/:user_id/habit_list", (req, res) => {
  const user_id = req.params.user_id;

  let habit_list_sql = `select id, h.habit_name ,h.str_date,h.end_date, (select count(1) from records r where h.id = r.habit_id) as cnt from habits h
      where h.user_id = ${user_id}  order by 1;`;
  db.all(habit_list_sql, [], (err, rows) => {
    if (err) {
      res.status(500).send("Server Error");
    } else {
      res.json({ habits: rows });
    }
  });
});

//습관 추가
app.post("/users/:user_id/habit/add", (req, res) => {
  const user_id = req.params.user_id;

  let sql = `insert into habits (habit_name,str_date,end_date,user_id)
    values ('${req.body.habit_name}','${req.body.str_date}','${req.body.end_date}','${user_id}')`;

  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/users/${user_id}/habit_list`);
    }
  });
});

//습관 삭제
app.delete("/users/:user_id/habit/:id", (req, res) => {
  const id = req.params.id;
  const user_id = req.params.user_id;

  let sql = `delete from habits where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.redirect(`/users/${user_id}/habit_list`);
    }
  });
});

//습관기록목록
app.get("/users/:user_id/habit_record_list/:id", (req, res) => {
  const id = req.params.id;
  const habit_name = req.query.habit_name;

  let habitRecodeSql = `select id, memo,createdAt, habit_id from records r where habit_id = '${id}'  order by 1 `;
  db.all(habitRecodeSql, [], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error!");
    } else {
      res.json({ records: rows });
    }
  });
});

//습관기록 추가
app.post("/users/:user_id/add_habit_record/:id", (req, res) => {
  const user_id = req.params.user_id;
  const id = req.params.id;

  let sql = `insert into records (memo,habit_id) 
    values ('${req.body.memo}','${req.body.habit_id}')`;

  db.run(sql, (err) => {
    if (err) {
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/users/${user_id}/habit_record_list/${id}`);
    }
  });
});

//습관기록 삭제
app.delete("/users/:user_id/delte_habit_record/:id", (req, res) => {
  const id = req.params.id;
  const user_id = req.params.user_id;

  let sql = `delete from records where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/users/${user_id}/habit_record_list/${id}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`listening on ${PORT}Server`);
});
