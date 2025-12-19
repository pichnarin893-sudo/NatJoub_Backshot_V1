require('dotenv').config();
const express = require('express');

// Optional: Load db.test.connection if it exists
let testConnection;
try {
    const dbTest = require('./config/db.test.connection');
    testConnection = dbTest.testConnection;
} catch (err) {
    console.log('⚠️  db.test.connection not found, skipping database connection test');
    testConnection = async () => { console.log('✅ Skipping database connection test'); };
}

const app = express();
const port = process.env.PORT || 3000;
const configPassport = require('./config/passport');
const cors = require("cors");
const userRoutes = require('./routes/user/user.routes');
const adminRoutes = require('./routes/admin/admin.routes');
const { initializeSocket } = require('./config/socket');
const http = require("node:http");
const {testCloudinaryConnection} = require("./config/cloudinary");
const cron = require('node-cron');
const { cancelExpiredPendingBookings } = require('./utils/booking.cleanup');

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
let io; // Store Socket.IO instance for cron jobs

const startServer = async () => {
    try {
        await testConnection();
        await testCloudinaryConnection();

        // create server once and attach Socket.IO to it
        server = http.createServer(app);
        io = initializeSocket(server);
        app.set('io', io);

        // listen on the same server instance (do NOT call app.listen)
        server.listen(port, '0.0.0.0', () => {
            console.log(`Server running at: http://localhost:${port}`);
            console.log('📡 Socket.IO ready!');
        });

        // Start cron job for auto-canceling expired pending bookings
        // Runs every minute to check for bookings that are 5+ minutes past creation time
        // Business rule: Users have 5 minutes from booking creation to complete payment
        cron.schedule('* * * * *', async () => {
            try {
                const result = await cancelExpiredPendingBookings();

                if (result.cancelled > 0) {
                    console.log(`🧹 [Cleanup] Cancelled ${result.cancelled} expired booking(s)`);

                    // Emit Socket.IO events for each cancelled booking
                    result.details.forEach(detail => {
                        // Notify the customer
                        io.to(`user:${detail.customerId}`).emit('booking:expired', {
                            success: false,
                            message: 'Your booking was automatically cancelled due to non-payment',
                            data: {
                                bookingId: detail.bookingId,
                                roomId: detail.roomId,
                                reason: 'Payment not received within 5 minutes of booking creation'
                            },
                            timestamp: new Date().toISOString()
                        });

                        // Notify room channel (for availability updates)
                        io.to(`room:${detail.roomId}`).emit('booking:cancelled', {
                            bookingId: detail.bookingId,
                            roomId: detail.roomId,
                            status: 'expired',
                            reason: 'auto-cancelled'
                        });
                    });
                }
            } catch (error) {
                console.error('❌ [Cleanup] Cron job error:', error);
            }
        });

        console.log('⏰ Booking cleanup cron job started (runs every minute)');

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
