const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/citizen', require('./routes/citizenRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/worker', require('./routes/workerRoutes'));

// DEBUG: Check all requests status
app.get('/api/debug/all-requests', async (req, res) => {
    try {
        const [waste_reports] = await db.promise().query('SELECT id, report_type, status, image_urls, LEFT(image_urls, 50) as img_preview FROM waste_reports ORDER BY created_at DESC LIMIT 10');
        const [pickups] = await db.promise().query('SELECT id, status FROM household_pickups ORDER BY created_at DESC LIMIT 10');
        const [dustbins] = await db.promise().query('SELECT id, status FROM dustbin_requests ORDER BY created_at DESC LIMIT 10');
        res.json({ waste_reports, pickups, dustbins });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
    // Check if it's an API route that was missed - if so, don't serve index.html
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
