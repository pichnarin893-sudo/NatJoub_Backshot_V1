const express = require('express');
const adminService = require('../../services/admin/admin.service');
const branchService = require('../../services/admin/branch.service');
const branchServiceUser = require('../../services/user/branch.service');
const roomServiceUser = require('../../services/user/room.service');
const roomService = require('../../services/admin/room.service');
const adminAuthService = require('../../services/admin/auth.service');
const configPassport = require('../../config/passport');
const router = express.Router();
const privateRouter = express.Router();

const {authLimiter, otpLimiter} = require("../../middlewares/rateLimiter.middleware");
const {validateLogin, validateOTP, validateTokenRefresh, validateBranch, roomValidation} = require("../../middlewares/validation.middleware");
const analyticsService = require('../../services/admin/analytics.service');
const promoCodeService = require('../../services/admin/promo_code.service');
const bookingHistoryService = require('../../services/admin/history.service');

// Initialize passport for this router
const passport = configPassport();

/*******************************************************
 *                                                     *
 *                Public routes                        *
 *                                                     *
 *******************************************************/

// Admin authentication routes (two-step login with OTP)
router.post('/login', authLimiter, validateLogin, adminAuthService.initiateLogin);
router.post('/verify', otpLimiter, validateOTP, adminAuthService.verifyOTP);
router.post('/refresh-token', validateTokenRefresh, adminAuthService.refreshToken);





/*******************************************************
 *                                                     *
 *                Private routes                       *
 *                                                     *
 *******************************************************/

// Apply JWT authentication to private routes
privateRouter.use(passport.authenticateJwt);
// Then check for admin role
privateRouter.use(passport.checkAdminRole);

// Admin user management routes
privateRouter.post('/create-user', adminService.createUser);
privateRouter.get('/get-all-users', adminService.getAllUesrs);

privateRouter.post('/branch/create-branch', branchService.createBranch);
privateRouter.get('/branch/get-all-branches', branchService.getAllBranches);
privateRouter.get('/branch/get-by-id-branch', branchService.getBranchById);
privateRouter.delete('/branch/delete-branch', branchService.deleteBranch);
privateRouter.patch('/branch/update-branch', branchService.updateBranch);
privateRouter.get('/branch/view-rooms-in-branch', branchService.viewRoomsInBranch);

privateRouter.post('/upload/branch-image', branchServiceUser.uploadBranchPhotos);

privateRouter.delete('/delete/image', branchServiceUser.deletePhoto);

privateRouter.post('/room/create-room', roomService.createRoom);
privateRouter.get('/room/get-all-rooms', roomService.getAllRooms);
privateRouter.get('/room/get-by-id-room', roomService.getRoomById);
privateRouter.delete('/room/delete-room', roomService.deleteRoom);
privateRouter.patch('/room/update-room', roomService.updateRoom);

privateRouter.post('/upload/room-image', roomServiceUser.uploadRoomPhotos);


privateRouter.get('/analytics/overview', analyticsService.getAdminOverview);
privateRouter.get('/analytics/revenue-trends', analyticsService.getAdminRevenueTrends);
privateRouter.get('/analytics/top-branches', analyticsService.getTopBranches);
privateRouter.get('/analytics/booking-status', analyticsService.getBookingStatusDistribution);
privateRouter.get('/analytics/top-customers', analyticsService.getTopCustomers);
privateRouter.get('/analytics/room-utilization', analyticsService.getRoomUtilization);

// Booking history route
privateRouter.get('/booking-history', bookingHistoryService.getAdminBookingHistory);



privateRouter.post('/promo-code',promoCodeService.createPromoCode);
privateRouter.get('/promo-code',promoCodeService.getAllPromoCode);
privateRouter.put('/promo-code/:id',promoCodeService.updatePromoCode);

// privateRouter.post('/promo-code',promoCodeService.createPromoCode);



// Admin authentication routes
privateRouter.post('/logout', adminAuthService.logout);

router.use('/auth', privateRouter);
module.exports = router;
