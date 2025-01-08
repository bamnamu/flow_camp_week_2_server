const http = require('http');
const mysql = require('mysql2');
const express = require('express');
const app = express();

// JSON 요청 처리 설정
app.use(express.json());

// RDS 엔드포인트와 사용자 정보 입력
const db = mysql.createConnection({
    host: 'snap-flow-camp-week2.ct6qmwgyelmn.ap-northeast-2.rds.amazonaws.com', // RDS Endpoint
    user: 'admin',                          // Master username
    password: 'snapflow',              // Master password
    database: 'snap_database'                        // Database name
});

// 연결 테스트
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully!');
    }
});

// 회원가입 API 추가
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Missing username or password');
    }

    // 중복 사용자 검사
    const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkUserQuery, [username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            // 중복 사용자 발견
            return res.status(409).send('Username already exists');
        }

        // 새로운 사용자 추가
        const insertUserQuery = 'INSERT INTO users (username, password, highest_score) VALUES (?, ?, 0)';
        db.query(insertUserQuery, [username, password], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }

            console.log('User registered successfully:', username);
            res.status(201).send('User registered successfully');
        });
    });
});

// 로그인 API 수정: 사용자 정보 반환
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            res.status(500).send('Database error');
        } else if (results.length > 0) {
            // 로그인 성공 시 사용자 정보 반환
            const user = results[0];
            res.status(200).json({
                message: 'Login successful',
                user_id: user.id,
                username: user.username,
                highest_score: user.highest_score
            });
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

app.post('/update-score', (req, res) => {
    const { username, highest_score } = req.body;

    if (!username || highest_score === undefined) {
        return res.status(400).send('Missing username or highest_score');
    }

    const query = 'UPDATE users SET highest_score = ? WHERE username = ? AND highest_score < ?';
    db.query(query, [highest_score, username, highest_score], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.affectedRows > 0) {
            res.status(200).send('High score updated successfully');
        } else {
            res.status(200).send('No update made (existing score is higher or equal)');
        }
    });
});

// 사용자 데이터 조회 API
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Database query failed');
        } else {
            res.status(200).json(results);
        }
    });
});

// 사용자 ID로 특정 데이터 조회 API
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            res.status(500).send('Database query failed');
        } else if (results.length > 0) {
            res.status(200).json(results[0]); // 사용자 데이터 반환
        } else {
            res.status(404).send('User not found');
        }
    });
});

// 점수별로 오름차순 정렬된 사용자 데이터 조회 API
app.get('/ranking', (req, res) => {
    const query = 'SELECT * FROM users ORDER BY highest_score DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query failed:', err);
            res.status(500).send('Database query failed');
        } else {
            res.status(200).json(results);
        }
    });
});

// 기본 경로 처리
app.get('/', (req, res) => {
    res.send('Hello, AWS Server with Database Yeah!');
});

// 서버 실행
const server = http.createServer(app);
server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});
