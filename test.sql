create table if not exists post (
    id varchar(100) primary key,
    name  varchar(100),
    password varchar(100),
    createdAt datetime
);



create table if not exists records (
    id integer primary key autoincrement,   
    memo varchar(500),
    createdAt datetime CURRENT_TIMESTAMP,
    habit_id foreign key references users habit_id
)



create table if not exists users (
    id integer primary key AUTOINCREMENT, 
    name varchar(100),
    email varchar(255) UNIQUE,
    password varchar(255),
    createdAt datetime default CURRENT_TIMESTAMP
)

create table if not exists hibits (
    id integer primary key AUTOINCREMENT, 
    habit_name vachar(255),
    str_date datetime,
    end_date datetime,
    createdAt datetime default CURRENT_TIMESTAMP,
    user_id integer not null,
    FOREIGN KEY(user_id) REFERENCES users (id)
)

create table if not exists records (
    id integer primary key AUTOINCREMENT,   
    memo varchar(500),
    createdAt datetime default CURRENT_TIMESTAMP,
    habit_id integer not null,
    FOREIGN KEY(habit_id) REFERENCES hibits (id)
)