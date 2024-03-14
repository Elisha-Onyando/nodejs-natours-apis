const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    //Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.getAllReviews = factory.getAllItems(Review)
exports.getReviewById = factory.getItemById(Review);
exports.createReview = factory.createItem(Review);
exports.updateReview = factory.updateItem(Review);
exports.deleteReview = factory.deleteItem(Review);