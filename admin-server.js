const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Serve admin dashboard at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Admin server running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard server running at http://localhost:${PORT}`);
    console.log(`📊 Open your browser and go to: http://localhost:${PORT}`);
});
