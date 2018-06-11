create table users (
    id int not null auto_increment,
    email varchar(255) not null,
    password varchar(255) not null,
    created_at timestamp not null default now(),
    primary key (id)
);
create unique index email_idx on users (email);

create table pictures (
    id varchar(255) not null,
    caption varchar(255) not null default '',
    created_at timestamp not null default now(),
    created_by int not null,
    primary key (id),
    foreign key (created_by) references users (id)
);
create index created_at_idx on pictures (created_at desc);

create table comments (
    id int not null auto_increment,
    text varchar(255) not null default '',
    created_at timestamp not null default now(),
    created_by int not null,
    primary key (id),
    foreign key (created_by) references users (id)
);
create index created_at_idx on comments (created_at desc);

create table likes (
    user_id int not null,
    picture_id varchar(255) not null,
    primary key (user_id, picture_id),
    foreign key (user_id) references users (id),
    foreign key (picture_id) references pictures(id)
);