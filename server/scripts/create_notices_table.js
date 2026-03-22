const db = require('../config/db');

async function createNoticesTable() {
    try {
        console.log('Creating notices table...');
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS notices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at DATE NOT NULL,
                created_by INT,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('✅ Created notices table');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createNoticesTable();
