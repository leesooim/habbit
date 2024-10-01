insert into users (name, email, password) values ('홍길동','hong1@gamil.com','admin1234');
insert into users (name, email, password) values ('이길동','lee1@gamil.com','admin1234');



--습관목록 insert

insert into habits (habit_name,str_date,end_date,user_id) values("running","20241001","20250931",1);
insert into habits (habit_name,str_date,end_date,user_id) values("study SQL","20241001","20250931",1);
insert into habits (habit_name,str_date,end_date,user_id) values("piano","20241001","20250931",2);
insert into habits (habit_name,str_date,end_date,user_id) values("cooking","20241001","20250931",2);

--습관기록 insert 
insert into records (memo,habit_id) values ("chapter1",2);
insert into records (memo,habit_id) values ("chapter2",2);
insert into records (memo,habit_id) values ("chapter3",2);
insert into records (memo,habit_id) values ("chapter4",2);

select h.id, h.habit_name,h.str_date,h.end_date,count(r.id) from habits h, records r where h.id = r.habit_id and user_id = 2


select id, memo,createdAt, habit_id from records where habit_id = 2


select h.id, h.habit_name ,h.str_date,h.end_date,  (select count(1) from records r where h.id = r.habit_id) as cnt from habits h, records r where user_id = 1 order by 1;