-- Household Waste Pickup Schedule Tables

-- Table 1: Ward Schedule (day -> ward mapping)
CREATE TABLE IF NOT EXISTS ward_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    ward_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_day_ward (day_of_week, ward_number)
);

-- Table 2: Area/Route (ward -> area mapping)
CREATE TABLE IF NOT EXISTS area_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ward_number INT NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ward (ward_number)
);

-- Table 3: Worker Area Assignments (area -> worker mapping)
CREATE TABLE IF NOT EXISTS worker_area_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    area_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES users(id),
    FOREIGN KEY (area_id) REFERENCES area_routes(id),
    UNIQUE KEY unique_worker_area (worker_id, area_id)
);
