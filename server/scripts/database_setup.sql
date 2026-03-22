CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('citizen', 'worker', 'admin') DEFAULT 'citizen',
    auth_provider ENUM('local', 'google', 'facebook', 'apple') DEFAULT 'local',
    age INT,
    phone_number VARCHAR(20),
    profile_complete TINYINT(1) DEFAULT 0,
    eco_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS household_pickups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    ward VARCHAR(20) NOT NULL,
    house_number VARCHAR(50) NOT NULL,
    full_address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    image_urls MEDIUMTEXT,
    status ENUM('pending', 'approved', 'active', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
    worker_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS waste_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type ENUM('street_waste', 'dead_animal') NOT NULL,
    waste_type VARCHAR(50), 
    description TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    image_urls MEDIUMTEXT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'rejected') DEFAULT 'pending',
    worker_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dustbin_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_type VARCHAR(50) NOT NULL,
    estimated_users VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    image_urls MEDIUMTEXT,
    status ENUM('pending', 'in_progress', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    worker_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS public_dustbins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    status ENUM('available', 'full', 'maintenance') DEFAULT 'available',
    dustbin_type VARCHAR(50) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notices for admin-managed announcements
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATE NOT NULL,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Emergency contacts shown in the admin Notice Board
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed emergency contacts if missing (safe because of UNIQUE + IGNORE)
INSERT IGNORE INTO emergency_contacts (service_name, phone_number) VALUES
    ('Police Emergency', '100'),
    ('Fire & Emergency', '101'),
    ('Ambulance Emergency', '102'),
    ('Municipality Hotline', '4200000'),
    ('Waste Management Team', '4200111'),
    ('Veterinary Emergency', '4200222');
