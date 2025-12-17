/**
 * Custom error classes for better error handling
 */

class AuthError extends Error {
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}

class ValidationError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ValidationError';
    }
}

class DatabaseError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'DatabaseError';
    }
}

class RateLimitError extends Error {
    constructor(message = 'Too many requests', statusCode = 429) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'RateLimitError';
    }
}

module.exports = {
    AuthError,
    ValidationError,
    DatabaseError,
    RateLimitError
};