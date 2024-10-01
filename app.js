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
  db.run(habit_sql);
  // db.run(recode_sql);
});

//로그인세션 마지막에 구현...

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");

//습관목록
app.get("/habit_list",(req,res) => {
  // const id = req.params.id;  로그인 구현 후 주석풀기
  const id = 1;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  let habit_list_sql = `select h.id, h.habit_name ,h.str_date,h.end_date, (select count(1) from records r where h.id = r.habit_id) as cnt from habits h
  where h.user_id = ${id}  order by 1 limit ? offset ?;`

  db.all(habit_list_sql, [limit, offset], (err,rows) => {
    if(err) {
      res.status(500).send("Server Error");
    }else{
      db.get(`select count(1) as count from habits  where user_id = ${id} `, (err,cnt) => {
        if(err) {
          res.status(500).send("Error")
        }else{
          const totalCnt = cnt.count;
          const totalPage = Math.ceil(totalCnt / limit);

          res.render("habit_list",{
            habits : rows,
            currentPage: page,
            totalPage: totalPage,
          });
        }
      });
    }
  });
});

app.use(express.urlencoded({ extended: true })); //form태크의 post요청을 받기위한 설정

//습관추가페이지
app.get("/habit_add",(req,res) => {

  res.render("habit_add")
});

//습관 추가 
app.post("/add_habbit",(req,res) => {
// const id = req.params.id;  로그인 구현 후 주석풀기
  const id = 1;
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
})

//습관 삭제
app.get("/delte_habit/:id", (req,res) =>{
  const id = req.params.id;

  let sql = `delete from habits where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.redirect("/habit_list");
    }
  });
})

//습관기록목록
app.get("/habit_record_list/:id/:habit_name",(req,res) => {
  const id = req.params.id;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  let habitRecodeSql = `select id, memo,createdAt, habit_id from records r where habit_id = ${id}  order by 1 limit ? offset ?`
  db.all(habitRecodeSql, [limit, offset],(err,rows) => {
    if(err) {
      console.log(err)
      res.status(500).send("Server Error!")
    }else{
      db.get(`select count(1) as count from records where habit_id = ${id}`, (err,cnt) => {
        if(err) {
          res.status(500).send("Error")
        }else{
              const totalCnt = cnt.count;
              const totalPage = Math.ceil(totalCnt / limit);

              res.render("habit_record_list", {
                habitRecode : rows,
                name : req.params.habit_name,
                habit_id : id,
                currentPage: page,
                totalPage: totalPage,
              })
          }
      });
    }
  })

  
})

//습관기록추가페이지
app.get("/habit_record_add/:id/:name",(req,res) => {
  res.render("habit_record_add",{
    habit_id : req.params.id,
    habit_name : req.params.name
  })
})

//습관기록 추가
app.post("/add_habit_record",(req,res) =>{
  console.log(req.body);
  let sql = `insert into records (memo,habit_id) 
  values ('${req.body.memo}','${req.body.habit_id}')`;

  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/habit_record_list/${req.body.habit_id}/${req.body.habit_name}`);
    }
  });
});

//습관기록 삭제
app.get("/delte_habit_record/:id/:habit_id/:name", (req,res) =>{
  const id = req.params.id;

  let sql = `delete from records where id = ${id}`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Server Error");
    } else {
      res.redirect(`/habit_record_list/${req.params.habit_id}/${req.params.name}`);
    }
  });
})
 
app.listen(PORT, () => {
  console.log("listening on listServer");
});
