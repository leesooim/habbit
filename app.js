const express = require("express");
const moment = require("moment");
const sqlite3 = require("sqlite3");
const path = require("path");
//로그인
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");

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
create table if not exists habits (
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
  // db.run(habit_sql);
  // db.run(recode_sql);
});

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  expressSession({
    secret: "sample",
    resave: true,
    saveUninitialized: true,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true })); //form태크의 post요청을 받기위한 설정

//로그인페이지
app.get("/login", (req, res) => {
  console.log(req.query);
  res.render("login", { message: req.query.message });
});

//로그인
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const usersSql = `select id, email, password from users where email = '${email}' and password = '${password}'`;
  let userId = "";

  db.get(usersSql, (err, row) => {
    if (err) {
      console.log(err);
      res.status(500).send("Login Error!");
    } else {
      if (row) {
        req.session.user = {
          id: email,
          authorized: true,
          userId: row.id,
        };
        res.redirect("/habit_list");
      } else {
        res.redirect("/login?message=true");
      }
    }
  });
});

//회원가입페이지
app.get("/register", (req, res) => {
  res.render("register");
});

//회원가입
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const userSql = "select email from users";
  const registerSql = `insert into users (name, email, password) values('${name}','${email}','${password}')`;
  db.all(userSql, (err, rows) => {
    let isUser = rows.filter((item) => {
      return item.email == email;
    });

    if (isUser.length > 0) {
      res.send(
        "<script>alert('중복 된 ID입니다.'); window.location.replace('/register')</script>; "
      );
    } else {
      db.run(registerSql, (err) => {
        if (err) {
          console.log(err);
          res.status(500).send("Server Error!");
        } else {
          res.redirect("/login");
        }
      });
    }
  });
});

//logout
app.get("/logout", (req, res) => {
  if (req.session.user) {
    req.session.user = null;
  }
  res.redirect("/login");
});

//습관목록
app.get("/habit_list", (req, res) => {
  let page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  if (req.session.user) {
    const id = req.session.user.userId;
    let habit_list_sql = `select h.id, h.habit_name ,h.str_date,h.end_date, (select count(1) from records r where h.id = r.habit_id) as cnt from habits h
    where h.user_id = ${id}  order by 1 limit ? offset ?;`;
    db.all(habit_list_sql, [limit, offset], (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send("Server Error");
      } else {
        db.get(
          `select count(1) as count from habits  where user_id = ${id} `,
          (err, cnt) => {
            if (err) {
              res.status(500).send("Error");
            } else {
              const totalCnt = cnt.count;
              const totalPage = Math.ceil(totalCnt / limit);

              res.render("habit_list", {
                habits: rows,
                currentPage: page,
                totalPage: totalPage,
              });
            }
          }
        );
      }
    });
  } else {
    res.redirect("/login");
  }
});

//습관추가페이지
app.get("/habit_add", (req, res) => {
  res.render("habit_add");
});

//습관 추가
app.post("/add_habbit", (req, res) => {
  const id = req.session.user.userId;
  // const id = 1;
  let sql = `insert into habits (habit_name,str_date,end_date,user_id)
  values ('${req.body.habit_name}','${req.body.str_date}','${req.body.end_date}','${id}')`;

  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect("/habit_list");
    }
  });
});

//습관 삭제
app.get("/delte_habit", (req, res) => {
  const id = req.query.id;

  let sql = `delete from habits where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.redirect("/habit_list");
    }
  });
});

//습관기록목록
app.get("/habit_record_list/:id", (req, res) => {
  const habit_name = req.query.habit_name;
  const id = req.params.id;
  console.log("1111111111");
  console.log(id);
  let page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  let habitRecodeSql = `select id, memo,createdAt, habit_id from records r where habit_id = '${id}'  order by 1 limit ? offset ?`;
  db.all(habitRecodeSql, [limit, offset], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error!");
    } else {
      db.get(
        `select count(1) as count from records where habit_id = ${id}`,
        (err, cnt) => {
          if (err) {
            res.status(500).send("Error");
          } else {
            const totalCnt = cnt.count;
            const totalPage = Math.ceil(totalCnt / limit);

            res.render("habit_record_list", {
              habitRecode: rows,
              habit_name: habit_name,
              habit_id: id,
              currentPage: page,
              totalPage: totalPage,
            });
          }
        }
      );
    }
  });
});

//습관기록추가페이지
app.get("/habit_record_add/:id", (req, res) => {
  console.log("22222222222");

  console.log(req.params);
  console.log(req.query);
  res.render("habit_record_add", {
    habit_id: req.params.id,
    habit_name: req.query.habit_name,
  });
});

//습관기록 추가
app.post("/add_habit_record", (req, res) => {
  console.log("3333333333");
  console.log(req.body);
  let sql = `insert into records (memo,habit_id) 
  values ('${req.body.memo}','${req.body.habit_id}')`;

  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/habit_record_list/${req.body.habit_id}`);
    }
  });
});

//습관기록 삭제
app.get("/delte_habit_record/:id", (req, res) => {
  const id = req.params.id;

  let sql = `delete from records where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/habit_record_list/${req.query.id}?name=${req.query.name}`);
    }
  });
});

app.listen(PORT, () => {
  console.log("listening on listServer");
});
