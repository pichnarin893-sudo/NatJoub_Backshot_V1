const jwt = require('jsonwebtoken');
const { users, roles, credentials } = require('../models');

module.exports = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await users.findByPk(decoded.id, {
            include: [
                {
                    model: roles,
                    attributes: ['id', 'name']
                },
                {
                    model: credentials,
                    as: 'credential',
                    attributes: ['email', 'username']
                }
            ]
        });

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = {
            id: user.id,
            email: user.credential?.email,
            username: user.credential?.username,
            role: user.role?.name || 'customer',
            firstName: user.first_name,
            lastName: user.last_name
        };

        next();
    } catch (error) {
        console.error('Socket auth error:', error.message);
        next(new Error('Authentication error: ' + error.message));
    }
};