const { query, body,param, validationResult } = require('express-validator');
const { errorResponse } = require('../controllers/api/v1/baseApi.controller');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => `${error.path}: ${error.msg}`);
        return errorResponse(res, `Validation failed: ${errorMessages.join(', ')}`, 400);
    }
    next();
};

/**Cancellation requires at least 2 hours notice.
 * Login validation rules
 */
const validateLogin = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9@._-]+$/)
        .withMessage('Username contains invalid characters'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    handleValidationErrors
];

/**
 * OTP verification validation rules
 */
const validateOTP = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
    handleValidationErrors
];

/**
 * User creation validation rules
 */
const validateUserCreation = [
    body('first_name')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('First name must be between 2 and 30 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    body('last_name')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Last name must be between 2 and 30 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address cannot exceed 255 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('role')
        .isIn(['owner', 'customer'])
        .withMessage('Role must be either owner or customer'),
    body('gender')
        .optional()
        .isIn(['male', 'female'])
        .withMessage('Gender must be either male or female'),
    body('phone_number')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?\d{8,15}$/)
        .withMessage('Please provide a valid phone number example: +85512345678'),
handleValidationErrors
];


const validateUserRegistration = [
    body('first_name')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('First name must be between 2 and 30 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    body('last_name')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Last name must be between 2 and 30 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address cannot exceed 255 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('gender')
        .optional()
        .isIn(['male', 'female'])
        .withMessage('Gender must be either male or female'),
    body('phone_number')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+855\d{8}$/)
        .withMessage('Phone number must start with +855 followed by 8 digits'),
    handleValidationErrors
];

/**
 * Token refresh validation rules
 */
const validateTokenRefresh = [
    body('token')
        .notEmpty()
        .withMessage('Token is required'),
    handleValidationErrors
];

const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const validateBranch = [
    body('branch_name')
        .notEmpty()
        .withMessage('Branch name is required'),

    body('work_days')
        .notEmpty()
        .withMessage('Work days are required')
        .isArray({ min: 1 })
        .withMessage('Work days must be an array with at least one day')
        .custom((workDays) => {
            // Fixed: Define allowed days properly
            const allowedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const invalidDays = workDays.filter(day => !allowedDays.includes(day.toLowerCase()));
            if (invalidDays.length > 0) {
                throw new Error(`Invalid work days: ${invalidDays.join(', ')}. Allowed days are ${allowedDays.join(', ')}`);
            }
            return true;
        }),

    // Fixed: Use time format validation instead of ISO8601
    body('open_times')
        .notEmpty()
        .withMessage('Open times are required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Open times must be in HH:mm format (e.g., 07:00)'),

    body('close_times')
        .notEmpty()
        .withMessage('Close times are required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Close times must be in HH:mm format (e.g., 21:00)'),

    body('room_amount')
        .notEmpty()
        .withMessage('Room amount is required')
        .isInt({ min: 1 })
        .withMessage('Room amount must be a positive integer'),

    body('address')
        .notEmpty()
        .withMessage('Address is required'),

    body('location_url')
        .isURL()
        .withMessage('Location URL must be a valid URL'),

    handleValidationErrors
];

/**
 * Validation for branch photo upload
 */
const validatePhoto = [
    // Validate branchId parameter
    query('id')
        // .withMessage('Branch or Room ID must be a valid UUID')
        .notEmpty()
        .withMessage('Branch or Room ID is required'),

    // Custom validation for uploaded files
    body().custom((value, { req }) => {
        // Check if files exist
        if (!req.files || req.files.length === 0) {
            throw new Error('At least one photo file is required');
        }

        // Validate file count
        if (req.files.length > 3) {
            throw new Error('Maximum 3 photos allowed per upload');
        }

        // Validate each file
        req.files.forEach((file, index) => {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error(`File ${index + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed`);
            }

            // Check file size (5MB limit)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error(`File ${index + 1}: File size exceeds 5MB limit`);
            }

            // Check if file has content
            if (!file.buffer && !file.path) {
                throw new Error(`File ${index + 1}: File data is missing`);
            }

            // Validate filename
            if (!file.originalname || file.originalname.trim().length === 0) {
                throw new Error(`File ${index + 1}: Invalid filename`);
            }
        });

        return true;
    }),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array().map(error => ({
                    field: error.path || error.param,
                    message: error.msg,
                    value: error.value
                }))
            });
        }
        next();
    }
];

const validateUpdateBranch = [
    // Required
    body('branch_name')
        .notEmpty()
        .withMessage('Branch name is required'),

    // Optional
    body('work_days')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Work days must be an array with at least one day')
        .custom((workDays) => {
            const allowedDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
            const invalidDays = workDays.filter(day => !allowedDays.includes(day.toLowerCase()));
            if (invalidDays.length > 0) {
                throw new Error(`Invalid work days: ${invalidDays.join(', ')}. Allowed days are ${allowedDays.join(', ')}`);
            }
            return true;
        }),

    body('open_times')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Open times must be in HH:mm format'),

    body('close_times')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Close times must be in HH:mm format'),

    body('room_amount')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Room amount must be a positive integer'),

    body('address')
        .optional(),

    body('location_url')
        .optional()
        .isURL()
        .withMessage('Location URL must be a valid URL'),

    body('descriptions')
        .optional(),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean')
];

