const db = require('../config/db');

async function createEmergencyContactsTable() {
    try {
        console.log('Creating emergency_contacts table...');
        
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS emergency_contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service_name VARCHAR(255) NOT NULL UNIQUE,
                phone_number VARCHAR(20) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created emergency_contacts table');

        const [existing] = await db.promise().query('SELECT COUNT(*) as count FROM emergency_contacts');
        console.log('[SEED] Current contact count:', existing[0].count);
        
        if (existing[0].count === 0) {
            console.log('[SEED] Inserting default emergency contacts...');
            
            const seedContacts = [
                { service_name: 'Police Emergency', phone_number: '100' },
                { service_name: 'Fire & Emergency', phone_number: '101' },
                { service_name: 'Ambulance Emergency', phone_number: '102' },
                { service_name: 'Municipality Hotline', phone_number: '4200000' },
                { service_name: 'Waste Management Team', phone_number: '4200111' },
                { service_name: 'Veterinary Emergency', phone_number: '4200222' }
            ];
            
            for (const contact of seedContacts) {
                await db.promise().query(
                    'INSERT INTO emergency_contacts (service_name, phone_number) VALUES (?, ?)',
                    [contact.service_name, contact.phone_number]
                );
                console.log(`[SEED] Inserted: ${contact.service_name}`);
            }
            
            console.log('✅ Seed data inserted successfully');
        } else {
            console.log('[SEED] Seed data already exists, skipping...');
        }
        
        // Verify table structure
        const [columns] = await db.promise().query('DESCRIBE emergency_contacts');
        console.log('[DB] Table structure:');
        columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));
        
        // Show current data
        const [contacts] = await db.promise().query('SELECT * FROM emergency_contacts');
        console.log('[DB] Current contacts:');
        contacts.forEach(c => console.log(`  - ${c.service_name}: ${c.phone_number} (active: ${c.is_active})`));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createEmergencyContactsTable();
