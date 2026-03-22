const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const sqlFile = path.join(__dirname, 'database_setup.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const queries = sql.split(';').filter(q => q.trim());

console.log(`Running ${queries.length} queries...`);

(async () => {
    for (const query of queries) {
        if (query.trim()) {
            try {
                await db.promise().query(query);
                console.log('✅ Query executed successfully');
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN' || err.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️ Column already exists, skipping...');
                } else {
                    console.error('❌ Error executing query:', err.message);
                }
            }
        }
    }

    try {
        await db.promise().query('ALTER TABLE users ADD COLUMN eco_points INT DEFAULT 0');
        console.log('✅ Added eco_points column to users');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ eco_points column already exists');
        } else {
            console.error('❌ eco_points column error:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE users ADD COLUMN age INT');
        console.log('✅ Added age column to users');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ age column already exists');
        } else {
            console.error('❌ age column error:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)');
        console.log('✅ Added phone_number column to users');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ phone_number column already exists');
        } else {
            console.error('❌ phone_number column error:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE users ADD COLUMN profile_complete TINYINT(1) DEFAULT 0');
        console.log('✅ Added profile_complete column to users');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ profile_complete column already exists');
        } else {
            console.error('❌ profile_complete column error:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE waste_reports ADD COLUMN worker_note TEXT');
        console.log('✅ Added worker_note column to waste_reports');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ worker_note column already exists');
        } else {
            console.error('❌ worker_note column error:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE waste_reports ADD COLUMN updated_by INT');
        console.log('✅ Added updated_by column to waste_reports');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ updated_by column already exists');
        } else {
            console.error('❌ updated_by column error:', err.message);
        }
    }

    try {
        await db.promise().query("ALTER TABLE waste_reports MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'rejected') DEFAULT 'pending'");
        console.log('✅ Updated waste_reports status enum (pending, in_progress, completed, cancelled, rejected)');
    } catch (err) {
        console.log('⚠️ waste_reports status enum already up to date or error:', err.message);
    }

    try {
        await db.promise().query("ALTER TABLE dustbin_requests MODIFY COLUMN status ENUM('pending', 'in_progress', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending'");
        console.log('✅ Updated dustbin_requests status enum (pending, in_progress, approved, rejected, completed, cancelled)');
    } catch (err) {
        console.log('⚠️ dustbin_requests status enum already up to date or error:', err.message);
    }

    try {
        await db.promise().query("UPDATE dustbin_requests SET status = 'pending' WHERE status IS NULL OR status = ''");
        console.log('✅ Normalized blank/null dustbin_requests.status to pending');
    } catch (err) {
        console.error('❌ Failed to normalize dustbin_requests.status:', err.message);
    }

    try {
        await db.promise().query("ALTER TABLE household_pickups MODIFY COLUMN status ENUM('pending', 'approved', 'active', 'completed', 'rejected', 'cancelled') DEFAULT 'pending'");
        console.log('✅ Updated household_pickups status enum (pending, approved, active, completed, rejected, cancelled)');
    } catch (err) {
        console.log('⚠️ household_pickups status enum already up to date or error:', err.message);
    }

    try {
        await db.promise().query('ALTER TABLE waste_reports MODIFY COLUMN image_urls MEDIUMTEXT');
        console.log('✅ Enlarged waste_reports.image_urls to MEDIUMTEXT');
    } catch (err) {
        console.log('⚠️ waste_reports.image_urls already MEDIUMTEXT or error:', err.message);
    }

    try {
        await db.promise().query('ALTER TABLE dustbin_requests MODIFY COLUMN image_urls MEDIUMTEXT');
        console.log('✅ Enlarged dustbin_requests.image_urls to MEDIUMTEXT');
    } catch (err) {
        console.log('⚠️ dustbin_requests.image_urls already MEDIUMTEXT or error:', err.message);
    }

    try {
        await db.promise().query('ALTER TABLE household_pickups ADD COLUMN IF NOT EXISTS image_urls MEDIUMTEXT');
        await db.promise().query('ALTER TABLE household_pickups MODIFY COLUMN image_urls MEDIUMTEXT');
        console.log('✅ Ensured household_pickups.image_urls exists and is MEDIUMTEXT');
    } catch (err) {
        console.log('⚠️ household_pickups.image_urls add/modify error:', err.message);
    }

    try {
        await db.promise().query('ALTER TABLE dustbin_requests ADD COLUMN worker_note TEXT');
        console.log('✅ Added worker_note column to dustbin_requests');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ worker_note column already exists in dustbin_requests');
        } else {
            console.error('❌ worker_note column error in dustbin_requests:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE dustbin_requests ADD COLUMN updated_by INT');
        console.log('✅ Added updated_by column to dustbin_requests');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ updated_by column already exists in dustbin_requests');
        } else {
            console.error('❌ updated_by column error in dustbin_requests:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE waste_reports ADD COLUMN worker_id INT NULL');
        console.log('✅ Added worker_id column to waste_reports');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ worker_id column already exists in waste_reports');
        } else {
            console.error('❌ worker_id column error in waste_reports:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE dustbin_requests ADD COLUMN worker_id INT NULL');
        console.log('✅ Added worker_id column to dustbin_requests');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ worker_id column already exists in dustbin_requests');
        } else {
            console.error('❌ worker_id column error in dustbin_requests:', err.message);
        }
    }

    try {
        await db.promise().query('ALTER TABLE household_pickups ADD COLUMN worker_id INT NULL');
        console.log('✅ Added worker_id column to household_pickups');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ worker_id column already exists in household_pickups');
        } else {
            console.error('❌ worker_id column error in household_pickups:', err.message);
        }
    }

    // Seed dummy dustbins near user location (26.659744, 87.269277 - Biratnagar area)
    try {
        const [existing] = await db.promise().query('SELECT COUNT(*) as count FROM public_dustbins');
        if (existing[0].count === 0) {
            const dustbins = [
                ['Biratnagar Main Road - General Waste Bin', 26.660120, 87.269850, 'available', 'General'],
                ['Traffic Chowk Public Bin', 26.659200, 87.268500, 'available', 'Public'],
                ['Bargachhi Market Area Bin', 26.661000, 87.270200, 'full', 'General'],
                ['Mahendra Chowk - Organic Bin', 26.658500, 87.267800, 'available', 'Organic'],
                ['Jogbani Road - Public Waste Bin', 26.660800, 87.271500, 'maintenance', 'Public'],
                ['Biratnagar Hospital Area Bin', 26.657900, 87.269000, 'available', 'General'],
                ['Rani Park - Waste Collection Point', 26.662100, 87.268200, 'available', 'General'],
                ['Ganesh Mandir Road Bin', 26.659000, 87.270800, 'available', 'Organic'],
                ['Bus Park Area - Large Waste Bin', 26.661500, 87.267500, 'full', 'Public'],
                ['Dharan Road Junction Bin', 26.658200, 87.271200, 'available', 'General']
            ];

            for (const d of dustbins) {
                await db.promise().query(
                    'INSERT INTO public_dustbins (name, latitude, longitude, status, dustbin_type) VALUES (?, ?, ?, ?, ?)',
                    d
                );
            }
            console.log('✅ Seeded 10 dummy dustbins near Biratnagar');
        } else {
            console.log('⚠️ Dustbins already seeded, skipping...');
        }
    } catch (err) {
        console.error('❌ Dustbin seeding error:', err.message);
    }

    // Seed temporary worker user
    try {
        const [existingWorker] = await db.promise().query('SELECT id FROM users WHERE email = ?', ['worker@bingo.gov']);
        if (existingWorker.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Worker123!', salt);
            await db.promise().query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['Test Worker', 'worker@bingo.gov', passwordHash, 'worker']
            );
            console.log('✅ Seeded temporary worker user: worker@bingo.gov / Worker123!');
        } else {
            console.log('⚠️ Worker user already exists, skipping...');
        }
    } catch (err) {
        console.error('❌ Worker user seeding error:', err.message);
    }

    // Seed admin user if missing so admin login works after fresh init
    try {
        const [existingAdmin] = await db.promise().query('SELECT id FROM users WHERE email = ?', ['admin@bingo.com']);
        if (existingAdmin.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Bingo@2024#Admin', salt);
            await db.promise().query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['System Admin', 'admin@bingo.com', passwordHash, 'admin']
            );
            console.log('✅ Seeded admin user: admin@bingo.com / Bingo@2024#Admin');
        } else {
            console.log('⚠️ Admin user already exists, skipping...');
        }
    } catch (err) {
        console.error('❌ Admin user seeding error:', err.message);
    }

    // Create Household Waste Pickup Schedule tables
    try {
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS ward_schedule (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day_of_week ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
                ward_number INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_day_ward (day_of_week, ward_number)
            )
        `);
        console.log('✅ Created ward_schedule table');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️ ward_schedule table already exists');
        } else {
            console.error('❌ ward_schedule table error:', err.message);
        }
    }

    try {
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS area_routes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ward_number INT NOT NULL,
                area_name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ward (ward_number)
            )
        `);
        console.log('✅ Created area_routes table');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️ area_routes table already exists');
        } else {
            console.error('❌ area_routes table error:', err.message);
        }
    }

    try {
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS worker_area_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                worker_id INT NOT NULL,
                area_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (worker_id) REFERENCES users(id),
                FOREIGN KEY (area_id) REFERENCES area_routes(id),
                UNIQUE KEY unique_worker_area (worker_id, area_id)
            )
        `);
        console.log('✅ Created worker_area_assignments table');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️ worker_area_assignments table already exists');
        } else {
            console.error('❌ worker_area_assignments table error:', err.message);
        }
    }

    // Seed default ward schedule (2 wards per day, 14 wards total)
    try {
        const [existingSchedule] = await db.promise().query('SELECT COUNT(*) as count FROM ward_schedule');
        if (existingSchedule[0].count === 0) {
            const defaultSchedule = [
                ['Sunday', 1], ['Sunday', 2],
                ['Monday', 3], ['Monday', 4],
                ['Tuesday', 5], ['Tuesday', 6],
                ['Wednesday', 7], ['Wednesday', 8],
                ['Thursday', 9], ['Thursday', 10],
                ['Friday', 11], ['Friday', 12],
                ['Saturday', 13], ['Saturday', 14]
            ];
            for (const [day, ward] of defaultSchedule) {
                await db.promise().query('INSERT INTO ward_schedule (day_of_week, ward_number) VALUES (?, ?)', [day, ward]);
            }
            console.log('✅ Seeded default ward schedule');
        } else {
            console.log('⚠️ Ward schedule already seeded');
        }
    } catch (err) {
        console.error('❌ Ward schedule seeding error:', err.message);
    }

    // Seed sample areas
    try {
        const [existingAreas] = await db.promise().query('SELECT COUNT(*) as count FROM area_routes');
        if (existingAreas[0].count === 0) {
            const defaultAreas = [
                [1, 'Main Road East', 'Primary road connecting to market'],
                [1, 'School Line', 'Near government school area'],
                [2, 'Market Zone', 'Central market area'],
                [3, 'Hospital Road', 'Near district hospital'],
                [4, 'Railway Station', 'Station approach road'],
                [5, 'Industrial Area', 'Factory zone'],
                [6, 'Temple Street', 'Old temple vicinity'],
                [7, 'Park View', 'Residential colony'],
                [8, 'Bus Terminal', 'Bus stand area'],
                [9, 'River Bank', 'Riverside community'],
                [10, 'Hill Top', 'Elevated residential'],
                [11, 'Old City', 'Heritage zone'],
                [12, 'New Colony', 'Recently developed area'],
                [13, 'Green Belt', 'Eco-friendly zone'],
                [14, 'Town Center', 'Municipal headquarters area']
            ];
            for (const [ward, area, desc] of defaultAreas) {
                await db.promise().query('INSERT INTO area_routes (ward_number, area_name, description) VALUES (?, ?, ?)', [ward, area, desc]);
            }
            console.log('✅ Seeded default areas');
        } else {
            console.log('⚠️ Areas already seeded');
        }
    } catch (err) {
        console.error('❌ Area seeding error:', err.message);
    }

    console.log('🎉 Database setup complete!');
    process.exit();
})();
