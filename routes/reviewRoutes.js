const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//Creating the tour router
const router = express.Router({ mergeParams: true });

router.use(authController.protectRoute);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user', 'admin'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router.route('/:id')
    .get(reviewController.getReviewById)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;