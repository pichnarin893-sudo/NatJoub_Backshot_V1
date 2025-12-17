require('dotenv').config();
const express = require('express');
const {testConnection} = require('./config/db.test.connection');
const app = express();
const port = process.env.PORT || 3000;
const configPassport = require('./config/passport');
const cors = require("cors");
const userRoutes = require('./routes/user/user.routes');
const adminRoutes = require('./routes/admin/admin.routes');
const { initializeSocket } = require('./config/socket');
const http = require("node:http");
const {testCloudinaryConnection} = require("./config/cloudinary");

// CORS configuration for frontend on port 5000
const corsOptions = {
  origin: [
    // process.env.FRONTEND_URL || "http://localhost:5000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:3000",
    "http://localhost:44659",
    "http://localhost:8080",
    "*",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors(corsOptions)); // Enable CORS with specific configuration

// Initialize Passport
const passport = configPassport();
app.use(passport.initialize());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to RADG5 API v1.0');
});

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

let server;

const startServer = async () => {
    try {
        await testConnection();
        await testCloudinaryConnection();

        // create server once and attach Socket.IO to it
        server = http.createServer(app);
        const io = initializeSocket(server);
        app.set('io', io);

        // listen on the same server instance (do NOT call app.listen)
        server.listen(port, '0.0.0.0', () => {
            console.log(`Server running at: http://localhost:${port}`);
            console.log('📡 Socket.IO ready!');
        });

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};


const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });

    setTimeout(() => {
        console.log('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

startServer();

module.exports = app;
