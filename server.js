/**
 * server.js
 * Main application entry point
 * Three-tier Architecture: Application Controller
 * 
 * Student: Steven Gaillard (D11405806)
 * Course: Software Engineering in CIS 2025
 */

const express = require('express');
const path = require('path');
const Database = require('./database');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database and make it accessible to routes
const database = new Database();
app.locals.db = database.getConnection();

// Import and mount routes
const frontendRoutes = require('./routes/frontend');
const apiRoutes = require('./routes/api');

app.use('/', frontendRoutes);
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).send(`
        <html>
        <head><title>404 Not Found</title></head>
        <body style="background: #1e293b; color: #cbd5e1; font-family: sans-serif; text-align: center; padding: 100px;">
            <h1>404 - Page Not Found</h1>
            <p>The requested resource does not exist.</p>
            <a href="/" style="color: #60a5fa;">Return to Dashboard</a>
        </body>
        </html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 TFR Analytics Dashboard');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`📈 Statistics: http://localhost:${PORT}/stats`);
    console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    app.locals.db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});