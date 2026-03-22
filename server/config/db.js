const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Default XAMPP user
    password: '', // Default XAMPP password (empty)
    database: 'bingo_db'
});

// Connect
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database (bingo_db)');
});

module.exports = db;
