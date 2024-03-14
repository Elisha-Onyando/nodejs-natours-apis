const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

//Creating the tour router
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

//Creating the various tour routes
router.route('/tour-stats')
    .get(tourController.getTourStats);

router.route('/monthly-plan/:year')
    .get(
        authController.protectRoute,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router.route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protectRoute,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );

router.route('/:id')
    .get(tourController.getTourById)
    .patch(
        authController.protectRoute,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages, tourController.resizeTourImages,
        tourController.updateTour)
    .delete(
        authController.protectRoute,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;