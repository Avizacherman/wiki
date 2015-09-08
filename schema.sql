DROP TABLE IF EXISTS comments;


DROP TABLE IF EXISTS pages;


DROP TABLE IF EXISTS users;


CREATE TABLE users (id INTEGER PRIMARY KEY, user_name TEXT, password TEXT, email TEXT);


CREATE TABLE pages (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT, tags TEXT, most_recent INTEGER DEFAULT 1, timestamp DATE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id));


CREATE TABLE comments (id INTEGER PRIMARY KEY, user_id INTEGER, comment TEXT, page_title TEXT, timestamp DATE DEFAULT CURRENT_TIMESTAMP,
                       FOREIGN KEY (user_id) REFERENCES users(id),
                       FOREIGN KEY (page_title) REFERENCES pages(title));


CREATE TRIGGER last_updated
BEFORE
INSERT ON pages BEGIN
UPDATE pages
SET most_recent=0
WHERE title=NEW.title; END;