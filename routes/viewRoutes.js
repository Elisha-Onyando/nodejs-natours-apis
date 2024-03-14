const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('./../controllers/bookingController');

//Creating the tour router
const router = express.Router();

//Routes for Server Side Rendering to the UI
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTourDetails);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protectRoute, viewsController.getAccount);
router.get('/my-tours', authController.protectRoute, viewsController.getMyTours);

router.post('/submit-user-data', authController.protectRoute, viewsController.updateUserData);

module.exports = router;