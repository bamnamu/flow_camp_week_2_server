DROP DATABASE snap_database;

CREATE DATABASE snap_database;

USE snap_database;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    highest_score INT DEFAULT 0
);

INSERT INTO users (username, password, highest_score) VALUES
('admin', '123', "123"),
('testuser', 'testpassword', '0');