const roomValidation = [
    body('room_no')
        .notEmpty()
        .withMessage('Room number is required')
        .isString()
        .withMessage('Room number must be a string'),

    body('people_capacity')
        .notEmpty()
        .withMessage('People capacity is required')
        .isInt({ min: 1 })
        .withMessage('People capacity must be a positive integer'),

    body('price_per_hour')
        .notEmpty()
        .withMessage('Price per hour is required')
        .isFloat({ min: 0 })
        .withMessage('Price per night must be a positive number'),

    body('equipments')
        .optional()
        .isArray()
        .withMessage('Equipments must be an array')
        .custom((equipments) => {
            if (equipments.some(e => typeof e !== 'string')) {
                throw new Error('Each equipment must be a string');
            }
            return true;
        })
];

const roomUpdateValidation = [
    body('room_no')
        .notEmpty()
        .withMessage('Room number is required')
        .isString()
        .withMessage('Room number must be a string'),

    body('people_capacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('People capacity must be a positive integer'),

    body('price_per_hour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price per night must be a positive number'),

    body('equipments')
        .optional()
        .isArray()
        .withMessage('Equipments must be an array')
        .custom((equipments) => {
            if (equipments.some(e => typeof e !== 'string')) {
                throw new Error('Each equipment must be a string');
            }
            return true;
        })
];

const validStatuses = ['pending', 'cancelled', 'completed'];

const bookingValidation = [

    body('room_id')
        .notEmpty()
        .withMessage('Room ID is required')
        .isUUID()
        .withMessage('Room ID must be a valid UUID'),

    body('start_time')
        .notEmpty()
        .withMessage('Start time is required')
        .isISO8601()
        .withMessage('Start time must be a valid date'),

    body('end_time')
        .notEmpty()
        .withMessage('End time is required')
        .isISO8601()
        .withMessage('End time must be a valid date')
        .custom((end_time, { req }) => {
            if (new Date(end_time) <= new Date(req.body.start_time)) {
                throw new Error('End time must be after start time');
            }
            return true;
        }),

    body('total_price')
        .notEmpty()
        .withMessage('Total price is required')
        .isFloat({ min: 0 })
        .withMessage('Total price must be a positive number'),

    body('status')
        .optional()
        .isIn(validStatuses)
        .withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
];

const validateBookingCancellation = [
    param('id')
        .notEmpty()
        .withMessage('Booking ID is required')
        .isUUID()
        .withMessage('Booking ID must be a valid UUID'),

    body('cancellation_reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason cannot exceed 500 characters'),

    handleValidationErrors
];

const validateFilterParams = [
    query('minCapacity').optional().isInt({ min: 1 }).withMessage('minCapacity must be a positive integer'),
    query('maxCapacity').optional().isInt({ min: 1 }).withMessage('maxCapacity must be a positive integer'),
    query('priceSort').optional().isIn(['asc', 'desc']).withMessage('priceSort must be "asc" or "desc"'),
    query('capacitySort').optional().isIn(['asc', 'desc']).withMessage('capacitySort must be "asc" or "desc"'),
    query('equipments').optional().isString().withMessage('equipments must be a comma-separated string'),
    query('workDays').optional().isString().withMessage('workDays must be a comma-separated string of weekdays example: monday,tuesday'),
    query('openTime')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
        .withMessage('openTime must be in HH:MM:SS format'),

    query('closeTime')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
        .withMessage('closeTime must be in HH:MM:SS format'),
    query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('userLat must be a valid latitude between -90 and 90'),
    query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('userLng must be a valid longitude between -180 and 180'),

    // Final middleware to check validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', errors: errors.array() });
        }
        next();
    }
];

const validateRoomFilterParams = [
    query('minCapacity').optional().isInt({ min: 1 }).withMessage('minCapacity must be a positive integer'),
    query('maxCapacity').optional().isInt({ min: 1 }).withMessage('maxCapacity must be a positive integer'),
    query('priceSort').optional().isIn(['asc', 'desc']).withMessage('priceSort must be "asc" or "desc"'),
    query('capacitySort').optional().isIn(['asc', 'desc']).withMessage('capacitySort must be "asc" or "desc"'),
    query('equipments').optional().isString().withMessage('equipments must be a comma-separated string'),

    // Final middleware to check validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validateLogin,
    validateOTP,
    validateUserCreation,
    validateTokenRefresh,
    handleValidationErrors,
    validateUserRegistration,
    validateBranch,
    roomValidation,
    bookingValidation,
    validateBookingCancellation,
    validateUpdateBranch,
    roomUpdateValidation,
    validateFilterParams,
    validatePhoto,
    validateRoomFilterParams
};