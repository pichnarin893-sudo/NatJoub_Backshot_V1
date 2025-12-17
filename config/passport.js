const passport = require('passport');
const { authenticate, authenticateAdmin, authenticateOwner, authenticateCustomer } = require('../middlewares/authentication.middleware');

module.exports = function() {
    return {
        initialize: () => passport.initialize(),
        // These methods use the updated auth middleware functions
        authenticateJwt: authenticate,
        checkAdminRole: authenticateAdmin,
        checkOwnerRole: authenticateOwner,
        checkCustomerRole: authenticateCustomer
    };
};