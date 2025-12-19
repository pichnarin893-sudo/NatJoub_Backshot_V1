const express = require('express');
const configPassport = require('../../config/passport');
const router = express.Router();
const privateRouter = express.Router();
const ownerRouter = express.Router();
const customerRouter = express.Router();
const {authLimiter, otpLimiter, requestBranchLimiter} = require('../../middlewares/rateLimiter.middleware');
const {validateLogin, validateOTP,validateFilterParams, validateTokenRefresh, validateRoomFilterParams, validateBookingCancellation} = require('../../middlewares/validation.middleware');
const UserRegistration = require('../../services/user/user.service');
const authService = require('../../services/user/auth.service');
const smsAuthService = require('../../services/user/sms.auth.service');
const filteringService = require('../../services/user/filtering.service');
const branchService = require('../../services/user/branch.service');
const bookingService = require('../../services/user/booking.service');
const userService = require('../../services/user/user.service');
const roomService = require('../../services/user/room.service');
const ownerRoomService = require('../../services/user/room.service');
const analyticsService = require('../../services/admin/analytics.service');
const promotionService = require('../../services/admin/promotion.service');
const bookingHistoryService = require('../../services/admin/history.service');
const {deleteBranch, updateBranch} = require('../../services/admin/branch.service');
const {createRoom, deleteRoom, updateRoom} = require('../../services/admin/room.service');

// Initialize passport for this router
const passport = configPassport();

/*******************************************************
 *                                                     *
 *                Public routes                        *
 *                                                     *
 *******************************************************/
//User register route
router.post('/register', UserRegistration.createUser);
router.post('/verify-registration-otp', UserRegistration.verifyRegistrationOTP);
router.post('/resend-registration-otp', UserRegistration.resendRegistrationOTP);

// Auth routes - updated for OTP flow
router.post('/login', authLimiter, validateLogin, authService.initiateLogin);  // Step 1: Initial login
router.post('/verify', otpLimiter, validateOTP, authService.verifyOTP);     // Step 2: OTP verification
router.post('/refresh-token', validateTokenRefresh, authService.refreshToken);

//get user profile
customerRouter.get('/profile', userService.getUserById);

// Booking routes
customerRouter.get('/booking/my', bookingService.getMyBookings);
customerRouter.post('/booking/:id/cancel', validateBookingCancellation, bookingService.requestCancellation);
customerRouter.delete('/booking/:bookingId', bookingService.cancelledPendingBooking);

router.get('/booking/room/:roomId/availability', bookingService.getRoomAvailability);

privateRouter.post('/booking/check-slot', bookingService.checkTimeSlot);
privateRouter.patch('/booking/:id/status', bookingService.updateBookingStatus);

//verify payment status with aba and update booking status accordingly
customerRouter.post('/booking', bookingService.createBooking);
customerRouter.post('/verify/:transactionId', bookingService.verifyPayment);
customerRouter.get('/history/:bookingId', bookingService.getPaymentHistory);
customerRouter.get('/status/:transactionId', bookingService.getPaymentStatus);

//favorite room routes
customerRouter.post('/favorite-room', roomService.toggleFavoriteRoom);
customerRouter.delete('/remove-favorite-room', roomService.removeFavoriteRoom);
customerRouter.get('/get-favorite-rooms', roomService.getFavoriteRooms);

// Auth routes - SMS-based login (Optional for users who prefer SMS login) - Must register phone number first
router.post('/sms-login', smsAuthService.initialSmsLogin);
router.post('/sms-verify', smsAuthService.verifySmsOTP);
router.post('/sms-refresh-token', smsAuthService.handleRefreshToken);

/*******************************************************
 *                                                     *
 *                Private routes                       *
 *                                                     *
 *******************************************************/

// Apply JWT authentication to all private routes first
privateRouter.use(passport.authenticateJwt);

// Common authenticated routes
privateRouter.post('/logout', authService.logout);

// Router specifically for teacher users
ownerRouter.use(passport.checkOwnerRole);

// Add owner-specific routes here
ownerRouter.post('/request-create-branch', requestBranchLimiter, branchService.requestCreateBranch);
ownerRouter.post('/upload/branch-image', branchService.uploadBranchPhotos);
ownerRouter.get('/branch/get-all-branches', branchService.getBranchByOwner);
ownerRouter.get('/branch/get-all-room-by-branch', branchService.getRoomByBranch);
ownerRouter.delete('/branch/delete-branch', deleteBranch);
ownerRouter.patch('/branch/update-branch', updateBranch);

ownerRouter.post('/request-create-room', createRoom);
ownerRouter.post('/upload/room-image', roomService.uploadRoomPhotos);
ownerRouter.get('/branch/photo', branchService.getBranchPhotos);

ownerRouter.get('/room/get-all-rooms', ownerRoomService.getAllRooms);
ownerRouter.delete('/room/delete-room', deleteRoom);
ownerRouter.patch('/room/update-room', updateRoom);

ownerRouter.post('/promotion', promotionService.createPromotion);
ownerRouter.get('/promotion', promotionService.getAllPromotions);
ownerRouter.get('/promotion/:id', promotionService.getPromotionById);
ownerRouter.put('/promotion/:id', promotionService.updatePromotion);
// ownerRouter.delete('/promotion/:id', promotionService.deletePromotion);
ownerRouter.post('/promotion/attach/:id', promotionService.attachPromotionHandler);

// Router specifically for parent users
customerRouter.use(passport.checkCustomerRole);
// Add customer-specific routes here
customerRouter.get('/filter-branches',validateFilterParams, filteringService.getFilteringRetrievalOptions);
customerRouter.get('/filter-rooms',validateRoomFilterParams, filteringService.getRoomFilteringRetrievalOptions);
customerRouter.get('/branch/details', branchService.getBranchDetails);
customerRouter.get('/branch/room/get-rooms-by-branch', roomService.getRoomsByBranch);
customerRouter.get('/branch/photo', branchService.getBranchPhotos);

customerRouter.get('/room/occupied-times', bookingService.getOccupiedRoomBookingTimes)
customerRouter.get('/room/details', roomService.getRoomDetails)

ownerRouter.get('/analytics/overview', analyticsService.getOwnerOverview);
ownerRouter.get('/analytics/revenue-trends', analyticsService.getOwnerRevenueTrends);
ownerRouter.get('/analytics/branch-performance', analyticsService.getOwnerBranchPerformance);
ownerRouter.get('/analytics/branch/:branchId/rooms', analyticsService.getBranchRoomPerformance);
ownerRouter.get('/analytics/peak-hours', analyticsService.getOwnerPeakHours);
ownerRouter.get('/analytics/customers', analyticsService.getOwnerCustomerInsights);

// Booking history route
ownerRouter.get('/booking-history', bookingHistoryService.getOwnerBookingHistory);

// Cancellation management routes
ownerRouter.get('/cancellation-requests', bookingService.getPendingCancellationRequests);
ownerRouter.post('/cancellation-requests/:id/approve', bookingService.approveCancellation);
ownerRouter.post('/cancellation-requests/:id/reject', bookingService.rejectCancellation);

ownerRouter.delete('/delete/image', branchService.deletePhoto);

// Register role-specific routers with the private router
privateRouter.use('/owner', ownerRouter);
privateRouter.use('/customer', customerRouter);

router.use('/auth', privateRouter);
module.exports = router;
